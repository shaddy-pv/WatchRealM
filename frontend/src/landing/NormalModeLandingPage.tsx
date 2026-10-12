import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  Play,
  ArrowRight,
  Music,
  Gamepad2,
  Code,
  Mic,
  Film,
  Globe,
  Sparkles,
  X,
  Compass,
  Lock,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';
import { sounds } from '../audio/soundManager';
import { BACKEND_URL } from '../config';
import { CreatePartyModal } from '../components/CreatePartyModal';
import { AllPublicPartiesPage } from './AllPublicPartiesPage';
import { UserNavMenu } from '../components/UserNavMenu';
import { AuthModal, type AuthUser } from '../components/AuthModal';
import { UserAvatar } from '../components/UserAvatar';

interface NormalModeLandingPageProps {
  onReturnToRealm: () => void;
  onJoinRoom?: (roomId: string, title?: string, videoId?: string, isPrivate?: boolean) => void;
}



const CastleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-[#e8c27a]' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 20V9L4 9V6H6V9H8V6H10V9L12 7L14 9V6H16V9H18V6H20V9L22 9V20H15V15C15 13.34 13.66 12 12 12C10.34 12 9 13.34 9 15V20H2Z" />
  </svg>
);

const WizardHatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-amber-300' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2L8.5 9.5H15.5L12 2Z" opacity="0.95" />
    <path d="M7 9.5L3.5 16H20.5L17 9.5H7Z" />
    <path d="M1.5 17C1.5 16.2 2.2 15.8 3 15.8H21C21.8 15.8 22.5 16.2 22.5 17C22.5 18.5 17.8 20 12 20C6.2 20 1.5 18.5 1.5 17Z" />
    <path d="M5.5 14C5.5 14 8.5 15.5 12 15.5C15.5 15.5 18.5 14 18.5 14L19 15.8H5L5.5 14Z" fill="#fde047" opacity="0.75" />
  </svg>
);

const SkullIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-red-500' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C7.58 2 4 5.58 4 10C4 13.04 5.7 15.68 8.19 17.03L8 20H16L15.81 17.03C18.3 15.68 20 13.04 20 10C20 5.58 16.42 2 12 2ZM9 12C8.17 12 7.5 11.33 7.5 10.5C7.5 9.67 8.17 9 9 9C9.83 9 10.5 9.67 10.5 10.5C10.5 11.33 9.83 12 9 12ZM15 12C14.17 12 13.5 11.33 13.5 10.5C13.5 9.67 14.17 9 15 9C15.83 9 16.5 9.67 16.5 10.5C16.5 11.33 15.83 12 15 12Z" />
  </svg>
);

const PlanetIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-cyan-400' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="5.5" />
    <path d="M2.5 13C2.5 11.5 5 9.5 9 8.5C8.4 9.6 8 10.7 8 12C8 13.3 8.4 14.4 9 15.5C5 14.5 2.5 12.5 2.5 13Z" opacity="0.75" />
    <path d="M15 15.5C15.6 14.4 16 13.3 16 12C16 10.7 15.6 9.6 15 8.5C19 9.5 21.5 11.5 21.5 13C21.5 14.5 19 15.5 15 15.5Z" opacity="0.75" />
  </svg>
);

const SakuraIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-pink-400' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="3" fill="#fde047" />
    <circle cx="12" cy="6" r="3.5" opacity="0.9" />
    <circle cx="17.7" cy="10.2" r="3.5" opacity="0.9" />
    <circle cx="15.5" cy="17" r="3.5" opacity="0.9" />
    <circle cx="8.5" cy="17" r="3.5" opacity="0.9" />
    <circle cx="6.3" cy="10.2" r="3.5" opacity="0.9" />
  </svg>
);

const BallIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-white' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <polygon points="12,7 16,10 14.5,15 9.5,15 8,10" fill="currentColor" />
  </svg>
);

const XSocialIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const LinkedInIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// -------------------------------------------------------------
// HARRY POTTER STYLE ENCHANTED ARROW (NO CIRCLE)
// -------------------------------------------------------------
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
    {/* Ornate magical arrow shaft with tapered ends */}
    <path
      d="M4 10H46"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Sharp Flared Gothic / Harry Potter arrowhead */}
    <path
      d="M36 3.5L48 10L36 16.5C38.8 12.8 38.8 7.2 36 3.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    {/* Feathered fletching / nock with magical runes */}
    <path
      d="M7 5.5L12 10L7 14.5M2 6.5L6.5 10L2 13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Center mystic talisman jewel */}
    <circle cx="26" cy="10" r="2" fill="currentColor" opacity="0.95" />
    <circle cx="26" cy="10" r="3.2" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
  </svg>
);

export const NormalModeLandingPage: React.FC<NormalModeLandingPageProps> = ({
  onReturnToRealm,
  onJoinRoom,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Entertainment' | 'Creator' | 'Featured'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [activeNavSection, setActiveNavSection] = useState<'home' | 'worlds' | 'parties' | 'how-it-works'>('home');
  const [isViewAllPageOpen, setIsViewAllPageOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'all-rooms';
    }
    return false;
  });

  const [viewAllInitialDistrict, setViewAllInitialDistrict] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('genre') || 'all';
    }
    return 'all';
  });
  const [viewAllMyPartiesOnly, setViewAllMyPartiesOnly] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('myParties') === '1';
    }
    return false;
  });
  const [modalDistrict, setModalDistrict] = useState<string>('Fantasy');
  const [hoveredCastle, setHoveredCastle] = useState<string | null>(null);
  const [showCentralCard, setShowCentralCard] = useState(false);
  // Hero section unified reveal — starts ready if images are already cached
  // (Cinematic preloader runs during loading/enter/mode-select phases so by
  // the time user reaches this page all images should be in browser cache.)
  const HERO_SRCS = [
    '/realm/normal-mode-heroSection.webp',
    '/realm/castle-fantasy.png',
    '/realm/castle-horror.png',
    '/realm/center-castle.png',
    '/realm/castle-scifi.png',
    '/realm/castle-anime.png',
  ];
  const checkAllCached = () =>
    HERO_SRCS.every(src => {
      const img = new Image();
      img.src = src;
      return img.complete && img.naturalWidth > 0;
    });
  const [heroReady, setHeroReady] = useState<boolean>(() => checkAllCached());
  const heroLoadCount = useRef(heroReady ? 6 : 0);
  const HERO_TOTAL = 6;
  const onHeroImageLoad = () => {
    if (heroReady) return; // already revealed — skip
    heroLoadCount.current += 1;
    if (heroLoadCount.current >= HERO_TOTAL) setHeroReady(true);
  };
  // Smart search bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchJoining, setSearchJoining] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Authenticated user session
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('wr_auth_user');
        if (stored) return JSON.parse(stored);
      } catch (_) { }
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAuthIntent, setPendingAuthIntent] = useState<{
    type: 'create' | 'join';
    roomData?: { roomId: string; title?: string; videoId?: string; isPrivate?: boolean };
    district?: string;
  } | null>(null);

  const handleLogout = () => {
    sounds.playClick();
    try {
      localStorage.removeItem('wr_auth_user');
    } catch (_) { }
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);

    // Sync any existing local guest rooms to user account in MongoDB Atlas
    if (user?.email && createdRooms.length > 0) {
      createdRooms.forEach(async (r) => {
        try {
          await fetch(`${BACKEND_URL}/api/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: r.id,
              roomId: r.id,
              name: r.name || r.title,
              theme: (r.theme || 'fantasy').toLowerCase(),
              videoId: r.videoId || r.currentVideoId || '1La4QzGeaaQ',
              isPrivate: r.isPrivate === true,
              hostName: user.name,
              hostEmail: user.email.toLowerCase().trim(),
            }),
          });
        } catch (_) { }
      });
    }
    if (pendingAuthIntent) {
      const intent = pendingAuthIntent;
      setPendingAuthIntent(null);

      if (intent.type === 'create') {
        if (intent.district && intent.district !== 'all') {
          setModalDistrict(intent.district);
        }
        setIsCreateModalOpen(true);
      } else if (intent.type === 'join') {
        if (intent.roomData) {
          if (onJoinRoom) {
            onJoinRoom(
              intent.roomData.roomId,
              intent.roomData.title,
              intent.roomData.videoId,
              intent.roomData.isPrivate
            );
          }
        } else {
          setIsJoinModalOpen(true);
        }
      }
    }
  };

  const handleCreateRoomClick = (district?: string) => {
    sounds.playClick();
    if (!currentUser) {
      setPendingAuthIntent({ type: 'create', district });
      setIsAuthModalOpen(true);
      return;
    }
    if (district && district !== 'all') {
      setModalDistrict(district);
    }
    setIsCreateModalOpen(true);
  };

  const handleJoinHeroClick = () => {
    sounds.playClick();
    if (!currentUser) {
      setPendingAuthIntent({ type: 'join' });
      setIsAuthModalOpen(true);
      return;
    }
    setIsJoinModalOpen(true);
  };

  // Keep browser history / back button in sync with View All page
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setIsViewAllPageOpen(params.get('view') === 'all-rooms');
      setViewAllInitialDistrict(params.get('genre') || 'all');
      setViewAllMyPartiesOnly(params.get('myParties') === '1');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close central character modal on Escape key
  useEffect(() => {
    if (!showCentralCard) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCentralCard(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCentralCard]);

  const openViewAllPage = (district: string = 'all', myPartiesOnly: boolean = false) => {
    sounds.playClick();
    setViewAllInitialDistrict(district);
    setViewAllMyPartiesOnly(myPartiesOnly);
    setIsViewAllPageOpen(true);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'all-rooms');
      if (district && district !== 'all') {
        url.searchParams.set('genre', district);
      } else {
        url.searchParams.delete('genre');
      }
      if (myPartiesOnly) {
        url.searchParams.set('myParties', '1');
      } else {
        url.searchParams.delete('myParties');
      }
      window.history.pushState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const closeViewAllPage = () => {
    sounds.playClick();
    setIsViewAllPageOpen(false);
    setViewAllInitialDistrict('all');
    setViewAllMyPartiesOnly(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('genre');
      url.searchParams.delete('myParties');
      window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const handleGenreClick = (genreId: string) => {
    sounds.playClick();
    openViewAllPage(genreId);
  };

  // Track current user's avatar reactively (syncs when changed in Profile modal)
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

  // Load custom created rooms from localStorage so they are permanently saved
  const [createdRooms, setCreatedRooms] = useState<Array<any>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('wr_created_rooms');
        if (stored) return JSON.parse(stored);
      } catch (_) { }
    }
    return [];
  });

  // Server rooms fetched from backend API
  const [serverRooms, setServerRooms] = useState<Array<any>>([]);

  // Fetch active rooms from backend API with change detection (stops laggy re-renders)
  useEffect(() => {
    let isMounted = true;
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rooms`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const rooms = Array.isArray(data.rooms) ? data.rooms : (Array.isArray(data) ? data : []);
          setServerRooms((prev) => {
            if (prev.length === rooms.length && JSON.stringify(prev) === JSON.stringify(rooms)) {
              return prev;
            }
            return rooms;
          });

          // Reconcile createdRooms live participant counts WITHOUT purging private rooms
          setCreatedRooms((prev) => {
            const serverRoomIds = new Set(rooms.map((r: any) => r.id || r.roomId));
            // CRITICAL: NEVER delete private rooms based on public server rooms list!
            const updated = prev.filter((r) => r.isPrivate === true || serverRoomIds.has(r.id || r.roomId));
            if (updated.length !== prev.length) {
              try {
                localStorage.setItem('wr_created_rooms', JSON.stringify(updated));
              } catch (_) { }
              return updated;
            }
            return prev;
          });
        }
      } catch (err) {
        // Silently catch network failures
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sync user's hosted parties from MongoDB Atlas when logged in (restores parties in incognito & new devices)
  useEffect(() => {
    if (!currentUser?.email) return;

    let isMounted = true;
    const fetchUserRooms = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rooms/user/${encodeURIComponent(currentUser.email.toLowerCase().trim())}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.rooms)) {
            const serverUserRooms = data.rooms.map((r: any) => ({
              ...r,
              title: r.name || r.title,
              isPrivate: r.isPrivate === true,
              hostName: currentUser.name ? `${currentUser.name} (Host)` : 'You (Host)',
            }));
            setCreatedRooms((prev) => {
              // Merge server user rooms with local rooms so nothing is lost
              const serverIds = new Set(serverUserRooms.map((sr: any) => sr.id || sr.roomId));
              const localUnsynced = prev.filter((p) => !serverIds.has(p.id || p.roomId));
              const merged = [...serverUserRooms, ...localUnsynced];
              try {
                localStorage.setItem('wr_created_rooms', JSON.stringify(merged));
              } catch (_) { }
              return merged;
            });
          }
        }
      } catch (_) { }
    };

    fetchUserRooms();
  }, [currentUser]);

  // Delete a specific room from MongoDB & in-memory backend
  const handleDeleteRoom = async (roomId: string) => {
    try {
      sounds.playClick();
      await fetch(`${BACKEND_URL}/api/rooms/${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
      });
      setCreatedRooms((prev) => {
        const next = prev.filter((r) => r.id !== roomId && r.roomId !== roomId);
        try {
          localStorage.setItem('wr_created_rooms', JSON.stringify(next));
        } catch (_) { }
        return next;
      });
      setServerRooms((prev) => prev.filter((r) => r.id !== roomId && r.roomId !== roomId));
    } catch (err) {
      console.warn('Failed to delete room:', err);
    }
  };

  // Delete ALL rooms from MongoDB & in-memory backend
  const handleClearAllRooms = async () => {
    try {
      sounds.playClick();
      await fetch(`${BACKEND_URL}/api/rooms`, {
        method: 'DELETE',
      });
      setCreatedRooms([]);
      try {
        localStorage.removeItem('wr_created_rooms');
      } catch (_) { }
      setServerRooms([]);
    } catch (err) {
      console.warn('Failed to clear rooms:', err);
    }
  };

  // Ref & handler for smooth carousel scrolling
  const carouselRef = useRef<HTMLDivElement>(null);
  const isClickScrollingRef = useRef(false);

  const scrollWorlds = (direction: 'left' | 'right') => {
    sounds.playClick();
    if (carouselRef.current) {
      const scrollAmount = 460;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Scroll detection for active section highlight with rAF throttling (prevents layout thrashing)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (isClickScrollingRef.current) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (isClickScrollingRef.current) {
            ticking = false;
            return;
          }
          const worldsEl = document.getElementById('worlds');
          const popularEl = document.getElementById('popular');
          const scrollPos = window.scrollY + 140;

          // Jab tak pura scroll end tak na ho jaye, tab tak How It Works highlight na ho
          const isAtEnd =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 180;

          if (isAtEnd) {
            setActiveNavSection('how-it-works');
          } else if (popularEl && scrollPos >= popularEl.offsetTop - 60) {
            setActiveNavSection('parties');
          } else if (worldsEl && scrollPos >= worldsEl.offsetTop - 60) {
            setActiveNavSection('worlds');
          } else {
            setActiveNavSection('home');
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 12 YouTube Video Genres matching WatchRealm Floating Multiverse
  const worldCategories = [
    {
      id: 'fantasy',
      name: 'Fantasy',
      watching: '124 watching',
      category: 'Entertainment',
      image: '/assets/card_fantasy_castle.jpg',
      icon: <WizardHatIcon className="w-4 h-4 text-amber-300" />,
    },
    {
      id: 'horror',
      name: 'Horror',
      watching: '86 watching',
      category: 'Entertainment',
      image: '/assets/card_horror_castle.jpg',
      icon: <SkullIcon className="w-4 h-4 text-red-500" />,
    },
    {
      id: 'scifi',
      name: 'Sci-Fi',
      watching: '142 watching',
      category: 'Entertainment',
      image: '/assets/card_scifi_city.jpg',
      icon: <PlanetIcon className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'anime',
      name: 'Anime',
      watching: '98 watching',
      category: 'Featured',
      image: '/assets/card_anime_village.jpg',
      icon: <SakuraIcon className="w-4 h-4 text-pink-400" />,
    },
    {
      id: 'gaming',
      name: 'Gaming & Esports',
      watching: '210 watching',
      category: 'Featured',
      image: '/assets/card_gaming.jpg',
      icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'tech',
      name: 'Tech & Coding',
      watching: '94 watching',
      category: 'Creator',
      image: '/assets/card_tech.jpg',
      icon: <Code className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'podcasts',
      name: 'Podcasts & Talk',
      watching: '115 watching',
      category: 'Creator',
      image: '/assets/card_podcast.jpg',
      icon: <Mic className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'cinema',
      name: 'Cinema & Movies',
      watching: '156 watching',
      category: 'Entertainment',
      image: '/assets/card_cinema.jpg',
      icon: <Film className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'music',
      name: 'Music & Beats',
      watching: '165 watching',
      category: 'Entertainment',
      image: '/assets/card_music_concert.jpg',
      icon: <Music className="w-4 h-4 text-fuchsia-400" />,
    },
    {
      id: 'sports',
      name: 'Sports',
      watching: '76 watching',
      category: 'Entertainment',
      image: '/assets/card_sports_stadium.jpg',
      icon: <BallIcon className="w-4 h-4 text-white" />,
    },
    {
      id: 'documentary',
      name: 'Documentary',
      watching: '82 watching',
      category: 'Featured',
      image: '/assets/card_documentary.jpg',
      icon: <Globe className="w-4 h-4 text-teal-400" />,
    },
    {
      id: 'comedy',
      name: 'Comedy & Memes',
      watching: '138 watching',
      category: 'Creator',
      image: '/assets/card_comedy.jpg',
      icon: <Sparkles className="w-4 h-4 text-yellow-300" />,
    },
  ];

  const filteredWorlds = worldCategories.filter((item) => {
    if (activeFilter === 'All') return true;
    return item.category === activeFilter;
  });

  // Dynamic rooms merged from real user creations and backend server (zero dummy data)
  const allWatchParties = [
    // 1. User created rooms (both public and private, saved in localStorage or MongoDB Atlas)
    ...createdRooms.map((r) => {
      const liveRoom = serverRooms.find((sr) => sr.id === r.id);
      const liveCount = liveRoom?.participantCount ?? r.participantCount ?? 1;
      return {
        id: r.id,
        title: r.name || r.title || 'Watch Party',
        genre: r.theme ? r.theme.charAt(0).toUpperCase() + r.theme.slice(1) : 'Custom World',
        viewers: liveCount,
        hostName: r.hostName || (currentUser?.name ? `${currentUser.name} (Host)` : 'You (Host)'),
        hostEmail: r.hostEmail || currentUser?.email,
        avatar: '',
        thumbnail: `https://img.youtube.com/vi/${r.videoId || r.currentVideoId || '1La4QzGeaaQ'}/hqdefault.jpg`,
        videoId: r.videoId || r.currentVideoId || '1La4QzGeaaQ',
        theme: r.theme || 'cinema',
        isPrivate: r.isPrivate === true,
        isUserCreated: true,
      };
    }),
    // 2. Active rooms from backend server that aren't already in createdRooms
    ...serverRooms
      .filter((sr) => !createdRooms.some((cr) => cr.id === sr.id))
      .map((r) => {
        const isMine = !!(currentUser?.email && r.hostEmail && r.hostEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
        return {
          id: r.id,
          title: r.name || 'Watch Party',
          genre: r.theme ? r.theme.charAt(0).toUpperCase() + r.theme.slice(1) : 'Public World',
          theme: r.theme || 'cinema',
          viewers: r.participantCount !== undefined ? r.participantCount : 1,
          hostName: isMine ? (currentUser?.name ? `${currentUser.name} (Host)` : 'You (Host)') : (r.hostName || 'Explorer'),
          hostEmail: r.hostEmail,
          avatar: '',
          thumbnail: `https://img.youtube.com/vi/${r.currentVideoId || r.videoId || '1La4QzGeaaQ'}/hqdefault.jpg`,
          videoId: r.currentVideoId || r.videoId || '1La4QzGeaaQ',
          isPrivate: r.isPrivate === true,
          isUserCreated: isMine,
        };
      }),
  ];

  // User hosted rooms count (merges localStorage and database rooms)
  const userHostedCount = useMemo(() => {
    const localIds = new Set(createdRooms.map((r) => r.id));
    let count = createdRooms.length;
    if (currentUser?.email) {
      const emailLower = currentUser.email.toLowerCase().trim();
      serverRooms.forEach((sr) => {
        if (!localIds.has(sr.id) && sr.hostEmail && sr.hostEmail.toLowerCase().trim() === emailLower) {
          count++;
        }
      });
    }
    return count;
  }, [createdRooms, serverRooms, currentUser]);

  // Public parties (shown in Popular Right Now) strictly sorted by viewer count (descending)
  const publicParties = allWatchParties
    .filter((p) => !p.isPrivate)
    .sort((a, b) => (b.viewers || 0) - (a.viewers || 0));

  // Top 5 public parties for Popular Right Now (full list is on dedicated View All page)
  const displayedParties = publicParties.slice(0, 5);

  // How It Works Steps matching Image 1
  const steps = [
    {
      step: '01',
      title: 'Choose Your World',
      desc: 'Explore different worlds based on what you love.',
      type: 'num',
    },
    {
      step: '02',
      title: 'Create or Join a Party',
      desc: 'Start your own or join an active watch party.',
      type: 'users',
    },
    {
      step: '03',
      title: 'Watch Together',
      desc: 'Enjoy YouTube videos in real-time sync.',
      type: 'play',
    },
    {
      step: '04',
      title: 'Stay in Sync',
      desc: 'Play, pause, seek — everyone stays together.',
      type: 'users',
    },
  ];



  const scrollToSection = (id: string) => {
    sounds.playClick();
    isClickScrollingRef.current = true;
    setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 850);

    const el = document.getElementById(id);
    if (el) {
      const navOffset = 65;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleRoomClick = (roomId: string, title?: string, videoId?: string, isPrivate?: boolean) => {
    sounds.playTravelSwoosh();
    if (!currentUser) {
      setPendingAuthIntent({
        type: 'join',
        roomData: { roomId, title, videoId, isPrivate },
      });
      setIsAuthModalOpen(true);
      return;
    }
    if (onJoinRoom) {
      onJoinRoom(roomId, title, videoId, isPrivate);
    }
  };

  // Dedicated Full Page View: All Public Watch Parties
  if (isViewAllPageOpen) {
    return (
      <>
        <AllPublicPartiesPage
          initialDistrict={viewAllInitialDistrict}
          initialMyPartiesOnly={viewAllMyPartiesOnly}
          onBack={closeViewAllPage}
          onJoinRoom={(roomId, title, videoId, isPrivate) => {
            handleRoomClick(roomId, title, videoId, isPrivate);
          }}
          onOpenCreateModal={(district) => {
            handleCreateRoomClick(district);
          }}
          createdRooms={createdRooms}
          serverRooms={serverRooms}
          currentUser={currentUser}
          onOpenAuth={() => {
            setPendingAuthIntent(null);
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
          onDeleteRoom={handleDeleteRoom}
          onClearAllRooms={handleClearAllRooms}
        />

        {/* Create Party Modal can also be opened from All Public Rooms page */}
        <CreatePartyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialDistrict={modalDistrict}
          onCreated={async (partyData) => {
            setIsCreateModalOpen(false);

            const newPartyObj = {
              id: partyData.id,
              name: partyData.title,
              title: partyData.title,
              theme: partyData.theme.toLowerCase(),
              videoId: partyData.videoId,
              currentVideoId: partyData.videoId,
              isPrivate: partyData.isPrivate,
              hostName: currentUser ? currentUser.name : (localStorage.getItem('wr_explorer_name') || 'You (Host)'),
              hostEmail: currentUser?.email ? currentUser.email.toLowerCase().trim() : undefined,
              participantCount: 1,
              createdAt: Date.now(),
            };

            const updatedRooms = [
              newPartyObj,
              ...createdRooms.filter((r) => r.id !== partyData.id),
            ];
            setCreatedRooms(updatedRooms);
            try {
              localStorage.setItem('wr_created_rooms', JSON.stringify(updatedRooms));
            } catch (_) { }

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
                  hostName: currentUser ? currentUser.name : (localStorage.getItem('wr_explorer_name') || 'You (Host)'),
                  hostEmail: currentUser?.email ? currentUser.email.toLowerCase().trim() : undefined,
                }),
              });
            } catch (err) {
              console.warn('Could not persist room to server:', err);
            }

            handleRoomClick(
              partyData.id,
              partyData.title,
              partyData.videoId,
              partyData.isPrivate
            );
          }}
        />

        {/* Auth Modal with Background Artwork from E:\Project\WatchRealm\2.png */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          intentAction={pendingAuthIntent?.type}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#07050a] text-[#f5efe4] selection:bg-[#e8c27a] selection:text-black font-sans antialiased overflow-x-hidden relative">
      {/* Subtle Floating Return to Mode Selection */}
      <button
        onClick={() => {
          sounds.playTravelSwoosh();
          onReturnToRealm();
        }}
        className="fixed top-20 right-4 z-40 p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white/70 hover:text-[#e8c27a] backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105"
        title="Return to Realm Mode Selection"
      >
        <Compass className="w-4 h-4" />
      </button>

      {/* ============================================================== */}
      {/* A. NAVBAR (CONSISTENT ACROSS MAIN APP & EVERY GENRE)           */}
      {/* ============================================================== */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 sm:px-10 lg:px-12 py-3 sm:py-3.5 flex items-center justify-between bg-transparent border-0 select-none"
      >
        {/* Left: Brand Logo + Nav Links together */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Logo without Hat - Optical Center Alignment */}
          <div
            onClick={() => {
              setActiveNavSection('home');
              scrollToSection('home');
            }}
            className="cursor-pointer group flex items-center select-none py-1"
          >
            <span className="font-harry-potter text-xl sm:text-2xl tracking-wider text-[#e8c27a] group-hover:text-[#f3dbab] transition-colors drop-shadow-[0_2px_10px_rgba(232,194,122,0.35)] leading-none inline-flex items-center translate-y-[2px]">
              WatchRealm
            </span>
          </div>

          {/* Navigation Links - 4 Balanced Sections */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-medium">
            <button
              onClick={() => {
                setActiveNavSection('home');
                scrollToSection('home');
              }}
              className={`transition-colors cursor-pointer py-1 relative ${activeNavSection === 'home'
                ? 'text-[#e8c27a] font-semibold'
                : 'text-stone-300 hover:text-white'
                }`}
            >
              Home
              {activeNavSection === 'home' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#e8c27a] shadow-[0_0_8px_rgba(232,194,122,0.8)] rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveNavSection('worlds');
                scrollToSection('worlds');
              }}
              className={`transition-colors cursor-pointer py-1 relative ${activeNavSection === 'worlds'
                ? 'text-[#e8c27a] font-semibold'
                : 'text-stone-300 hover:text-white'
                }`}
            >
              Worlds
              {activeNavSection === 'worlds' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#e8c27a] shadow-[0_0_8px_rgba(232,194,122,0.8)] rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveNavSection('parties');
                scrollToSection('popular');
              }}
              className={`transition-colors cursor-pointer py-1 relative ${activeNavSection === 'parties'
                ? 'text-[#e8c27a] font-semibold'
                : 'text-stone-300 hover:text-white'
                }`}
            >
              Watch Parties
              {activeNavSection === 'parties' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#e8c27a] shadow-[0_0_8px_rgba(232,194,122,0.8)] rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveNavSection('how-it-works');
                scrollToSection('how-it-works');
              }}
              className={`transition-colors cursor-pointer py-1 relative ${activeNavSection === 'how-it-works'
                ? 'text-[#e8c27a] font-semibold'
                : 'text-stone-300 hover:text-white'
                }`}
            >
              How It Works
              {activeNavSection === 'how-it-works' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#e8c27a] shadow-[0_0_8px_rgba(232,194,122,0.8)] rounded-full" />
              )}
            </button>
          </nav>
        </div>

        {/* Right: Search + Create Room + Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Smart Search Bar — search public rooms OR join via invite link/code */}
          <div ref={searchBarRef} className="relative flex items-center">
            <Search
              className="w-3 h-3 absolute left-2.5 pointer-events-none z-10 transition-colors"
              style={{ color: searchOpen ? '#e8c27a' : 'rgba(255,255,255,0.4)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const cleaned = searchQuery.trim();
                  const isCode = /^[A-Za-z0-9_-]{5,30}$/.test(cleaned) && !cleaned.includes(' ');
                  const isLink = cleaned.includes('?room=') || cleaned.includes('/room/') || cleaned.includes('localhost');
                  if (isCode || isLink) {
                    // join by code/link
                    const roomId = (() => {
                      try { const u = new URL(cleaned.startsWith('http') ? cleaned : `http://x.com?${cleaned}`); return u.searchParams.get('room') || u.searchParams.get('roomId') || cleaned; } catch { return cleaned; }
                    })();
                    setSearchJoining(true);
                    fetch(`${BACKEND_URL}/api/rooms/${roomId}`)
                      .then(r => r.ok ? r.json() : null)
                      .then(data => {
                        const room = data?.room;
                        handleRoomClick(room?.id || roomId, room?.name, room?.videoId, room?.isPrivate);
                      })
                      .catch(() => handleRoomClick(roomId, undefined, undefined, undefined))
                      .finally(() => { setSearchJoining(false); setSearchQuery(''); setSearchOpen(false); });
                  } else if (cleaned) {
                    openViewAllPage();
                    setSearchOpen(false);
                  }
                }
                if (e.key === 'Escape') setSearchOpen(false);
              }}
              placeholder="Search rooms or paste invite link..."
              className="w-36 sm:w-56 lg:w-72 pl-7 pr-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#e8c27a]/60 hover:border-[#e8c27a]/50 transition-all"
            />

            {/* Dropdown */}
            {searchOpen && searchQuery.trim().length > 1 && (() => {
              const q = searchQuery.trim();
              const isCode = /^[A-Za-z0-9_-]{5,30}$/.test(q) && !q.includes(' ');
              const isLink = q.includes('?room=') || q.includes('/room/') || q.includes('localhost');
              const showInvite = q.length > 2 && (isCode || isLink);
              const results = !showInvite
                ? publicParties.filter(p =>
                    p.title.toLowerCase().includes(q.toLowerCase()) ||
                    (p.theme || '').toLowerCase().includes(q.toLowerCase())
                  ).slice(0, 6)
                : [];
              return (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0b08]/98 border border-[#e8c27a]/20 rounded-xl shadow-2xl overflow-hidden z-[999] backdrop-blur-xl" style={{ minWidth: '260px' }}>
                  {showInvite ? (
                    <button
                      onClick={() => {
                        const roomId = (() => { try { const u = new URL(q.startsWith('http') ? q : `http://x.com?${q}`); return u.searchParams.get('room') || u.searchParams.get('roomId') || q; } catch { return q; } })();
                        setSearchJoining(true);
                        fetch(`${BACKEND_URL}/api/rooms/${roomId}`)
                          .then(r => r.ok ? r.json() : null)
                          .then(data => { const room = data?.room; handleRoomClick(room?.id || roomId, room?.name, room?.videoId, room?.isPrivate); })
                          .catch(() => handleRoomClick(roomId, undefined, undefined, undefined))
                          .finally(() => { setSearchJoining(false); setSearchQuery(''); setSearchOpen(false); });
                      }}
                      disabled={searchJoining}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#e8c27a]/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#e8c27a]/15 border border-[#e8c27a]/30 flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="w-4 h-4 text-[#e8c27a]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#e8c27a]">{searchJoining ? 'Joining...' : 'Join via Invite'}</p>
                        <p className="text-[10px] text-white/50 truncate max-w-[200px]">{q}</p>
                      </div>
                    </button>
                  ) : results.length > 0 ? (
                    <>
                      <p className="text-[9px] uppercase tracking-widest text-white/30 px-4 pt-2.5 pb-1">Public Watch Parties</p>
                      {results.map(room => (
                        <button
                          key={room.id}
                          onClick={() => { handleRoomClick(room.id, room.title, room.videoId, false); setSearchOpen(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#e8c27a]/10 transition-colors text-left cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                            <img src={room.thumbnail} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">{room.title}</p>
                            <p className="text-[10px] text-white/40">{room.theme} · {room.viewers || 1} watching</p>
                          </div>
                        </button>
                      ))}
                      <button onClick={() => { openViewAllPage(); setSearchOpen(false); }} className="w-full px-4 py-2.5 text-[10px] text-[#e8c27a]/70 hover:text-[#e8c27a] border-t border-white/5 transition-colors text-left cursor-pointer">
                        View all results →
                      </button>
                    </>
                  ) : (
                    <div className="px-4 py-3 text-xs text-white/40 text-center">No parties found. Paste a room code or invite link to join directly.</div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* + Create Room Pill Button */}
          <button
            onClick={() => handleCreateRoomClick()}
            className="px-3 sm:px-3.5 py-1 rounded-full border border-[#e8c27a] text-[#e8c27a] hover:bg-[#e8c27a]/15 hover:text-[#ffe5a3] text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
          >
            <Plus className="w-3 h-3 text-[#e8c27a]" />
            <span>Create Room</span>
          </button>

          {/* Interactive User Avatar Menu with Popover */}
          <UserNavMenu
            currentUser={currentUser}
            onOpenAuth={() => {
              setPendingAuthIntent(null);
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            createdRoomsCount={userHostedCount}
            onOpenCreateRoom={() => handleCreateRoomClick()}
            onOpenMyParty={() => openViewAllPage('all', true)}
          />
        </div>
      </header>

      {/* ============================================================== */}
      {/* B. HERO SECTION — Layered Castle Glow System                   */}
      {/* ============================================================== */}
      <section
        id="home"
        className="relative w-full aspect-[16/9] min-h-[640px] max-h-[960px] flex flex-col justify-start overflow-hidden bg-[#07050a] select-none"
      >
        {/* ── UNIFIED HERO REVEAL WRAPPER ──────────────────────────────────────
             ALL images (background + castles) are inside this one div.
             It stays opacity:0 until every critical image fires onLoad,
             then fades to opacity:1 in one smooth motion — zero "paste" effect. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: heroReady ? 1 : 0,
            transition: heroReady ? 'opacity 0.65s ease' : 'none',
          }}
        >
          {/* 1. Base Hero Background */}
          <img
            src="/realm/normal-mode-heroSection.webp"
            alt="WatchRealm Floating Multiverse"
            className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={onHeroImageLoad}
          />

          {/* 2. Castle Hover Layers */}
          <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            aspectRatio: '16 / 9',
          }}
        >
          {(() => {
            // Castle definitions: image layers (visual only, pointer-events:none)
            // + separate hover-zone divs for accurate click/hover detection
            const castles = [
              {
                id: 'fantasy',
                src: '/realm/castle-fantasy.png',
                genre: 'fantasy',
                // Full PNG layer position
                style: { top: '2%', left: '24%', width: '34%' },
                // Narrow hover zone over actual visible castle structure
                zone: { top: '3%', left: '30%', width: '18%', height: '28%' },
                glow: 'drop-shadow(0 0 22px rgba(255,185,55,1)) drop-shadow(0 0 45px rgba(255,155,20,0.85)) drop-shadow(0 0 80px rgba(255,130,0,0.5)) brightness(1.4)',
                label: 'Fantasy Realm',
                emoji: '🏰',
              },
              {
                id: 'horror',
                src: '/realm/castle-horror.png',
                genre: 'horror',
                style: { top: '5%', left: '56.9%', width: '34%' },
                zone: { top: '2%', left: '64%', width: '16%', height: '24%' },
                glow: 'drop-shadow(0 0 22px rgba(255,20,20,1)) drop-shadow(0 0 45px rgba(200,0,0,0.9)) drop-shadow(0 0 80px rgba(160,0,0,0.55)) brightness(1.35)',
                label: 'Horror Realm',
                emoji: '💀',
              },
              {
                id: 'main',
                src: '/realm/center-castle.png',
                genre: null, // opens bottom card
                style: { top: '23%', left: '42%', width: '28%' },
                // Zone covers the full PNG visual area
                zone: { top: '23%', left: '42%', width: '28%', height: '44%' },
                glow: 'drop-shadow(0 0 30px rgba(255,210,90,1)) drop-shadow(0 0 60px rgba(232,194,122,0.9)) drop-shadow(0 0 100px rgba(200,160,60,0.6)) brightness(1.45)',
                label: 'WatchRealm Central',
                emoji: '⚡',
              },
              {
                id: 'scifi',
                src: '/realm/castle-scifi.png',
                genre: 'scifi',
                style: { top: '19%', left: '69.5%', width: '30%' },
                zone: { top: '20%', left: '73%', width: '18%', height: '26%' },
                // Reduced glow — was too intense
                glow: 'drop-shadow(0 0 16px rgba(0,190,255,0.8)) drop-shadow(0 0 35px rgba(60,120,255,0.6)) brightness(1.25)',
                label: 'Sci-Fi Realm',
                emoji: '🚀',
              },
              {
                id: 'anime',
                src: '/realm/castle-anime.png',
                genre: 'anime',
                style: { top: '28%', left: '1.5%', width: '34%' },
                zone: { top: '20%', left: '4%', width: '20%', height: '36%' },
                glow: 'drop-shadow(0 0 22px rgba(255,100,185,1)) drop-shadow(0 0 45px rgba(220,70,180,0.85)) drop-shadow(0 0 80px rgba(180,50,160,0.5)) brightness(1.4)',
                label: 'Anime Realm',
                emoji: '🌸',
              },
              {
                id: 'sports',
                src: '/realm/castle-sports.png',
                genre: 'sports',
                style: { top: '50%', left: '-3%', width: '58%' },
                zone: { top: '52%', left: '2%', width: '22%', height: '20%' },
                glow: 'drop-shadow(0 0 22px rgba(255,155,0,1)) drop-shadow(0 0 45px rgba(220,120,0,0.85)) drop-shadow(0 0 80px rgba(180,80,0,0.5)) brightness(1.4)',
                label: 'Sports Realm',
                emoji: '🏟️',
              },
              {
                id: 'music',
                src: '/realm/castle-music.png',
                genre: 'music',
                style: { top: '61%', left: '55%', width: '58%' },
                zone: { top: '63%', left: '62%', width: '22%', height: '20%' },
                glow: 'drop-shadow(0 0 22px rgba(185,0,255,1)) drop-shadow(0 0 45px rgba(140,0,220,0.85)) drop-shadow(0 0 80px rgba(100,0,180,0.5)) brightness(1.4)',
                label: 'Music Realm',
                emoji: '🎵',
              },
            ];

            return (
              <>
                {/* Image layers — visual only, NO pointer events */}
                {castles.map((castle) => {
                  const isHovered = hoveredCastle === castle.id;
                  const otherHovered = hoveredCastle !== null && !isHovered;
                  return (
                    <img
                      key={`img-${castle.id}`}
                      src={castle.src}
                      alt={castle.label}
                      draggable={false}
                      decoding="async"
                      loading={castle.id === 'sports' || castle.id === 'music' ? 'lazy' : 'eager'}
                      fetchPriority={
                        castle.id === 'fantasy' || castle.id === 'horror' || castle.id === 'main' || castle.id === 'scifi'
                          ? 'high' : 'auto'
                      }
                      className="absolute select-none"
                      style={{
                        top: castle.style.top,
                        left: castle.style.left,
                        width: castle.style.width,
                        height: 'auto',
                        pointerEvents: 'none',
                        zIndex: isHovered ? 7 : 4,
                        willChange: 'filter',
                        filter: isHovered
                          ? castle.glow
                          : otherHovered
                            ? 'brightness(0.6) saturate(0.55)'
                            : 'brightness(1) saturate(1)',
                        transition: 'filter 0.28s ease',
                      }}
                      onLoad={castle.id !== 'sports' && castle.id !== 'music' ? onHeroImageLoad : undefined}
                    />
                  );
                })}

                {/* Hit zones — invisible clickable overlays matching each castle's actual visible area */}
                {castles.map((castle) => {
                  const isHovered = hoveredCastle === castle.id;
                  return (
                    <div
                      key={`zone-${castle.id}`}
                      id={`castle-zone-${castle.id}`}
                      data-testid={`castle-${castle.id}`}
                      style={{
                        position: 'absolute',
                        top: castle.zone.top,
                        left: castle.zone.left,
                        width: castle.zone.width,
                        height: castle.zone.height,
                        zIndex: 15,
                        cursor: 'pointer',
                        borderRadius: '12px',
                        // Uncomment below to debug zone placement:
                        // background: 'rgba(255,0,0,0.2)',
                      }}
                      onMouseEnter={() => setHoveredCastle(castle.id)}
                      onMouseLeave={() => setHoveredCastle(null)}
                      onClick={() => {
                        if (castle.id === 'main') {
                          sounds.playClick();
                          setShowCentralCard((v) => !v);
                        } else {
                          // Open genre page — navigates to /?view=all-rooms&genre=<id>
                          const genreMap: Record<string, string> = {
                            fantasy: 'fantasy',
                            horror: 'horror',
                            scifi: 'scifi',
                            anime: 'anime',
                            sports: 'sports',
                            music: 'music',
                          };
                          openViewAllPage(genreMap[castle.id] ?? 'all');
                        }
                      }}
                    >
                      {/* Tooltip on hover — Harry Potter font, no emoji */}
                      {isHovered && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-36px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            zIndex: 30,
                            fontFamily: '"Harry Potter", "Cinzel", Georgia, serif',
                            fontSize: '13px',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            color: '#f5e8c0',
                            textShadow: '0 0 12px rgba(232,194,122,0.9), 0 2px 4px rgba(0,0,0,0.9)',
                            background: 'linear-gradient(135deg, rgba(10,8,5,0.92), rgba(20,15,8,0.88))',
                            border: '1px solid rgba(232,194,122,0.35)',
                            borderRadius: '8px',
                            padding: '4px 14px',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                          }}
                        >
                          {castle.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
        </div>
        {/* end castle + hero reveal wrapper */}


        {/* 3. Gradient Overlays */}
        {/* Left Dark Gradient for Typography */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07050a]/92 via-[#07050a]/40 via-48% to-transparent pointer-events-none z-10" />
        {/* Top Navbar Fade */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
        {/* Bottom Smooth Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-[#07050a] via-[#07050a]/60 to-transparent pointer-events-none z-10" />

        {/* 4. Hero Content — Left Side */}
        {/* IMPORTANT: outer div is pointer-events-none so castle hit zones work everywhere.
            Only the actual content box (max-w-md) has pointer-events-auto for buttons. */}
        <div className="relative z-20 pt-24 sm:pt-28 lg:pt-32 px-6 sm:px-10 lg:px-16 w-full flex justify-start" style={{ pointerEvents: 'none' }}>
          <div className="max-w-md lg:max-w-lg text-left" style={{ pointerEvents: 'auto' }}>
            <div className="text-[11px] font-bold tracking-[0.25em] text-[#e8c27a] uppercase mb-2">
              A UNIVERSE OF WATCH PARTIES
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[62px] font-bold text-[#f5efe4] leading-[1.08] tracking-tight drop-shadow-md mb-3">
              Different Worlds.
              <br />
              Same Screen.
            </h1>
            <p className="text-sm sm:text-base text-white/75 font-sans leading-relaxed max-w-md mb-6">
              Explore a living universe of watch parties.
              <br />
              Find your world. Invite your people. Watch together.
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={handleJoinHeroClick}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#f1d49a] via-[#d9a850] to-[#b9873a] hover:brightness-110 text-black font-bold text-xs sm:text-sm tracking-wide shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Join Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCreateRoomClick()}
                className="px-6 py-3 rounded-lg bg-black/45 hover:bg-black/70 border border-white/20 hover:border-[#e8c27a]/60 text-white font-medium text-xs sm:text-sm backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Create Room</span>
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* AURELION CHARACTER MODAL — opens on main castle click            */}
      {/* ============================================================== */}
      {showCentralCard && (
        <div
          id="aurelion-modal"
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ animation: 'aurelionBgFade 0.4s ease forwards', paddingTop: '10vh', paddingBottom: '0', paddingLeft: '1rem', paddingRight: '1rem', alignItems: 'flex-end' }}
          onClick={() => setShowCentralCard(false)}
        >
          {/* Dark cinematic backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

          {/* Floating golden ambient particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-[#e8c27a]"
                style={{
                  left: `${10 + i * 12}%`,
                  bottom: '0%',
                  opacity: 0,
                  animation: `particleRise ${2.5 + i * 0.3}s ${i * 0.2}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>

          {/* Main character card */}
          <div
            className="relative max-w-4xl w-full"
            style={{ animation: 'aurelionReveal 0.55s cubic-bezier(0.22,1,0.36,1) forwards' }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Character image with text overlay */}
            <div className="relative w-full drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
              <img
                src="/realm/character.png"
                alt="Aurelion, Realm Guardian"
                className="w-full h-auto select-none pointer-events-none"
                draggable={false}
                decoding="async"
              />

              {/* Text overlay: centered in full parchment (compass on right accounted for) */}
              {/* Parchment: 30%-97.5%, compass takes ~75-97.5% → text center at ~52% */}
              <div
                style={{
                  position: 'absolute',
                  top: '63%',
                  left: '30%',
                  width: '66%',        /* full parchment width */
                  height: '26%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                  paddingRight: '28%', /* push text left of compass rose */
                  paddingLeft: '3%',
                }}
              >
                <p
                  style={{
                    fontFamily: '"Cinzel", "Palatino Linotype", Georgia, serif',
                    color: '#1a0a02',
                    fontWeight: 700,
                    fontSize: 'clamp(8px, 1.3vw, 15px)',
                    lineHeight: 1.5,
                    textAlign: 'center',
                    letterSpacing: '0.03em',
                    margin: 0,
                    textShadow: '0 1px 0 rgba(255,240,200,0.4)',
                    width: '100%',
                  }}
                >
                  "Six realms await your gaze,
                  <br />
                  each a world unlike the rest."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

        @keyframes aurelionBgFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes aurelionReveal {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes particleRise {
          0%   { transform: translateY(0)    scale(1);   opacity: 0; }
          20%  { opacity: 0.7; }
          80%  { opacity: 0.3; }
          100% { transform: translateY(-80vh) scale(0.4); opacity: 0; }
        }
      `}</style>

      {/* ============================================================== */}
      {/* C. EXPLORE WORLDS ("Find Your World" - EXACT MATCH TO IMAGE)   */}
      {/* ============================================================== */}

      <section
        id="worlds"
        className="relative -mt-20 sm:-mt-28 lg:-mt-36 z-20 pt-8 pb-14 px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto w-full"
      >
        {/* Atmospheric Blending Backdrop — transparent top so hero bleeds in, solid warm base at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07050a]/70 via-35% to-[#07050a] pointer-events-none -z-10" />

        {/* Section Heading & Category Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-[0.25em] text-[#e8c27a] uppercase mb-1.5">
              EXPLORE WORLDS
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#f5efe4] tracking-tight leading-tight">
              Find Your World
            </h2>
            <p className="text-xs sm:text-sm text-white/65 mt-1.5 max-w-xl font-sans">
              From epic stories to everyday creators, there's a space for every kind of content.
            </p>
          </div>

          {/* Segmented Category Filter Tabs matching Screenshot */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-xs self-start md:self-auto shadow-lg">
            {(['All', 'Entertainment', 'Creator', 'Featured'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  sounds.playClick();
                  setActiveFilter(tab);
                }}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${activeFilter === tab
                  ? 'bg-[#f5c364] text-black font-bold shadow-md'
                  : 'text-white/70 hover:text-white'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* YouTube Video Genre World Cards Horizontal Carousel */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="flex items-center gap-3.5 overflow-x-auto scroll-smooth pb-2 pt-1 no-scrollbar select-none -mx-1 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredWorlds.map((world) => {
              return (
                <div
                  key={world.id}
                  onClick={() => handleGenreClick(world.id)}
                  className="group relative flex-none w-[205px] sm:w-[220px] aspect-[1.38/1] rounded-2xl overflow-hidden border border-white/10 hover:border-[#e8c27a]/70 bg-[#0c0905] shadow-xl hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer flex flex-col justify-end p-3"
                >
                  {/* World Card Thumbnail */}
                  <img
                    src={world.image}
                    alt={world.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 select-none"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent group-hover:via-black/45 transition-colors" />

                  {/* Bottom Metadata: Icon + Name + Viewer Count + Arrow */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 flex items-center justify-center">
                        {world.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs sm:text-sm text-white group-hover:text-[#e8c27a] transition-colors leading-tight truncate">
                          {world.name}
                        </span>
                        <span className="text-[10px] text-white/60 font-sans leading-tight mt-0.5 truncate">
                          {(() => {
                            const inGenre = allWatchParties.filter(
                              (p) => p.genre.toLowerCase() === world.id || p.genre.toLowerCase().includes(world.id)
                            );
                            const count = inGenre.reduce((sum, p) => sum + (p.viewers || 0), 0);
                            return count > 0 ? `👥 ${count} watching` : 'Explore World';
                          })()}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-[#e8c27a] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Harry Potter Style Carousel Arrow Controls (Placed Below Cards, NO CIRCLE) */}
          <div className="mt-5 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs text-white/50 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e8c27a] animate-pulse" />
              <span className="text-white/60">
                Explore <span className="text-[#e8c27a] font-medium">{filteredWorlds.length}</span> YouTube Realms
              </span>
            </div>

            <div className="flex items-center gap-6 sm:gap-8">
              <button
                onClick={() => scrollWorlds('left')}
                className="group flex items-center gap-2.5 text-[#e8c27a] hover:text-[#ffe5a3] cursor-pointer transition-all duration-300 active:scale-95 select-none"
                title="Scroll Left"
              >
                <HarryPotterArrow direction="left" className="w-11 h-6 group-hover:-translate-x-1" />
                <span className="font-harry-potter text-sm sm:text-base tracking-wider text-[#e8c27a] group-hover:text-[#ffe5a3] transition-colors">
                  Prev
                </span>
              </button>

              <div className="w-px h-4 bg-white/15" />

              <button
                onClick={() => scrollWorlds('right')}
                className="group flex items-center gap-2.5 text-[#e8c27a] hover:text-[#ffe5a3] cursor-pointer transition-all duration-300 active:scale-95 select-none"
                title="Scroll Right"
              >
                <span className="font-harry-potter text-sm sm:text-base tracking-wider text-[#e8c27a] group-hover:text-[#ffe5a3] transition-colors">
                  Next
                </span>
                <HarryPotterArrow direction="right" className="w-11 h-6 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* D. POPULAR RIGHT NOW (FEATURED WATCH PARTIES)                  */}
      {/* ============================================================== */}
      <section
        id="popular"
        className="py-12 px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto w-full border-t border-white/5 relative z-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-[0.25em] text-[#e8c27a] uppercase mb-1.5">
              FEATURED WATCH PARTIES
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#f5efe4] tracking-tight">
              Popular Right Now
            </h2>
          </div>

          {/* Harry Potter Style "View All" Button (Only text, no arrow) */}
          <button
            onClick={() => openViewAllPage()}
            className="group flex items-center text-[#e8c27a] hover:text-[#ffe5a3] cursor-pointer transition-all duration-300 active:scale-95 select-none self-start sm:self-auto"
            title="View All Public Watch Parties"
          >
            <span className="font-harry-potter text-xl sm:text-2xl tracking-wider text-[#e8c27a] group-hover:text-[#ffe5a3] transition-colors">
              View All
            </span>
          </button>
        </div>

        {/* Grid or Empty State */}
        {displayedParties.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl my-6 p-8 sm:p-10 text-center flex flex-col items-center justify-center border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] group transition-all duration-300">
            {/* Ambient Background Aura behind glass */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-b from-[#e8c27a]/20 via-[#99621e]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Frosted Castle Orb */}
            <div className="relative mb-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-white/15 to-white/5 border border-white/20 backdrop-blur-md flex items-center justify-center text-[#e8c27a] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_24px_rgba(232,194,122,0.25)] group-hover:scale-105 transition-transform duration-300">
                <CastleIcon className="w-7 h-7 text-[#e8c27a] drop-shadow-[0_2px_8px_rgba(232,194,122,0.5)]" />
              </div>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f7ebd4] to-[#e8c27a] mb-5 drop-shadow-sm">
              No Public Watch Parties Live
            </h3>

            <button
              onClick={() => handleCreateRoomClick()}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#f1d49a] via-[#e8c27a] to-[#d4af37] text-black text-xs font-bold shadow-[0_4px_24px_rgba(232,194,122,0.4)] hover:shadow-[0_4px_32px_rgba(232,194,122,0.65)] hover:brightness-110 active:scale-95 cursor-pointer transition-all flex items-center gap-1.5 z-10"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Watch Party</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {displayedParties.map((party) => (
              <div
                key={party.id}
                onClick={() => handleRoomClick(party.id, party.title, party.videoId, party.isPrivate)}
                className="group rounded-2xl overflow-hidden bg-[#0c0905] border border-[#e8c27a]/20 hover:border-[#e8c27a]/70 shadow-[0_4px_24px_rgba(0,0,0,0.7),0_0_0_1px_rgba(232,194,122,0.04)] hover:shadow-[0_8px_32px_rgba(232,194,122,0.15),0_0_0_1px_rgba(232,194,122,0.12)] transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                  <img
                    src={party.thumbnail}
                    alt={party.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${party.videoId || '1La4QzGeaaQ'}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                  />

                  {/* LIVE + Viewers Count Pills (Top-Left) */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600/95 text-[9px] font-bold uppercase tracking-wider text-white shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>LIVE</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white/95 backdrop-blur-md border border-white/15 shadow-sm">
                      <Users className="w-2.5 h-2.5 text-[#e8c27a]" />
                      <span>{party.viewers} watching</span>
                    </div>
                  </div>

                  {/* Public / Private Badge (Top-Right) */}
                  <div className="absolute top-2.5 right-2.5">
                    {party.isPrivate ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/25 backdrop-blur-md border border-amber-400/40 text-[9px] font-bold text-amber-300">
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

                {/* Room Metadata */}
                <div className="p-3 flex flex-col justify-between flex-1 bg-gradient-to-b from-[#130f08]/80 to-[#0c0905]">
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-[#f5efe4] line-clamp-1 group-hover:text-[#e8c27a] transition-colors mb-0.5">
                      {party.title}
                    </h3>
                    <div className="text-[11px] text-[#e8c27a]/50 mb-2.5">
                      {party.genre}
                    </div>
                  </div>

                  {/* Host Info + Join Arrow Circle */}
                  <div className="pt-2 border-t border-[#e8c27a]/10 flex items-center justify-between text-xs text-white/60">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserAvatar
                        name={party.hostName}
                        avatarId={party.isUserCreated ? myAvatarId : undefined}
                        size="xs"
                      />
                      <span className="text-[11px] truncate font-medium text-[#c9b48a]">
                        Hosted by {party.hostName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playClick();
                          if (window.confirm(`Delete watch party "${party.title}"?`)) {
                            handleDeleteRoom(party.id);
                          }
                        }}
                        className="p-1 rounded-md bg-red-500/15 hover:bg-red-500/35 text-red-300 hover:text-white border border-red-500/30 transition-all cursor-pointer opacity-80 hover:opacity-100"
                        title="Delete Party"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>

                      <div className="w-6 h-6 rounded-full bg-[#e8c27a]/10 group-hover:bg-[#e8c27a] group-hover:text-black flex items-center justify-center transition-colors shrink-0 border border-[#e8c27a]/20 group-hover:border-[#e8c27a]">
                        <ArrowRight className="w-3 h-3 text-[#e8c27a] group-hover:text-black group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* E. HOW IT WORKS ("Watch Together in 4 Simple Steps")           */}
      {/* ============================================================== */}
      <section
        id="how-it-works"
        className="py-10 sm:py-12 px-6 sm:px-10 lg:px-12 max-w-7xl mx-auto w-full border-t border-white/5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-[0.2em] text-[#e8c27a] uppercase mb-1.5">
              HOW IT WORKS
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#f5efe4] tracking-tight">
              Watch Together in 4 Simple Steps
            </h2>
          </div>

          <button
            onClick={() => scrollToSection('worlds')}
            className="self-start sm:self-auto text-xs sm:text-sm font-semibold text-white/70 hover:text-[#e8c27a] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Connected Step Nodes Matching Image 1 Horizontal Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-3">
          {steps.map((item, index) => (
            <div key={item.step} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                {/* Circular Icon Ring on Left */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/20 group-hover:border-[#e8c27a] flex items-center justify-center text-white/90 group-hover:text-[#e8c27a] transition-all bg-white/[0.04] shadow-md group-hover:scale-105 shrink-0">
                  {item.type === 'num' && (
                    <span className="font-serif text-sm font-bold text-white/90">{item.step}</span>
                  )}
                  {item.type === 'users' && (
                    <Users className="w-4.5 h-4.5 text-white/90" />
                  )}
                  {item.type === 'play' && (
                    <Play className="w-4.5 h-4.5 fill-current text-white/90 ml-0.5" />
                  )}
                </div>

                {/* Title & Description on Right */}
                <div className="min-w-0">
                  <h3 className="font-serif text-sm font-bold text-white group-hover:text-[#e8c27a] transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-white/60 leading-tight mt-0.5 max-w-[145px] sm:max-w-[160px]">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Connecting Arrow between steps in clear blue-grey */}
              {index < 3 && (
                <div className="hidden lg:flex items-center text-slate-400 pl-2">
                  <ArrowRight className="w-4 h-4 text-[#94a3b8] stroke-[2]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* F. CLOSING CTA BANNER (100% Full-Width Edge to Edge)           */}
      {/* ============================================================== */}
      <section className="w-full relative overflow-hidden border-t border-white/10 mt-6 sm:mt-8 mb-0 bg-[#05070d]">
        <div className="relative w-full aspect-[1907/247] min-h-[160px] sm:min-h-[190px] lg:min-h-[220px] flex items-center">
          {/* Master 100% Full Width Panoramic Artwork */}
          <img
            src="/assets/cta_master_panorama.png"
            alt="Ready to explore a new world together"
            className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
          />

          {/* Gentle Center Vignette for Text & Button Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-black/45 to-black/25 pointer-events-none" />

          {/* Content Layer Spanning Max-Width Container for Perfect Alignment */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 py-4">
            {/* Left Spacer so friends sitting on the cliff remain completely unobstructed */}
            <div className="hidden md:block w-1/4 lg:w-[28%]" />

            {/* Center Heading & Subtitle */}
            <div className="text-center md:text-left drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-medium text-[#f5efe4] tracking-tight leading-snug">
                Ready to explore
                <br className="hidden sm:block" />
                {' '}a new world together?
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-sans">
                Create your watch party and invite your people.
              </p>
            </div>

            {/* Right Button */}
            <div className="shrink-0 drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)]">
              <button
                onClick={() => {
                  sounds.playTravelSwoosh();
                  setIsCreateModalOpen(true);
                }}
                className="px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#f1d49a] via-[#e8c27a] to-[#d4af37] text-black font-semibold text-xs sm:text-sm tracking-wide shadow-[0_0_30px_rgba(232,194,122,0.45)] hover:brightness-110 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Create Watch Party</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* G. FOOTER (CLEAN, BORDERLESS SEAMLESS TRANSITION, REFINED)     */}
      {/* ============================================================== */}
      <footer className="w-full bg-[#030509] pt-6 sm:pt-8 pb-10 sm:pb-12 px-6 sm:px-10 lg:px-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10 lg:gap-16">
          {/* Logo & Tagline (Left side) */}
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <span className="font-harry-potter text-3xl sm:text-4xl tracking-wider text-[#e8c27a] drop-shadow-[0_2px_10px_rgba(232,194,122,0.3)] hover:text-[#f3dbab] transition-colors">
                WatchRealm
              </span>
            </div>
            <p className="text-xs text-white/50 font-serif italic tracking-wide mb-5">
              Different Worlds. Same Screen.
            </p>
            <p className="text-[11px] text-white/30 font-sans">
              © 2026 WatchRealm Inc. All rights reserved.
            </p>
          </div>

          {/* Navigation & Links Columns (Right side: 4 balanced columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 lg:gap-14 w-full md:w-auto">
            {/* Column 1: Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/90 mb-3.5">
                Product
              </h4>
              <ul className="space-y-2.5 text-white/60">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-[#e8c27a] transition-colors cursor-pointer">Home</button></li>
                <li><button onClick={() => scrollToSection('worlds')} className="hover:text-[#e8c27a] transition-colors cursor-pointer">Worlds</button></li>
                <li><button onClick={() => scrollToSection('popular')} className="hover:text-[#e8c27a] transition-colors cursor-pointer">Watch Parties</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#e8c27a] transition-colors cursor-pointer">How It Works</button></li>
              </ul>
            </div>

            {/* Column 2: Community */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/90 mb-3.5">
                Community
              </h4>
              <ul className="space-y-2.5 text-white/60">
                <li><button onClick={() => handleCreateRoomClick()} className="hover:text-[#e8c27a] transition-colors cursor-pointer">Create Party</button></li>
                <li><button onClick={handleJoinHeroClick} className="hover:text-[#e8c27a] transition-colors cursor-pointer">Join Room</button></li>
                <li><a href="#popular" className="hover:text-[#e8c27a] transition-colors">Creators</a></li>
                <li><a href="#worlds" className="hover:text-[#e8c27a] transition-colors">Explore</a></li>
              </ul>
            </div>

            {/* Column 3: Built By */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/90 mb-3.5">
                Built By
              </h4>
              <p className="text-[11px] text-white/55 font-sans leading-relaxed mb-2 max-w-[200px]">
                Built in 3-4 days as a company assignment. Given the opportunity to fully showcase my skills, I would build the complete Story Mode experience as well.
              </p>
              <a
                href="https://www.linkedin.com/in/md-shadan-siddiqui/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#e8c27a]/80 hover:text-[#e8c27a] transition-colors font-medium"
              >
                Md Shadan Siddiqui
              </a>
            </div>

            {/* Column 4: Stay Connected */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/90 mb-3.5">
                Stay Connected
              </h4>
              <div className="flex items-center gap-3.5 pt-0.5">
                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/in/md-shadan-siddiqui/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 -m-1 text-white/50 hover:text-[#e8c27a] hover:scale-115 transition-all cursor-pointer"
                  title="LinkedIn"
                >
                  <LinkedInIcon className="w-4 h-4" />
                </a>
                {/* X / Twitter */}
                <a
                  href="https://x.com/md_shadann"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 -m-1 text-white/50 hover:text-[#e8c27a] hover:scale-115 transition-all cursor-pointer"
                  title="X (Twitter)"
                >
                  <XSocialIcon className="w-3.5 h-3.5" />
                </a>
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/am_shadann/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 -m-1 text-white/50 hover:text-[#e8c27a] hover:scale-115 transition-all cursor-pointer"
                  title="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                {/* Email */}
                <a
                  href="mailto:shadanmd566@gmail.com"
                  className="p-1 -m-1 text-white/50 hover:text-[#e8c27a] hover:scale-115 transition-all cursor-pointer"
                  title="Email"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* MODAL: WATCH TRAILER VIDEO                                     */}
      {/* ============================================================== */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-3xl bg-[#0d0d12]/95 rounded-2xl overflow-hidden border border-[#e8c27a]/25 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 fill-[#e8c27a] text-[#e8c27a]" /> WatchRealm Experience Trailer
              </h3>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded-full text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black relative flex items-center justify-center">
              <img
                src="/realm/exact_hero_panorama.jpg"
                alt="Trailer Preview"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              <div className="relative z-10 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-[#e8c27a] text-black flex items-center justify-center mx-auto mb-3 shadow-xl">
                  <Play className="w-6 h-6 fill-black ml-1" />
                </div>
                <h4 className="font-serif text-xl font-bold text-white mb-1">
                  Living Universe Trailer
                </h4>
                <p className="text-xs text-white/70 max-w-sm">
                  Synchronized streaming across 6 distinct floating world districts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE WATCH PARTY ROOM                                 */}
      {/* ============================================================== */}
      <CreatePartyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialDistrict={modalDistrict}
        onCreated={async (partyData) => {
          setIsCreateModalOpen(false);

          // Construct persisted room object
          const newPartyObj = {
            id: partyData.id,
            name: partyData.title,
            title: partyData.title,
            theme: partyData.theme.toLowerCase(),
            videoId: partyData.videoId,
            currentVideoId: partyData.videoId,
            isPrivate: partyData.isPrivate,
            hostName: currentUser ? currentUser.name : (localStorage.getItem('wr_explorer_name') || 'You (Host)'),
            hostEmail: currentUser?.email ? currentUser.email.toLowerCase().trim() : undefined,
            participantCount: 1,
            createdAt: Date.now(),
          };

          // 1. Save permanently to localStorage
          const updatedRooms = [
            newPartyObj,
            ...createdRooms.filter((r) => r.id !== partyData.id),
          ];
          setCreatedRooms(updatedRooms);
          try {
            localStorage.setItem('wr_created_rooms', JSON.stringify(updatedRooms));
          } catch (_) { }

          // 2. Persist to backend server
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
                hostName: currentUser ? currentUser.name : (localStorage.getItem('wr_explorer_name') || 'You (Host)'),
                hostEmail: currentUser?.email ? currentUser.email.toLowerCase().trim() : undefined,
              }),
            });
          } catch (err) {
            console.warn('Could not persist room to server:', err);
          }

          // 3. Switch to room
          handleRoomClick(
            partyData.id,
            partyData.title,
            partyData.videoId,
            partyData.isPrivate
          );
        }}
      />

      {/* ============================================================== */}
      {/* MODAL: JOIN WATCH PARTY ROOM                                   */}
      {/* ============================================================== */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0d0d12]/95 rounded-3xl p-6 border border-[#e8c27a]/25 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-white">
                Join Watch Party
              </h3>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1 rounded-full text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1.5">
                  Room Code or Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. REALM-882 or https://..."
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#e8c27a] transition-colors"
                />
              </div>

              <button
                onClick={() => {
                  sounds.playTravelSwoosh();
                  setIsJoinModalOpen(false);
                  let cleanCode = joinRoomCode.trim();
                  if (cleanCode.includes('room=')) {
                    cleanCode = cleanCode.split('room=')[1].split('&')[0];
                  }
                  handleRoomClick(
                    cleanCode || 'public-lounge',
                    `Watch Party (${cleanCode || 'public-lounge'})`
                  );
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f1d49a] via-[#d9a850] to-[#b9873a] text-black font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 cursor-pointer mt-2 hover:brightness-110 transition-all"
              >
                Connect to Party →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal with Background Artwork from E:\Project\WatchRealm\2.png */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        intentAction={pendingAuthIntent?.type}
      />
    </div>
  );
};

export default NormalModeLandingPage;
