import React, { useState, useEffect } from 'react';

export interface RealmAvatarDef {
  id: string;
  name: string;
  realm: string;
  imageUrl: string;
  glowColor: string;
  borderColor: string;
  badgeLabel: string;
}

export const LEGACY_AVATAR_MAP: Record<string, string> = {
  crown: 'avatar_6',
  sorcerer: 'avatar_1',
  shinobi: 'avatar_7',
  titan: 'avatar_19',
  voyager: 'avatar_14',
  shadow: 'avatar_3',
  bard: 'avatar_2',
  nomad: 'avatar_8',
};

export const REALM_AVATARS: RealmAvatarDef[] = [
  {
    id: 'avatar_1',
    name: 'Shadow Prodigy',
    realm: 'Nocturne Realm',
    imageUrl: '/avatars/avatar_1.png',
    glowColor: 'rgba(232,194,122,0.55)',
    borderColor: 'border-[#e8c27a]',
    badgeLabel: 'Prodigy',
  },
  {
    id: 'avatar_2',
    name: 'Cyber Songstress',
    realm: 'Music & Beats',
    imageUrl: '/avatars/avatar_2.png',
    glowColor: 'rgba(232,194,122,0.55)',
    borderColor: 'border-[#e8c27a]',
    badgeLabel: 'Songstress',
  },
  {
    id: 'avatar_3',
    name: 'Crimson Sovereign',
    realm: 'Blood Moon',
    imageUrl: '/avatars/avatar_3.png',
    glowColor: 'rgba(239,68,68,0.55)',
    borderColor: 'border-red-500',
    badgeLabel: 'Sovereign',
  },
  {
    id: 'avatar_4',
    name: 'Moonlight Mystic',
    realm: 'Astral Realm',
    imageUrl: '/avatars/avatar_4.png',
    glowColor: 'rgba(56,189,248,0.55)',
    borderColor: 'border-sky-400',
    badgeLabel: 'Mystic',
  },
  {
    id: 'avatar_5',
    name: 'Violet Phantom',
    realm: 'Cyber Neon',
    imageUrl: '/avatars/avatar_5.png',
    glowColor: 'rgba(168,85,247,0.55)',
    borderColor: 'border-purple-400',
    badgeLabel: 'Phantom',
  },
  {
    id: 'avatar_6',
    name: 'Solaris Empress',
    realm: 'Imperial Realm',
    imageUrl: '/avatars/avatar_6.png',
    glowColor: 'rgba(232,194,122,0.6)',
    borderColor: 'border-[#faecd0]',
    badgeLabel: 'Empress',
  },
  {
    id: 'avatar_7',
    name: 'Shadow Shinobi',
    realm: 'Anime Realm',
    imageUrl: '/avatars/avatar_7.png',
    glowColor: 'rgba(232,194,122,0.55)',
    borderColor: 'border-[#e8c27a]',
    badgeLabel: 'Shinobi',
  },
  {
    id: 'avatar_8',
    name: 'Frost Siren',
    realm: 'Glacial Beats',
    imageUrl: '/avatars/avatar_8.png',
    glowColor: 'rgba(56,189,248,0.55)',
    borderColor: 'border-cyan-400',
    badgeLabel: 'Siren',
  },
  {
    id: 'avatar_9',
    name: 'Eclipse Monarch',
    realm: 'Gothic Spire',
    imageUrl: '/avatars/avatar_9.png',
    glowColor: 'rgba(59,130,246,0.55)',
    borderColor: 'border-blue-400',
    badgeLabel: 'Monarch',
  },
  {
    id: 'avatar_10',
    name: 'Scarlet Vixen',
    realm: 'Horror Realm',
    imageUrl: '/avatars/avatar_10.png',
    glowColor: 'rgba(239,68,68,0.55)',
    borderColor: 'border-rose-500',
    badgeLabel: 'Scarlet',
  },
  {
    id: 'avatar_11',
    name: 'Void Reaper',
    realm: 'Nether Void',
    imageUrl: '/avatars/avatar_11.png',
    glowColor: 'rgba(168,85,247,0.55)',
    borderColor: 'border-purple-500',
    badgeLabel: 'Reaper',
  },
  {
    id: 'avatar_12',
    name: 'Amber Wanderer',
    realm: 'Twilight Castle',
    imageUrl: '/avatars/avatar_12.png',
    glowColor: 'rgba(232,194,122,0.55)',
    borderColor: 'border-[#e8c27a]',
    badgeLabel: 'Wanderer',
  },
  {
    id: 'avatar_13',
    name: 'Ember Witch',
    realm: 'Fantasy Realm',
    imageUrl: '/avatars/avatar_13.png',
    glowColor: 'rgba(245,158,11,0.55)',
    borderColor: 'border-amber-400',
    badgeLabel: 'Witch',
  },
  {
    id: 'avatar_14',
    name: 'Starlight Nomad',
    realm: 'Cosmic Explorer',
    imageUrl: '/avatars/avatar_14.png',
    glowColor: 'rgba(56,189,248,0.55)',
    borderColor: 'border-sky-400',
    badgeLabel: 'Nomad',
  },
  {
    id: 'avatar_15',
    name: 'Radiant Queen',
    realm: 'Golden Heights',
    imageUrl: '/avatars/avatar_15.png',
    glowColor: 'rgba(232,194,122,0.6)',
    borderColor: 'border-[#faecd0]',
    badgeLabel: 'Queen',
  },
  {
    id: 'avatar_16',
    name: 'Crimson Watcher',
    realm: 'Blood Citadel',
    imageUrl: '/avatars/avatar_16.png',
    glowColor: 'rgba(239,68,68,0.55)',
    borderColor: 'border-red-500',
    badgeLabel: 'Watcher',
  },
  {
    id: 'avatar_17',
    name: 'Amethyst Dreamer',
    realm: 'Lunar Bloom',
    imageUrl: '/avatars/avatar_17.png',
    glowColor: 'rgba(168,85,247,0.55)',
    borderColor: 'border-purple-400',
    badgeLabel: 'Dreamer',
  },
  {
    id: 'avatar_18',
    name: 'Arctic Assassin',
    realm: 'Frozen Peak',
    imageUrl: '/avatars/avatar_18.png',
    glowColor: 'rgba(56,189,248,0.55)',
    borderColor: 'border-cyan-400',
    badgeLabel: 'Assassin',
  },
  {
    id: 'avatar_19',
    name: 'Cyber Visor',
    realm: 'Sci-Fi City',
    imageUrl: '/avatars/avatar_19.png',
    glowColor: 'rgba(168,85,247,0.55)',
    borderColor: 'border-purple-400',
    badgeLabel: 'Visor',
  },
  {
    id: 'avatar_20',
    name: 'Sunset Priestess',
    realm: 'Temple of Dusk',
    imageUrl: '/avatars/avatar_20.png',
    glowColor: 'rgba(232,194,122,0.55)',
    borderColor: 'border-[#e8c27a]',
    badgeLabel: 'Priestess',
  },
  {
    id: 'avatar_21',
    name: 'Blood Infiltrator',
    realm: 'Shadow Syndicate',
    imageUrl: '/avatars/avatar_21.png',
    glowColor: 'rgba(239,68,68,0.55)',
    borderColor: 'border-red-500',
    badgeLabel: 'Infiltrator',
  },
  {
    id: 'avatar_22',
    name: 'Frost Empress',
    realm: 'Crystal Spire',
    imageUrl: '/avatars/avatar_22.png',
    glowColor: 'rgba(147,197,253,0.6)',
    borderColor: 'border-blue-300',
    badgeLabel: 'Crystal',
  },
  {
    id: 'avatar_23',
    name: 'Dusk Knight',
    realm: 'Castle Bastion',
    imageUrl: '/avatars/avatar_23.png',
    glowColor: 'rgba(232,194,122,0.55)',
    borderColor: 'border-[#e8c27a]',
    badgeLabel: 'Knight',
  },
  {
    id: 'avatar_24',
    name: 'Midnight Muse',
    realm: 'Lo-Fi Night',
    imageUrl: '/avatars/avatar_24.png',
    glowColor: 'rgba(56,189,248,0.55)',
    borderColor: 'border-sky-400',
    badgeLabel: 'Muse',
  },
];

export interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  avatarId?: string;
  isCurrentUser?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'Explorer',
  avatarUrl,
  avatarId,
  isCurrentUser = false,
  className = '',
  size = 'md',
}) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(() => {
    if (avatarId) {
      return LEGACY_AVATAR_MAP[avatarId] || avatarId;
    }
    if (isCurrentUser && typeof window !== 'undefined') {
      const stored = localStorage.getItem('wr_realm_avatar');
      if (stored) return LEGACY_AVATAR_MAP[stored] || stored;
      return 'avatar_1';
    }
    return '';
  });

  useEffect(() => {
    if (avatarId) {
      const resolved = LEGACY_AVATAR_MAP[avatarId] || avatarId;
      setSelectedAvatarId(resolved);
      return;
    }
    if (!isCurrentUser) {
      setSelectedAvatarId('');
      return;
    }
    const handleAvatarChange = (e: any) => {
      const raw = e?.detail?.avatarId || localStorage.getItem('wr_realm_avatar') || 'avatar_1';
      const resolved = LEGACY_AVATAR_MAP[raw] || raw;
      setSelectedAvatarId(resolved);
    };
    window.addEventListener('wr_avatar_changed', handleAvatarChange as EventListener);
    return () => {
      window.removeEventListener('wr_avatar_changed', handleAvatarChange as EventListener);
    };
  }, [avatarId, isCurrentUser]);

  const cleanName = (name || 'Explorer').trim();

  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
    xl: 'w-16 h-16',
  };

  const isRealPhoto = avatarUrl && !avatarUrl.includes('unsplash.com') && !avatarUrl.includes('dummy');

  if (isRealPhoto) {
    return (
      <img
        src={avatarUrl}
        alt={cleanName}
        className={`${sizeClasses[size]} rounded-full object-cover border border-[#e8c27a]/40 shadow-sm ${className}`}
      />
    );
  }

  // Determine avatar: either explicit theme avatar or deterministically from name
  let themeAvatar = selectedAvatarId ? REALM_AVATARS.find((a) => a.id === selectedAvatarId) : undefined;
  if (!themeAvatar) {
    // Deterministic selection based on name hash so everyone has a unique avatar
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    themeAvatar = REALM_AVATARS[Math.abs(hash) % REALM_AVATARS.length];
  }


  return (
    <div
      className={`${sizeClasses[size]} rounded-full relative overflow-hidden select-none shrink-0 transition-transform ${className}`}
      style={{
        boxShadow: `0 0 10px ${themeAvatar.glowColor}`,
      }}
      title={`${cleanName} (${themeAvatar.name} · ${themeAvatar.realm})`}
    >
      <img
        src={themeAvatar.imageUrl}
        alt={themeAvatar.name}
        className="w-full h-full object-cover rounded-full select-none pointer-events-none"
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/avatars/avatar_1.png';
        }}
      />
    </div>
  );
};
