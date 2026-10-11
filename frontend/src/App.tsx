import React, { useState, useEffect } from 'react';
import { CinematicIntroReveal } from './cinematic/CinematicIntroReveal';
import { NormalModeLandingPage } from './landing/NormalModeLandingPage';
import { WatchRealmWorldApp } from './world3d/WatchRealmWorldApp';
import { WatchPartyRoom } from './components/WatchPartyRoom';
import { AuthModal, type AuthUser } from './components/AuthModal';
import { sounds } from './audio/soundManager';
import { Lock, Globe, LogIn, ArrowRight, Compass, User } from 'lucide-react';

interface ActiveRoomInfo {
  roomId: string;
  roomTitle: string;
  themeName?: string;
  initialVideoId?: string;
  isPrivate?: boolean;
}

const getStoredAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('wr_auth_user');
    if (raw) {
      const u = JSON.parse(raw);
      const name = u?.name || u?.username;
      if (name && typeof name === 'string' && name.trim()) {
        return {
          name: name.trim(),
          email: u.email || '',
          isLoggedIn: true,
        };
      }
    }
  } catch (_) {}
  return null;
};

export const App: React.FC = () => {
  useEffect(() => {
    document.title = 'Watch Realm';
  }, []);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [isInviteAuthModalOpen, setIsInviteAuthModalOpen] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');

  // Check URL query parameters for ?room=... and ?private=...
  const [pendingInviteRoom, setPendingInviteRoom] = useState<ActiveRoomInfo | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        const storedUser = getStoredAuthUser();
        // If user is NOT logged in, hold the invite until they log in / sign up / enter guest name
        if (!storedUser) {
          const isPriv = params.get('private') === '1' || params.get('isPrivate') === 'true';
          return {
            roomId: roomParam,
            roomTitle: `Watch Party (${roomParam})`,
            themeName: 'WatchRealm',
            isPrivate: isPriv,
          };
        }
      }
    }
    return null;
  });

  const [activeRoom, setActiveRoom] = useState<ActiveRoomInfo | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        const storedUser = getStoredAuthUser();
        // If user is ALREADY logged in, join immediately with their account
        if (storedUser) {
          const isPriv = params.get('private') === '1' || params.get('isPrivate') === 'true';
          return {
            roomId: roomParam,
            roomTitle: `Watch Party (${roomParam})`,
            themeName: 'WatchRealm',
            isPrivate: isPriv,
          };
        }
      }
    }
    return null;
  });

  const [hasEnteredRealm, setHasEnteredRealm] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('room')) return true; // Direct invite entry!
      if (params.get('mode') === 'intro') return false;
      return sessionStorage.getItem('wr_mode') === 'normal' || params.get('mode') === 'normal';
    }
    return false;
  });

  const [selectedMode, setSelectedMode] = useState<'STORY' | 'NORMAL'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('room')) return 'NORMAL';
      const mode = sessionStorage.getItem('wr_mode');
      if (mode === 'story') return 'STORY';
    }
    return 'NORMAL';
  });

  // Keep URL query param synced when room opens/exits
  const handleExitRoom = () => {
    sounds.playClick();
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      url.searchParams.delete('private');
      window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
    }
    setActiveRoom(null);
    setPendingInviteRoom(null);
  };

  const handleJoinRoom = (roomId: string, title?: string, videoId?: string, isPrivate?: boolean) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      if (isPrivate) {
        url.searchParams.set('private', '1');
      } else {
        url.searchParams.delete('private');
      }
      window.history.pushState({}, '', url.toString());
    }
    setActiveRoom({
      roomId,
      roomTitle: title || `Watch Party (${roomId})`,
      themeName: 'WatchRealm',
      initialVideoId: videoId,
      isPrivate: isPrivate,
    });
    setPendingInviteRoom(null);
  };

  // Handle successful login/signup from invite gateway
  const handleInviteAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsInviteAuthModalOpen(false);
    if (pendingInviteRoom) {
      setActiveRoom(pendingInviteRoom);
      setPendingInviteRoom(null);
    }
  };

  // Handle guest entry from invite gateway
  const handleGuestJoin = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    const cleanGuestName = guestNameInput.trim() || 'Guest Explorer';
    if (typeof window !== 'undefined') {
      localStorage.setItem('wr_explorer_name', cleanGuestName);
      sessionStorage.setItem('wr_username', cleanGuestName);
    }
    if (pendingInviteRoom) {
      setActiveRoom(pendingInviteRoom);
      setPendingInviteRoom(null);
    }
  };

  // If there is an active watch party room -> render WatchPartyRoom!
  if (activeRoom) {
    let resolvedUser = 'Guest Explorer';
    if (currentUser?.name) {
      resolvedUser = currentUser.name.trim();
    } else if (typeof window !== 'undefined') {
      try {
        const authRaw = localStorage.getItem('wr_auth_user');
        if (authRaw) {
          const u = JSON.parse(authRaw);
          const n = u?.name || u?.username;
          if (n && typeof n === 'string' && n.trim()) {
            resolvedUser = n.trim();
          }
        } else {
          const storedExplorer = localStorage.getItem('wr_explorer_name');
          if (storedExplorer && storedExplorer.trim()) {
            resolvedUser = storedExplorer.trim();
          }
        }
      } catch (_) {}
    }

    return (
      <WatchPartyRoom
        roomCode={activeRoom.roomId}
        roomTitle={activeRoom.roomTitle}
        themeName={activeRoom.themeName}
        initialVideoId={activeRoom.initialVideoId}
        userName={resolvedUser}
        isPrivate={activeRoom.isPrivate}
        onExitRoom={handleExitRoom}
        onSwitchRoom={handleJoinRoom}
      />
    );
  }

  // If an unauthenticated user opened an invite link -> show elegant invite gateway
  if (pendingInviteRoom) {
    const isPrivateInvite = pendingInviteRoom.isPrivate === true;

    return (
      <div className="min-h-screen bg-[#05070d] text-[#f5efe4] font-sans antialiased flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#bd8933]/15 to-[#3b82f6]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#e5bc72]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-[#0c101c]/95 border border-[#e8c27a]/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          {/* Header Icon */}
          <div className="flex justify-center mb-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
              isPrivateInvite
                ? 'bg-[#1a140a] border-[#e8c27a]/50 text-[#f5cf82] shadow-[#bd8933]/20'
                : 'bg-[#0f172a] border-[#38bdf8]/40 text-[#38bdf8] shadow-[#0284c7]/20'
            }`}>
              {isPrivateInvite ? <Lock className="w-8 h-8" /> : <Globe className="w-8 h-8" />}
            </div>
          </div>

          {/* Privacy Badge */}
          <div className="flex justify-center mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border ${
              isPrivateInvite
                ? 'bg-[#bd8933]/20 border-[#e8c27a]/40 text-[#faecd0]'
                : 'bg-[#0369a1]/20 border-[#38bdf8]/40 text-[#bae6fd]'
            }`}>
              {isPrivateInvite ? 'Private Watch Party' : 'Public Watch Party'}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-center text-[#fbf6ec] tracking-wide mb-2">
            You're Invited to Watch Together!
          </h2>

          <p className="text-center text-sm text-[#b8a88a] mb-6">
            Join the synchronized streaming room <span className="font-mono text-[#faecd0] font-semibold bg-[#1a1d2d] px-2 py-0.5 rounded border border-[#e8c27a]/20">{pendingInviteRoom.roomId}</span>.
            Sign in or create an account to access with your profile.
          </p>

          {/* Primary Action: Log In / Sign Up */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsInviteAuthModalOpen(true);
            }}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-black bg-gradient-to-r from-[#faecd0] via-[#e5bc72] to-[#bd8933] hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-[#bd8933]/25 flex items-center justify-center gap-2 group mb-5"
          >
            <LogIn className="w-5 h-5 text-black" />
            <span>Log In or Sign Up to Join</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0c101c] px-3 text-[11px] font-semibold uppercase tracking-wider text-[#8e816a] absolute">
              or continue as guest
            </span>
          </div>

          {/* Guest Name Entry Form */}
          <form onSubmit={handleGuestJoin} className="space-y-3 mb-6">
            <div className="relative">
              <User className="w-4 h-4 text-[#8e816a] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                placeholder="Enter your name (e.g. Rahul)"
                className="w-full pl-10 pr-4 py-3 bg-[#131929] border border-white/10 rounded-xl text-sm text-[#f5efe4] placeholder-[#665e4f] focus:outline-none focus:border-[#e8c27a]/60 transition-colors"
                maxLength={32}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-[#d9caa9] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Join as Guest</span>
            </button>
          </form>

          {/* Exit / Return to Multiverse */}
          <div className="text-center pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handleExitRoom}
              className="text-xs text-[#8e816a] hover:text-[#e8c27a] transition-colors inline-flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Public Multiverse Instead</span>
            </button>
          </div>
        </div>

        {/* Dedicated Auth Modal */}
        <AuthModal
          isOpen={isInviteAuthModalOpen}
          onClose={() => setIsInviteAuthModalOpen(false)}
          onSuccess={handleInviteAuthSuccess}
          intentAction="join"
        />
      </div>
    );
  }

  // Screen 1 & 2 & 3: Loading -> Enter Realm -> Story / Normal Mode Choice
  if (!hasEnteredRealm) {
    return (
      <CinematicIntroReveal
        onEnterRealm={() => {
          sessionStorage.setItem('wr_mode', 'normal');
          setSelectedMode('NORMAL');
          setHasEnteredRealm(true);
        }}
        onSelectMode={(mode) => {
          sessionStorage.setItem('wr_mode', mode.toLowerCase());
          setSelectedMode(mode);
          setHasEnteredRealm(true);
        }}
      />
    );
  }

  // If Normal Mode is chosen -> Render the majestic Multiverse Landing Page
  if (selectedMode === 'NORMAL') {
    return (
      <NormalModeLandingPage
        onReturnToRealm={() => {
          sessionStorage.removeItem('wr_mode');
          setHasEnteredRealm(false);
        }}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  // If Story Mode is chosen -> Render genuine 3D WatchRealm World Experience
  return (
    <WatchRealmWorldApp
      onReturnIntro={() => {
        sessionStorage.removeItem('wr_mode');
        setHasEnteredRealm(false);
      }}
      onJoinRoom={handleJoinRoom}
    />
  );
};

export default App;
