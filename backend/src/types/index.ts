export type UserRole = 'HOST' | 'MODERATOR' | 'PARTICIPANT' | 'VIEWER';

export type PlayState = 'PLAYING' | 'PAUSED';

export interface ParticipantInfo {
  id: string;
  socketId: string;
  username: string;
  role: UserRole;
  avatarColor: string;
  avatarId?: string;
  joinedAt: number;
  seatIndex?: number;
  isSeated?: boolean;
}

export interface SyncStatePayload {
  playState: PlayState;
  currentTime: number;
  videoId: string;
  lastUpdated: number;
  title?: string;
  pausedBy?: string;
  pausedAt?: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  text: string;
  timestamp: number;
}

export interface ReactionPayload {
  userId: string;
  username: string;
  emoji: string;
  timestamp: number;
}

export type RoomAction =
  | 'PLAY'
  | 'PAUSE'
  | 'SEEK'
  | 'CHANGE_VIDEO'
  | 'ASSIGN_ROLE'
  | 'REMOVE_PARTICIPANT'
  | 'TRANSFER_HOST';
