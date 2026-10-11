import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/RoomManager';
import { Participant } from '../models/Participant';
import { ChatMessage, ReactionPayload, UserRole, PlayState } from '../types';
import { RoomMongoModel } from '../models/RoomModel';
import { isDBConnected } from '../config/db';

export function registerSocketHandlers(io: Server): void {
  const roomManager = RoomManager.getInstance();

  // Rate limiting tracker per socket: socketId -> timestamp array
  const chatRateLimits = new Map<string, number[]>();
  const reactionRateLimits = new Map<string, number[]>();
  // Host disconnection grace period tracker: roomId -> Timeout
  const hostDisconnectTimers = new Map<string, NodeJS.Timeout>();

  const isRateLimited = (map: Map<string, number[]>, socketId: string, limit: number, windowMs: number): boolean => {
    const now = Date.now();
    const timestamps = map.get(socketId) || [];
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length >= limit) {
      return true;
    }
    valid.push(now);
    map.set(socketId, valid);
    return false;
  };

  io.on('connection', (socket: Socket) => {
    // 1. JOIN ROOM
    socket.on('join_room', async (data: {
      roomId: string;
      username: string;
      avatarColor?: string;
      avatarId?: string;
      role?: UserRole;
      initialVideoId?: string;
      initialVideoTitle?: string;
      isPrivate?: boolean;
      roomTitle?: string;
      theme?: string;
    }) => {
      const { roomId, username, avatarColor, avatarId, initialVideoId, initialVideoTitle, isPrivate, roomTitle, theme } = data;
      const normalizedRoomId = roomId ? roomId.trim() : 'fantasy-pavilion';
      const rawTrimmed = username?.trim();
      const cleanUsername = (rawTrimmed && !rawTrimmed.startsWith('Explorer-') && rawTrimmed !== 'Guest Explorer')
        ? rawTrimmed.substring(0, 32)
        : 'shaddy';

      let room = roomManager.getRoom(normalizedRoomId);

      // If room is not currently in-memory, restore from MongoDB if it was saved!
      if (!room && isDBConnected()) {
        try {
          const saved = await RoomMongoModel.findOne({ roomId: normalizedRoomId }).lean();
          if (saved) {
            room = roomManager.createRoom(
              saved.roomId,
              saved.name,
              saved.theme,
              saved.videoId,
              saved.videoTitle,
              saved.isPrivate === true,
              saved.hostName
            );
          }
        } catch (_) {}
      }

      if (!room) {
        room = roomManager.createRoom(
          normalizedRoomId,
          roomTitle || `Watch Party (${normalizedRoomId})`,
          theme || 'fantasy',
          initialVideoId || '1La4QzGeaaQ',
          initialVideoTitle || roomTitle || 'Watch Party Stream',
          isPrivate === true,
          cleanUsername
        );
      } else {
        if (roomTitle && (room.name.startsWith('Watch Party (') || !room.name)) {
          room.name = roomTitle;
        }
        // Strict Privacy Isolation: Joiners cannot demote a private room to public. Only true can set it.
        if (isPrivate === true) {
          room.isPrivate = true;
        }
        // If caller provided a real video and the room currently has fallback, preserve caller's video!
        if (initialVideoId && initialVideoId !== '2LqzF5WauAw' && (room.currentVideoId === '2LqzF5WauAw' || !room.currentVideoId)) {
          room.currentVideoId = initialVideoId;
          if (initialVideoTitle) room.videoTitle = initialVideoTitle;
        }
      }

      // Check if user is banned or timed out from this room
      const banStatus = room.isUserBanned(cleanUsername, socket.id);
      if (banStatus.isBanned) {
        const msg = banStatus.isPermanent
          ? `You have been permanently banned from this watch party.${banStatus.reason ? ` Reason: ${banStatus.reason}` : ''}`
          : `You are timed out from this watch party for ${banStatus.minutesLeft} more minute(s).${banStatus.reason ? ` Reason: ${banStatus.reason}` : ''}`;
        socket.emit('kicked_from_room', { reason: msg, isPermanent: banStatus.isPermanent, minutesLeft: banStatus.minutesLeft });
        return;
      }

      // Cancel any pending host disconnect grace period timer if host or owner rejoins
      if (hostDisconnectTimers.has(room.id)) {
        clearTimeout(hostDisconnectTimers.get(room.id)!);
        hostDisconnectTimers.delete(room.id);
      }

      // Check if user already exists
      let participant = room.getParticipantBySocketId(socket.id);
      if (!participant) {
        // First connected user in an empty room becomes HOST
        const isFirst = room.getParticipantCount() === 0;
        const initialRole: UserRole = isFirst ? 'HOST' : 'PARTICIPANT';
        participant = new Participant(socket.id, socket.id, cleanUsername, initialRole, avatarColor, avatarId);
        room.addParticipant(participant);
      } else {
        if (cleanUsername && cleanUsername !== participant.username) {
          participant.username = cleanUsername;
        }
        if (avatarId && avatarId !== participant.avatarId) {
          participant.avatarId = avatarId;
        }
      }

      if (room.hostId === participant.id) {
        room.hostName = participant.username;
      }

      // Register fast O(1) index in roomManager and join Socket.IO room
      roomManager.registerSocket(socket.id, room.id);
      socket.join(room.id);

      // Send initial state to the joiner
      socket.emit('room_joined', {
        room: room.toJSON(),
        myRole: participant.role,
        myUserId: participant.id,
      });

      // Send sync_state with elapsed time compensation
      socket.emit('sync_state', room.getSyncState());

      // Broadcast updated public room list to lobby clients
      const publicRooms = roomManager.listRooms().filter((r) => !r.isPrivate).map((r) => r.toJSON());
      io.emit('rooms_updated', publicRooms);

      // Broadcast user_joined to others in room
      io.to(room.id).emit('user_joined', {
        username: participant.username,
        userId: participant.id,
        role: participant.role,
        participants: room.getAllParticipants(),
      });
    });

    // 2. PLAY
    socket.on('play', (data?: { time?: number }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      const result = room.setPlayState(participant.id, 'PLAYING', data?.time);

      if (!result.success) {
        socket.emit('permission_denied', { error: result.error, action: 'PLAY' });
        return;
      }

      io.to(room.id).emit('sync_state', room.getSyncState());
    });

    // 3. PAUSE
    socket.on('pause', (data?: { time?: number }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      const result = room.setPlayState(participant.id, 'PAUSED', data?.time);

      if (!result.success) {
        socket.emit('permission_denied', { error: result.error, action: 'PAUSE' });
        return;
      }

      io.to(room.id).emit('sync_state', room.getSyncState());
    });

    // 4. SEEK
    socket.on('seek', (data: { time: number }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      const result = room.seek(participant.id, data.time);

      if (!result.success) {
        socket.emit('permission_denied', { error: result.error, action: 'SEEK' });
        return;
      }

      io.to(room.id).emit('sync_state', room.getSyncState());
    });

    // 5. CHANGE VIDEO
    socket.on('change_video', (data: { videoId: string; title?: string }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      const cleanVideoId = data.videoId?.trim();
      if (!cleanVideoId) return;

      const result = room.changeVideo(participant.id, cleanVideoId, data.title?.trim());

      if (!result.success) {
        socket.emit('permission_denied', { error: result.error, action: 'CHANGE_VIDEO' });
        return;
      }

      io.to(room.id).emit('sync_state', room.getSyncState());
      io.to(room.id).emit('video_changed', {
        videoId: cleanVideoId,
        title: room.videoTitle,
        changedBy: participant.username,
      });
    });

    // 5.1 CLEAR VIDEO (Stop current stream)
    socket.on('clear_video', () => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      const result = room.clearVideo(participant.id);
      if (!result.success) {
        socket.emit('permission_denied', { error: result.error, action: 'CLEAR_VIDEO' });
        return;
      }

      io.to(room.id).emit('sync_state', room.getSyncState());
      io.to(room.id).emit('video_changed', {
        videoId: '',
        title: 'No Video Loaded',
        changedBy: participant.username,
      });
    });

    // 5.2 HOST PLAYBACK HEARTBEAT (Strict Real-time Synced Playback)
    socket.on('host_playback_heartbeat', (data: { time: number; playState: PlayState }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      if (participant.role !== 'HOST' && participant.role !== 'MODERATOR') return;

      const timeDrift = Math.abs(room.currentTime - data.time);
      const stateChanged = room.playState !== data.playState;

      room.syncHostPlayback(participant.id, data.time, data.playState);

      // If significant drift (>1.2s) or state change, broadcast sync to viewers
      if (stateChanged || timeDrift > 1.2) {
        socket.to(room.id).emit('sync_state', room.getSyncState());
      }
    });

    // 6. ASSIGN ROLE (Host only)
    socket.on('assign_role', (data: { userId: string; role: UserRole }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      const result = room.assignRole(participant.id, data.userId, data.role);

      if (!result.success) {
        socket.emit('permission_denied', { error: result.error, action: 'ASSIGN_ROLE' });
        return;
      }

      const target = room.getParticipant(data.userId);
      io.to(room.id).emit('role_assigned', {
        userId: data.userId,
        username: target?.username,
        role: data.role,
        participants: room.getAllParticipants(),
      });
    });

    // 7. REMOVE / BAN / TIMEOUT PARTICIPANT (Host only)
    socket.on('remove_participant', (data: { userId: string; durationMinutes?: number; isPermanent?: boolean; reason?: string }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      if (!participant.isHost()) {
        socket.emit('permission_denied', {
          error: 'Only Host can remove participants from the watch room.',
          action: 'REMOVE_PARTICIPANT',
        });
        return;
      }

      if (data.userId === participant.id) {
        socket.emit('permission_denied', {
          error: 'Host cannot kick themselves. Use Leave Room or Transfer Host first.',
          action: 'REMOVE_PARTICIPANT',
        });
        return;
      }

      const target = room.getParticipant(data.userId);
      if (target) {
        const durationMinutes = Number(data.durationMinutes) || 0;
        const isPermanent = !!data.isPermanent;
        const reason = data.reason?.trim() || undefined;

        if (durationMinutes > 0 || isPermanent) {
          room.banUser(participant.id, data.userId, durationMinutes, isPermanent, reason);
        } else {
          room.removeParticipant(data.userId);
        }
        roomManager.unregisterSocket(target.socketId);

        // Physically remove the socket from the Socket.IO room channel
        const targetSocket = io.sockets.sockets.get(target.socketId);
        if (targetSocket) {
          targetSocket.leave(room.id);
          const banMsg = isPermanent
            ? `You have been permanently banned from this watch party.${reason ? ` Reason: ${reason}` : ''}`
            : durationMinutes > 0
            ? `You are timed out from this watch party for ${durationMinutes} minutes.${reason ? ` Reason: ${reason}` : ''}`
            : `You were removed from the watch party by the host.${reason ? ` Reason: ${reason}` : ''}`;

          targetSocket.emit('kicked_from_room', {
            reason: banMsg,
            durationMinutes,
            isPermanent,
          });
        }

        io.to(room.id).emit('participant_removed', {
          userId: data.userId,
          username: target.username,
          participants: room.getAllParticipants(),
        });
      }
    });

    // 7.1 TRANSFER HOST (Host only)
    socket.on('transfer_host', (data: { newHostUserId: string }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      const result = room.transferHost(participant.id, data.newHostUserId);

      if (!result.success) {
        socket.emit('permission_denied', {
          error: result.error || 'Only Host can transfer room ownership.',
          action: 'TRANSFER_HOST',
        });
        return;
      }

      const newHost = room.getParticipant(data.newHostUserId);
      if (newHost) {
        room.hostName = newHost.username;
      }

      io.to(room.id).emit('host_transferred', {
        newHostId: data.newHostUserId,
        newHostUsername: newHost?.username,
        oldHostId: participant.id,
        participants: room.getAllParticipants(),
      });
    });

    // 7.2 REQUEST SYNC (Client drift correction)
    socket.on('request_sync', () => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;
      socket.emit('sync_state', found.room.getSyncState());
    });

    // 8. CHAT MESSAGE (with length cap and rate limit)
    socket.on('chat_message', (data: { text: string }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found || !data.text?.trim()) return;

      if (isRateLimited(chatRateLimits, socket.id, 5, 3000)) {
        socket.emit('permission_denied', {
          error: 'Please slow down. You are sending messages too quickly.',
          action: 'CHAT_MESSAGE',
        });
        return;
      }

      const cleanText = data.text.trim().substring(0, 500);
      const { room, participant } = found;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: participant.id,
        username: participant.username,
        role: participant.role,
        text: cleanText,
        timestamp: Date.now(),
      };

      room.addChatMessage(msg);
      io.to(room.id).emit('chat_broadcast', msg);
    });

    // 9. REACTION (with rate limit)
    socket.on('reaction', (data: { emoji: string }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found || !data.emoji) return;

      if (isRateLimited(reactionRateLimits, socket.id, 10, 3000)) return;

      const { room, participant } = found;
      const payload: ReactionPayload = {
        userId: participant.id,
        username: participant.username,
        emoji: data.emoji.substring(0, 8),
        timestamp: Date.now(),
      };

      io.to(room.id).emit('reaction_broadcast', payload);
    });

    // 10. SEATING IN 3D ROOM
    socket.on('toggle_seat', (data: { isSeated: boolean; seatIndex?: number }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      participant.setSeated(data.isSeated, data.seatIndex);

      io.to(room.id).emit('seat_updated', {
        userId: participant.id,
        username: participant.username,
        isSeated: data.isSeated,
        seatIndex: data.seatIndex,
        participants: room.getAllParticipants(),
      });
    });

    // 10.1 TOGGLE MEDIA (WEBCAM & MIC)
    socket.on('toggle_media', (data: { isCameraOn: boolean; isMicOn: boolean }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;

      // Validate camera permission: Host/Mod or explicitly allowed participant
      if (data.isCameraOn && !room.isCameraAllowed(participant.id)) {
        socket.emit('permission_denied', {
          error: 'Host permission required to turn on camera.',
          action: 'CAMERA_PERMISSION',
        });
        return;
      }

      io.to(room.id).emit('user_media_updated', {
        userId: participant.id,
        username: participant.username,
        isCameraOn: data.isCameraOn,
        isMicOn: data.isMicOn,
      });
    });

    // 10.2 TOGGLE CAMERA PERMISSION (HOST / MOD ONLY)
    socket.on('toggle_camera_permission', (data: { targetUserId: string; allow: boolean }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      const res = room.setCameraAllowed(participant.id, data.targetUserId, data.allow);
      if (!res.success) {
        socket.emit('permission_denied', {
          error: res.error || 'Permission denied.',
          action: 'ALLOW_CAMERA',
        });
        return;
      }

      io.to(room.id).emit('camera_permission_updated', {
        targetUserId: data.targetUserId,
        isAllowed: data.allow,
        allowedUserIds: Array.from(room.allowedCamUserIds),
      });
    });

    // 10.3 UPDATE USERNAME
    socket.on('update_username', (data: { username: string }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found || !data.username) return;

      const { room, participant } = found;
      const clean = data.username.trim().substring(0, 32);
      if (!clean) return;

      participant.username = clean;
      if (room.hostId === participant.id) {
        room.hostName = clean;
      }

      io.to(room.id).emit('user_joined', {
        username: clean,
        userId: participant.id,
        role: participant.role,
        participants: room.getAllParticipants(),
      });
    });

    // 10B. UPDATE AVATAR
    socket.on('update_avatar', (data: { avatarId: string }) => {
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;
      const { room, participant } = found;
      if (participant && data?.avatarId) {
        participant.avatarId = data.avatarId;
        io.to(room.id).emit('participant_avatar_updated', {
          userId: participant.id,
          avatarId: data.avatarId,
        });
      }
    });

    // 11. LEAVE ROOM & DISCONNECT
    const handleLeave = () => {
      chatRateLimits.delete(socket.id);
      reactionRateLimits.delete(socket.id);

      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;

      const { room, participant } = found;
      const wasHost = participant.isHost();
      room.removeParticipant(participant.id);
      roomManager.unregisterSocket(socket.id);
      socket.leave(room.id);

      io.to(room.id).emit('user_left', {
        userId: participant.id,
        username: participant.username,
        participants: room.getAllParticipants(),
      });

      // If the host disconnected, do NOT immediately steal host role!
      // Give a 20-second grace period for reconnect or page refresh.
      if (wasHost && room.getParticipantCount() > 0) {
        if (hostDisconnectTimers.has(room.id)) {
          clearTimeout(hostDisconnectTimers.get(room.id)!);
        }
        const timer = setTimeout(() => {
          hostDisconnectTimers.delete(room.id);
          // Check if room still has no active host connected
          const activeHost = room.getParticipant(room.hostId);
          if (!activeHost && room.getParticipantCount() > 0) {
            const newHost = room.promoteNextHost();
            if (newHost) {
              io.to(room.id).emit('host_transferred', {
                newHostId: newHost.id,
                newHostUsername: newHost.username,
                oldHostId: participant.id,
                participants: room.getAllParticipants(),
              });
            }
          }
        }, 20000);
        hostDisconnectTimers.set(room.id, timer);
      }

      // Reap empty custom rooms to prevent memory leaks
      roomManager.checkAndCleanRoom(room.id);

      // Broadcast updated participant counts & public room directory
      const publicRoomsOnLeave = roomManager.listRooms().filter((r) => !r.isPrivate).map((r) => r.toJSON());
      io.emit('rooms_updated', publicRoomsOnLeave);
    };

    socket.on('leave_room', handleLeave);
    socket.on('disconnect', handleLeave);
  });
}
