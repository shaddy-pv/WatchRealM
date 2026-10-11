import React, { useState, useEffect } from 'react';
import { sounds } from '../audio/soundManager';
import { X, Check, Pencil, Lock, Globe, Link2 } from 'lucide-react';

export interface CreatePartyData {
  id: string;
  code: string;
  title: string;
  name: string;
  theme: string;
  videoId: string;
  videoUrl: string;
  isPrivate: boolean;
}

export interface CreatePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (data: CreatePartyData) => void | Promise<void>;
  initialDistrict?: string;
}

// ---------------------------------------------------------------------------
// Custom Vector Icons Matching Dark Fantasy Theme & Reference Screenshot
// ---------------------------------------------------------------------------

export const WizardHatWithStars: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="hatGoldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#faecd0" />
        <stop offset="45%" stopColor="#e5bc72" />
        <stop offset="100%" stopColor="#bd8933" />
      </linearGradient>
      <linearGradient id="sparkleGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f5cf82" />
      </linearGradient>
    </defs>
    {/* Brim */}
    <ellipse cx="17" cy="27" rx="12.5" ry="3.4" fill="url(#hatGoldGrad)" />
    <ellipse cx="17" cy="26.3" rx="9" ry="1.8" fill="#6f4812" opacity="0.4" />
    {/* Cone */}
    <path
      d="M9.8 25.5C10.5 20 13 14 17 7.5C18 6 20 6.3 20.6 8C21.4 10.5 20 14 21.8 17.5C22.8 20 24.2 22.8 24.6 25.5C20.2 26.3 14 26.3 9.8 25.5Z"
      fill="url(#hatGoldGrad)"
    />
    {/* Fabric band */}
    <path
      d="M10.5 24.5C13.5 25.3 20.8 25.3 24 24.5C24.3 25.3 23.8 25.9 20.5 26.2C15 26.6 11 26.2 10.5 24.5Z"
      fill="#faecd0"
      opacity="0.9"
    />
    {/* Sparkle 1 */}
    <path
      d="M26.5 6.5C26.5 8.5 28 9.5 29.5 9.5C28 9.5 26.5 10.5 26.5 12.5C26.5 10.5 25 9.5 23.5 9.5C25 9.5 26.5 8.5 26.5 6.5Z"
      fill="url(#sparkleGrad)"
    />
    {/* Sparkle 2 */}
    <path
      d="M30 15.5C30 16.5 30.8 17 31.5 17C30.8 17 30 17.5 30 18.5C30 17.5 29.2 17 28.5 17C29.2 17 30 16.5 30 15.5Z"
      fill="url(#sparkleGrad)"
    />
  </svg>
);

const CastleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="#e8c27a" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 20V9L4 9V6H6V9H8V6H10V9L12 7L14 9V6H16V9H18V6H20V9L22 9V20H15V15C15 13.34 13.66 12 12 12C10.34 12 9 13.34 9 15V20H2Z" />
  </svg>
);

const SakuraIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="6" r="3.4" fill="#f472b6" />
    <circle cx="17.7" cy="10.2" r="3.4" fill="#f472b6" />
    <circle cx="15.5" cy="17" r="3.4" fill="#f472b6" />
    <circle cx="8.5" cy="17" r="3.4" fill="#f472b6" />
    <circle cx="6.3" cy="10.2" r="3.4" fill="#f472b6" />
    <circle cx="12" cy="12" r="2.8" fill="#fde047" />
  </svg>
);

const SciFiPlanetIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="5" fill="#38bdf8" />
    <ellipse
      cx="12"
      cy="12"
      rx="9.5"
      ry="3.8"
      stroke="#38bdf8"
      strokeWidth="1.6"
      transform="rotate(-22 12 12)"
    />
  </svg>
);

const HorrorSkullIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="#ef4444" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C7.58 2 4 5.58 4 10C4 13.04 5.7 15.68 8.19 17.03L8 20H16L15.81 17.03C18.3 15.68 20 13.04 20 10C20 5.58 16.42 2 12 2ZM9 12C8.17 12 7.5 11.33 7.5 10.5C7.5 9.67 8.17 9 9 9C9.83 9 10.5 9.67 10.5 10.5C10.5 11.33 9.83 12 9 12ZM15 12C14.17 12 13.5 11.33 13.5 10.5C13.5 9.67 14.17 9 15 9C15.83 9 16.5 9.67 16.5 10.5C16.5 11.33 15.83 12 15 12Z" />
  </svg>
);

const BeamedMusicIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="#c084fc" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M19.5 4.5L9.5 6.5V15.5C8.8 15.2 8 15 7 15C4.8 15 3 16.6 3 18.5C3 20.4 4.8 22 7 22C9.2 22 11 20.4 11 18.5V9.5L18 8.1V14.5C17.3 14.2 16.5 14 15.5 14C13.3 14 11.5 15.6 11.5 17.5C11.5 19.4 13.3 21 15.5 21C17.7 21 19.5 19.4 19.5 17.5V4.5Z" />
  </svg>
);

const SoccerBallIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="1.6" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" />
    <polygon points="12,7.5 15.5,10 14.2,14 9.8,14 8.5,10" fill="#f8fafc" />
    <path d="M12 3V7.5M15.5 10L19.5 8.8M14.2 14L17.2 18M9.8 14L6.8 18M8.5 10L4.5 8.8" />
  </svg>
);

const SparkleStarIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="#2dd4bf" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z" />
  </svg>
);

const YouTubeBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="4.5" fill="#ef4444" />
    <polygon points="10,8.5 16,12 10,15.5" fill="#ffffff" />
  </svg>
);

const OrbitDistrictIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-[#e8c27a]' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <circle cx="12" cy="12" r="4.5" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(-25 12 12)" />
  </svg>
);

// ---------------------------------------------------------------------------
// 7 World Districts
// ---------------------------------------------------------------------------

const DISTRICT_ROW_1 = [
  { id: 'Fantasy', label: 'Fantasy', icon: CastleIcon },
  { id: 'Anime', label: 'Anime', icon: SakuraIcon },
  { id: 'Sci-Fi', label: 'Sci-Fi', icon: SciFiPlanetIcon },
];

const DISTRICT_ROW_2 = [
  { id: 'Horror', label: 'Horror', icon: HorrorSkullIcon },
  { id: 'Music', label: 'Music', icon: BeamedMusicIcon },
  { id: 'Sports', label: 'Sports', icon: SoccerBallIcon },
  { id: 'Other', label: 'Other', icon: SparkleStarIcon },
];

const DEFAULT_DISTRICT_VIDEOS: Record<string, string> = {
  Fantasy: '1La4QzGeaaQ', // Lord of the Rings 4K
  Anime: 'jfKfPfyJRdk',   // Lofi Girl Live
  'Sci-Fi': 'qIcTM8WXFjk', // Cyberpunk 2077 Night City 4K
  Horror: 'qIcTM8WXFjk',
  Music: 'jfKfPfyJRdk',
  Sports: 'V1Pl8CzNzCw',
  Other: '1La4QzGeaaQ',
};

export function extractYouTubeVideoId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (trimmed.includes('v=')) {
    const afterV = trimmed.split('v=')[1];
    return afterV.split('&')[0].split('#')[0].split('?')[0];
  }
  if (trimmed.includes('youtu.be/')) {
    const afterSlash = trimmed.split('youtu.be/')[1];
    return afterSlash.split('?')[0].split('&')[0].split('#')[0];
  }
  if (trimmed.includes('/shorts/')) {
    const afterShorts = trimmed.split('/shorts/')[1];
    return afterShorts.split('?')[0].split('&')[0].split('#')[0];
  }
  if (trimmed.includes('embed/')) {
    const afterEmbed = trimmed.split('embed/')[1];
    return afterEmbed.split('?')[0].split('&')[0].split('#')[0];
  }
  if (trimmed.includes('/live/')) {
    const afterLive = trimmed.split('/live/')[1];
    return afterLive.split('?')[0].split('&')[0].split('#')[0];
  }
  return trimmed;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const normalizeDistrict = (d?: string) => {
  if (!d) return 'Fantasy';
  const lower = d.toLowerCase();
  if (lower.includes('fant')) return 'Fantasy';
  if (lower.includes('anim')) return 'Anime';
  if (lower.includes('sci')) return 'Sci-Fi';
  if (lower.includes('horr')) return 'Horror';
  if (lower.includes('musi')) return 'Music';
  if (lower.includes('spor')) return 'Sports';
  return 'Other';
};

export const CreatePartyModal: React.FC<CreatePartyModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialDistrict = 'Fantasy',
}) => {
  const [partyName, setPartyName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(() => normalizeDistrict(initialDistrict));
  const [streamUrl, setStreamUrl] = useState('');

  // Sync district if initialDistrict changes upon open
  useEffect(() => {
    if (isOpen && initialDistrict) {
      setSelectedDistrict(normalizeDistrict(initialDistrict));
    }
  }, [isOpen, initialDistrict]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sounds.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playTravelSwoosh();

    const title = partyName.trim() || `${selectedDistrict} Watch Party`;
    const generatedCode = partyName.trim()
      ? partyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')
      : `${selectedDistrict.toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const resolvedVideoId = streamUrl.trim()
      ? extractYouTubeVideoId(streamUrl)
      : (DEFAULT_DISTRICT_VIDEOS[selectedDistrict] || '1La4QzGeaaQ');

    onCreated({
      id: generatedCode,
      code: generatedCode,
      title,
      name: title,
      theme: selectedDistrict.toLowerCase(),
      videoId: resolvedVideoId,
      videoUrl: `https://www.youtube.com/watch?v=${resolvedVideoId}`,
      isPrivate,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03060d]/50 backdrop-blur-[7px] animate-fade-in overflow-y-auto select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sounds.playClick();
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-[530px] my-auto bg-[rgba(10,14,24,0.72)] backdrop-blur-2xl border border-[#e8c27a]/35 rounded-[28px] p-7 md:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(232,194,122,0.12),inset_0_1px_1.5px_rgba(255,255,255,0.16),inset_0_0_20px_rgba(232,194,122,0.03)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft atmospheric ambient light reflections */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-28 bg-[#e8c27a]/[0.08] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-28 bg-[#e8c27a]/[0.06] rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-5">
          <div className="flex items-center gap-3.5">
            <WizardHatWithStars className="w-10 h-10 flex-shrink-0" />
            <div>
              <h2 className="font-serif text-[26px] font-semibold text-[#f5efe4] tracking-tight leading-tight">
                Create Watch Party
              </h2>
              <p className="text-xs text-[#8e9aa8] mt-1 font-normal tracking-wide">
                Start a new adventure and watch together
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.10] hover:bg-white/[0.10] hover:border-white/[0.22] backdrop-blur-md flex items-center justify-center text-stone-300 hover:text-white transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Party Name */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Pencil className="w-3.5 h-3.5 text-stone-300" />
              <label className="text-sm font-medium text-[#f5efe4]">
                Party Name
              </label>
            </div>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="e.g. Fellowship 4K Watchalong"
              className="w-full px-4 py-3 rounded-xl bg-[rgba(6,9,16,0.60)] backdrop-blur-md border border-white/[0.10] focus:border-[#e8c27a]/75 text-stone-100 placeholder-[#586272] text-sm outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),inset_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[0_0_18px_rgba(232,194,122,0.18),inset_0_2px_4px_rgba(0,0,0,0.5)]"
            />
          </div>

          {/* 2. Room Privacy */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-3.5 h-3.5 text-[#e8c27a]" />
              <label className="text-sm font-medium text-[#f5efe4]">
                Room Privacy
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Public Room Card */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsPrivate(false);
                }}
                className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                  !isPrivate
                    ? 'bg-[rgba(232,194,122,0.10)] border-[#e8c27a] shadow-[0_0_25px_rgba(232,194,122,0.16),inset_0_1px_1.5px_rgba(255,255,255,0.16)]'
                    : 'bg-[rgba(255,255,255,0.03)] border-white/[0.08] hover:bg-[rgba(255,255,255,0.06)] hover:border-white/[0.18] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#e8c27a]" />
                    <span className="font-semibold text-sm text-[#f5efe4]">1. Public Room</span>
                  </div>
                  {!isPrivate && (
                    <div className="w-5 h-5 rounded-full bg-[#e8c27a] text-[#0a0d14] flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[#8e9aa8] leading-snug">
                  Shows in &ldquo;Popular Right Now&rdquo; for everyone to discover &amp; join.
                </p>
              </button>

              {/* Private Room Card */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsPrivate(true);
                }}
                className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                  isPrivate
                    ? 'bg-[rgba(232,194,122,0.10)] border-[#e8c27a] shadow-[0_0_25px_rgba(232,194,122,0.16),inset_0_1px_1.5px_rgba(255,255,255,0.16)]'
                    : 'bg-[rgba(255,255,255,0.03)] border-white/[0.08] hover:bg-[rgba(255,255,255,0.06)] hover:border-white/[0.18] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#e8c27a]" />
                    <span className="font-semibold text-sm text-[#f5efe4]">2. Private Room</span>
                  </div>
                  {isPrivate && (
                    <div className="w-5 h-5 rounded-full bg-[#e8c27a] text-[#0a0d14] flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[#8e9aa8] leading-snug">
                  Hidden from public feed. Joinable via invite link &amp; under &ldquo;My Created Rooms&rdquo;.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Choose World District */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <OrbitDistrictIcon className="w-3.5 h-3.5 text-[#e8c27a]" />
              <label className="text-sm font-medium text-[#f5efe4]">
                Choose World District
              </label>
            </div>

            {/* Row 1 (3 items) */}
            <div className="grid grid-cols-3 gap-2.5">
              {DISTRICT_ROW_1.map((district) => {
                const Icon = district.icon;
                const isSelected = selectedDistrict === district.id;
                return (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedDistrict(district.id);
                    }}
                    className={`h-10 px-2 rounded-xl border flex items-center justify-center gap-2 text-xs transition-all cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? 'bg-[rgba(232,194,122,0.14)] border-[#e8c27a] text-[#f5e6cc] font-semibold shadow-[0_0_16px_rgba(232,194,122,0.2),inset_0_1px_1.5px_rgba(255,255,255,0.15)]'
                        : 'bg-[rgba(255,255,255,0.03)] border-white/[0.08] text-stone-200 font-medium hover:border-white/[0.18] hover:bg-[rgba(255,255,255,0.07)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{district.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Row 2 (4 items) */}
            <div className="grid grid-cols-4 gap-2.5 mt-2.5">
              {DISTRICT_ROW_2.map((district) => {
                const Icon = district.icon;
                const isSelected = selectedDistrict === district.id;
                return (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedDistrict(district.id);
                    }}
                    className={`h-10 px-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? 'bg-[rgba(232,194,122,0.14)] border-[#e8c27a] text-[#f5e6cc] font-semibold shadow-[0_0_16px_rgba(232,194,122,0.2),inset_0_1px_1.5px_rgba(255,255,255,0.15)]'
                        : 'bg-[rgba(255,255,255,0.03)] border-white/[0.08] text-stone-200 font-medium hover:border-white/[0.18] hover:bg-[rgba(255,255,255,0.07)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{district.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Select Starting YouTube Stream */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <YouTubeBadgeIcon className="w-4 h-4 flex-shrink-0" />
              <label className="text-sm font-medium text-[#f5efe4]">
                Select Starting YouTube Stream
              </label>
            </div>
            <div className="relative">
              <Link2 className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="Paste any YouTube URL / Video ID..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[rgba(6,9,16,0.60)] backdrop-blur-md border border-white/[0.10] focus:border-[#e8c27a]/75 text-stone-100 placeholder-[#586272] text-sm outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),inset_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[0_0_18px_rgba(232,194,122,0.18),inset_0_2px_4px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>

          {/* 5. Launch Watch Party CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f5d58f] via-[#e2b157] to-[#c98e32] hover:brightness-105 active:scale-[0.99] text-[#141009] font-bold text-sm tracking-wide shadow-[0_10px_30px_-5px_rgba(226,177,87,0.38),inset_0_1px_1.5px_rgba(255,255,255,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Launch Watch Party</span>
              <span className="text-base leading-none">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
