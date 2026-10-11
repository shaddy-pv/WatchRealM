import React, { useState } from 'react';
import type { CameraMode } from './CameraController';
import { sounds } from '../audio/soundManager';
import {
  Compass,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  LogOut,
  Maximize2,
  Crown,
  Shield,
  User,
  MessageSquare,
  Flame,
  Heart,
  Zap,
  ArrowDown,
  Send,
  AlertCircle,
  Link as LinkIcon,
  Check,
  Radio,
  UserX,
} from 'lucide-react';
import type { UserRole, ParticipantInfo, ChatMessage, ReactionItem } from '../hooks/useWatchPartySocket';

export interface RoomSocketController {
  isConnected: boolean;
  myRole: UserRole;
  setMyRole?: (r: UserRole) => void;
  myUserId?: string;
  participants: ParticipantInfo[];
  playState: 'PLAYING' | 'PAUSED';
  currentTime: number;
  currentVideoId: string;
  videoTitle: string;
  chatMessages: ChatMessage[];
  activeReactions: ReactionItem[];
  permissionError: string | null;
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  changeVideo: (videoId: string, title?: string) => void;
  assignRole: (userId: string, role: UserRole) => void;
  removeParticipant: (userId: string) => void;
  sendChatMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
}

interface WorldHUDProps {
  cameraMode: CameraMode;
  scrollProgress: number;
  playerPos: [number, number, number];
  isInsideBuilding: boolean;
  isSeated?: boolean;
  onEnterExploration: () => void;
  onOpenMap: () => void;
  onOpenCreate: () => void;
  onStandUp: () => void;
  onToggleCinema: () => void;
  isCinema: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnIntro?: () => void;
  roomSocket?: RoomSocketController;
}

export const WorldHUD: React.FC<WorldHUDProps> = ({
  cameraMode,
  scrollProgress,
  playerPos,
  isInsideBuilding,
  onEnterExploration,
  onOpenMap,
  onOpenCreate,
  onStandUp,
  onToggleCinema,
  isCinema,
  isMuted,
  onToggleMute,
  onReturnIntro,
  roomSocket,
}) => {
  // Fallback local state if no socket
  const [localRole, setLocalRole] = useState<UserRole>('HOST');
  const [localPlaying, setLocalPlaying] = useState(true);
  const [localTime, setLocalTime] = useState(42);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [chatInputText, setChatInputText] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [newVideoInput, setNewVideoInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync state with socket or fallback
  const isPlaying = roomSocket ? roomSocket.playState === 'PLAYING' : localPlaying;
  const currentTime = roomSocket ? roomSocket.currentTime : localTime;
  const currentRole = roomSocket ? roomSocket.myRole : localRole;
  const videoTitle = roomSocket ? roomSocket.videoTitle : 'The Fellowship Watch Party';
  const currentVideoId = roomSocket ? roomSocket.currentVideoId : '1La4QzGeaaQ';
  const participants = roomSocket?.participants && roomSocket.participants.length > 0
    ? roomSocket.participants
    : [
        { id: '1', socketId: 's1', username: 'Shadan (You)', role: 'HOST' as UserRole, avatarColor: '#6366f1', joinedAt: Date.now() },
        { id: '2', socketId: 's2', username: 'Rahul', role: 'MODERATOR' as UserRole, avatarColor: '#06b6d4', joinedAt: Date.now() },
        { id: '3', socketId: 's3', username: 'Aryan', role: 'PARTICIPANT' as UserRole, avatarColor: '#10b981', joinedAt: Date.now() },
        { id: '4', socketId: 's4', username: 'Kavya', role: 'PARTICIPANT' as UserRole, avatarColor: '#ec4899', joinedAt: Date.now() },
      ];

  const duration = 154;
  const canControl = currentRole === 'HOST' || currentRole === 'MODERATOR';

  // Calculate current zone
  let zoneName = 'WatchRealm Central Plaza';
  if (isInsideBuilding) {
    zoneName = 'The Fellowship Watch Pavilion';
  } else if (playerPos[2] < -32) {
    zoneName = 'Fellowship Forest Glade';
  } else if (playerPos[2] < -10) {
    zoneName = 'Wayfarer Crossroads';
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!canControl) return;
    sounds.playClick();
    if (roomSocket) {
      if (isPlaying) {
        roomSocket.pause();
      } else {
        roomSocket.play();
      }
    } else {
      setLocalPlaying(!localPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (!canControl) return;
    if (roomSocket) {
      roomSocket.seek(time);
    } else {
      setLocalTime(time);
    }
  };

  const handleTriggerReaction = (type: string) => {
    sounds.playClick();
    if (roomSocket) {
      roomSocket.sendReaction(type);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;
    sounds.playClick();
    if (roomSocket) {
      roomSocket.sendChatMessage(chatInputText);
    }
    setChatInputText('');
  };

  const handleApplyNewVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoInput.trim()) return;

    let vId = newVideoInput.trim();
    // Parse YouTube URL if full link pasted
    if (vId.includes('v=')) {
      vId = vId.split('v=')[1].split('&')[0];
    } else if (vId.includes('youtu.be/')) {
      vId = vId.split('youtu.be/')[1].split('?')[0];
    }

    if (roomSocket) {
      roomSocket.changeVideo(vId, 'Live Room Stream');
    }
    sounds.playSyncChime();
    setShowVideoModal(false);
    setNewVideoInput('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    sounds.playClick();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30">
      {/* ============================================================== */}
      {/* 1. CINEMATIC SCROLL DESCENT OVERLAY                            */}
      {/* ============================================================== */}
      {cameraMode === 'CINEMATIC_SCROLL' && (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-8">
          {/* Top Bar */}
          <div className="w-full max-w-6xl pointer-events-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onReturnIntro && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    onReturnIntro();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-xs text-white/80 cursor-pointer backdrop-blur-md"
                >
                  ← Exit to Intro
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-sm font-extrabold tracking-wider text-white">WATCHREALM</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenCreate();
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold backdrop-blur-md cursor-pointer text-white"
              >
                Create Party
              </button>
              <button
                onClick={onToggleMute}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Center Title & Enter Button */}
          <div className="text-center pointer-events-auto flex flex-col items-center my-auto">
            <div className="px-4 py-1.5 rounded-full bg-purple-950/70 border border-purple-400/40 backdrop-blur-md mb-4 text-xs font-semibold uppercase tracking-widest text-purple-200">
              The Living 3D Watch Party Universe
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight drop-shadow-2xl mb-3">
              WATCHREALM
            </h1>
            <p className="text-base text-white/70 max-w-lg mb-8 font-normal leading-relaxed">
              Different Worlds. Same Screen. Scroll mouse to descend through the clouds into the kingdom, or step directly onto the plaza.
            </p>
            <button
              onClick={() => {
                sounds.playTravelSwoosh();
                onEnterExploration();
              }}
              className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5"
            >
              <span>Enter Realm</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* Scroll Guidance Indicator */}
          <div className="flex flex-col items-center gap-2 pointer-events-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-white/60">
              Scroll Mouse Wheel to Descend ({Math.round(scrollProgress * 100)}%)
            </span>
            <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-150"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. FIRST-PERSON & BUILDING NAVIGATION HUD                      */}
      {/* ============================================================== */}
      {cameraMode !== 'CINEMATIC_SCROLL' && cameraMode !== 'SEATED_WATCHING' && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          {/* Top Bar with Zone & Map Button */}
          <div className="w-full flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              {onReturnIntro && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    onReturnIntro();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-xs text-white/80 cursor-pointer backdrop-blur-md"
                >
                  ← Back
                </button>
              )}
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wide text-white">{zoneName}</span>
                {roomSocket && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {roomSocket.isConnected ? 'LIVE WS SYNC' : 'CONNECTING...'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  sounds.playMapOpen();
                  onOpenMap();
                }}
                className="px-4 py-2 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/15 hover:border-white/30 backdrop-blur-md text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>World Map (M)</span>
              </button>

              <button
                onClick={onToggleMute}
                className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/15 text-white/80 cursor-pointer backdrop-blur-md"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Crosshair (Center) */}
          <div className="mx-auto my-auto w-3 h-3 rounded-full border border-white/40 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-white/80" />
          </div>

          {/* Bottom Controls Legend */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 pointer-events-auto px-4 py-2 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md text-xs text-white/70">
              <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white text-[10px]">W A S D</span>
              <span>Walk</span>
              <span className="text-white/30">•</span>
              <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white text-[10px]">Shift</span>
              <span>Sprint</span>
              <span className="text-white/30">•</span>
              <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white text-[10px]">Mouse</span>
              <span>Look Around</span>
              <span className="text-white/30">•</span>
              <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white text-[10px]">E</span>
              <span>Interact</span>
            </div>

            {isInsideBuilding && (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2">
                <span>Walk up to the empty chair and press [E] to Sit</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SEATED WATCH MODE OVERLAY (FULL INTERACTIVE THEATER)        */}
      {/* ============================================================== */}
      {cameraMode === 'SEATED_WATCHING' && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          {/* Top Seated Header */}
          <div className="w-full flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={onStandUp}
                className="px-4 py-2 rounded-xl bg-black/70 hover:bg-black/90 border border-white/20 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg hover:scale-105"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Stand Up (Esc)</span>
              </button>

              <div className="px-3 py-1.5 rounded-xl bg-black/70 border border-white/15 text-xs text-white/80 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{videoTitle}</span>
              </div>

              {/* Share Room Button */}
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-white/80 flex items-center gap-1.5 cursor-pointer"
                title="Copy Room Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            {/* Role Indicator / Switcher Deck */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/70 border border-white/15 backdrop-blur-md text-xs">
              <span className="px-2 text-[10px] text-white/50 uppercase tracking-wider font-mono">Role:</span>
              <button
                onClick={() => {
                  sounds.playClick();
                  if (roomSocket?.setMyRole) {
                    roomSocket.setMyRole('HOST');
                  } else {
                    setLocalRole('HOST');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  currentRole === 'HOST' ? 'bg-amber-500 text-black font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Host</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  if (roomSocket?.setMyRole) {
                    roomSocket.setMyRole('MODERATOR');
                  } else {
                    setLocalRole('MODERATOR');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  currentRole === 'MODERATOR' ? 'bg-cyan-500 text-black font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Mod</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  if (roomSocket?.setMyRole) {
                    roomSocket.setMyRole('PARTICIPANT');
                  } else {
                    setLocalRole('PARTICIPANT');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  currentRole === 'PARTICIPANT' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Viewer</span>
              </button>
            </div>
          </div>

          {/* Permission Denial Warning Banner if Participant tried restricted action */}
          {roomSocket?.permissionError && (
            <div className="mx-auto px-4 py-2 rounded-xl bg-rose-600/90 border border-rose-400 text-white font-mono text-xs flex items-center gap-2 shadow-2xl animate-bounce pointer-events-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{roomSocket.permissionError}</span>
            </div>
          )}

          {/* Embedded YouTube IFrame Screen Frame (when seated or cinema mode) */}
          <div
            className={`pointer-events-auto mx-auto my-auto rounded-2xl overflow-hidden shadow-2xl border border-amber-500/40 transition-all duration-500 relative ${
              isCinema ? 'w-[88vw] aspect-video' : 'w-[64vw] aspect-video'
            }`}
          >
            <iframe
              className="w-full h-full pointer-events-auto"
              src={`https://www.youtube.com/embed/${currentVideoId}?enablejsapi=1&autoplay=1&mute=0&controls=0&rel=0&start=${Math.floor(currentTime)}`}
              title="YouTube Watch Stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Floating Reactions Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {roomSocket?.activeReactions?.map((r) => (
                <div key={r.id} style={{ left: `${30 + Math.random() * 40}%` }} className="absolute bottom-6 animate-float-up">
                  {r.emoji === 'flame' && <Flame className="w-7 h-7 text-amber-500 fill-amber-500" />}
                  {r.emoji === 'heart' && <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />}
                  {r.emoji === 'zap' && <Zap className="w-7 h-7 text-yellow-400 fill-yellow-400" />}
                </div>
              ))}
            </div>

            {!canControl && (
              <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] text-white/70">
                Viewing Mode • Playback controlled by Host & Moderator
              </div>
            )}
          </div>

          {/* Bottom Playback Toolbar */}
          <div className="w-full max-w-4xl pointer-events-auto mx-auto p-3.5 rounded-2xl bg-black/85 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col gap-2">
            {/* Scrubber */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-white/60 min-w-10 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                disabled={!canControl}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className={`w-full h-1.5 rounded-lg appearance-none bg-white/10 accent-amber-400 cursor-pointer ${
                  !canControl ? 'opacity-30 cursor-not-allowed' : ''
                }`}
              />
              <span className="text-xs font-mono text-white/40 min-w-10">{formatTime(duration)}</span>
            </div>

            {/* Buttons Deck */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  disabled={!canControl}
                  className={`p-2.5 rounded-xl font-bold transition-all ${
                    !canControl
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-black hover:scale-105 active:scale-95 cursor-pointer shadow-md'
                  }`}
                  title={canControl ? (isPlaying ? 'Pause' : 'Play') : 'Only Host/Mod can pause or play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  onClick={() => canControl && handleSeek(Math.max(0, currentTime - 10))}
                  disabled={!canControl}
                  className="p-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/10 cursor-pointer"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => canControl && handleSeek(Math.min(duration, currentTime + 10))}
                  disabled={!canControl}
                  className="p-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/10 cursor-pointer"
                  title="Forward 10s"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Change Video Button (Host/Mod only) */}
                {canControl && (
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="ml-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-white/90 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Radio className="w-3 h-3 text-amber-400" />
                    <span>Change Video</span>
                  </button>
                )}
              </div>

              {/* Reactions & Sidebar Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerReaction('flame')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-400 cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-amber-400/50" />
                </button>
                <button
                  onClick={() => handleTriggerReaction('heart')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-rose-400/50" />
                </button>
                <button
                  onClick={() => handleTriggerReaction('zap')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-yellow-400 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-yellow-400/50" />
                </button>
                <button
                  onClick={onToggleCinema}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 cursor-pointer ml-1"
                  title="Toggle Cinema Mode"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Room ({participants.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Social / Participants Drawer */}
          {isDrawerOpen && (
            <div className="fixed top-20 right-6 bottom-28 w-84 rounded-2xl bg-black/95 border border-white/15 backdrop-blur-2xl pointer-events-auto z-40 flex flex-col overflow-hidden shadow-2xl">
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2.5 text-xs font-bold border-b-2 ${
                    activeTab === 'chat' ? 'border-amber-400 text-amber-300' : 'border-transparent text-white/50'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`flex-1 py-2.5 text-xs font-bold border-b-2 ${
                    activeTab === 'participants' ? 'border-amber-400 text-amber-300' : 'border-transparent text-white/50'
                  }`}
                >
                  Members ({participants.length})
                </button>
              </div>

              {/* Chat View */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col justify-between p-3 overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
                    {roomSocket?.chatMessages && roomSocket.chatMessages.length > 0 ? (
                      roomSocket.chatMessages.map((msg) => (
                        <div key={msg.id} className="p-2 rounded-lg bg-white/5">
                          <span className="font-bold text-amber-300">{msg.username}: </span>
                          <span className="text-white/90">{msg.text}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="p-2 rounded-lg bg-white/5 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-bold text-amber-400">Shadan: </span>
                          <span>Welcome everyone to the Fellowship Pavilion!</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="font-bold text-cyan-400">Rahul: </span>
                          <span>The 3D audio & sync feel incredible!</span>
                        </div>
                      </>
                    )}
                  </div>

                  <form onSubmit={handleSendChat} className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* Participants View (RBAC Management) */}
              {activeTab === 'participants' && (
                <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: p.avatarColor || '#6366f1' }}
                        />
                        <span className="font-semibold text-white/90">{p.username}</span>
                        {p.role === 'HOST' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        {p.role === 'MODERATOR' && <Shield className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>

                      {/* Host Controls for other members */}
                      {currentRole === 'HOST' && p.role !== 'HOST' && roomSocket && (
                        <div className="flex items-center gap-1">
                          {p.role === 'PARTICIPANT' ? (
                            <button
                              onClick={() => roomSocket.assignRole(p.id, 'MODERATOR')}
                              className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 cursor-pointer"
                              title="Promote to Moderator"
                            >
                              Promote
                            </button>
                          ) : (
                            <button
                              onClick={() => roomSocket.assignRole(p.id, 'PARTICIPANT')}
                              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 text-[10px] border border-white/20 cursor-pointer"
                              title="Demote to Viewer"
                            >
                              Demote
                            </button>
                          )}
                          <button
                            onClick={() => roomSocket.removeParticipant(p.id)}
                            className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 cursor-pointer"
                            title="Kick user from room"
                          >
                            <UserX className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Change Video Modal */}
          {showVideoModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto">
              <div className="w-full max-w-md p-6 rounded-2xl bg-[#12141c] border border-white/20 shadow-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Change Cinema Stream</span>
                  </h3>
                  <button
                    onClick={() => setShowVideoModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleApplyNewVideo} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-mono text-white/60 mb-1 block">YouTube Video URL or ID</label>
                    <input
                      type="text"
                      value={newVideoInput}
                      onChange={(e) => setNewVideoInput(e.target.value)}
                      placeholder="e.g. jfKfPfyJRdk or https://youtube.com/..."
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowVideoModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      Broadcast Video
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
