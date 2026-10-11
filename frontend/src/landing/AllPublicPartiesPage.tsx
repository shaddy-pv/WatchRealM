import React, { useState, useMemo, useEffect, useRef } from 'react';
import { sounds } from '../audio/soundManager';
import {
  Users,
  Search,
  Plus,
  Globe,
  Lock,
  Flame,
  Clock,
  Radio,
  Gamepad2,
  Code,
  Mic,
  Film,
  Sparkles,
  Tv,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { UserNavMenu } from '../components/UserNavMenu';
import type { AuthUser } from '../components/AuthModal';
import { UserAvatar } from '../components/UserAvatar';

interface PartyItem {
  id: string;
  title: string;
  genre: string;
  viewers: number;
  hostName: string;
  avatar: string;
  thumbnail: string;
  videoId: string;
  isPrivate: boolean;
  isUserCreated?: boolean;
  createdAt?: number;
}

interface AllPublicPartiesPageProps {
  initialDistrict?: string;
  initialMyPartiesOnly?: boolean;
  onBack: () => void;
  onJoinRoom: (roomId: string, title?: string, videoId?: string, isPrivate?: boolean) => void;
  onOpenCreateModal: (district?: string) => void;
  createdRooms: Array<any>;
  serverRooms: Array<any>;
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onDeleteRoom?: (roomId: string) => void;
  onClearAllRooms?: () => void;
}

// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Harry Potter Enchanted Arrow
// ---------------------------------------------------------------------------
const HarryPotterArrow: React.FC<{ direction?: 'left' | 'right'; className?: string }> = ({
  direction = 'right',
  className = 'w-11 h-6',
}) => (
  <svg
    viewBox="0 0 52 20"
    fill="none"
    className={`${className} transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(232,194,122,0.5)] group-hover:drop-shadow-[0_0_16px_rgba(243,219,171,0.95)]`}
    style={{ transform: direction === 'left' ? 'scaleX(-1)' : undefined }}
  >
    <path d="M4 10H46" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M36 3.5L48 10L36 16.5C38.8 12.8 38.8 7.2 36 3.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    <path
      d="M7 5.5L12 10L7 14.5M2 6.5L6.5 10L2 13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="26" cy="10" r="2" fill="currentColor" opacity="0.95" />
    <circle cx="26" cy="10" r="3.2" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// District Icons
// ---------------------------------------------------------------------------
const CastleIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="#e8c27a" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 20V9L4 9V6H6V9H8V6H10V9L12 7L14 9V6H16V9H18V6H20V9L22 9V20H15V15C15 13.34 13.66 12 12 12C10.34 12 9 13.34 9 15V20H2Z" />
  </svg>
);

const SakuraIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="6" r="3.4" fill="#f472b6" />
    <circle cx="17.7" cy="10.2" r="3.4" fill="#f472b6" />
    <circle cx="15.5" cy="17" r="3.4" fill="#f472b6" />
    <circle cx="8.5" cy="17" r="3.4" fill="#f472b6" />
    <circle cx="6.3" cy="10.2" r="3.4" fill="#f472b6" />
    <circle cx="12" cy="12" r="2.8" fill="#fde047" />
  </svg>
);

const SciFiPlanetIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
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

const HorrorSkullIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="#ef4444" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C7.58 2 4 5.58 4 10C4 13.04 5.7 15.68 8.19 17.03L8 20H16L15.81 17.03C18.3 15.68 20 13.04 20 10C20 5.58 16.42 2 12 2ZM9 12C8.17 12 7.5 11.33 7.5 10.5C7.5 9.67 8.17 9 9 9C9.83 9 10.5 9.67 10.5 10.5C10.5 11.33 9.83 12 9 12ZM15 12C14.17 12 13.5 11.33 13.5 10.5C13.5 9.67 14.17 9 15 9C15.83 9 16.5 9.67 16.5 10.5C16.5 11.33 15.83 12 15 12Z" />
  </svg>
);

const BeamedMusicIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="#c084fc" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M19.5 4.5L9.5 6.5V15.5C8.8 15.2 8 15 7 15C4.8 15 3 16.6 3 18.5C3 20.4 4.8 22 7 22C9.2 22 11 20.4 11 18.5V9.5L18 8.1V14.5C17.3 14.2 16.5 14 15.5 14C13.3 14 11.5 15.6 11.5 17.5C11.5 19.4 13.3 21 15.5 21C17.7 21 19.5 19.4 19.5 17.5V4.5Z" />
  </svg>
);

const SoccerBallIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="1.6" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" />
    <polygon points="12,7.5 15.5,10 14.2,14 9.8,14 8.5,10" fill="#f8fafc" />
    <path d="M12 3V7.5M15.5 10L19.5 8.8M14.2 14L17.2 18M9.8 14L6.8 18M8.5 10L4.5 8.8" />
  </svg>
);

const DISTRICT_FILTERS = [
  { id: 'all', label: 'All Districts', icon: Globe },
  { id: 'fantasy', label: 'Fantasy', icon: CastleIcon },
  { id: 'horror', label: 'Horror', icon: HorrorSkullIcon },
  { id: 'scifi', label: 'Sci-Fi', icon: SciFiPlanetIcon },
  { id: 'anime', label: 'Anime', icon: SakuraIcon },
  { id: 'gaming', label: 'Gaming & Esports', icon: Gamepad2 },
  { id: 'tech', label: 'Tech & Coding', icon: Code },
  { id: 'podcasts', label: 'Podcasts & Talk', icon: Mic },
  { id: 'cinema', label: 'Cinema & Movies', icon: Film },
  { id: 'music', label: 'Music & Beats', icon: BeamedMusicIcon },
  { id: 'sports', label: 'Sports', icon: SoccerBallIcon },
  { id: 'documentary', label: 'Documentary', icon: Globe },
  { id: 'comedy', label: 'Comedy & Memes', icon: Sparkles },
];

export const AllPublicPartiesPage: React.FC<AllPublicPartiesPageProps> = ({
  initialDistrict = 'all',
  initialMyPartiesOnly = false,
  onBack,
  onJoinRoom,
  onOpenCreateModal,
  createdRooms,
  serverRooms,
  currentUser = null,
  onOpenAuth,
  onLogout,
  onDeleteRoom,
  onClearAllRooms,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [filterMyPartiesOnly, setFilterMyPartiesOnly] = useState(initialMyPartiesOnly);
  const [sortBy, setSortBy] = useState<'viewers' | 'newest'>('viewers');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  // Track current user's avatar ID reactively (listens for changes in other tabs/components)
  const [myAvatarId, setMyAvatarId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wr_realm_avatar') || 'avatar_1';
    }
    return 'avatar_1';
  });

  useEffect(() => {
    const handleAvatarChange = (e: any) => {
      const id = e?.detail?.avatarId || localStorage.getItem('wr_realm_avatar') || 'avatar_1';
      setMyAvatarId(id);
    };
    window.addEventListener('wr_avatar_changed', handleAvatarChange as EventListener);
    return () => window.removeEventListener('wr_avatar_changed', handleAvatarChange as EventListener);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setIsGenreDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsGenreDropdownOpen(false);
      }
    };
    if (isGenreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGenreDropdownOpen]);

  useEffect(() => {
    if (initialDistrict) {
      setSelectedDistrict(initialDistrict);
    }
  }, [initialDistrict]);

  useEffect(() => {
    if (initialMyPartiesOnly !== undefined) {
      setFilterMyPartiesOnly(initialMyPartiesOnly);
    }
  }, [initialMyPartiesOnly]);

  // Dynamic Rooms (Solely from user creations and server rooms, zero dummy data)
  const allPublicParties: PartyItem[] = useMemo(() => {
    const list: PartyItem[] = [
      ...createdRooms.map((r) => {
        const live = serverRooms.find((sr) => sr.id === r.id);
        const liveCount = live?.participantCount ?? r.participantCount ?? 1;
        return {
          id: r.id,
          title: r.name || r.title || 'Watch Party',
          genre: r.theme ? r.theme.charAt(0).toUpperCase() + r.theme.slice(1) : 'Custom World',
          viewers: liveCount,
          hostName: r.hostName || (currentUser?.name ? `${currentUser.name} (Host)` : 'You (Host)'),
          avatar: '',
          thumbnail: `https://img.youtube.com/vi/${r.videoId || r.currentVideoId || '1La4QzGeaaQ'}/hqdefault.jpg`,
          videoId: r.videoId || r.currentVideoId || '1La4QzGeaaQ',
          isPrivate: r.isPrivate === true,
          isUserCreated: true,
          createdAt: r.createdAt || 0,
        };
      }),
      ...serverRooms
        .filter((sr) => !createdRooms.some((cr) => cr.id === sr.id))
        .map((r) => {
          const isMine = !!(currentUser?.email && r.hostEmail && r.hostEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
          return {
            id: r.id,
            title: r.name || 'Watch Party',
            genre: r.theme ? r.theme.charAt(0).toUpperCase() + r.theme.slice(1) : 'Public World',
            viewers: r.participantCount !== undefined ? r.participantCount : 1,
            hostName: isMine ? (currentUser?.name ? `${currentUser.name} (Host)` : 'You (Host)') : (r.hostName || 'Explorer'),
            avatar: '',
            thumbnail: `https://img.youtube.com/vi/${r.currentVideoId || r.videoId || '1La4QzGeaaQ'}/hqdefault.jpg`,
            videoId: r.currentVideoId || r.videoId || '1La4QzGeaaQ',
            isPrivate: r.isPrivate === true,
            isUserCreated: isMine,
            createdAt: r.createdAt || 0,
          };
        }),
    ];

    // Remove duplicates
    const uniqueMap = new Map<string, PartyItem>();
    list.forEach((p) => uniqueMap.set(p.id, p));
    const unique = Array.from(uniqueMap.values());

    // Sort strictly by viewers or newest
    if (sortBy === 'newest') {
      return unique.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return unique.sort((a, b) => (b.viewers || 0) - (a.viewers || 0));
  }, [createdRooms, serverRooms, sortBy, currentUser]);

  const userCreatedCount = useMemo(() => {
    return allPublicParties.filter((p) => p.isUserCreated).length;
  }, [allPublicParties]);

  // Filtered List based on Search, District, and My Parties Only
  const filteredParties = useMemo(() => {
    return allPublicParties.filter((party) => {
      // My Parties Only filter: shows ALL parties created by user (BOTH public AND private!)
      if (filterMyPartiesOnly) {
        if (!party.isUserCreated) {
          return false;
        }
      } else {
        // Public discovery view: strictly hide private streams from general public!
        if (party.isPrivate) {
          return false;
        }
      }

      // Search filter
      const matchesSearch =
        !searchQuery.trim() ||
        party.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.id.toLowerCase().includes(searchQuery.toLowerCase());

      // District filter
      let matchesDistrict = true;
      if (selectedDistrict !== 'all') {
        const sel = selectedDistrict.toLowerCase();
        const pGenre = party.genre.toLowerCase();
        if (sel === 'scifi' || sel === 'sci-fi') {
          matchesDistrict = pGenre.includes('sci');
        } else if (sel === 'gaming' || sel === 'games' || sel === 'game') {
          matchesDistrict = pGenre.includes('game') || pGenre.includes('esport');
        } else if (sel === 'tech' || sel === 'coding' || sel === 'code') {
          matchesDistrict = pGenre.includes('tech') || pGenre.includes('code');
        } else if (sel === 'cinema') {
          matchesDistrict = pGenre.includes('cinem') || pGenre.includes('movie');
        } else if (sel === 'music') {
          matchesDistrict = pGenre.includes('music') || pGenre.includes('beat');
        } else if (sel === 'sports') {
          matchesDistrict = pGenre.includes('sport');
        } else if (sel === 'podcasts' || sel === 'podcast') {
          matchesDistrict = pGenre.includes('podcast') || pGenre.includes('talk');
        } else if (sel === 'comedy') {
          matchesDistrict = pGenre.includes('comed') || pGenre.includes('meme');
        } else if (sel === 'documentary') {
          matchesDistrict = pGenre.includes('docu');
        } else if (sel === 'fantasy') {
          matchesDistrict = pGenre.includes('fant');
        } else if (sel === 'anime') {
          matchesDistrict = pGenre.includes('anim');
        } else if (sel === 'horror') {
          matchesDistrict = pGenre.includes('horr');
        } else {
          matchesDistrict = pGenre.includes(sel);
        }
      }

      return matchesSearch && matchesDistrict;
    });
  }, [allPublicParties, searchQuery, selectedDistrict, filterMyPartiesOnly]);

  const currentDistrictFilter = DISTRICT_FILTERS.find((d) => {
    if (d.id === selectedDistrict) return true;
    if ((selectedDistrict === 'scifi' || selectedDistrict === 'sci-fi') && (d.id === 'scifi' || d.id === 'sci-fi')) return true;
    if ((selectedDistrict === 'podcasts' || selectedDistrict === 'podcast') && (d.id === 'podcasts' || d.id === 'podcast')) return true;
    if ((selectedDistrict === 'tech' || selectedDistrict === 'coding' || selectedDistrict === 'code') && (d.id === 'tech' || d.id === 'coding')) return true;
    if ((selectedDistrict === 'gaming' || selectedDistrict === 'games' || selectedDistrict === 'game') && (d.id === 'gaming')) return true;
    return false;
  });
  const currentDistrictLabel = currentDistrictFilter?.label || (selectedDistrict !== 'all' ? selectedDistrict : 'Multiverse');

  const totalWatching = useMemo(() => {
    return allPublicParties.reduce((sum, p) => sum + (p.viewers || 0), 0);
  }, [allPublicParties]);

  const currentGenreTheme = useMemo(() => {
    const sel = selectedDistrict?.toLowerCase();
    if (sel === 'scifi' || sel === 'sci-fi') {
      return {
        bg: '/scifi-bg.png',
        badgeIcon: '🪐',
        badgeText: 'SCI-FI REALM',
        badgeClass: 'bg-sky-500/15 border-sky-400/35 text-sky-200',
        activeChipClass: 'bg-sky-500/20 border-sky-400 text-sky-100 shadow-[0_0_15px_rgba(56,189,248,0.3)]',
        glowGradient: 'from-cyan-400 via-sky-400 to-blue-400 shadow-[0_0_12px_rgba(56,189,248,0.95)]',
      };
    }
    if (sel === 'fantasy') {
      return {
        bg: '/fantasy-bg.png',
        badgeIcon: '🏰',
        badgeText: 'FANTASY REALM',
        badgeClass: 'bg-[#e8c27a]/15 border-[#e8c27a]/35 text-[#f5efe4]',
        activeChipClass: 'bg-[#e8c27a]/20 border-[#e8c27a] text-[#f5e6cc] shadow-[0_0_15px_rgba(232,194,122,0.25)]',
        glowGradient: 'from-amber-400 via-[#e8c27a] to-amber-300 shadow-[0_0_12px_rgba(232,194,122,0.95)]',
      };
    }
    if (sel === 'horror') {
      return {
        bg: '/horror-bg.png',
        badgeIcon: '💀',
        badgeText: 'HORROR REALM',
        badgeClass: 'bg-red-500/15 border-red-500/35 text-red-200',
        activeChipClass: 'bg-red-500/20 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        glowGradient: 'from-red-500 via-rose-500 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.95)]',
      };
    }
    if (sel === 'anime') {
      return {
        bg: '/anime-bg.png',
        badgeIcon: '🌸',
        badgeText: 'ANIME REALM',
        badgeClass: 'bg-[#f472b6]/15 border-[#f472b6]/35 text-[#f5efe4]',
        activeChipClass: 'bg-[#e8c27a]/20 border-[#e8c27a] text-[#f5e6cc] shadow-[0_0_15px_rgba(232,194,122,0.22)]',
        glowGradient: 'from-amber-400 via-[#e8c27a] to-amber-300 shadow-[0_0_12px_rgba(232,194,122,0.95)]',
      };
    }
    if (sel === 'gaming' || sel === 'games' || sel === 'game') {
      return {
        bg: '/gaming-bg.png',
        badgeIcon: '🎮',
        badgeText: 'GAMING REALM',
        badgeClass: 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200',
        activeChipClass: 'bg-emerald-500/20 border-emerald-400 text-emerald-100 shadow-[0_0_15px_rgba(52,211,153,0.3)]',
        glowGradient: 'from-emerald-400 via-green-400 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.95)]',
      };
    }
    if (sel === 'podcasts' || sel === 'podcast') {
      return {
        bg: '/podcast-bg.png',
        badgeIcon: '🎙️',
        badgeText: 'PODCAST REALM',
        badgeClass: 'bg-violet-500/15 border-violet-400/35 text-violet-200',
        activeChipClass: 'bg-violet-500/20 border-violet-400 text-violet-100 shadow-[0_0_15px_rgba(167,139,250,0.3)]',
        glowGradient: 'from-purple-500 via-violet-400 to-indigo-400 shadow-[0_0_12px_rgba(167,139,250,0.95)]',
      };
    }
    if (sel === 'tech' || sel === 'coding' || sel === 'code') {
      return {
        bg: '/tech-bg.png',
        badgeIcon: '💻',
        badgeText: 'CODING & TECH REALM',
        badgeClass: 'bg-cyan-500/15 border-cyan-400/35 text-cyan-200',
        activeChipClass: 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
        glowGradient: 'from-cyan-400 via-teal-400 to-blue-400 shadow-[0_0_12px_rgba(34,211,238,0.95)]',
      };
    }
    if (sel === 'cinema') {
      return {
        bg: '/fantasy-bg.png',
        badgeIcon: '🎬',
        badgeText: 'CINEMA REALM',
        badgeClass: 'bg-amber-500/15 border-amber-400/35 text-amber-200',
        activeChipClass: 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
        glowGradient: 'from-amber-400 via-orange-400 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.95)]',
      };
    }
    if (sel === 'music') {
      return {
        bg: '/fantasy-bg.png',
        badgeIcon: '🎵',
        badgeText: 'MUSIC REALM',
        badgeClass: 'bg-purple-500/15 border-purple-400/35 text-purple-200',
        activeChipClass: 'bg-purple-500/20 border-purple-400 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
        glowGradient: 'from-purple-400 via-fuchsia-400 to-pink-400 shadow-[0_0_12px_rgba(168,85,247,0.95)]',
      };
    }
    if (sel === 'sports') {
      return {
        bg: '/gaming-bg.png',
        badgeIcon: '⚽',
        badgeText: 'SPORTS REALM',
        badgeClass: 'bg-blue-500/15 border-blue-400/35 text-blue-200',
        activeChipClass: 'bg-blue-500/20 border-blue-400 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
        glowGradient: 'from-blue-400 via-sky-400 to-indigo-400 shadow-[0_0_12px_rgba(59,130,246,0.95)]',
      };
    }
    if (sel === 'comedy') {
      return {
        bg: '/fantasy-bg.png',
        badgeIcon: '',
        badgeText: 'COMEDY REALM',
        badgeClass: 'bg-yellow-500/15 border-yellow-400/35 text-yellow-200',
        activeChipClass: 'bg-yellow-500/20 border-yellow-400 text-yellow-100 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
        glowGradient: 'from-yellow-400 via-amber-400 to-orange-400 shadow-[0_0_12px_rgba(234,179,8,0.95)]',
      };
    }
    if (sel === 'documentary') {
      return {
        bg: '/fantasy-bg.png',
        badgeIcon: '🌍',
        badgeText: 'DOCUMENTARY REALM',
        badgeClass: 'bg-teal-500/15 border-teal-400/35 text-teal-200',
        activeChipClass: 'bg-teal-500/20 border-teal-400 text-teal-100 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
        glowGradient: 'from-teal-400 via-emerald-400 to-cyan-400 shadow-[0_0_12px_rgba(20,184,166,0.95)]',
      };
    }
    // Default / All Districts
    return {
      bg: '/fantasy-bg.png',
      badgeIcon: '',
      badgeText: selectedDistrict !== 'all' ? `${currentDistrictLabel.toUpperCase()} REALM` : 'WATCHREALM MULTIVERSE',
      badgeClass: 'bg-[#e8c27a]/10 border-[#e8c27a]/25 text-[#e8c27a]',
      activeChipClass: 'bg-[#e8c27a]/20 border-[#e8c27a] text-[#f5e6cc] shadow-[0_0_15px_rgba(232,194,122,0.22)]',
      glowGradient: 'from-amber-400 via-[#e8c27a] to-amber-300 shadow-[0_0_12px_rgba(232,194,122,0.95)]',
    };
  }, [selectedDistrict, currentDistrictLabel]);

  return (
    <div className="min-h-screen bg-[#07050a] text-[#f5efe4] selection:bg-[#e8c27a]/30 selection:text-[#f3dbab] flex flex-col relative select-none">
      {/* Background Cinematic Artwork Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ transform: 'translate3d(0,0,0)' }}>
        <img
          key={currentGenreTheme.bg}
          src={currentGenreTheme.bg}
          alt=""
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-top opacity-95 contrast-[1.05] brightness-95"
          style={{ transform: 'translate3d(0,0,0)' }}
        />
        {/* Top dark gradient so navbar and search bar are crystal clear */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none" />
        {/* Left subtle shadow behind title & description */}
        <div className="absolute top-0 left-0 w-full sm:w-[55%] h-[520px] bg-gradient-to-r from-black/75 via-black/30 to-transparent pointer-events-none" />
        {/* Soft atmospheric gradient across bottom */}
        <div className="absolute bottom-0 inset-x-0 h-[65%] bg-gradient-to-t from-[#05070d]/90 via-[#05070d]/45 to-transparent pointer-events-none" />
        {/* Subtle atmospheric vignette */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      </div>

      {/* Glassmorphism Frosted Blur Layer: Crystal clear at top, smoothly blurs where content starts */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(0,0,0,0.4) 28%, black 40%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(0,0,0,0.4) 28%, black 40%)',
          transform: 'translate3d(0,0,0)',
          contain: 'strict',
        }}
      />

      {/* ============================================================== */}
      {/* 1. TOP NAVBAR (MATCHING IMAGE 2 EXACTLY)                        */}
      {/* ============================================================== */}
      <header
        className="sticky top-0 left-0 right-0 z-50 transition-all duration-300 px-6 sm:px-10 lg:px-12 py-2 sm:py-2.5 flex items-center justify-between bg-transparent backdrop-blur-md border-b border-white/5"
      >
        {/* Left: Brand Logo (Nav links removed from genre navbar as requested) */}
        <div className="flex items-center gap-6 sm:gap-8">
          <div
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="cursor-pointer group flex items-center select-none"
          >
            <span className="font-harry-potter text-xl sm:text-2xl tracking-wider text-[#e8c27a] group-hover:text-[#f3dbab] transition-colors drop-shadow-[0_2px_10px_rgba(232,194,122,0.35)]">
              WatchRealm
            </span>
          </div>
        </div>

        {/* Right: Search Pill + + Create Room Pill + Avatar with Popover */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Pill-shaped Search Input */}
          <div className="relative flex items-center cursor-pointer group">
            <Search className="w-3 h-3 text-white/40 group-hover:text-[#e8c27a] absolute left-2.5 transition-colors pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, creators or videos..."
              className="w-36 sm:w-56 lg:w-64 pl-7 pr-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#e8c27a]/60 group-hover:border-[#e8c27a]/50 transition-all"
            />
          </div>

          {/* + Create Room Pill Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenCreateModal(selectedDistrict !== 'all' ? currentDistrictLabel : undefined);
            }}
            className="px-3 sm:px-3.5 py-1 rounded-full border border-[#e8c27a] text-[#e8c27a] hover:bg-[#e8c27a]/15 hover:text-[#ffe5a3] text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
          >
            <Plus className="w-3 h-3 text-[#e8c27a]" />
            <span>Create Room</span>
          </button>

          {/* Interactive User Avatar Menu with Popover */}
          <UserNavMenu
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onLogout={onLogout}
            createdRoomsCount={userCreatedCount}
            onOpenCreateRoom={() => onOpenCreateModal(selectedDistrict !== 'all' ? currentDistrictLabel : undefined)}
            onOpenMyParty={() => {
              sounds.playClick();
              setFilterMyPartiesOnly(true);
              setSearchQuery('');
            }}
          />
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. PAGE HERO HEADER                                            */}
      {/* ============================================================== */}
      <main className="relative z-10 flex-1 px-6 sm:px-10 lg:px-16 py-8 sm:py-12 max-w-[1600px] w-full mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            {/* Interactive Theme-Wise Genre Dropdown */}
            <div className="relative inline-block mb-3.5" ref={genreDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsGenreDropdownOpen((prev) => !prev);
                }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e8c27a]/10 border border-[#e8c27a]/35 text-[#e8c27a] text-xs font-bold tracking-widest uppercase backdrop-blur-xl shadow-[0_2px_12px_rgba(232,194,122,0.15)] cursor-pointer hover:bg-[#e8c27a]/18 hover:border-[#e8c27a]/60 hover:shadow-[0_4px_20px_rgba(232,194,122,0.25)] active:scale-95 transition-all select-none"
                title="Switch Genre Realm"
              >
                {currentGenreTheme.badgeIcon ? (
                  <span className="text-sm leading-none">{currentGenreTheme.badgeIcon}</span>
                ) : (
                  <Globe className="w-3.5 h-3.5 text-[#e8c27a]/80" />
                )}
                <span>{selectedDistrict === 'all' ? 'All Realms' : `${currentDistrictLabel} Realm`}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#e8c27a]/70 transition-transform duration-200 ${isGenreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isGenreDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-[#0e0a05]/97 border border-[#e8c27a]/30 shadow-[0_16px_40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(232,194,122,0.06)] backdrop-blur-2xl py-2 z-50 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/10 mb-1">
                    Select Realm / Genre
                  </div>
                  {DISTRICT_FILTERS.map((df) => {
                    const isSelected = selectedDistrict === df.id || (df.id === 'all' && selectedDistrict === 'all');
                    const IconComp = df.icon;
                    return (
                      <button
                        key={df.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedDistrict(df.id);
                          setFilterMyPartiesOnly(false);
                          setIsGenreDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#e8c27a]/20 text-[#e8c27a] font-bold'
                            : 'text-stone-300 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <span className="truncate">{df.label}</span>
                        </div>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e8c27a] shadow-[0_0_8px_rgba(232,194,122,0.8)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#f5efe4] tracking-tight leading-tight">
              {filterMyPartiesOnly
                ? 'My Created Watch Parties'
                : selectedDistrict !== 'all'
                ? `${currentDistrictLabel} Watch Parties`
                : 'Public Watch Parties'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-2xl leading-relaxed">
              {filterMyPartiesOnly
                ? 'Watch parties created by you. Host friends and enjoy synchronized playback.'
                : selectedDistrict !== 'all'
                ? `Discover and instantly join synchronized live ${currentDistrictLabel} watch parties hosted by real explorers.`
                : 'Discover and instantly join synchronized live watch parties hosted by real explorers across floating world districts.'}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 text-xs bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-1.5 text-stone-200">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>
                <strong>{filterMyPartiesOnly ? filteredParties.length : allPublicParties.length}</strong>{' '}
                {filterMyPartiesOnly ? 'My Rooms' : 'Live Rooms'}
              </span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span><strong>{totalWatching}</strong> Watching Live</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. SORT CONTROLS BAR & MY PARTIES TOGGLE                       */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 pt-4 border-t border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-stone-400 font-medium">
              Showing {filterMyPartiesOnly ? 'your created' : 'live'} rooms in{' '}
              <span className="text-[#e8c27a] font-semibold">{currentDistrictLabel}</span>
            </div>

            {/* Quick Toggle for My Parties */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setFilterMyPartiesOnly((prev) => !prev);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                filterMyPartiesOnly
                  ? 'bg-[#e8c27a] text-black border-[#e8c27a] shadow-[0_0_12px_rgba(232,194,122,0.4)]'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 hover:text-white border-white/10'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>{filterMyPartiesOnly ? '★ Showing My Parties' : 'My Parties'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterMyPartiesOnly ? 'bg-black text-[#e8c27a]' : 'bg-white/10 text-stone-300'
                }`}
              >
                {userCreatedCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium">Sort by:</span>
            <div className="flex items-center p-0.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-xs">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSortBy('viewers');
                }}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sortBy === 'viewers'
                    ? 'bg-[#e8c27a] text-black shadow-md'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Popularity</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSortBy('newest');
                }}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sortBy === 'newest'
                    ? 'bg-[#e8c27a] text-black shadow-md'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Newest</span>
              </button>
            </div>

            {onClearAllRooms && allPublicParties.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (window.confirm('Delete ALL watch parties created by anyone? This will clear all rooms permanently.')) {
                    onClearAllRooms();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ml-1 sm:ml-2"
                title="Delete all created parties"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete All Parties</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. ROOMS GRID OR EMPTY STATE                                    */}
        {/* ============================================================== */}
        {filteredParties.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl my-8 p-10 sm:p-14 text-center flex flex-col items-center justify-center border border-white/15 bg-white/[0.04] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] group transition-all duration-300">
            {/* Ambient Background Aura behind glass */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-[#e8c27a]/20 via-[#99621e]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Frosted Emblem Orb */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-white/15 to-white/5 border border-white/20 backdrop-blur-md flex items-center justify-center text-[#e8c27a] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_24px_rgba(232,194,122,0.25)] group-hover:scale-105 transition-transform duration-300">
                {filterMyPartiesOnly ? (
                  <Tv className="w-9 h-9 drop-shadow-[0_2px_8px_rgba(232,194,122,0.4)]" />
                ) : (
                  <CastleIcon className="w-9 h-9 drop-shadow-[0_2px_8px_rgba(232,194,122,0.4)]" />
                )}
              </div>
            </div>

            {/* Title with Gold-Silver Gradient & Font-Serif */}
            <h3 className={`font-serif text-2xl sm:text-3xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f7ebd4] to-[#e8c27a] drop-shadow-sm max-w-xl ${
              filterMyPartiesOnly || searchQuery.trim() ? 'mb-3' : 'mb-8'
            }`}>
              {filterMyPartiesOnly
                ? "You Haven't Created Any Watch Parties Yet"
                : selectedDistrict !== 'all'
                ? `No Public Watch Parties in ${currentDistrictLabel} Right Now`
                : 'No Public Watch Parties Found'}
            </h3>

            {/* Subtitle - only when filtering by my parties or actively searching */}
            {(filterMyPartiesOnly || searchQuery.trim()) && (
              <p className="text-xs sm:text-sm text-stone-300/80 max-w-lg mb-8 leading-relaxed font-sans">
                {filterMyPartiesOnly
                  ? 'Host your own synchronized party in any realm and invite friends to watch together.'
                  : `No watch party matched "${searchQuery}".`}
              </p>
            )}

            {/* Action Buttons with Translucent Frosted Glass & Regal Gold CTA */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 z-10">
              {filterMyPartiesOnly && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setFilterMyPartiesOnly(false);
                  }}
                  className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-md border border-white/15 text-xs font-semibold text-stone-200 cursor-pointer transition-all shadow-md hover:scale-102"
                >
                  Show All Public Rooms ({allPublicParties.length})
                </button>
              )}
              {selectedDistrict !== 'all' && !filterMyPartiesOnly && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedDistrict('all');
                  }}
                  className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-md border border-white/15 text-xs font-semibold text-stone-200 cursor-pointer transition-all shadow-md hover:scale-102"
                >
                  Show All Districts ({allPublicParties.length})
                </button>
              )}
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-md border border-white/15 text-xs font-semibold text-stone-200 cursor-pointer transition-all shadow-md hover:scale-102"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenCreateModal(selectedDistrict !== 'all' ? currentDistrictLabel : undefined);
                }}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#f1d49a] via-[#e8c27a] to-[#d4af37] text-black text-xs font-bold shadow-[0_4px_24px_rgba(232,194,122,0.4)] hover:shadow-[0_4px_32px_rgba(232,194,122,0.65)] hover:brightness-110 active:scale-95 cursor-pointer transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Launch New Watch Party</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4.5">
            {filteredParties.map((party) => (
              <div
                key={party.id}
                onClick={() => {
                  sounds.playTravelSwoosh();
                  onJoinRoom(party.id, party.title, party.videoId, party.isPrivate);
                }}
                className="group rounded-2xl overflow-hidden bg-[#0c0905] border border-[#e8c27a]/20 hover:border-[#e8c27a]/70 shadow-[0_4px_20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(232,194,122,0.04)] hover:shadow-[0_8px_28px_rgba(232,194,122,0.15),0_0_0_1px_rgba(232,194,122,0.1)] transition-transform duration-200 cursor-pointer flex flex-col hover:-translate-y-1 will-change-transform"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/80">
                  <img
                    src={party.thumbnail}
                    alt={party.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${party.videoId || '1La4QzGeaaQ'}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* LIVE + Viewers Count Pills (Top-Left) */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600/95 text-[9px] font-bold uppercase tracking-wider text-white shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>LIVE</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white/95 backdrop-blur-md border border-white/15 shadow-sm font-medium">
                      <Users className="w-2.5 h-2.5 text-[#e8c27a]" />
                      <span>{party.viewers} watching</span>
                    </div>
                  </div>

                  {/* Public / Private Badge (Top-Right) */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    {party.isPrivate ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/25 backdrop-blur-md border border-amber-400/40 text-[9px] font-bold text-[#f5cf82] shadow-sm">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Private</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-[9px] font-bold text-emerald-300">
                        <Globe className="w-2.5 h-2.5" />
                        <span>Public</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-3.5 flex flex-col justify-between flex-1 bg-gradient-to-b from-[#130f08]/80 to-[#0c0905]">
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-[#f5efe4] line-clamp-1 group-hover:text-[#e8c27a] transition-colors mb-1 leading-snug">
                      {party.title}
                    </h3>
                    <div className="text-[11px] text-[#e8c27a]/60 font-medium mb-3 flex items-center gap-1">
                      <span className="text-[#e8c27a]/40">District:</span>
                      <span className="text-[#c9b48a]">{party.genre}</span>
                    </div>
                  </div>

                  {/* Host Info + Join Arrow Circle */}
                  <div className="pt-2.5 border-t border-[#e8c27a]/10 flex items-center justify-between text-xs text-stone-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserAvatar
                        name={party.hostName}
                        avatarId={party.isUserCreated ? myAvatarId : undefined}
                        size="xs"
                      />
                      <span className="text-[11px] truncate font-medium text-[#c9b48a]">
                        {party.hostName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onDeleteRoom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            if (window.confirm(`Delete watch party "${party.title}"?`)) {
                              onDeleteRoom(party.id);
                            }
                          }}
                          title="Delete Party"
                          className="p-1 rounded-lg bg-red-500/15 hover:bg-red-500/35 text-red-300 hover:text-white border border-red-500/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      )}

                      <div className="w-6 h-6 rounded-full bg-white/[0.05] group-hover:bg-[#e8c27a] group-hover:text-black flex items-center justify-center transition-all shrink-0 shadow-sm">
                        <span className="text-xs font-bold leading-none">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Back Button */}
        <div className="mt-14 pt-8 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="group flex items-center gap-3 text-[#e8c27a] hover:text-[#ffe5a3] cursor-pointer transition-all duration-300 active:scale-95 select-none"
          >
            <HarryPotterArrow direction="left" className="w-10 h-5 group-hover:-translate-x-1" />
            <span className="font-harry-potter text-lg sm:text-xl tracking-wider text-[#e8c27a] group-hover:text-[#ffe5a3] transition-colors">
              Back to Home
            </span>
          </button>

          <span className="text-xs text-stone-500 font-sans">
            WatchRealm Floating Multiverse · Synchronized Cinema
          </span>
        </div>
      </main>
    </div>
  );
};
