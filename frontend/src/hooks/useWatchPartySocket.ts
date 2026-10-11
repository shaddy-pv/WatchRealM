import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config';

export type UserRole = 'HOST' | 'MODERATOR' | 'PARTICIPANT' | 'VIEWER';

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

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  text: string;
  timestamp: number;
}

export interface SyncStatePayload {
  playState: 'PLAYING' | 'PAUSED';
  currentTime: number;
  videoId: string;
  lastUpdated: number;
  title?: string;
  pausedBy?: string;
  pausedAt?: number;
}

export interface ReactionItem {
  id: string;
  username: string;
  emoji: string;
  timestamp: number;
}

export function useWatchPartySocket(
  roomId: string = 'fantasy-pavilion',
  username: string = 'Explorer',
  initialVideoId?: string,
  initialVideoTitle?: string,
  initialIsPrivate?: boolean
) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [myRole, setMyRole] = useState<UserRole>('PARTICIPANT');
  const [myUserId, setMyUserId] = useState<string>('');
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [playState, setPlayState] = useState<'PLAYING' | 'PAUSED'>('PLAYING');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentVideoId, setCurrentVideoId] = useState<string>(initialVideoId || '1La4QzGeaaQ');
  const [videoTitle, setVideoTitle] = useState<string>(initialVideoTitle || 'Watch Party Stream');
  const [isPrivateRoom, setIsPrivateRoom] = useState<boolean>(initialIsPrivate ?? false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeReactions, setActiveReactions] = useState<ReactionItem[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isKicked, setIsKicked] = useState<boolean>(false);
  const [mediaStates, setMediaStates] = useState<Record<string, { isCameraOn: boolean; isMicOn: boolean }>>({});
  const [allowedCamUserIds, setAllowedCamUserIds] = useState<string[]>([]);
  const [pausedBy, setPausedBy] = useState<string | undefined>(undefined);
  const [pausedAt, setPausedAt] = useState<number | undefined>(undefined);

  // Keep latest video info in refs so socket connect always emits latest values
  const initialVideoIdRef = useRef(initialVideoId);
  initialVideoIdRef.current = initialVideoId;
  const initialVideoTitleRef = useRef(initialVideoTitle);
  initialVideoTitleRef.current = initialVideoTitle;

  // Initialize socket connection
  useEffect(() => {
    setIsKicked(false);
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      const localAvatar = typeof window !== 'undefined' ? localStorage.getItem('wr_realm_avatar') || 'avatar_1' : 'avatar_1';
      // Join watch party room with actual custom video ID and realm avatar
      socket.emit('join_room', {
        roomId,
        username,
        avatarId: localAvatar,
        initialVideoId: initialVideoIdRef.current || undefined,
        initialVideoTitle: initialVideoTitleRef.current || undefined,
        isPrivate: initialIsPrivate,
        roomTitle: initialVideoTitleRef.current || undefined,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room_joined', (data: { room: any; myRole: UserRole; myUserId: string }) => {
      setMyRole(data.myRole);
      setMyUserId(data.myUserId);
      if (data.room) {
        setParticipants(data.room.participants || []);
        if (data.room.currentVideoId && data.room.currentVideoId !== '2LqzF5WauAw') {
          setCurrentVideoId(data.room.currentVideoId);
        } else if (initialVideoIdRef.current) {
          setCurrentVideoId(initialVideoIdRef.current);
        }
        if (data.room.videoTitle && !data.room.videoTitle.includes('Interstellar')) {
          setVideoTitle(data.room.videoTitle);
        } else if (initialVideoTitleRef.current) {
          setVideoTitle(initialVideoTitleRef.current);
        }
        setPlayState(data.room.playState || 'PLAYING');
        setCurrentTime(data.room.currentTime || 0);
        if (data.room.isPrivate !== undefined) {
          setIsPrivateRoom(data.room.isPrivate);
        }
        if (data.room.allowedCamUserIds) {
          setAllowedCamUserIds(data.room.allowedCamUserIds);
        }
        if (data.room.pausedBy !== undefined) {
          setPausedBy(data.room.pausedBy);
        }
        if (data.room.pausedAt !== undefined) {
          setPausedAt(data.room.pausedAt);
        }
      }
    });

    socket.on('sync_state', (data: SyncStatePayload) => {
      setPlayState(data.playState);
      setCurrentTime(data.currentTime);
      setPausedBy(data.pausedBy);
      setPausedAt(data.pausedAt);
      if (data.videoId !== undefined && (data.videoId !== '2LqzF5WauAw' || !initialVideoIdRef.current)) {
        setCurrentVideoId(data.videoId);
      }
      if (data.title && !data.title.includes('Interstellar')) {
        setVideoTitle(data.title);
      }
    });

    socket.on('user_joined', (data: { username: string; userId: string; role: UserRole; participants: ParticipantInfo[] }) => {
      setParticipants(data.participants);
    });

    socket.on('user_left', (data: { username: string; userId: string; participants: ParticipantInfo[] }) => {
      setParticipants(data.participants);
      // Re-verify my own role in case of automatic promotion
      const me = data.participants.find((p) => p.id === socket.id);
      if (me) {
        setMyRole(me.role);
      }
    });

    socket.on('role_assigned', (data: { userId: string; role: UserRole; participants: ParticipantInfo[] }) => {
      setParticipants(data.participants);
      if (data.userId === socket.id) {
        setMyRole(data.role);
      }
    });

    socket.on('participant_removed', (data: { userId: string; participants: ParticipantInfo[] }) => {
      setParticipants(data.participants);
    });

    socket.on('kicked_from_room', (data: { reason: string }) => {
      setPermissionError(data.reason || 'You were removed from the room by the host.');
      setIsKicked(true);
    });

    socket.on('permission_denied', (data: { error: string; action: string }) => {
      setPermissionError(data.error);
      setTimeout(() => setPermissionError(null), 4000);
    });

    socket.on('chat_broadcast', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-49), msg]);
    });

    socket.on('reaction_broadcast', (reaction: { userId: string; username: string; emoji: string }) => {
      const item: ReactionItem = {
        id: `react-${Date.now()}-${Math.random()}`,
        username: reaction.username,
        emoji: reaction.emoji,
        timestamp: Date.now(),
      };
      setActiveReactions((prev) => [...prev.slice(-9), item]);
    });

    socket.on('host_transferred', (data: { newHostId: string; oldHostId: string; participants: ParticipantInfo[] }) => {
      setParticipants(data.participants);
      if (data.newHostId === socket.id) {
        setMyRole('HOST');
      } else if (data.oldHostId === socket.id) {
        setMyRole('MODERATOR');
      }
    });

    socket.on('user_media_updated', (data: { userId: string; isCameraOn: boolean; isMicOn: boolean }) => {
      setMediaStates((prev) => ({
        ...prev,
        [data.userId]: { isCameraOn: data.isCameraOn, isMicOn: data.isMicOn },
      }));
    });

    socket.on('seat_updated', (data: { participants: ParticipantInfo[] }) => {
      setParticipants(data.participants);
    });

    socket.on('camera_permission_updated', (data: { targetUserId: string; isAllowed: boolean; allowedUserIds?: string[] }) => {
      if (data.allowedUserIds) {
        setAllowedCamUserIds(data.allowedUserIds);
      } else {
        setAllowedCamUserIds((prev) =>
          data.isAllowed
            ? [...prev.filter((id) => id !== data.targetUserId), data.targetUserId]
            : prev.filter((id) => id !== data.targetUserId)
        );
      }
    });

    socket.on('participant_avatar_updated', (data: { userId: string; avatarId: string }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === data.userId ? { ...p, avatarId: data.avatarId } : p))
      );
    });

    const handleLocalAvatarBroadcast = (e: any) => {
      const newAv = e?.detail?.avatarId || localStorage.getItem('wr_realm_avatar');
      if (newAv && socketRef.current?.connected) {
        socketRef.current.emit('update_avatar', { avatarId: newAv });
      }
    };
    window.addEventListener('wr_avatar_changed', handleLocalAvatarBroadcast as EventListener);

    return () => {
      window.removeEventListener('wr_avatar_changed', handleLocalAvatarBroadcast as EventListener);
      socket.emit('leave_room', { roomId });
      socket.disconnect();
    };
  }, [roomId, username]);

  // Actions
  const play = useCallback((time?: number) => {
    socketRef.current?.emit('play', { time });
  }, []);

  const pause = useCallback((time?: number) => {
    socketRef.current?.emit('pause', { time });
  }, []);

  const seek = useCallback((time: number) => {
    socketRef.current?.emit('seek', { time });
  }, []);

  const changeVideo = useCallback((videoId: string, title?: string) => {
    socketRef.current?.emit('change_video', { videoId, title });
  }, []);

  const assignRole = useCallback((userId: string, role: UserRole) => {
    socketRef.current?.emit('assign_role', { userId, role });
  }, []);

  const removeParticipant = useCallback((userId: string, durationMinutes?: number, isPermanent?: boolean, reason?: string) => {
    socketRef.current?.emit('remove_participant', { userId, durationMinutes, isPermanent, reason });
  }, []);

  const transferHost = useCallback((newHostUserId: string) => {
    socketRef.current?.emit('transfer_host', { newHostUserId });
  }, []);

  const clearVideo = useCallback(() => {
    socketRef.current?.emit('clear_video');
  }, []);

  const sendPlaybackHeartbeat = useCallback((time: number, playState: 'PLAYING' | 'PAUSED') => {
    socketRef.current?.emit('host_playback_heartbeat', { time, playState });
  }, []);

  const requestSync = useCallback(() => {
    socketRef.current?.emit('request_sync');
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    socketRef.current?.emit('chat_message', { text });
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    socketRef.current?.emit('reaction', { emoji });
  }, []);

  const toggleMedia = useCallback((isCameraOn: boolean, isMicOn: boolean) => {
    socketRef.current?.emit('toggle_media', { isCameraOn, isMicOn });
  }, []);

  const toggleCameraPermission = useCallback((targetUserId: string, allow: boolean) => {
    socketRef.current?.emit('toggle_camera_permission', { targetUserId, allow });
  }, []);

  const updateUsername = useCallback((newUsername: string) => {
    if (!newUsername.trim()) return;
    socketRef.current?.emit('update_username', { username: newUsername.trim() });
  }, []);

  const toggleSeat = useCallback((isSeated: boolean, seatIndex?: number) => {
    socketRef.current?.emit('toggle_seat', { isSeated, seatIndex });
  }, []);

  return {
    isConnected,
    myRole,
    setMyRole,
    myUserId,
    participants,
    playState,
    currentTime,
    currentVideoId,
    videoTitle,
    chatMessages,
    activeReactions,
    permissionError,
    mediaStates,
    allowedCamUserIds,
    isKicked,
    setPermissionError,
    play,
    pause,
    seek,
    changeVideo,
    assignRole,
    removeParticipant,
    transferHost,
    requestSync,
    sendChatMessage,
    sendReaction,
    toggleMedia,
    toggleCameraPermission,
    updateUsername,
    toggleSeat,
    pausedBy,
    pausedAt,
    clearVideo,
    sendPlaybackHeartbeat,
    isPrivate: isPrivateRoom,
  };
}
