import { Participant } from './Participant';
import { PlayState, SyncStatePayload, ChatMessage, UserRole, ParticipantInfo } from '../types';
import { RoleValidator } from '../services/RoleValidator';

export class Room {
  public id: string;
  public name: string;
  public theme: string;
  public hostId: string;
  public currentVideoId: string;
  public videoTitle: string;
  public playState: PlayState;
  public currentTime: number;
  public lastUpdatedTimestamp: number;
  private participants: Map<string, Participant>;
  public chatHistory: ChatMessage[];
  public createdAt: number;
  public isPrivate: boolean;
  public hostName: string;
  public hostEmail?: string;
  public allowedCamUserIds: Set<string>;
  public pausedBy?: string;
  public pausedAt?: number;
  public bannedUsers: Map<string, { username: string; until: number | 'PERMANENT'; reason?: string }>;

  constructor(
    id: string,
    name: string,
    theme: string = 'fantasy',
    initialVideoId: string = '1La4QzGeaaQ',
    initialVideoTitle: string = 'Watch Party Stream',
    isPrivate: boolean = false,
    hostName: string = 'Explorer',
    hostEmail?: string
  ) {
    this.id = id;
    this.name = name;
    this.theme = theme;
    this.hostId = '';
    this.currentVideoId = initialVideoId;
    this.videoTitle = initialVideoTitle;
    this.playState = 'PLAYING';
    this.currentTime = 0;
    this.lastUpdatedTimestamp = Date.now();
    this.participants = new Map();
    this.chatHistory = [];
    this.createdAt = Date.now();
    this.isPrivate = isPrivate;
    this.hostName = hostName;
    this.hostEmail = hostEmail;
    this.allowedCamUserIds = new Set();
    this.pausedBy = undefined;
    this.pausedAt = undefined;
    this.bannedUsers = new Map();
  }

  public addParticipant(participant: Participant): void {
    // 1. Check if this participant is the persistent room owner/creator by username matching hostName
    const isOwner = !!(
      this.hostName &&
      this.hostName.toLowerCase() !== 'explorer' &&
      participant.username.toLowerCase() === this.hostName.toLowerCase()
    );

    if (isOwner) {
      // Room owner ALWAYS reclaims/maintains HOST role!
      // If someone else temporarily held host during reconnect, demote them
      if (this.hostId && this.hostId !== participant.id) {
        const tempHost = this.participants.get(this.hostId);
        if (tempHost) {
          tempHost.setRole('MODERATOR');
        }
      }
      this.hostId = participant.id;
      participant.setRole('HOST');
    } else if (!this.hostId || this.participants.size === 0) {
      // If room has no active host and no participants, first user becomes HOST
      this.hostId = participant.id;
      participant.setRole('HOST');
      if (!this.hostName || this.hostName.toLowerCase() === 'explorer') {
        this.hostName = participant.username;
      }
    } else if (participant.role === 'HOST' && participant.id !== this.hostId) {
      participant.setRole('PARTICIPANT');
    }

    this.participants.set(participant.id, participant);
  }

  public removeParticipant(userId: string): { removed?: Participant } {
    const participant = this.participants.get(userId);
    if (!participant) return {};

    this.participants.delete(userId);
    // Note: Do not immediately switch host here; reconnection grace period is managed by socketHandler
    return { removed: participant };
  }

  public promoteNextHost(): Participant | undefined {
    if (this.participants.size === 0) {
      this.hostId = '';
      return undefined;
    }
    const remaining = Array.from(this.participants.values());
    // Prioritize room owner if present in room
    const owner = this.hostName && this.hostName.toLowerCase() !== 'explorer'
      ? remaining.find((p) => p.username.toLowerCase() === this.hostName.toLowerCase())
      : undefined;

    const nextMod = remaining.find((p) => p.role === 'MODERATOR');
    const newHost = owner || nextMod || remaining[0];
    this.hostId = newHost.id;
    newHost.setRole('HOST');
    return newHost;
  }

  public getParticipant(userId: string): Participant | undefined {
    return this.participants.get(userId);
  }

  public getParticipantBySocketId(socketId: string): Participant | undefined {
    for (const participant of this.participants.values()) {
      if (participant.socketId === socketId) {
        return participant;
      }
    }
    return undefined;
  }

  public getAllParticipants(): ParticipantInfo[] {
    return Array.from(this.participants.values()).map(p => p.toJSON());
  }

  public getParticipantCount(): number {
    return this.participants.size;
  }

  public assignRole(callerId: string, targetUserId: string, newRole: UserRole): { success: boolean; error?: string } {
    const caller = this.participants.get(callerId);
    if (!caller) return { success: false, error: 'Caller not found in room.' };

    if (!RoleValidator.canPerform(caller.role, 'ASSIGN_ROLE')) {
      return { success: false, error: RoleValidator.getPermissionDenialReason(caller.role, 'ASSIGN_ROLE') };
    }

    const target = this.participants.get(targetUserId);
    if (!target) return { success: false, error: 'Target participant not found in room.' };

    if (newRole === 'HOST') {
      return this.transferHost(callerId, targetUserId);
    }

    target.setRole(newRole);
    return { success: true };
  }

  public transferHost(currentHostId: string, newHostId: string): { success: boolean; error?: string } {
    if (this.hostId !== currentHostId) {
      return { success: false, error: 'Only current host can transfer host status.' };
    }

    const newHost = this.participants.get(newHostId);
    if (!newHost) return { success: false, error: 'New host participant not found.' };

    const oldHost = this.participants.get(currentHostId);
    if (oldHost) {
      oldHost.setRole('MODERATOR');
    }

    newHost.setRole('HOST');
    this.hostId = newHostId;
    return { success: true };
  }

  public setPlayState(callerId: string, state: PlayState, time?: number): { success: boolean; error?: string } {
    const caller = this.participants.get(callerId);
    if (!caller) return { success: false, error: 'Participant not in room.' };

    const action = state === 'PLAYING' ? 'PLAY' : 'PAUSE';
    if (!RoleValidator.canPerform(caller.role, action)) {
      return { success: false, error: RoleValidator.getPermissionDenialReason(caller.role, action) };
    }

    if (time !== undefined) {
      this.currentTime = Math.max(0, time);
    } else if (this.playState === 'PLAYING') {
      // Calculate elapsed since last play
      const elapsed = (Date.now() - this.lastUpdatedTimestamp) / 1000;
      this.currentTime += elapsed;
    }

    this.playState = state;
    if (state === 'PAUSED') {
      this.pausedBy = caller.username || 'Host';
      this.pausedAt = Date.now();
    } else {
      this.pausedBy = undefined;
      this.pausedAt = undefined;
    }
    this.lastUpdatedTimestamp = Date.now();
    return { success: true };
  }

  public seek(callerId: string, targetTime: number): { success: boolean; error?: string } {
    const caller = this.participants.get(callerId);
    if (!caller) return { success: false, error: 'Participant not in room.' };

    if (!RoleValidator.canPerform(caller.role, 'SEEK')) {
      return { success: false, error: RoleValidator.getPermissionDenialReason(caller.role, 'SEEK') };
    }

    this.currentTime = Math.max(0, targetTime);
    this.lastUpdatedTimestamp = Date.now();
    return { success: true };
  }

  public changeVideo(callerId: string, videoId: string, title?: string): { success: boolean; error?: string } {
    const caller = this.participants.get(callerId);
    if (!caller) return { success: false, error: 'Participant not in room.' };

    if (!RoleValidator.canPerform(caller.role, 'CHANGE_VIDEO')) {
      return { success: false, error: RoleValidator.getPermissionDenialReason(caller.role, 'CHANGE_VIDEO') };
    }

    this.currentVideoId = videoId;
    if (title) this.videoTitle = title;
    this.currentTime = 0;
    this.playState = 'PLAYING';
    this.pausedBy = undefined;
    this.pausedAt = undefined;
    this.lastUpdatedTimestamp = Date.now();
    return { success: true };
  }

  public clearVideo(callerId: string): { success: boolean; error?: string } {
    const caller = this.participants.get(callerId);
    if (!caller) return { success: false, error: 'Participant not in room.' };

    if (!RoleValidator.canPerform(caller.role, 'CHANGE_VIDEO')) {
      return { success: false, error: RoleValidator.getPermissionDenialReason(caller.role, 'CHANGE_VIDEO') };
    }

    this.currentVideoId = '';
    this.videoTitle = 'No Video Loaded';
    this.currentTime = 0;
    this.playState = 'PAUSED';
    this.pausedBy = caller.username || 'Host';
    this.pausedAt = Date.now();
    this.lastUpdatedTimestamp = Date.now();
    return { success: true };
  }

  public syncHostPlayback(callerId: string, time: number, state: PlayState): boolean {
    const caller = this.participants.get(callerId);
    if (!caller || (caller.role !== 'HOST' && caller.role !== 'MODERATOR')) return false;

    this.currentTime = Math.max(0, time);
    this.playState = state;
    if (state === 'PAUSED' && !this.pausedAt) {
      this.pausedBy = caller.username || 'Host';
      this.pausedAt = Date.now();
    } else if (state === 'PLAYING') {
      this.pausedBy = undefined;
      this.pausedAt = undefined;
    }
    this.lastUpdatedTimestamp = Date.now();
    return true;
  }

  public banUser(
    callerId: string,
    targetUserId: string,
    durationMinutes: number,
    isPermanent: boolean,
    reason?: string
  ): { success: boolean; error?: string; removedParticipant?: Participant; until?: number | 'PERMANENT' } {
    const caller = this.participants.get(callerId);
    if (!caller || caller.role !== 'HOST') {
      return { success: false, error: 'Only Host can ban or timeout participants.' };
    }
    const target = this.participants.get(targetUserId);
    if (!target) return { success: false, error: 'Target participant not found in room.' };
    if (target.id === this.hostId) return { success: false, error: 'Host cannot ban themselves.' };

    const until: number | 'PERMANENT' = isPermanent
      ? 'PERMANENT'
      : (durationMinutes > 0 ? Date.now() + durationMinutes * 60 * 1000 : 0);

    if (until !== 0) {
      this.bannedUsers.set(target.username.toLowerCase().trim(), {
        username: target.username,
        until,
        reason,
      });
      this.bannedUsers.set(target.socketId, {
        username: target.username,
        until,
        reason,
      });
    }

    const { removed } = this.removeParticipant(targetUserId);
    return { success: true, removedParticipant: removed, until };
  }

  public isUserBanned(username: string, socketId?: string): { isBanned: boolean; reason?: string; minutesLeft?: number; isPermanent?: boolean } {
    const key = username.toLowerCase().trim();
    const entry = this.bannedUsers.get(key) || (socketId ? this.bannedUsers.get(socketId) : undefined);
    if (!entry) return { isBanned: false };

    if (entry.until === 'PERMANENT') {
      return { isBanned: true, reason: entry.reason, isPermanent: true };
    }

    if (entry.until > Date.now()) {
      const minutesLeft = Math.ceil((entry.until - Date.now()) / 60000);
      return { isBanned: true, reason: entry.reason, minutesLeft, isPermanent: false };
    }

    // Expired
    this.bannedUsers.delete(key);
    if (socketId) this.bannedUsers.delete(socketId);
    return { isBanned: false };
  }

  /**
   * Computes synchronized playback position with elapsed time correction
   * for late joiners and periodic sync.
   */
  public getComputedTime(): number {
    if (this.playState === 'PLAYING') {
      const elapsed = (Date.now() - this.lastUpdatedTimestamp) / 1000;
      return this.currentTime + elapsed;
    }
    return this.currentTime;
  }

  public getSyncState(): SyncStatePayload {
    return {
      playState: this.playState,
      currentTime: this.getComputedTime(),
      videoId: this.currentVideoId,
      lastUpdated: this.lastUpdatedTimestamp,
      title: this.videoTitle,
      pausedBy: this.pausedBy,
      pausedAt: this.pausedAt,
    };
  }

  public addChatMessage(message: ChatMessage): void {
    this.chatHistory.push(message);
    if (this.chatHistory.length > 100) {
      this.chatHistory.shift();
    }
  }

  public isCameraAllowed(userId: string): boolean {
    const p = this.participants.get(userId);
    if (!p) return false;
    if (p.role === 'HOST' || p.role === 'MODERATOR') return true;
    return this.allowedCamUserIds.has(userId);
  }

  public setCameraAllowed(callerId: string, targetUserId: string, allow: boolean): { success: boolean; error?: string } {
    const caller = this.participants.get(callerId);
    if (!caller) return { success: false, error: 'Caller not found in room.' };
    if (caller.role !== 'HOST' && caller.role !== 'MODERATOR') {
      return { success: false, error: 'Only Host or Moderator can grant camera permissions.' };
    }
    if (allow) {
      this.allowedCamUserIds.add(targetUserId);
    } else {
      this.allowedCamUserIds.delete(targetUserId);
    }
    return { success: true };
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      theme: this.theme,
      hostId: this.hostId,
      hostName: this.hostName || (this.participants.size > 0 ? Array.from(this.participants.values())[0].username : 'Explorer'),
      participantCount: this.participants.size,
      participants: this.getAllParticipants(),
      currentVideoId: this.currentVideoId,
      videoTitle: this.videoTitle,
      playState: this.playState,
      currentTime: this.getComputedTime(),
      createdAt: this.createdAt,
      isPrivate: this.isPrivate,
      hostEmail: this.hostEmail,
      allowedCamUserIds: Array.from(this.allowedCamUserIds),
    };
  }
}
