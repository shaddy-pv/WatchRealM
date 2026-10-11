import { Room } from '../models/Room';
import { Participant } from '../models/Participant';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room>;
  // O(1) Fast lookup index: socketId -> roomId
  private socketMap: Map<string, string>;

  private constructor() {
    this.rooms = new Map();
    this.socketMap = new Map();
  }

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public registerSocket(socketId: string, roomId: string): void {
    this.socketMap.set(socketId, roomId);
  }

  public unregisterSocket(socketId: string): void {
    this.socketMap.delete(socketId);
  }

  // Grace period cleanup timers to prevent accidental deletion on momentary disconnects
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

  public createRoom(
    roomId: string,
    name: string,
    theme: string = 'fantasy',
    initialVideoId: string = '1La4QzGeaaQ',
    initialVideoTitle: string = 'Watch Party Stream',
    isPrivate: boolean = false,
    hostName: string = 'Explorer',
    hostEmail?: string
  ): Room {
    // Cancel any pending reap timer for this room
    if (this.cleanupTimers.has(roomId)) {
      clearTimeout(this.cleanupTimers.get(roomId)!);
      this.cleanupTimers.delete(roomId);
    }

    if (this.rooms.has(roomId)) {
      const existing = this.rooms.get(roomId)!;
      // Strict Privacy Isolation: Never demote a private room to public. Only set true if explicitly requested.
      if (isPrivate === true) {
        existing.isPrivate = true;
      }
      if (hostEmail && !existing.hostEmail) {
        existing.hostEmail = hostEmail;
      }
      if (initialVideoId && initialVideoId !== '2LqzF5WauAw' && (existing.currentVideoId === '2LqzF5WauAw' || !existing.currentVideoId)) {
        existing.currentVideoId = initialVideoId;
        if (initialVideoTitle) existing.videoTitle = initialVideoTitle;
      }
      return existing;
    }
    const newRoom = new Room(roomId, name, theme, initialVideoId, initialVideoTitle, isPrivate, hostName, hostEmail);
    this.rooms.set(roomId, newRoom);
    return newRoom;
  }

  /**
   * O(1) Fast Socket to Room Lookup with safety fallback
   */
  public findRoomBySocketId(socketId: string): { room: Room; participant: Participant } | undefined {
    const roomId = this.socketMap.get(socketId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        const participant = room.getParticipantBySocketId(socketId);
        if (participant) {
          return { room, participant };
        }
      }
    }

    // Safety fallback: linear scan if map was somehow unsynced
    for (const room of this.rooms.values()) {
      const participant = room.getParticipantBySocketId(socketId);
      if (participant) {
        this.socketMap.set(socketId, room.id);
        return { room, participant };
      }
    }
    return undefined;
  }

  /**
   * Reaps empty custom rooms with a 90-second grace period.
   * Prevents momentary socket dropouts or tab switches from deleting the room.
   */
  public checkAndCleanRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room && room.getParticipantCount() === 0) {
      if (this.cleanupTimers.has(roomId)) {
        clearTimeout(this.cleanupTimers.get(roomId)!);
      }
      const timer = setTimeout(() => {
        const r = this.rooms.get(roomId);
        if (r && r.getParticipantCount() === 0) {
          this.rooms.delete(roomId);
        }
        this.cleanupTimers.delete(roomId);
      }, 90000); // 90 second grace period
      this.cleanupTimers.set(roomId, timer);
    } else if (room && room.getParticipantCount() > 0) {
      if (this.cleanupTimers.has(roomId)) {
        clearTimeout(this.cleanupTimers.get(roomId)!);
        this.cleanupTimers.delete(roomId);
      }
    }
  }

  public deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  public clearAllRooms(): void {
    this.rooms.clear();
    this.socketMap.clear();
  }

  public listRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}
