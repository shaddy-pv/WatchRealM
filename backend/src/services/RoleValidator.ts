import { UserRole, RoomAction } from '../types';

export class RoleValidator {
  /**
   * Evaluates if a role is permitted to perform a given action.
   * Host: Full control (play/pause, seek, change video, assign roles, remove participants, transfer host)
   * Moderator: Play/pause, seek, change video
   * Participant / Viewer: Watch only; cannot control playback or change video.
   */
  public static canPerform(role: UserRole, action: RoomAction): boolean {
    switch (action) {
      case 'PLAY':
      case 'PAUSE':
      case 'SEEK':
      case 'CHANGE_VIDEO':
        return role === 'HOST' || role === 'MODERATOR';

      case 'ASSIGN_ROLE':
      case 'REMOVE_PARTICIPANT':
      case 'TRANSFER_HOST':
        return role === 'HOST';

      default:
        return false;
    }
  }

  public static getPermissionDenialReason(role: UserRole, action: RoomAction): string {
    switch (action) {
      case 'PLAY':
      case 'PAUSE':
      case 'SEEK':
        return `Playback controls are restricted to Host and Moderator. Your current role is ${role}.`;
      case 'CHANGE_VIDEO':
        return `Only Host and Moderator can change the video in this watch party. Your current role is ${role}.`;
      case 'ASSIGN_ROLE':
        return `Only the Host can assign roles to participants.`;
      case 'REMOVE_PARTICIPANT':
        return `Only the Host can remove participants from the room.`;
      case 'TRANSFER_HOST':
        return `Only the current Host can transfer ownership.`;
      default:
        return `Action ${action} is not permitted for role ${role}.`;
    }
  }
}
