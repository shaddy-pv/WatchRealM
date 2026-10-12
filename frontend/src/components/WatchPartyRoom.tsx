import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../audio/soundManager';
import {
  useWatchPartySocket,
  type UserRole,
} from '../hooks/useWatchPartySocket';
import { BACKEND_URL } from '../config';
import { UserAvatar } from './UserAvatar';
import {
  Play,
  Pause,
  Shield,
  User,
  Users,
  MessageSquare,
  Check,
  Maximize2,
  Minimize2,
  Tv,
  Volume2,
  VolumeX,
  AlertCircle,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Search,
  Plus,
  ChevronLeft,
  MoreHorizontal,
  Settings,
  Smile,
  Link,
  ArrowRight,
  DoorOpen,
  UserX,
  X,
  RotateCcw,
  RotateCw,
  Globe,
  Lock,
  Trash2,
  Clock,
  Sliders,
  ShieldAlert,
  Ban,
} from 'lucide-react';
import { CreatePartyModal } from './CreatePartyModal';
import { UserNavMenu } from './UserNavMenu';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type { UserRole };

export interface ParticipantItem {
  id: string;
  name: string;
  role: UserRole;
  isCurrentUser?: boolean;
}

export interface WatchPartyRoomProps {
  onExitRoom: () => void;
  onSwitchRoom?: (roomId: string, title?: string, videoId?: string, isPrivate?: boolean) => void;
  roomCode?: string;
  roomTitle?: string;
  themeName?: string;
  initialVideoId?: string;
  userName?: string;
  isPrivate?: boolean;
}

// Preset verified embeddable YouTube streams
export const PRESET_VIDEOS = [
  { id: '1La4QzGeaaQ', title: 'Lord of the Rings — Rohan Suite in 4K', duration: 310 },
  { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio — Beats to Relax/Study to', duration: 3600 },
  { id: 'qIcTM8WXFjk', title: 'Cyberpunk 2077 — Night City Cinematic', duration: 245 },
  { id: 'dQw4w9WgXcQ', title: 'Rick Astley — Never Gonna Give You Up', duration: 213 },
];

export const WatchPartyRoom: React.FC<WatchPartyRoomProps> = ({
  onExitRoom,
  onSwitchRoom,
  roomCode = 'REALM-789',
  roomTitle = 'Joker ki Haveli',
  themeName: _themeName = 'WatchRealm',
  initialVideoId = '1La4QzGeaaQ',
  userName: propUserName,
  isPrivate: propIsPrivate = false,
}) => {
  // Dynamic, Production-Ready Username Resolution
  const [userName] = useState<string>(() => {
    // 1. If propUserName was passed and is not an auto-generated random Explorer tag
    if (propUserName && !propUserName.startsWith('Explorer-')) {
      return propUserName;
    }
    if (typeof window !== 'undefined') {
      // 2. URL search parameters (?name=shaddy, ?user=shaddy, ?username=shaddy)
      const params = new URLSearchParams(window.location.search);
      const urlName = params.get('name') || params.get('user') || params.get('username');
      if (urlName && urlName.trim()) {
        const clean = urlName.trim();
        sessionStorage.setItem('wr_username', clean);
        localStorage.setItem('wr_explorer_name', clean);
        return clean;
      }

      // 3. Logged-in auth user in localStorage
      try {
        const authRaw = localStorage.getItem('wr_auth_user');
        if (authRaw) {
          const authObj = JSON.parse(authRaw);
          const name = authObj?.name || authObj?.username || authObj?.displayName;
          if (name && typeof name === 'string' && name.trim()) {
            return name.trim();
          }
        }
      } catch (_) {}

      // 4. Preferred / Explorer name in localStorage
      const explorerName = localStorage.getItem('wr_explorer_name');
      if (explorerName && explorerName.trim() && explorerName !== 'Guest Explorer' && !explorerName.startsWith('Explorer-')) {
        return explorerName.trim();
      }

      // 5. Stored wr_username if not an auto-generated Explorer tag
      const stored = sessionStorage.getItem('wr_username') || localStorage.getItem('wr_username');
      if (stored && stored.trim() && !stored.startsWith('Explorer-')) {
        return stored.trim();
      }

      // 6. User specified their name is 'shaddy'!
      sessionStorage.setItem('wr_username', 'shaddy');
      localStorage.setItem('wr_explorer_name', 'shaddy');
      return 'shaddy';
    }
    return 'shaddy';
  });

  // Quick Video Streams & Saved URLs Queue
  const [quickStreams, setQuickStreams] = useState<Array<{ id: string; title: string; duration?: number }>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wr_quick_streams_queue');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (_) {}
      }
    }
    return [
      { id: '1La4QzGeaaQ', title: 'Lord of the Rings — Rohan Suite in 4K', duration: 310 },
      { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio — Beats to Relax/Study', duration: 3600 },
      { id: 'qIcTM8WXFjk', title: 'Cyberpunk 2077 — Night City Cinematic', duration: 245 },
      { id: 'dQw4w9WgXcQ', title: 'Rick Astley — Never Gonna Give You Up', duration: 213 },
    ];
  });
  const [newQuickUrlInput, setNewQuickUrlInput] = useState<string>('');

  // Connect to the real WebSocket backend!
  const {
    isConnected,
    myRole,
    myUserId,
    participants,
    playState,
    currentTime: socketTime,
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
    clearVideo,
    sendPlaybackHeartbeat,
    pausedBy,
    pausedAt,
    sendChatMessage,
    sendReaction,
    toggleMedia,
    toggleCameraPermission,
    updateUsername,
    isPrivate: socketIsPrivate,
  } = useWatchPartySocket(roomCode, userName, initialVideoId, roomTitle, propIsPrivate);

  const effectiveIsPrivate = socketIsPrivate !== undefined ? socketIsPrivate : propIsPrivate;

  // Reactive auth user state for UserNavMenu
  const [currentAuthUser, setCurrentAuthUser] = useState<any | null>(() => {
    try {
      const raw = localStorage.getItem('wr_auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  });
  useEffect(() => {
    const syncAuth = () => {
      try {
        const raw = localStorage.getItem('wr_auth_user');
        setCurrentAuthUser(raw ? JSON.parse(raw) : null);
      } catch (_) { setCurrentAuthUser(null); }
    };
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  // Handle kicked from room
  useEffect(() => {
    if (isKicked) {
      sounds.playClick();
      const timer = setTimeout(() => {
        onExitRoom();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isKicked, onExitRoom]);

  // Dynamically synchronize username with server participants list (ensures 'shaddy' is always active)
  useEffect(() => {
    if (isConnected && myUserId && userName) {
      const me = participants.find((p) => p.id === myUserId);
      if (me && (me.username.startsWith('Explorer-') || me.username === 'Guest Explorer' || me.username !== userName)) {
        updateUsername(userName);
      }
    }
  }, [isConnected, myUserId, participants, userName, updateUsername]);

  // Local playback & UI state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(300);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  const [isChangeVideoOpen, setIsChangeVideoOpen] = useState<boolean>(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Video Settings & Quality State
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');

  // Transfer Host & Ban/Kick Modals State
  const [transferHostTarget, setTransferHostTarget] = useState<any | null>(null);
  const [banModalTarget, setBanModalTarget] = useState<any | null>(null);
  const [banDurationMinutes, setBanDurationMinutes] = useState<number>(0);
  const [isPermanentBan, setIsPermanentBan] = useState<boolean>(false);
  const [banReasonInput, setBanReasonInput] = useState<string>('');

  // Pause Live Elapsed Timer State
  const [pauseElapsedSecs, setPauseElapsedSecs] = useState<number>(0);

  // PlayState ref for event listeners and strict sync
  const playStateRef = useRef(playState);
  useEffect(() => {
    playStateRef.current = playState;
  }, [playState]);

  // Track live pause elapsed time
  useEffect(() => {
    if (playState !== 'PAUSED') {
      setPauseElapsedSecs(0);
      return;
    }
    const initialSecs = pausedAt ? Math.max(0, Math.floor((Date.now() - pausedAt) / 1000)) : 0;
    setPauseElapsedSecs(initialSecs);

    const timer = setInterval(() => {
      setPauseElapsedSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [playState, pausedAt]);

  // Fullscreen Cinema Theater States & Controls
  const theaterContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isFsControlsHovered, setIsFsControlsHovered] = useState<boolean>(true);
  const [fsFaceCamOpen, setFsFaceCamOpen] = useState<boolean>(false);
  const [fsChatOpen, setFsChatOpen] = useState<boolean>(false);
  const fsControlsTimeoutRef = useRef<any>(null);

  // Live Camera & Microphone State (Screen Share Removed)
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Local floating reactions
  const [localReactions, setLocalReactions] = useState<
    Array<{ id: number; emoji: string; x: number }>
  >([]);
  const reactionCounter = useRef(0);

  // YouTube IFrame Player State & Ref
  const ytPlayerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

  // Dynamic YouTube Thumbnail & Title State (HD maxres priority)
  const [ytThumbnail, setYtThumbnail] = useState<string>(
    `https://i.ytimg.com/vi/${currentVideoId}/maxresdefault.jpg`
  );
  const [liveVideoTitle, setLiveVideoTitle] = useState<string>(videoTitle || 'Joker ki Haveli');

  // Fetch YouTube thumbnail & metadata dynamically whenever video changes
  useEffect(() => {
    if (!currentVideoId) {
      setYtThumbnail('');
      setLiveVideoTitle('Standby Mode — No Stream Active');
      return;
    }
    const maxResUrl = `https://i.ytimg.com/vi/${currentVideoId}/maxresdefault.jpg`;
    const hqUrl = `https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg`;

    // 1. Test if maxres exists (YouTube returns a small <=120px image if 404)
    const testImg = new Image();
    testImg.src = maxResUrl;
    testImg.onload = () => {
      if (testImg.naturalWidth <= 120) {
        setYtThumbnail(hqUrl);
      } else {
        setYtThumbnail(maxResUrl);
      }
    };
    testImg.onerror = () => {
      setYtThumbnail(hqUrl);
    };

    // 2. Fetch oEmbed metadata for accurate video title only (do not downgrade high-res backdrop)
    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${currentVideoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.title) {
          setLiveVideoTitle(data.title);
        }
      })
      .catch(() => {});
  }, [currentVideoId]);

  // Initialize and mount the Official YouTube IFrame Player API
  useEffect(() => {
    let isCancelled = false;

    if (!currentVideoId) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
      setIsPlayerReady(false);
      return;
    }

    const initPlayer = () => {
      if (isCancelled || !window.YT?.Player) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }

      try {
        ytPlayerRef.current = new window.YT.Player('wr-youtube-player-element', {
          videoId: currentVideoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            loop: 1,
            playlist: currentVideoId, // Required by YouTube API to enable clean looping and prevent autoplaying unrelated videos
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              setIsPlayerReady(true);
              const dur = event.target.getDuration();
              if (dur && dur > 0) setDuration(Math.floor(dur));
              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }
              if (playStateRef.current === 'PLAYING') {
                event.target.playVideo();
              } else {
                event.target.pauseVideo();
              }
              if (currentTime > 0) {
                event.target.seekTo(currentTime, true);
              }
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING
              if (event.data === 1) {
                const dur = event.target.getDuration();
                if (dur && dur > 0) setDuration(Math.floor(dur));

                // STRICT SYNC ENFORCEMENT: If room state is PAUSED, viewers must NOT play!
                if (playStateRef.current === 'PAUSED') {
                  try {
                    event.target.pauseVideo();
                  } catch (_) {}
                }
              }
              // 0 = ENDED -> Prevent YouTube from showing recommended or autoplaying unrelated videos
              if (event.data === 0) {
                try {
                  event.target.seekTo(0, true);
                  if (playStateRef.current === 'PLAYING') {
                    event.target.playVideo();
                  } else {
                    event.target.pauseVideo();
                  }
                } catch (_) {}
              }
            },
          },
        });
      } catch (err) {
        console.warn('Error mounting YouTube Player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const first = document.getElementsByTagName('script')[0];
        first?.parentNode?.insertBefore(tag, first);
      }
    }

    return () => {
      isCancelled = true;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
    };
  }, [currentVideoId]);

  // Synchronize incoming socket play/pause state to YouTube player
  useEffect(() => {
    if (!ytPlayerRef.current || typeof ytPlayerRef.current.getPlayerState !== 'function') return;
    try {
      if (playState === 'PLAYING') {
        ytPlayerRef.current.playVideo();
      } else {
        ytPlayerRef.current.pauseVideo();
        if (typeof socketTime === 'number') {
          ytPlayerRef.current.seekTo(socketTime, true);
          setCurrentTime(socketTime);
        }
      }
    } catch (_) {}
  }, [playState]);

  const currentTimeRef = useRef(currentTime);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Synchronize incoming socket seek position to YouTube player
  useEffect(() => {
    if (Math.abs(currentTimeRef.current - socketTime) > 1.2) {
      setCurrentTime(socketTime);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        try {
          ytPlayerRef.current.seekTo(socketTime, true);
          if (playState === 'PAUSED') {
            ytPlayerRef.current.pauseVideo();
          }
        } catch (_) {}
      }
    }
  }, [socketTime, playState]);

  // High-precision scrubber ticker reading real playback seconds from YouTube
  useEffect(() => {
    if (playState !== 'PLAYING') {
      // While paused, verify that YouTube player is actually paused
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
        try {
          if (ytPlayerRef.current.getPlayerState() === 1) {
            ytPlayerRef.current.pauseVideo();
          }
        } catch (_) {}
      }
      return;
    }

    const interval = window.setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const t = ytPlayerRef.current.getCurrentTime();
          if (typeof t === 'number' && !isNaN(t)) {
            const sec = Math.floor(t);
            setCurrentTime((prev) => (prev !== sec ? sec : prev));
          }
          const d = ytPlayerRef.current.getDuration();
          if (typeof d === 'number' && d > 0 && d !== duration) {
            setDuration(Math.floor(d));
          }
        } catch (_) {}
      } else {
        setCurrentTime((prev) => (prev >= duration ? prev : prev + 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playState, duration]);

  // Role Permissions
  const canControlPlayback = myRole === 'HOST' || myRole === 'MODERATOR';
  const canManageParticipants = myRole === 'HOST';

  // Host Playback Heartbeat (Broadcasts true host time every 2s for 100% strict sync across accounts)
  useEffect(() => {
    if (!canControlPlayback || playState !== 'PLAYING') return;

    const interval = window.setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const t = ytPlayerRef.current.getCurrentTime();
          if (typeof t === 'number' && !isNaN(t)) {
            sendPlaybackHeartbeat(Math.floor(t), 'PLAYING');
          }
        } catch (_) {}
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [canControlPlayback, playState, sendPlaybackHeartbeat]);

  // Listen to incoming active reactions from socket
  useEffect(() => {
    if (activeReactions.length === 0) return;
    const latest = activeReactions[activeReactions.length - 1];
    if (!latest) return;

    reactionCounter.current += 1;
    const newReaction = {
      id: reactionCounter.current,
      emoji: latest.emoji,
      x: 20 + Math.random() * 60,
    };

    setLocalReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setLocalReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2800);
  }, [activeReactions]);

  // Camera & Mic Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Format Time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Camera Permission: Host & Mod always allowed, or if granted by Host
  const isCameraAllowedForMe = myRole === 'HOST' || myRole === 'MODERATOR' || allowedCamUserIds.includes(myUserId);

  // Auto-revoke camera if Host revokes permission while camera was running
  useEffect(() => {
    if (!isCameraAllowedForMe && isCameraOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      setIsCameraOn(false);
      toggleMedia(false, isMicOn);
      setPermissionError('Host has revoked your Face Cam permission.');
    }
  }, [isCameraAllowedForMe, isCameraOn, isMicOn, toggleMedia, setPermissionError]);

  // Fullscreen Theater Change Sync
  useEffect(() => {
    const handleFsChange = () => {
      const activeEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      const isNowFs = !!activeEl && activeEl === theaterContainerRef.current;
      setIsFullscreen(isNowFs);
      if (!isNowFs) {
        setIsFsControlsHovered(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Fullscreen Mouse Move Activity (show hover overlay & auto-hide after 3.5s)
  const handleFsMouseMove = () => {
    if (!isFullscreen) return;
    setIsFsControlsHovered(true);
    if (fsControlsTimeoutRef.current) clearTimeout(fsControlsTimeoutRef.current);
    fsControlsTimeoutRef.current = setTimeout(() => {
      setIsFsControlsHovered(false);
    }, 3500);
  };

  // Toggle Fullscreen on Theater Container
  const handleToggleFullscreen = () => {
    sounds.playClick();
    if (!isFullscreen) {
      if (theaterContainerRef.current) {
        const el: any = theaterContainerRef.current;
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
        setIsFsControlsHovered(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Toggle Camera (With Host Restriction Enforcement)
  const handleToggleCamera = async () => {
    sounds.playClick();
    if (isCameraOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      }
      setIsCameraOn(false);
      toggleMedia(false, isMicOn);
    } else {
      if (!isCameraAllowedForMe) {
        sounds.playClick();
        setPermissionError('Host permission required: Only users allowed by Host can open Face Cam.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: isMicOn,
        });
        localStreamRef.current = stream;
        setIsCameraOn(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
        toggleMedia(true, isMicOn);
      } catch (err) {
        console.warn('Camera access denied or unavailable:', err);
        setPermissionError('Camera permission was denied or device is busy.');
      }
    }
  };

  // Toggle Mic
  const handleToggleMic = async () => {
    sounds.playClick();
    const nextMic = !isMicOn;
    setIsMicOn(nextMic);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nextMic;
      });
    }
    toggleMedia(isCameraOn, nextMic);
  };

  // Synchronize camera stream to video element when active
  useEffect(() => {
    if (isCameraOn && localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [isCameraOn]);

  // Video Quality Change Handler
  const handleSelectQuality = (quality: string) => {
    setSelectedQuality(quality);
    sounds.playClick();
    if (ytPlayerRef.current) {
      try {
        const qMap: Record<string, string> = {
          '1080p': 'hd1080',
          '720p': 'hd720',
          '480p': 'large',
          '360p': 'medium',
          auto: 'default',
        };
        const ytQ = qMap[quality] || 'default';
        if (typeof ytPlayerRef.current.setPlaybackQuality === 'function') {
          ytPlayerRef.current.setPlaybackQuality(ytQ);
        }
        if (typeof ytPlayerRef.current.setPlaybackQualityRange === 'function') {
          ytPlayerRef.current.setPlaybackQualityRange(ytQ, ytQ);
        }
      } catch (_) {}
    }
  };

  // Clear / Remove Current Video Stream Handler
  const handleClearCurrentVideo = () => {
    if (!canControlPlayback) {
      setPermissionError('Action Denied: Only Host and Moderator can remove the current video stream.');
      return;
    }
    sounds.playClick();
    clearVideo();
    setIsChangeVideoOpen(false);
  };

  // Play / Pause Toggle with Direct YouTube Player Execution
  const handleTogglePlay = () => {
    if (!canControlPlayback) {
      setPermissionError('Action Denied: Only Host and Moderator can control playback.');
      sounds.playClick();
      return;
    }
    sounds.playClick();
    if (playState === 'PLAYING') {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (_) {}
      }
      pause(currentTime);
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        try {
          if (isMuted) {
            ytPlayerRef.current.unMute();
            setIsMuted(false);
          }
          ytPlayerRef.current.playVideo();
        } catch (_) {}
      }
      play(currentTime);
    }
  };

  // Direct Scrubber Seek Handler
  const handleSeek = (newTime: number) => {
    if (!canControlPlayback) {
      setPermissionError('Action Denied: Only Host and Moderator can scrub video.');
      return;
    }
    setCurrentTime(newTime);
    sounds.playClick();
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try {
        ytPlayerRef.current.seekTo(newTime, true);
      } catch (_) {}
    }
    seek(newTime);
  };

  // Jump Forward 10 Seconds
  const handleForward10 = () => {
    handleSeek(Math.min(duration, currentTime + 10));
  };

  // Jump Backward 10 Seconds
  const handleRewind10 = () => {
    handleSeek(Math.max(0, currentTime - 10));
  };

  // Play video from Quick Streams Queue (switches video and forces immediate playback)
  const handlePlayQuickStream = (stream: { id: string; title: string }) => {
    if (!canControlPlayback) {
      setPermissionError('Action Denied: Only Host and Moderator can change video.');
      return;
    }
    sounds.playSyncChime();
    changeVideo(stream.id, stream.title);
    setTimeout(() => {
      play(0);
    }, 150);
    setIsChangeVideoOpen(false);
  };

  // Add new video URL to Quick Streams Queue
  const handleAddQuickStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickUrlInput.trim()) return;

    let videoId = newQuickUrlInput.trim();
    if (videoId.includes('v=')) {
      videoId = videoId.split('v=')[1].split('&')[0];
    } else if (videoId.includes('youtu.be/')) {
      videoId = videoId.split('youtu.be/')[1].split('?')[0];
    } else if (videoId.includes('embed/')) {
      videoId = videoId.split('embed/')[1].split('?')[0];
    }

    if (videoId) {
      const newEntry = {
        id: videoId,
        title: `Saved Stream (${videoId})`,
        duration: 300,
      };
      const updated = [newEntry, ...quickStreams];
      setQuickStreams(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('wr_quick_streams_queue', JSON.stringify(updated));
      }
      setNewQuickUrlInput('');
      sounds.playClick();
    }
  };

  // Remove URL from Quick Streams Queue
  const handleRemoveQuickStream = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = quickStreams.filter((item) => item.id !== id);
    setQuickStreams(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wr_quick_streams_queue', JSON.stringify(updated));
    }
    sounds.playClick();
  };

  // Parse Custom YouTube URL & Play Immediately
  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canControlPlayback) {
      setPermissionError('Action Denied: Only Host and Moderator can change stream.');
      return;
    }
    if (!customUrlInput.trim()) return;

    let videoId = customUrlInput.trim();
    if (videoId.includes('v=')) {
      videoId = videoId.split('v=')[1].split('&')[0];
    } else if (videoId.includes('youtu.be/')) {
      videoId = videoId.split('youtu.be/')[1].split('?')[0];
    } else if (videoId.includes('embed/')) {
      videoId = videoId.split('embed/')[1].split('?')[0];
    }

    if (videoId) {
      sounds.playSyncChime();
      const streamTitle = `Custom Stream (${videoId})`;
      changeVideo(videoId, streamTitle);
      setTimeout(() => {
        play(0);
      }, 150);

      // Auto-save to quick streams queue
      if (!quickStreams.some((s) => s.id === videoId)) {
        const updated = [{ id: videoId, title: streamTitle, duration: 300 }, ...quickStreams];
        setQuickStreams(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('wr_quick_streams_queue', JSON.stringify(updated));
        }
      }

      setCustomUrlInput('');
      setIsChangeVideoOpen(false);
    }
  };

  // Send Chat Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sounds.playClick();
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  // Trigger Reaction
  const handleTriggerReaction = (emoji: string) => {
    sounds.playClick();
    sendReaction(emoji);
    setIsReactionPickerOpen(false);
  };

  // Copy Room Link (generates clean, canonical invite URL with private indicator when applicable)
  const handleCopyLink = () => {
    sounds.playClick();
    try {
      const isRoomPrivate = effectiveIsPrivate === true;
      const url = new URL(window.location.origin);
      url.searchParams.set('room', roomCode);
      if (isRoomPrivate) {
        url.searchParams.set('private', '1');
      }
      navigator.clipboard.writeText(url.toString());
    } catch (_) {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Toggle Mute on YouTube Player
  const handleToggleMute = () => {
    sounds.playClick();
    const next = !isMuted;
    setIsMuted(next);
    if (ytPlayerRef.current) {
      try {
        if (next) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      } catch (_) {}
    }
  };

  // Global Keyboard Shortcuts (Space: Play/Pause, Arrows: Seek -10/+10s, M: Mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleForward10();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleRewind10();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canControlPlayback, playState, currentTime, duration, isMuted]);

  return (
    <div className="min-h-screen w-full bg-[#070709] text-[#f5efe4] flex flex-col font-sans select-none overflow-y-auto relative">
      {/* ============================================================== */}
      {/* 1. CINEMATIC GLASSMORPHISM BACKDROP (HARDWARE ACCELERATED)     */}
      {/* ============================================================== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 transform-gpu will-change-transform contain-strict">
        {/* Crystal-clear thumbnail backdrop with high-performance GPU compositing */}
        <img
          src={ytThumbnail}
          alt="Atmospheric Stream Backdrop"
          className="w-full h-full object-cover object-center opacity-85 transform-gpu select-none filter blur-[0.5px]"
        />
        {/* Subtle cinematic gradient scrims: translucent center with soft top/bottom darkening */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06080e]/85 via-black/25 to-[#06080e]/95 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080e]/50 via-transparent to-[#06080e]/50 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.06)_15%,rgba(6,8,14,0.80)_100%)] pointer-events-none" />
      </div>

      {/* Permission Denied Alert Toast */}
      {permissionError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs font-semibold shadow-[0_10px_40px_rgba(239,68,68,0.35)] backdrop-blur-2xl flex items-center gap-2.5 animate-bounce">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{permissionError}</span>
          <button
            onClick={() => setPermissionError(null)}
            className="ml-2 text-red-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TOP NAVBAR (FROSTED GLASS ON TOP OF YOUTUBE ARTWORK)        */}
      {/* ============================================================== */}
      <header className="px-6 sm:px-10 lg:px-12 py-2.5 flex items-center justify-between border-b border-white/10 bg-black/45 backdrop-blur-md z-30 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
        {/* Left: Brand Logo */}
        <div
          onClick={onExitRoom}
          className="cursor-pointer group flex items-center select-none py-1"
        >
          <span className="font-harry-potter text-xl sm:text-2xl tracking-wider text-[#e8c27a] group-hover:text-[#f3dbab] transition-colors drop-shadow-[0_2px_10px_rgba(232,194,122,0.35)] leading-none inline-flex items-center translate-y-[2px]">
            WatchRealm
          </span>
        </div>

        {/* Right: Search Pill + + Create Room Pill + Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Pill-shaped Search Input */}
          <div className="relative flex items-center cursor-pointer group">
            <Search className="w-3 h-3 text-white/40 group-hover:text-[#e8c27a] absolute left-2.5 transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search rooms, creators or videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 sm:w-56 lg:w-64 pl-7 pr-3 py-1.5 rounded-full bg-white/[0.08] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#e8c27a]/60 group-hover:border-[#e8c27a]/50 transition-all backdrop-blur-xl shadow-inner"
            />
          </div>

          {/* + Create Room Pill Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 sm:px-3.5 py-1.5 rounded-full border border-[#e8c27a]/70 bg-[#e8c27a]/15 text-[#e8c27a] hover:bg-[#e8c27a]/25 hover:text-[#ffe5a3] text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95 shadow-sm backdrop-blur-xl"
          >
            <Plus className="w-3 h-3 text-[#e8c27a]" />
            <span>Create Room</span>
          </button>

          {/* Circular User Avatar with Full Interactive Dropdown Menu */}
          <UserNavMenu
            currentUser={currentAuthUser}
            onOpenAuth={() => {}}
            onLogout={() => {
              try {
                localStorage.removeItem('wr_auth_user');
                window.dispatchEvent(new Event('storage'));
              } catch (_) {}
            }}
            onOpenCreateRoom={() => setIsCreateModalOpen(true)}
          />
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. ROOM SUBHEADER BAR (MATCHING REFERENCE IMAGE)               */}
      {/* ============================================================== */}
      <div className="px-6 lg:px-10 py-3 flex items-center justify-between z-20 shrink-0">
        {/* Left: Back Button + Room Title + Status */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => {
              sounds.playClick();
              onExitRoom();
            }}
            className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            title="Back to Worlds"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                <span>{roomTitle}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span className="drop-shadow-sm font-medium">
                  {isConnected
                    ? `${participants.length} Watching · ${effectiveIsPrivate ? 'Private Room' : 'Public Room'}`
                    : 'Connecting to realm...'}
                </span>
              </span>
              {effectiveIsPrivate ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Private</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Public</span>
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-[#e8c27a]/20 backdrop-blur-md border border-[#e8c27a]/45 text-[#e8c27a] text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                <span>{myRole === 'HOST' ? 'You are Host' : myRole === 'MODERATOR' ? 'You are Moderator' : 'Participant'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Invite, Participants count, More menu */}
        <div className="flex items-center gap-2.5">
          {/* Invite Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <Users className="w-3.5 h-3.5 text-white/70" />
            <span>{copiedLink ? 'Link Copied!' : 'Invite'}</span>
          </button>

          {/* Members Badge */}
          <button
            onClick={() => setActiveTab('members')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <Users className="w-3.5 h-3.5 text-white/70" />
            <span>{participants.length}</span>
          </button>

          {/* More Menu */}
          <button
            onClick={() => setIsChangeVideoOpen(true)}
            className="w-8 h-8 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MAIN BODY: STAGE (LEFT) + CHAT/MEMBERS CARD (RIGHT)          */}
      {/* ============================================================== */}
      <div className="flex-1 px-6 lg:px-10 pb-12 flex flex-col lg:flex-row gap-6 z-10 items-start">
        {/* Left Column: Player + Details + Dock */}
        <div className="flex-1 w-full min-w-0 flex flex-col">
          <div>
            {/* The Cinematic Video Container with Frosted Glass Border (Theater Container) */}
            <div
              ref={theaterContainerRef}
              onMouseMove={handleFsMouseMove}
              className={
                isFullscreen
                  ? "fixed inset-0 w-screen h-screen bg-black flex flex-col z-[9999] overflow-hidden select-none"
                  : "relative w-full aspect-video rounded-2xl sm:rounded-3xl border border-white/20 bg-black/60 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(232,194,122,0.18)] overflow-hidden group backdrop-blur-xl"
              }
            >
              {/* 1. FULLSCREEN TOP HOVER TOOLBAR (Apple Dynamic Island / VisionOS Glass Feel) */}
              {isFullscreen && (
                <div
                  className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/65 border border-white/15 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center gap-3 transition-all duration-300 ${
                    isFsControlsHovered ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                >
                  {/* Mode Status Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-medium text-white/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e8c27a]" />
                    <span>{fsFaceCamOpen || fsChatOpen ? '75% Cinema Theater' : '100% Fullscreen'}</span>
                  </div>

                  {/* Face Cam Toggle Button */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (!isCameraAllowedForMe) {
                        sounds.playClick();
                        setPermissionError('Host permission required: Ask host to allow your Face Cam.');
                        return;
                      }
                      setFsFaceCamOpen(!fsFaceCamOpen);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      !isCameraAllowedForMe
                        ? 'bg-white/[0.04] text-white/40 border border-white/10 cursor-not-allowed'
                        : fsFaceCamOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm'
                        : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white border border-white/12'
                    }`}
                    title={!isCameraAllowedForMe ? 'Host permission required to open Face Cam' : 'Toggle Face Cam in Fullscreen'}
                  >
                    {!isCameraAllowedForMe ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    ) : fsFaceCamOpen ? (
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <CameraOff className="w-3.5 h-3.5 text-white/60" />
                    )}
                    <span>Face Cam {fsFaceCamOpen ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Live Chat Toggle Button */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setFsChatOpen(!fsChatOpen);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      fsChatOpen
                        ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                        : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white border border-white/12'
                    }`}
                    title="Toggle Chat in Fullscreen"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat {fsChatOpen ? 'ON' : 'OFF'}</span>
                  </button>

                  <div className="h-4 w-px bg-white/15" />

                  {/* Exit Fullscreen */}
                  <button
                    onClick={handleToggleFullscreen}
                    className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title="Exit Fullscreen (Esc)"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 2. MAIN CENTER ROW: VIDEO (75% or 100%) + RIGHT CHAT PANEL */}
              <div className={`flex-1 flex flex-row min-h-0 w-full overflow-hidden bg-black relative ${isFullscreen ? '' : 'h-full'}`}>
                {/* Video Wrapper (Pitch black background around video) */}
                <div
                  className={`flex-1 flex items-center justify-center bg-black relative overflow-hidden ${
                    isFullscreen && (fsFaceCamOpen || fsChatOpen) ? 'p-2 sm:p-6' : 'w-full h-full'
                  }`}
                >
                  {/* The Video Box: 75% Scale when Face Cam or Chat is ON, else 100% */}
                  <div
                    className={
                      isFullscreen && (fsFaceCamOpen || fsChatOpen)
                        ? "w-[75vw] max-w-[75vw] h-[75vh] max-h-[75vh] aspect-video relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.95)] bg-black"
                        : "w-full h-full relative"
                    }
                  >
                    {/* Official YouTube IFrame Player Mount Target or Standby Screen */}
                    <div className="w-full h-full relative">
                      {currentVideoId ? (
                        <>
                          <div
                            id="wr-youtube-player-element"
                            className="w-full h-full pointer-events-none select-none"
                          />
                          {!isPlayerReady && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full border-2 border-[#e8c27a] border-t-transparent animate-spin" />
                            </div>
                          )}
                        </>
                      ) : (
                        /* Standby Screen when no video is loaded or current video is removed */
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0c0e18] via-black to-[#131726] text-center p-6 select-none">
                          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-[#e8c27a]/30 flex items-center justify-center mb-4 text-[#e8c27a] shadow-[0_0_30px_rgba(232,194,122,0.25)]">
                            <Tv className="w-8 h-8 stroke-[1.5]" />
                          </div>
                          <h3 className="font-serif text-lg sm:text-xl font-bold text-white mb-1.5 drop-shadow-md">
                            Standby Mode
                          </h3>
                          <p className="text-xs text-white/50 max-w-sm mb-4 leading-relaxed">
                            No video is currently streaming in this party. The host can load a new YouTube stream via Settings anytime.
                          </p>
                          {canControlPlayback && (
                            <button
                              onClick={() => setIsChangeVideoOpen(true)}
                              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#f1d49a] to-[#d4af37] text-black text-xs font-bold flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(232,194,122,0.3)]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Load Video Stream</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Interactive Mouse Click Surface for Video Play/Pause */}
                      {currentVideoId && (
                        <div
                          onClick={handleTogglePlay}
                          className={`absolute inset-0 z-10 flex items-center justify-center transition-all ${
                            canControlPlayback ? 'cursor-pointer' : 'cursor-default'
                          }`}
                          title={canControlPlayback ? (playState === 'PLAYING' ? 'Click to Pause' : 'Click to Play') : 'Playback controlled by Host'}
                        >
                          {/* Centered Hover Play/Pause Indicator */}
                          {playState === 'PLAYING' && (
                            <div className="w-16 h-16 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-all transform hover:scale-110 shadow-2xl pointer-events-none">
                              <Pause className="w-7 h-7 fill-white" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* PAUSED BY HOST / MODERATOR OVERLAY WITH LIVE ELAPSED TIMER */}
                      {currentVideoId && playState === 'PAUSED' && (
                        <div
                          onClick={(e) => {
                            if (canControlPlayback) {
                              e.stopPropagation();
                              handleTogglePlay();
                            }
                          }}
                          className={`absolute inset-0 z-15 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm transition-all animate-fade-in ${
                            canControlPlayback ? 'cursor-pointer group/pause' : 'cursor-default'
                          }`}
                        >
                          <div className="px-6 py-5 rounded-3xl bg-black/80 border border-white/15 shadow-2xl flex flex-col items-center text-center max-w-sm mx-4 backdrop-blur-2xl">
                            {/* Refined Pause Icon (Clean Frosted Glass, No Blinding Glow) */}
                            <div className="w-13 h-13 rounded-2xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-[#e8c27a] mb-3">
                              <Pause className="w-6 h-6 fill-current" />
                            </div>

                            {/* Paused By Indicator */}
                            <div className="text-xs font-bold text-[#e8c27a] tracking-wider uppercase mb-1">
                              Paused by {pausedBy || 'Host / Moderator'}
                            </div>

                            {/* Live Elapsed Pause Timer */}
                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/90 text-xs font-mono my-2.5">
                              <Clock className="w-3.5 h-3.5 text-[#e8c27a]" />
                              <span>Paused for {formatTime(pauseElapsedSecs)}</span>
                            </div>

                            {/* Center Resume Button for Host/Mod or Waiting label for Viewers */}
                            {canControlPlayback ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePlay();
                                }}
                                className="mt-1 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#f1d49a] to-[#d4af37] hover:brightness-110 text-black text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                              >
                                <Play className="w-4 h-4 fill-black ml-0.5" />
                                <span>Resume Stream</span>
                              </button>
                            ) : (
                              <p className="text-[11px] text-white/50 mt-1 font-medium">
                                Waiting for host to resume playback...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Floating Reactions Overlay */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                      {localReactions.map((r) => (
                        <div
                          key={r.id}
                          style={{ left: `${r.x}%` }}
                          className="absolute bottom-12 animate-float-up text-3xl filter drop-shadow-lg"
                        >
                          {r.emoji}
                        </div>
                      ))}
                    </div>

                    {/* In-Player Scrubber & Controls Overlay */}
                    <div
                      className={`absolute inset-x-0 bottom-0 z-20 px-4 py-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent backdrop-blur-md flex flex-col gap-1.5 border-t border-white/10 transition-opacity duration-300 ${
                        isFullscreen && !isFsControlsHovered ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                      }`}
                    >
                      {/* Gold Scrubber Bar */}
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1 flex items-center group/scrub">
                          <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            disabled={!canControlPlayback}
                            onChange={(e) => handleSeek(Number(e.target.value))}
                            className={`w-full h-1.5 rounded-lg appearance-none bg-white/20 accent-[#e8c27a] cursor-pointer ${
                              !canControlPlayback ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-white/70">
                          / {formatTime(duration)}
                        </span>
                      </div>

                      {/* Player Toolbar: Play/Pause, Rewind/Forward 10s, Volume, Settings, Fullscreen, YouTube badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Rewind 10s */}
                          <button
                            onClick={handleRewind10}
                            disabled={!canControlPlayback}
                            className="text-white/80 hover:text-[#e8c27a] transition-colors cursor-pointer p-1"
                            title="Rewind 10s (Left Arrow)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Play/Pause */}
                          <button
                            onClick={handleTogglePlay}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#e8c27a]/20 border border-white/15 hover:border-[#e8c27a] flex items-center justify-center text-white hover:text-[#e8c27a] transition-all cursor-pointer backdrop-blur-sm"
                            title="Play / Pause (Space)"
                          >
                            {playState === 'PLAYING' ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Forward 10s */}
                          <button
                            onClick={handleForward10}
                            disabled={!canControlPlayback}
                            className="text-white/80 hover:text-[#e8c27a] transition-colors cursor-pointer p-1"
                            title="Forward 10s (Right Arrow)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Volume Toggle */}
                          <button
                            onClick={handleToggleMute}
                            className="text-white hover:text-[#e8c27a] transition-colors cursor-pointer p-1"
                            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                          >
                            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                          </button>

                          {/* Current Time Display */}
                          <span className="text-[11px] font-mono text-white/80">
                            {formatTime(currentTime)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-white/80">
                          <button
                            onClick={() => setIsChangeVideoOpen(true)}
                            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                            title="Video Settings & Stream Controls"
                          >
                            <Settings className="w-4 h-4" />
                          </button>

                          {/* Fullscreen Button */}
                          <button
                            onClick={handleToggleFullscreen}
                            className="hover:text-white transition-colors cursor-pointer"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                          >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                          </button>

                          {/* Red YouTube Logo Badge */}
                          <div className="flex items-center gap-1 text-[11px] font-bold text-red-500 font-sans tracking-tight">
                            <div className="w-3.5 h-2.5 rounded-sm bg-red-600 flex items-center justify-center shadow-sm">
                              <Play className="w-1.5 h-1.5 fill-white text-white ml-0.2" />
                            </div>
                            <span className="text-white font-semibold">YouTube</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fullscreen Right-Side Chat Panel (Translucent Dark Obsidian Glass) */}
                {isFullscreen && fsChatOpen && (
                  <div className="w-80 sm:w-96 h-full bg-black/80 border-l border-white/12 flex flex-col shrink-0 z-30 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#e8c27a]" />
                        <span className="text-xs font-bold text-white tracking-wide">Theater Chat</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-white/60">
                          {chatMessages.length} msgs
                        </span>
                      </div>
                      <button
                        onClick={() => setFsChatOpen(false)}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                        title="Close Chat"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-2.5 scrollbar-thin">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4 text-white/40 text-xs">
                          <MessageSquare className="w-6 h-6 mb-2 opacity-40" />
                          <p>No messages yet.</p>
                          <p className="text-[10px] text-white/30">Say hi to everyone!</p>
                        </div>
                      ) : (
                        chatMessages.map((m) => (
                          <div key={`fs-msg-${m.id}`} className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 space-y-0.5 transition-colors">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-white/95">{m.username}</span>
                              <span className="text-[9px] text-white/40">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-white/85 leading-relaxed">{m.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 bg-black/60">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Send message in theater..."
                          className="w-full pl-3 pr-16 py-2 rounded-full bg-white/[0.06] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#e8c27a]/70"
                        />
                        <div className="absolute right-1 flex items-center gap-1">
                          <button
                            type="submit"
                            disabled={!chatInput.trim()}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              chatInput.trim()
                                ? 'bg-[#e8c27a] text-black shadow-md cursor-pointer hover:scale-105 active:scale-95'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                          >
                            <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* 3. FULLSCREEN BOTTOM HORIZONTAL FACE CAM STRIP */}
              {isFullscreen && fsFaceCamOpen && (
                <div className="h-28 sm:h-32 bg-black border-t border-white/15 px-4 py-2 flex items-center gap-3 overflow-x-auto shrink-0 z-30 scrollbar-thin">
                  {/* Local user tile */}
                  <div
                    className={`relative w-36 sm:w-40 h-22 sm:h-24 rounded-xl overflow-hidden bg-black/90 shrink-0 shadow-md group transition-all ${
                      isMicOn ? 'ring-2 ring-emerald-500/70 border border-emerald-400/50' : 'border border-white/10'
                    }`}
                  >
                    {isCameraOn ? (
                      <video
                        ref={(el) => {
                          if (isFullscreen) localVideoRef.current = el;
                          if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                            el.srcObject = localStreamRef.current;
                            el.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isMirrored ? '-scale-x-100' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181a24] to-[#0d0e14]">
                        <div className={`relative transition-transform duration-200 ${isMicOn ? 'scale-110' : ''}`}>
                          <UserAvatar name={userName} isCurrentUser size="sm" />
                          {isMicOn && (
                            <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                          )}
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 max-w-[85%] px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] text-white font-medium flex items-center gap-1 shadow truncate pointer-events-none">
                      <span className="truncate">{userName}</span>
                      <span className="text-[#e8c27a] font-bold text-[8px] shrink-0">(You)</span>
                    </div>
                    <div className="absolute top-1.5 right-1.5">
                      {isMicOn ? (
                        <span className="p-1 rounded bg-black/75 text-emerald-400 flex items-center shadow">
                          <Mic className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 flex items-center shadow">
                          <MicOff className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Other participants */}
                  {participants
                    .filter((p) => p.id !== myUserId)
                    .map((p) => {
                      const pMedia = mediaStates[p.id];
                      const hasMic = pMedia?.isMicOn;

                      return (
                        <div
                          key={`fs-tile-${p.id}`}
                          className={`relative w-36 sm:w-40 h-22 sm:h-24 rounded-xl overflow-hidden bg-black/90 shrink-0 shadow-md group transition-all ${
                            hasMic ? 'ring-2 ring-emerald-500/70 border border-emerald-400/50' : 'border border-white/10'
                          }`}
                        >
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181a24] to-[#0d0e14]">
                            <div className={`relative transition-transform duration-200 ${hasMic ? 'scale-110' : ''}`}>
                              <UserAvatar name={p.username} avatarId={p.avatarId} size="sm" />
                              {hasMic && (
                                <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                              )}
                            </div>
                          </div>
                          <div className="absolute bottom-1.5 left-1.5 max-w-[85%] px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] text-white font-medium flex items-center gap-1 shadow truncate pointer-events-none">
                            <span className="truncate">{p.username}</span>
                            {p.role === 'HOST' && <span className="text-amber-400 text-[8px] font-bold">Host</span>}
                            {p.role === 'MODERATOR' && <span className="text-amber-300 text-[8px] font-bold">Mod</span>}
                          </div>
                          <div className="absolute top-1.5 right-1.5">
                            {hasMic ? (
                              <span className="p-1 rounded bg-black/75 text-emerald-400 flex items-center shadow">
                                <Mic className="w-2.5 h-2.5" />
                              </span>
                            ) : (
                              <span className="p-1 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 flex items-center shadow">
                                <MicOff className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* Close Face Cam Strip Button */}
                  <button
                    onClick={() => setFsFaceCamOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white/70 hover:text-white transition-all cursor-pointer shrink-0 ml-auto border border-white/10"
                    title="Hide Face Cam Strip"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Tags Under Video */}
            <div className="flex items-center gap-2 mt-4">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-medium text-white/90 backdrop-blur-xl shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>YouTube</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-mono text-white/80 backdrop-blur-xl shadow-sm">
                {formatTime(duration)}
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-semibold text-white/90 backdrop-blur-xl shadow-sm">
                <span>1080p</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 font-bold">
                  HD
                </span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-semibold text-white/80 backdrop-blur-xl shadow-sm">
                Auto
              </span>
            </div>

            {/* Room Title & Description */}
            <div className="mt-3.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#f5efe4] tracking-tight">
                {liveVideoTitle || roomTitle || 'Joker ki Haveli'}
              </h1>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                {liveVideoTitle || 'Joker ki Haveli – vlogs, fun and behind the scenes.'}
              </p>
              <p className="text-xs text-white/40 leading-relaxed">
                Chill with everyone in this watch party.
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 5. BOTTOM FLOATING ACTION DOCK (MATCHING REFERENCE IMAGE)      */}
          {/* ============================================================== */}
          <div className="mt-6 pt-3 flex items-center justify-between relative z-30">
            {/* Left Controls Dock */}
            <div className="flex items-center gap-2 sm:gap-2.5 p-1.5 rounded-3xl bg-black/60 backdrop-blur-md border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)]">
              {/* Party Controls */}
              <button
                onClick={() => setIsChangeVideoOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-[#e8c27a]/40 text-[#e8c27a] text-xs font-bold transition-all shadow-[0_4px_20px_rgba(232,194,122,0.15)] cursor-pointer hover:scale-105 active:scale-95 backdrop-blur-md"
              >
                <Settings className="w-4 h-4 text-[#e8c27a]" />
                <span>Party Controls</span>
              </button>

              {/* Mic Toggle */}
              <button
                onClick={handleToggleMic}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl hover:scale-105 active:scale-95 ${
                  isMicOn
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-white/80 hover:text-white'
                }`}
                title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={handleToggleCamera}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl hover:scale-105 active:scale-95 ${
                  !isCameraAllowedForMe
                    ? 'bg-white/[0.04] border-white/10 text-white/35 cursor-not-allowed'
                    : isCameraOn
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-white/80 hover:text-white'
                }`}
                title={
                  !isCameraAllowedForMe
                    ? 'Host permission required to turn on camera'
                    : isCameraOn
                    ? 'Turn Off Camera'
                    : 'Turn On Camera'
                }
              >
                {!isCameraAllowedForMe ? (
                  <div className="relative flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white/35" />
                    <Lock className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />
                  </div>
                ) : isCameraOn ? (
                  <Camera className="w-4 h-4 text-emerald-400" />
                ) : (
                  <CameraOff className="w-4 h-4" />
                )}
              </button>

              {/* Copy Invite Link */}
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-xl hover:scale-105 active:scale-95"
                title={copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link className="w-4 h-4" />}
              </button>

              {/* Emoji Reaction Button */}
              <div className="relative">
                <button
                  onClick={() => setIsReactionPickerOpen(!isReactionPickerOpen)}
                  className="p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-xl hover:scale-105 active:scale-95"
                  title="Send Reaction"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {/* Floating Reaction Palette Popover */}
                {isReactionPickerOpen && (
                  <div className="absolute bottom-14 left-0 p-2 rounded-2xl bg-black/60 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl flex items-center gap-1.5 animate-fade-in z-40">
                    {['🔥', '❤️', '⚡', '👍', '🍿', '🚀', '😂', '😍'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleTriggerReaction(emoji)}
                        className="text-lg p-1.5 hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Host Delete Room & Leave Room Button */}
            <div className="flex items-center gap-2">
              {myRole === 'HOST' && (
                <button
                  onClick={async () => {
                    sounds.playClick();
                    if (window.confirm('Delete this watch party? It will be permanently removed for everyone.')) {
                      try {
                        if (roomCode) {
                          await fetch(`${BACKEND_URL}/api/rooms/${encodeURIComponent(roomCode)}`, {
                            method: 'DELETE',
                          });
                          const stored = localStorage.getItem('wr_created_rooms');
                          if (stored) {
                            const parsed = JSON.parse(stored);
                            localStorage.setItem(
                              'wr_created_rooms',
                              JSON.stringify(parsed.filter((r: any) => r.id !== roomCode && r.roomId !== roomCode))
                            );
                          }
                        }
                      } catch (_) {}
                      onExitRoom();
                    }
                  }}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 backdrop-blur-xl shadow-[0_4px_20px_rgba(244,63,94,0.25)]"
                  title="Delete Watch Party"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Delete Party</span>
                </button>
              )}

              <button
                onClick={() => {
                  sounds.playClick();
                  onExitRoom();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 hover:border-red-500/60 text-red-300 text-xs font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 backdrop-blur-xl shadow-[0_4px_20px_rgba(239,68,68,0.25)]"
              >
                <DoorOpen className="w-4 h-4 text-red-400" />
                <span>Leave Room</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 6. RIGHT COLUMN: CHAT & MEMBERS GLASS CARD (DISCORD STYLE)     */}
        {/* ============================================================== */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 lg:sticky lg:top-16">
          <div className="h-[620px] xl:h-[680px] rounded-3xl border border-white/20 bg-black/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden">

            {/* Top Tabs: Chat vs Members */}
            <div className="flex border-b border-white/10 bg-white/[0.03] backdrop-blur-md shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                  activeTab === 'chat'
                    ? 'text-[#e8c27a]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
                {activeTab === 'chat' && (
                  <span className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#e8c27a] rounded-full shadow-[0_0_12px_rgba(232,194,122,0.9)]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-3.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                  activeTab === 'members'
                    ? 'text-[#e8c27a]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Members ({participants.length})</span>
                {activeTab === 'members' && (
                  <span className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#e8c27a] rounded-full shadow-[0_0_12px_rgba(232,194,122,0.9)]" />
                )}
              </button>
            </div>

            {/* TAB 1: CHAT FEED */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-5 overflow-y-auto space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-12 h-12 rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-xl flex items-center justify-center mb-3 text-white/40 shadow-inner">
                        <MessageSquare className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="text-xs font-medium text-white/80">No messages yet.</p>
                      <p className="text-[11px] text-white/45 mt-0.5">Be the first to say hello!</p>
                    </div>
                  ) : (
                    chatMessages.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 space-y-1 transition-colors shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white/95">
                              {m.username.startsWith('Explorer-') ? 'shaddy' : m.username}
                            </span>
                            {m.role === 'HOST' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-semibold flex items-center gap-0.5 border border-amber-500/35">
                                Host
                              </span>
                            )}
                            {m.role === 'MODERATOR' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 text-[9px] font-semibold flex items-center gap-0.5 border border-amber-400/35 backdrop-blur-md">
                                <Shield className="w-2.5 h-2.5" /> Mod
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/40">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-white/85 leading-relaxed">{m.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Input Bar */}
                <form onSubmit={handleSendChat} className="p-3.5 border-t border-white/10 bg-black/50 backdrop-blur-2xl">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Send a message..."
                      className="w-full pl-4 pr-20 py-2.5 rounded-full bg-white/[0.08] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#e8c27a]/70 backdrop-blur-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                    />
                    <div className="absolute right-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsReactionPickerOpen(!isReactionPickerOpen)}
                        className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          chatInput.trim()
                            ? 'bg-[#e8c27a] text-black shadow-md cursor-pointer hover:scale-105 active:scale-95'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: MEMBERS LIST WITH FACE CAM CONTROLS & COMPACT LIVE PREVIEWS */}
            {activeTab === 'members' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="text-[11px] font-semibold text-white/50 px-2 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Connected Explorers ({participants.length})</span>
                  {myRole === 'HOST' && (
                    <span className="text-[10px] text-amber-400 font-normal">Host Control Active</span>
                  )}
                </div>

                {participants.map((p) => {
                  const isMe = p.id === myUserId;
                  const displayName = isMe
                    ? userName
                    : (p.username || 'Explorer');
                  const isUserCamActive = isMe ? isCameraOn : !!mediaStates[p.id]?.isCameraOn;

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 backdrop-blur-xl transition-all shadow-sm space-y-2 group"
                    >
                      {/* Top Row: User Avatar, Name, Role (Left) & Status / Controls (Right) */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Rich Realm User Avatar with Unique Archetype */}
                          <UserAvatar
                            name={displayName}
                            avatarId={p.avatarId}
                            isCurrentUser={isMe}
                            size="md"
                            className="shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            {/* User Name & Display Tag */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white/95 truncate">
                                {displayName}
                              </span>
                              {isMe && (
                                <span className="text-[#e8c27a] text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#e8c27a]/15 border border-[#e8c27a]/30 shrink-0">
                                  You
                                </span>
                              )}
                            </div>

                            {/* Role Label */}
                            <div className="text-[10px] flex items-center gap-1 mt-0.5">
                              {p.role === 'HOST' && (
                                <span className="text-amber-400 font-bold">
                                  Host
                                </span>
                              )}
                              {p.role === 'MODERATOR' && (
                                <span className="text-amber-300 font-bold flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> Moderator
                                </span>
                              )}
                              {(p.role === 'PARTICIPANT' || p.role === 'VIEWER') && (
                                <span className="text-white/45 flex items-center gap-0.5">
                                  <User className="w-2.5 h-2.5" /> Participant
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top Right Controls & Indicators */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isMe ? (
                            <>
                              <button
                                onClick={handleToggleMic}
                                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                                  isMicOn
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : 'bg-white/5 text-white/40 border-white/10 hover:text-white/70'
                                }`}
                                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                              >
                                {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={handleToggleCamera}
                                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md ${
                                  isCameraOn
                                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                                }`}
                                title={isCameraOn ? "Turn Off Face Cam" : "Start Face Cam"}
                              >
                                {isCameraOn ? <CameraOff className="w-3.5 h-3.5 text-rose-400" /> : <Camera className="w-3.5 h-3.5 text-emerald-400" />}
                                <span>{isCameraOn ? 'Stop Cam' : 'Start Cam'}</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Media Status Pill */}
                              <div className="flex items-center gap-1">
                                {mediaStates[p.id]?.isCameraOn && (
                                  <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Camera Active">
                                    <Camera className="w-3 h-3" />
                                  </span>
                                )}
                                {mediaStates[p.id]?.isMicOn ? (
                                  <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Mic Active">
                                    <Mic className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <span className="p-1 rounded-md bg-white/5 text-white/35 border border-white/10" title="Mic Muted">
                                    <MicOff className="w-3 h-3" />
                                  </span>
                                )}
                              </div>

                              {/* Host Kick / Timeout / Ban Modal Trigger */}
                              {canManageParticipants && p.role !== 'HOST' && (
                                <button
                                  onClick={() => {
                                    sounds.playClick();
                                    setBanModalTarget(p);
                                    setBanDurationMinutes(0);
                                    setIsPermanentBan(false);
                                    setBanReasonInput('');
                                  }}
                                  title="Kick, Timeout or Ban Participant"
                                  className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 text-[10px] cursor-pointer transition-all hover:scale-105 active:scale-95 ml-0.5"
                                >
                                  <UserX className="w-3.5 h-3.5 text-rose-400" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Second Row: Host Moderation Controls (Dedicated Bar) */}
                      {canManageParticipants && !isMe && p.role !== 'HOST' && (
                        <div className="pt-2 border-t border-white/5 flex items-center gap-1.5">
                          {/* Moderator Role Toggle Button */}
                          {p.role === 'MODERATOR' ? (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                assignRole(p.id, 'PARTICIPANT');
                              }}
                              title={`Remove Moderator permissions from ${displayName}`}
                              className="flex-1 py-1 px-2 rounded-xl bg-amber-500/15 hover:bg-rose-500/20 text-amber-300 hover:text-rose-300 border border-amber-500/35 hover:border-rose-500/35 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                            >
                              <Shield className="w-3 h-3 text-amber-400" />
                              <span>Remove Mod</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                assignRole(p.id, 'MODERATOR');
                              }}
                              title={`Make ${displayName} a Moderator`}
                              className="flex-1 py-1 px-2 rounded-xl bg-white/[0.06] hover:bg-amber-500/20 text-white/80 hover:text-amber-300 border border-white/12 hover:border-amber-400/40 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                            >
                              <Shield className="w-3 h-3 text-amber-400" />
                              <span>Make Mod</span>
                            </button>
                          )}

                          {/* Clean Transfer Host Button */}
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setTransferHostTarget(p);
                            }}
                            title={`Transfer Host role to ${displayName}`}
                            className="flex-1 py-1 px-2 rounded-xl bg-white/[0.06] hover:bg-amber-500/20 text-white/80 hover:text-amber-300 border border-white/12 hover:border-amber-400/40 text-[10px] font-semibold flex items-center justify-center cursor-pointer transition-all active:scale-95"
                          >
                            <span>Make Host</span>
                          </button>

                          {/* Host Allow Face Cam Toggle Button */}
                          <button
                            onClick={() => {
                              sounds.playClick();
                              toggleCameraPermission(p.id, !allowedCamUserIds.includes(p.id));
                            }}
                            title={allowedCamUserIds.includes(p.id) ? "Revoke Face Cam Permission" : "Allow User to use Face Cam"}
                            className={`flex-1 py-1 px-2 rounded-xl border text-[10px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                              allowedCamUserIds.includes(p.id)
                                ? 'bg-emerald-500/20 hover:bg-rose-500/20 text-emerald-300 hover:text-rose-300 border-emerald-500/35 hover:border-rose-500/35'
                                : 'bg-white/[0.06] hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300 border-white/12 hover:border-emerald-500/35'
                            }`}
                          >
                            <Camera className="w-3 h-3" />
                            <span>{allowedCamUserIds.includes(p.id) ? 'Cam ✓' : 'Allow Cam'}</span>
                          </button>
                        </div>
                      )}

                      {/* CHOTA SA FACE CAM (COMPACT VIDEO PREVIEW DIRECTLY ON CARD) */}
                      {isMe && isCameraOn && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-amber-400/30 bg-black shadow-lg">
                          <video
                            ref={(el) => {
                              if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                                el.srcObject = localStreamRef.current;
                                el.play().catch(() => {});
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                          />
                          {/* Badges & Actions inside preview */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-bold text-emerald-400 flex items-center gap-1 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>LIVE CAM</span>
                          </div>

                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              onClick={() => setIsMirrored(!isMirrored)}
                              className="p-1 rounded-lg bg-black/75 hover:bg-black/95 text-white/80 hover:text-white border border-white/20 cursor-pointer"
                              title="Flip Mirror"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>
                            <button
                              onClick={handleToggleCamera}
                              className="p-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-400/40 cursor-pointer"
                              title="Stop Camera"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[10px] text-white/90 font-medium">
                            {displayName} (Host)
                          </div>
                        </div>
                      )}

                      {/* Remote Member Live Face Cam Preview */}
                      {!isMe && isUserCamActive && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-emerald-500/40 bg-black/90 shadow-lg flex items-center justify-center">
                          <div className="text-center p-3">
                            <UserAvatar name={displayName} avatarId={p.avatarId} isCurrentUser={isMe} size="lg" className="mx-auto mb-1.5" />
                            <span className="text-xs text-white/95 font-semibold">{displayName} is Live</span>
                            <span className="text-[10px] text-emerald-400/80 block mt-0.5">Face Cam Active</span>
                          </div>

                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-bold text-emerald-400 flex items-center gap-1 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>LIVE</span>
                          </div>

                          {canManageParticipants && (
                            <button
                              onClick={() => toggleCameraPermission(p.id, false)}
                              className="absolute top-2 right-2 p-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-400/40 cursor-pointer"
                              title="Revoke Camera Permission"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 7. MODAL: PARTY CONTROLS / STREAM SETTINGS                     */}
      {/* ============================================================== */}
      {isChangeVideoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col my-auto rounded-3xl bg-[#0c0d12]/95 border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.95)] backdrop-blur-3xl text-[#f5efe4] overflow-hidden">
            {/* Pinned Modal Header */}
            <div className="px-6 py-4.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#e8c27a]" /> Party Settings & Stream Controls
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Manage video quality, load new streams via YouTube link, or pause playback.
                </p>
              </div>
              <button
                onClick={() => setIsChangeVideoOpen(false)}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/60 hover:text-white cursor-pointer transition-all shrink-0 ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body with Sleek Theme Scrollbar */}
            <div className="px-6 py-5 overflow-y-auto flex-1 sleek-modal-scrollbar space-y-5">
              {/* SECTION 1: VIDEO QUALITY SELECTOR */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#e8c27a]" /> Video Quality
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">Current: {selectedQuality.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'auto', label: 'Auto' },
                    { id: '1080p', label: '1080p HD' },
                    { id: '720p', label: '720p HD' },
                    { id: '480p', label: '480p' },
                    { id: '360p', label: '360p' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuality(q.id)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        selectedQuality === q.id
                          ? 'bg-[#e8c27a]/25 text-[#ffe5a3] border-[#e8c27a] shadow-[0_0_12px_rgba(232,194,122,0.3)]'
                          : 'bg-white/[0.05] hover:bg-white/[0.10] text-white/70 border-white/10'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: LOAD NEW VIDEO VIA YOUTUBE LINK */}
              <form onSubmit={handleCustomUrlSubmit}>
                <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-[#e8c27a]" /> Play New Video by Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-white placeholder-white/35 focus:outline-none focus:border-[#e8c27a] backdrop-blur-xl"
                  />
                  <button
                    type="submit"
                    disabled={!customUrlInput.trim()}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      customUrlInput.trim()
                        ? 'bg-gradient-to-r from-[#f1d49a] to-[#d4af37] text-black cursor-pointer hover:brightness-110 shadow-[0_4px_20px_rgba(232,194,122,0.3)]'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Play Video
                  </button>
                </div>
              </form>

              {/* SECTION 3: CLEAR CURRENT VIDEO (STANDBY MODE) */}
              {canControlPlayback && currentVideoId && (
                <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-rose-300">Clear Current Stream</div>
                    <div className="text-[10px] text-white/50">Stop playback and place the party into Standby mode</div>
                  </div>
                  <button
                    onClick={handleClearCurrentVideo}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/50 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                  >
                    Remove Video
                  </button>
                </div>
              )}

              {/* SECTION 4: QUICK STREAM QUEUE (MULTIPLE URLS & INSTANT PLAY) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-[#e8c27a]" /> Quick Streams & Saved URLs ({quickStreams.length})
                  </span>
                  <span className="text-[10px] text-[#e8c27a]/80 font-medium">Click any to play instantly</span>
                </div>

                {/* Add URL form */}
                <form onSubmit={handleAddQuickStream} className="flex gap-2">
                  <input
                    type="text"
                    value={newQuickUrlInput}
                    onChange={(e) => setNewQuickUrlInput(e.target.value)}
                    placeholder="Paste YouTube link to save in quick list..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/12 text-xs text-white placeholder-white/35 focus:outline-none focus:border-[#e8c27a]"
                  />
                  <button
                    type="submit"
                    disabled={!newQuickUrlInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#e8c27a]/20 hover:text-[#ffe5a3] hover:border-[#e8c27a]/40 border border-white/15 text-xs font-semibold text-white/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#e8c27a]" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Stream items list */}
                <div className="space-y-2 max-h-56 overflow-y-auto sleek-modal-scrollbar pr-1">
                  {quickStreams.map((v) => {
                    const isCurrent = currentVideoId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => handlePlayQuickStream(v)}
                        className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer backdrop-blur-xl group ${
                          isCurrent
                            ? 'bg-[#e8c27a]/15 border-[#e8c27a]/60 text-white shadow-[0_0_15px_rgba(232,194,122,0.15)]'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center border border-white/15 shrink-0">
                            <Tv className="w-4 h-4 text-[#e8c27a]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{v.title}</div>
                            <div className="text-[10px] text-white/40 font-mono">
                              {v.duration ? `${formatTime(v.duration)} · ` : ''}ID: {v.id}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {isCurrent ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/35">
                              PLAYING
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayQuickStream(v);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-white/[0.08] hover:bg-[#e8c27a] hover:text-black text-white/80 text-[10px] font-bold border border-white/15 hover:border-[#e8c27a] flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Play</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleRemoveQuickStream(v.id, e)}
                            className="p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pinned Modal Footer */}
            <div className="px-6 py-3.5 border-t border-white/10 flex justify-end bg-white/[0.02] shrink-0">
              <button
                onClick={() => setIsChangeVideoOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/80 hover:text-white cursor-pointer transition-all border border-white/10 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL: TRANSFER HOST CONFIRMATION MODAL                     */}
      {/* ============================================================== */}
      {transferHostTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md my-auto rounded-3xl bg-[#0c0d12]/95 border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.95)] p-6 backdrop-blur-3xl text-[#f5efe4]">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 mx-auto mb-4 shadow-sm">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>

            <h3 className="text-center text-base font-bold text-white mb-2">
              Transfer Host Permissions?
            </h3>
            <p className="text-center text-xs text-white/60 mb-6 leading-relaxed">
              Are you sure you want to transfer Host control to{' '}
              <span className="text-amber-400 font-bold">
                {transferHostTarget.username || transferHostTarget.name || 'Participant'}
              </span>
              ? You will become a participant and they will have full playback & moderation authority.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setTransferHostTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  sounds.playSyncChime();
                  transferHost(transferHostTarget.id);
                  setTransferHostTarget(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#f1d49a] to-[#d4af37] hover:brightness-110 text-black text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. MODAL: KICK / TIMEOUT / BAN PARTICIPANT MODAL               */}
      {/* ============================================================== */}
      {banModalTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md max-h-[85vh] flex flex-col my-auto rounded-3xl bg-[#0c0d12]/95 border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.95)] backdrop-blur-3xl text-[#f5efe4] overflow-hidden">
            <div className="p-6 overflow-y-auto flex-1 sleek-modal-scrollbar">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-300 mx-auto mb-4 shadow-sm">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>

              <h3 className="text-center text-base font-bold text-white mb-1">
                Remove Participant
              </h3>
              <p className="text-center text-xs text-white/60 mb-5">
                Target:{' '}
                <span className="text-rose-300 font-bold">
                  {banModalTarget.username || banModalTarget.name || 'Participant'}
                </span>
              </p>

              {/* Time / Duration Options Selector */}
              <div className="space-y-2 mb-4">
                <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider">
                  Select Removal Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '0 Min (Kick Only)', minutes: 0, isPermanent: false, desc: 'Can rejoin anytime' },
                    { label: '5 Minutes', minutes: 5, isPermanent: false, desc: 'Timed timeout' },
                    { label: '15 Minutes', minutes: 15, isPermanent: false, desc: 'Timed timeout' },
                    { label: '30 Minutes', minutes: 30, isPermanent: false, desc: 'Timed timeout' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setBanDurationMinutes(opt.minutes);
                        setIsPermanentBan(false);
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        !isPermanentBan && banDurationMinutes === opt.minutes
                          ? 'bg-rose-500/25 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/70'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[10px] text-white/40">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Complete Watch Party Ban Option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPermanentBan(true);
                    setBanDurationMinutes(0);
                  }}
                  className={`w-full p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    isPermanentBan
                      ? 'bg-rose-600/35 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'bg-white/[0.04] hover:bg-rose-500/15 border-white/10 text-white/70'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5 text-rose-300">
                      <Ban className="w-3.5 h-3.5" /> Complete Watch Party Ban
                    </div>
                    <div className="text-[10px] text-white/40">Permanently blocked from re-entering this room</div>
                  </div>
                  {isPermanentBan && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                      SELECTED
                    </span>
                  )}
                </button>
              </div>

              {/* Optional Reason Input */}
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="e.g., Disruption, spam, or mic noise"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setBanModalTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    removeParticipant(
                      banModalTarget.id,
                      isPermanentBan ? undefined : banDurationMinutes,
                      isPermanentBan,
                      banReasonInput.trim() || undefined
                    );
                    setBanModalTarget(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition-all cursor-pointer shadow-[0_4px_20px_rgba(244,63,94,0.4)] active:scale-95"
                >
                  {isPermanentBan ? 'Ban Participant' : banDurationMinutes > 0 ? `Timeout (${banDurationMinutes}m)` : 'Kick Participant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL: CREATE ROOM (NAVBAR QUICK LAUNCH)                    */}
      {/* ============================================================== */}
      <CreatePartyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={async (partyData) => {
          setIsCreateModalOpen(false);

          // 1. Save to localStorage
          try {
            const stored = localStorage.getItem('wr_created_rooms');
            const existing = stored ? JSON.parse(stored) : [];
            const newPartyObj = {
              id: partyData.id,
              name: partyData.title,
              title: partyData.title,
              theme: partyData.theme.toLowerCase(),
              videoId: partyData.videoId,
              currentVideoId: partyData.videoId,
              isPrivate: partyData.isPrivate,
              hostName: userName || 'You (Host)',
              participantCount: 1,
              createdAt: Date.now(),
            };
            localStorage.setItem('wr_created_rooms', JSON.stringify([newPartyObj, ...existing.filter((r: any) => r.id !== partyData.id)]));
          } catch (_) {}

          // 2. POST to backend API
          try {
            await fetch(`${BACKEND_URL}/api/rooms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: partyData.id,
                roomId: partyData.id,
                name: partyData.title,
                theme: partyData.theme.toLowerCase(),
                videoId: partyData.videoId,
                isPrivate: partyData.isPrivate,
                hostName: userName || 'You (Host)',
              }),
            });
          } catch (err) {
            console.warn('Failed to register room on backend:', err);
          }

          // 3. Navigate into the newly created room via smooth SPA transition
          if (onSwitchRoom) {
            onSwitchRoom(partyData.id, partyData.title, partyData.videoId, partyData.isPrivate);
          } else if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('room', partyData.id);
            window.history.pushState({}, '', url.toString());
            onExitRoom();
          }
        }}
      />
    </div>
  );
};

export default WatchPartyRoom;
