import { UserRole, ParticipantInfo } from '../types';

export class Participant {
  public id: string;
  public socketId: string;
  public username: string;
  public role: UserRole;
  public avatarColor: string;
  public avatarId?: string;
  public joinedAt: number;
  public seatIndex?: number;
  public isSeated: boolean;

  constructor(
    id: string,
    socketId: string,
    username: string,
    role: UserRole = 'PARTICIPANT',
    avatarColor?: string,
    avatarId?: string
  ) {
    this.id = id;
    this.socketId = socketId;
    this.username = username;
    this.role = role;
    this.joinedAt = Date.now();
    this.isSeated = false;
    this.avatarId = avatarId;

    const defaultColors = [
      '#6366f1', '#ec4899', '#10b981', '#f59e0b',
      '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6'
    ];
    this.avatarColor = avatarColor || defaultColors[Math.floor(Math.random() * defaultColors.length)];
  }

  public setRole(role: UserRole): void {
    this.role = role;
  }

  public setSeated(isSeated: boolean, seatIndex?: number): void {
    this.isSeated = isSeated;
    if (seatIndex !== undefined) {
      this.seatIndex = seatIndex;
    }
  }

  public isHost(): boolean {
    return this.role === 'HOST';
  }

  public isModerator(): boolean {
    return this.role === 'MODERATOR';
  }

  public canControlPlayback(): boolean {
    return this.role === 'HOST' || this.role === 'MODERATOR';
  }

  public toJSON(): ParticipantInfo {
    return {
      id: this.id,
      socketId: this.socketId,
      username: this.username,
      role: this.role,
      avatarColor: this.avatarColor,
      avatarId: this.avatarId,
      joinedAt: this.joinedAt,
      seatIndex: this.seatIndex,
      isSeated: this.isSeated,
    };
  }
}
