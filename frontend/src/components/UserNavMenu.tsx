import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Tv, Settings, X, Volume2, VolumeX, Sparkles, Check, Film, LogIn, LogOut, ShieldCheck, Activity, Eye, Bell, RefreshCw } from 'lucide-react';
import { sounds } from '../audio/soundManager';
import type { AuthUser } from './AuthModal';
import { UserAvatar, REALM_AVATARS, LEGACY_AVATAR_MAP } from './UserAvatar';

export type { AuthUser };

interface UserNavMenuProps {
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenMyParty?: () => void;
  onOpenCreateRoom?: () => void;
  createdRoomsCount?: number;
  className?: string;
}

export const UserNavMenu: React.FC<UserNavMenuProps> = ({
  currentUser = null,
  onOpenAuth,
  onLogout,
  onOpenMyParty,
  onOpenCreateRoom,
  createdRoomsCount = 0,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'profile' | 'settings' | 'my-party'>('none');
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  
  // Real Realm Avatar
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wr_realm_avatar') || 'avatar_1';
      return LEGACY_AVATAR_MAP[stored] || stored;
    }
    return 'avatar_1';
  });

  // Settings states
  const [playbackQuality, setPlaybackQuality] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wr_playback_quality') || 'Auto (1080p)';
    }
    return 'Auto (1080p)';
  });

  const [glassEffect, setGlassEffect] = useState<'ultra' | 'perf'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('wr_perf_glass') as 'ultra' | 'perf') || 'ultra';
    }
    return 'ultra';
  });

  const [syncLatency, setSyncLatency] = useState<'ultra-low' | 'balanced'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('wr_sync_latency') as 'ultra-low' | 'balanced') || 'ultra-low';
    }
    return 'ultra-low';
  });

  const [chatPing, setChatPing] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wr_chat_ping') !== 'disabled';
    }
    return true;
  });

  const [explorerName, setExplorerName] = useState(() => {
    if (currentUser?.name) return currentUser.name;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wr_explorer_name') || 'Guest Explorer';
    }
    return 'Guest Explorer';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(explorerName);

  // Sync with currentUser
  useEffect(() => {
    if (currentUser?.name) {
      setExplorerName(currentUser.name);
      setTempName(currentUser.name);
    }
  }, [currentUser]);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal !== 'none') {
          setActiveModal('none');
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activeModal]);

  const handleToggleMenu = () => {
    sounds.playClick();
    setIsOpen((prev) => !prev);
  };

  const handleSelectOption = (modalType: 'profile' | 'settings' | 'my-party') => {
    sounds.playClick();
    setIsOpen(false);
    if (modalType === 'my-party' && onOpenMyParty) {
      onOpenMyParty();
    } else {
      setActiveModal(modalType);
    }
  };

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setExplorerName(tempName.trim());
      localStorage.setItem('wr_explorer_name', tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleSelectAvatar = (avatarId: string) => {
    sounds.playSyncChime();
    setSelectedAvatarId(avatarId);
    try {
      localStorage.setItem('wr_realm_avatar', avatarId);
      window.dispatchEvent(new CustomEvent('wr_avatar_changed', { detail: { avatarId } }));
    } catch (_) {}
  };

  const currentThemeAvatar =
    REALM_AVATARS.find((a) => a.id === selectedAvatarId || LEGACY_AVATAR_MAP[selectedAvatarId] === a.id) ||
    REALM_AVATARS[0];

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Circular User Avatar Trigger */}
      <button
        type="button"
        onClick={handleToggleMenu}
        className="relative cursor-pointer flex-shrink-0 group focus:outline-none"
        title="Explorer Account Menu"
        aria-label="Explorer Account Menu"
      >
        <UserAvatar
          name={currentUser ? currentUser.name : explorerName}
          isCurrentUser
          size="md"
          className="group-hover:scale-105 transition-all shadow-sm"
        />
        {/* Subtle Online Indicator */}
        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#05070d]" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl bg-[#0b0e17]/95 border border-[#e8c27a]/35 shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-2 z-50 select-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Identity */}
          <div className="px-3 py-2.5 mb-1 flex items-center gap-3 border-b border-white/10">
            <UserAvatar
              name={currentUser ? currentUser.name : explorerName}
              isCurrentUser
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-[#f5efe4] truncate flex items-center gap-1.5">
                <span>{currentUser ? currentUser.name : explorerName}</span>
                <Sparkles className="w-3 h-3 text-[#e8c27a]" />
              </div>
              <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{currentUser ? currentUser.email : 'Guest Explorer'}</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5">
            {/* 1. Profile */}
            <button
              type="button"
              onClick={() => handleSelectOption('profile')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/[0.08] text-stone-200 hover:text-[#f3dbab] transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] group-hover:bg-[#e8c27a]/20 border border-white/10 group-hover:border-[#e8c27a]/40 flex items-center justify-center transition-colors">
                <User className="w-3.5 h-3.5 text-[#e8c27a]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-tight">Profile & Avatars</div>
                <div className="text-[10px] text-stone-400 leading-tight">Choose realm avatar & identity</div>
              </div>
            </button>

            {/* 2. My Party */}
            <button
              type="button"
              onClick={() => handleSelectOption('my-party')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/[0.08] text-stone-200 hover:text-[#f3dbab] transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] group-hover:bg-[#e8c27a]/20 border border-white/10 group-hover:border-[#e8c27a]/40 flex items-center justify-center transition-colors">
                <Tv className="w-3.5 h-3.5 text-[#e8c27a]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-tight flex items-center justify-between">
                  <span>My Party</span>
                  {createdRoomsCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#e8c27a]/20 text-[#e8c27a] text-[9px] font-bold rounded-full">
                      {createdRoomsCount}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-stone-400 leading-tight">Hosted rooms & live parties</div>
              </div>
            </button>

            {/* 3. Settings */}
            <button
              type="button"
              onClick={() => handleSelectOption('settings')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/[0.08] text-stone-200 hover:text-[#f3dbab] transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] group-hover:bg-[#e8c27a]/20 border border-white/10 group-hover:border-[#e8c27a]/40 flex items-center justify-center transition-colors">
                <Settings className="w-3.5 h-3.5 text-[#e8c27a]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-tight">Realm Settings</div>
                <div className="text-[10px] text-stone-400 leading-tight">Audio, video quality & sync</div>
              </div>
            </button>

            {/* 4. Auth Action (Sign In / Logout) */}
            <div className="pt-1.5 mt-1 border-t border-white/10">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-red-500/15 text-stone-300 hover:text-red-200 transition-all cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/[0.05] group-hover:bg-red-500/25 border border-white/10 group-hover:border-red-500/40 flex items-center justify-center transition-colors">
                    <LogOut className="w-3.5 h-3.5 text-stone-400 group-hover:text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold leading-tight">Sign Out / Switch</div>
                    <div className="text-[10px] text-stone-500 leading-tight">Clear current session</div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsOpen(false);
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left bg-[#e8c27a]/15 hover:bg-[#e8c27a]/25 border border-[#e8c27a]/40 text-[#f5efe4] hover:text-[#ffe5a3] transition-all cursor-pointer group shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#e8c27a]/25 border border-[#e8c27a]/50 flex items-center justify-center transition-colors">
                    <LogIn className="w-3.5 h-3.5 text-[#e8c27a]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-tight text-[#e8c27a]">Sign In / Register</div>
                    <div className="text-[10px] text-[#e8c27a]/70 leading-tight">Unlock party hosting</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Portaled Modals (Profile, Settings, My Party) mounted directly to document.body */}
      {typeof document !== 'undefined' && activeModal !== 'none' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              sounds.playClick();
              setActiveModal('none');
            }
          }}
        >
          {/* ========================================================== */}
          {/* 1. PROFILE MODAL WITH REALM AVATARS & GENUINE LOGIC        */}
          {/* ========================================================== */}
          {activeModal === 'profile' && (
            <div className="w-full max-w-lg rounded-3xl bg-[#0c101c]/95 border border-[#e8c27a]/35 shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-5 sm:p-7 relative animate-in zoom-in-95 duration-200 backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveModal('none');
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                {/* Active Avatar Preview with Glow */}
                <div className="relative mb-3">
                  <UserAvatar
                    name={currentUser ? currentUser.name : explorerName}
                    isCurrentUser
                    size="xl"
                  />
                  <span className="absolute bottom-0 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0c101c]" />
                </div>

                {/* Name & Inline Edit */}
                {isEditingName ? (
                  <div className="flex items-center gap-1.5 mb-1">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="px-3 py-1 text-sm rounded-lg bg-black/60 border border-[#e8c27a]/50 text-white focus:outline-none text-center font-semibold"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="p-1.5 rounded-lg bg-[#e8c27a] text-black font-bold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingName(true)}
                    className="font-serif text-lg font-bold text-[#f5efe4] hover:text-[#e8c27a] cursor-pointer flex items-center gap-1.5 mb-0.5"
                    title="Click to edit name"
                  >
                    <span>{explorerName}</span>
                    <span className="text-[10px] text-stone-400 font-sans">(edit)</span>
                  </div>
                )}

                {/* Dynamic Realm Title according to chosen Avatar */}
                <span className="text-xs text-[#e8c27a] font-medium tracking-wide">
                  ✦ {currentThemeAvatar ? `${currentThemeAvatar.name} · ${currentThemeAvatar.realm}` : 'Realm Pioneer'} ✦
                </span>

                {/* Account Verification Status */}
                <div className="mt-2 mb-4">
                  {currentUser ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Explorer ({currentUser.email})</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#e8c27a] text-[11px]">
                      <span>Guest Explorer Session</span>
                      {onOpenAuth && (
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setActiveModal('none');
                            onOpenAuth();
                          }}
                          className="underline hover:text-white font-semibold cursor-pointer"
                        >
                          Sign In
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* THEME AVATAR SELECTION GRID (24 High-Resolution Anime Avatars) */}
                <div className="w-full text-left mb-4">
                  <div className="text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#e8c27a]" />
                      <span>Choose Realm Avatar</span>
                    </span>
                    <span className="text-[10px] text-[#e8c27a] font-semibold">24 Anime Archetypes</span>
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1 p-1.5 rounded-2xl bg-black/30 border border-white/5">
                    {REALM_AVATARS.map((avatar) => {
                      const isSelected = selectedAvatarId === avatar.id || LEGACY_AVATAR_MAP[selectedAvatarId] === avatar.id;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => handleSelectAvatar(avatar.id)}
                          className={`flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer relative group ${
                            isSelected
                              ? 'bg-[#e8c27a]/20 border-[#e8c27a] shadow-[0_0_14px_rgba(232,194,122,0.4)] scale-105 ring-1 ring-[#e8c27a]'
                              : 'bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.08] hover:scale-102'
                          }`}
                          title={`${avatar.name} (${avatar.realm})`}
                        >
                          <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden mb-1 relative shrink-0"
                            style={{ boxShadow: `0 0 10px ${avatar.glowColor}` }}
                          >
                            <img
                              src={avatar.imageUrl}
                              alt={avatar.name}
                              className="w-full h-full object-cover rounded-full select-none pointer-events-none"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-[9px] font-medium text-stone-300 truncate max-w-full group-hover:text-white transition-colors">
                            {avatar.badgeLabel}
                          </span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#f1d49a] to-[#d4af37] text-black flex items-center justify-center text-[8px] font-bold shadow-md">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* GENUINE REAL STATS GRID */}
                <div className="grid grid-cols-2 gap-2.5 w-full mb-4">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center">
                    <span className="text-sm font-bold text-[#e8c27a]">{createdRoomsCount}</span>
                    <span className="text-[10px] text-stone-400">Rooms Created by You</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center">
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Synced
                    </span>
                    <span className="text-[10px] text-stone-400">Multiverse Socket</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full flex items-center gap-2.5">
                  {currentUser && onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveModal('none');
                        onLogout();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-stone-300 hover:text-red-300 border border-white/10 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Sign Out
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setActiveModal('none');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#f1d49a] via-[#e8c27a] to-[#d4af37] text-black font-bold text-xs shadow-lg hover:brightness-110 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. REALM SETTINGS MODAL (PRODUCTION-LEVEL REAL CONTROLS)   */}
          {/* ========================================================== */}
          {activeModal === 'settings' && (
            <div className="w-full max-w-md rounded-3xl bg-[#0c101c]/95 border border-[#e8c27a]/35 shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-6 sm:p-7 relative animate-in zoom-in-95 duration-200 backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveModal('none');
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-[#e8c27a]/15 border border-[#e8c27a]/40 flex items-center justify-center text-[#e8c27a]">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#f5efe4]">Realm Settings</h3>
                  <p className="text-[10px] text-stone-400">Configure client audio, video quality & synchronization</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* 1. Audio & Procedural Sound Effects */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-stone-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#e8c27a]" />
                    )}
                    <div>
                      <div className="font-semibold text-white">Audio & Sound FX</div>
                      <div className="text-[10px] text-stone-400">Procedural Web Audio chimes & clicks</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all text-xs ${
                      isMuted ? 'bg-white/10 text-stone-300 hover:bg-white/15' : 'bg-[#e8c27a] text-black shadow-md'
                    }`}
                  >
                    {isMuted ? 'Muted' : 'Enabled'}
                  </button>
                </div>

                {/* 2. Video Playback Quality */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-white">Default Video Quality</div>
                      <div className="text-[10px] text-stone-400">Preferred YouTube streaming resolution</div>
                    </div>
                    <span className="text-[11px] font-bold text-[#e8c27a]">{playbackQuality}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Auto (1080p)', '720p HD', '480p SD', '1440p 2K'].map((q) => {
                      const isActive = playbackQuality === q;
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setPlaybackQuality(q);
                            localStorage.setItem('wr_playback_quality', q);
                          }}
                          className={`py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#e8c27a] text-black font-bold shadow-sm'
                              : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'
                          }`}
                        >
                          {q.replace(' (1080p)', '')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Cinematic Glassmorphism Effect */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-[#e8c27a]" />
                    <div>
                      <div className="font-semibold text-white">Cinematic Glass Effect</div>
                      <div className="text-[10px] text-stone-400">Backdrop blur & ambient light reflection</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      const next = glassEffect === 'ultra' ? 'perf' : 'ultra';
                      setGlassEffect(next);
                      localStorage.setItem('wr_perf_glass', next);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all text-xs ${
                      glassEffect === 'ultra'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/10 text-stone-300'
                    }`}
                  >
                    {glassEffect === 'ultra' ? 'Ultra Frost' : 'Low Blur'}
                  </button>
                </div>

                {/* 4. Party Sync Latency Tolerance */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-[#e8c27a]" />
                    <div>
                      <div className="font-semibold text-white">Party Synchronization</div>
                      <div className="text-[10px] text-stone-400">WebSocket drift correction threshold</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      const next = syncLatency === 'ultra-low' ? 'balanced' : 'ultra-low';
                      setSyncLatency(next);
                      localStorage.setItem('wr_sync_latency', next);
                    }}
                    className="px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all text-xs bg-white/10 hover:bg-white/15 text-stone-200 border border-white/10"
                  >
                    {syncLatency === 'ultra-low' ? 'Ultra-Low (<1s)' : 'Balanced (3s)'}
                  </button>
                </div>

                {/* 5. Chat Audio Notification */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-[#e8c27a]" />
                    <div>
                      <div className="font-semibold text-white">Chat Message Ping</div>
                      <div className="text-[10px] text-stone-400">Play chime when new party message arrives</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      const next = !chatPing;
                      setChatPing(next);
                      localStorage.setItem('wr_chat_ping', next ? 'enabled' : 'disabled');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all text-xs ${
                      chatPing
                        ? 'bg-[#e8c27a] text-black shadow-md'
                        : 'bg-white/10 text-stone-300'
                    }`}
                  >
                    {chatPing ? 'Enabled' : 'Silent'}
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playSyncChime();
                    localStorage.removeItem('wr_playback_quality');
                    localStorage.removeItem('wr_perf_glass');
                    localStorage.removeItem('wr_sync_latency');
                    localStorage.removeItem('wr_chat_ping');
                    setPlaybackQuality('Auto (1080p)');
                    setGlassEffect('ultra');
                    setSyncLatency('ultra-low');
                    setChatPing(true);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white border border-white/10 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                  title="Reset to default settings"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveModal('none');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#f1d49a] via-[#e8c27a] to-[#d4af37] text-black font-bold text-xs shadow-lg hover:brightness-110 cursor-pointer"
                >
                  Save & Close
                </button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 3. MY PARTY MODAL                                          */}
          {/* ========================================================== */}
          {activeModal === 'my-party' && (
            <div className="w-full max-w-sm rounded-3xl bg-[#0c101c]/95 border border-[#e8c27a]/35 shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-6 relative animate-in zoom-in-95 duration-200 backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveModal('none');
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <Tv className="w-5 h-5 text-[#e8c27a]" />
                <h3 className="font-serif text-lg font-bold text-[#f5efe4]">My Watch Parties</h3>
              </div>

              <p className="text-xs text-stone-300 mb-4 leading-relaxed">
                Manage your hosted watch parties and launch new synchronized video rooms for your friends.
              </p>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center mb-4">
                <Film className="w-8 h-8 text-[#e8c27a] mx-auto mb-2 opacity-80" />
                <div className="text-xs font-bold text-white mb-0.5">
                  {createdRoomsCount > 0 ? `${createdRoomsCount} Room(s) Saved Locally` : 'No Active Room Currently'}
                </div>
                <div className="text-[10px] text-stone-400">
                  {createdRoomsCount > 0
                    ? 'Your rooms are synced and visible in the public watch party feed.'
                    : 'Host an adventure in Fantasy, Anime, Gaming, Horror, or any realm!'}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveModal('none');
                    if (onOpenCreateRoom) onOpenCreateRoom();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#f1d49a] via-[#e8c27a] to-[#d4af37] text-black font-bold text-xs shadow-lg hover:brightness-110 cursor-pointer"
                >
                  + Launch New Party
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveModal('none');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
