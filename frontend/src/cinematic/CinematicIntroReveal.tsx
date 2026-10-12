import React, { useState, useEffect } from 'react';
import { sounds } from '../audio/soundManager';
import { MapModal } from '../components/MapModal';

interface CinematicIntroRevealProps {
  onEnterRealm: () => void;
  onSelectMode?: (mode: 'STORY' | 'NORMAL') => void;
}

export const CinematicIntroReveal: React.FC<CinematicIntroRevealProps> = ({
  onEnterRealm,
  onSelectMode,
}) => {
  // Phase: 'LOADING' -> 'PARTING' -> 'REVEALED' -> 'MODE_SELECT'
  const [phase, setPhase] = useState<'LOADING' | 'PARTING' | 'REVEALED' | 'MODE_SELECT'>('LOADING');
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [showStoryVideo, setShowStoryVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  // True once ALL critical landing-page images have finished downloading
  const [imagesReady, setImagesReady] = useState(false);

  // ─── Asset Preload: loads ALL critical images then sets imagesReady ──────────
  // The loading bar won't reach 100% until Promise.all resolves, guaranteeing
  // images are in browser cache before the user ever reaches the landing page.
  useEffect(() => {
    // Cinematic scene assets (small, load fast)
    const cinematicSrcs = [
      '/realm/0.png',
      '/realm/revealed_kingdom.jpg',
      '/realm/balcony_terrace.jpg',
      '/assets/broom_rider.png',
      '/assets/enter_realm_button.png',
      '/assets/mode_story.png',
      '/assets/mode_normal.png',
    ];

    // Landing page images — ALL must be cached before loading bar hits 100%
    const landingSrcs = [
      '/realm/normal-mode-heroSection.webp',
      '/realm/castle-fantasy.png',
      '/realm/castle-horror.png',
      '/realm/center-castle.png',
      '/realm/castle-scifi.png',
      '/realm/castle-anime.png',
      '/realm/castle-sports.png',
      '/realm/castle-music.png',
      '/realm/character.png',
    ];

    // Inject <link rel="preload"> for highest browser fetch priority
    const injectPreloadLink = (href: string, as: string = 'image') => {
      if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = as;
      link.href = href;
      document.head.appendChild(link);
    };

    // Helper: returns a Promise that resolves when image is loaded (or errors)
    const loadImg = (src: string): Promise<void> =>
      new Promise((resolve) => {
        const probe = new Image();
        probe.src = src;
        // Already in cache — resolve immediately
        if (probe.complete && probe.naturalWidth > 0) { resolve(); return; }
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // don't block on missing assets
        img.src = src;
      });

    // Start cinematic assets loading (fire-and-forget, they're small)
    cinematicSrcs.forEach(src => { injectPreloadLink(src); loadImg(src); });

    // Load ALL landing page images — set imagesReady when every one is done
    landingSrcs.forEach(src => injectPreloadLink(src));
    Promise.all(landingSrcs.map(loadImg)).then(() => {
      setImagesReady(true);
    });

    // Story mode video: start buffering immediately
    const storyVideoSrc = '/story-mode-coming-soon.mp4';
    injectPreloadLink(storyVideoSrc, 'video');
    const hiddenVideo = document.createElement('video');
    hiddenVideo.src = storyVideoSrc;
    hiddenVideo.preload = 'auto';
    hiddenVideo.muted = true;
    hiddenVideo.style.display = 'none';
    document.body.appendChild(hiddenVideo);
    hiddenVideo.load();

    return () => {
      if (hiddenVideo.parentNode) hiddenVideo.parentNode.removeChild(hiddenVideo);
    };
  }, []);


  // Keyboard shortcut listener ('M' for World Map, 'Escape' to go back, 'Enter' to confirm)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        sounds.playMapOpen();
        setIsMapOpen((prev) => !prev);
      }
      if (e.key === 'Enter' && phase === 'REVEALED') {
        sounds.playTravelSwoosh();
        setPhase('MODE_SELECT');
      }
      if (e.key === 'Escape' && phase === 'MODE_SELECT') {
        sounds.playTravelSwoosh();
        setPhase('REVEALED');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  // Loading bar: runs cosmetically up to 92%, then WAITS for imagesReady
  // before jumping to 100%. This ties the "Enter Realm" reveal to actual
  // asset availability — guaranteed cache hit when user lands on main page.
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress((prev) => {
        // Cap at 92 until all images are loaded
        const ceiling = imagesReady ? 100 : 92;
        if (prev >= ceiling) {
          if (imagesReady) clearInterval(interval);
          return ceiling;
        }
        // Faster at start, slows near ceiling for cinematic feel
        const remaining = ceiling - prev;
        const step = remaining > 30 ? 3 : remaining > 10 ? 1.5 : 0.8;
        return Math.min(ceiling, prev + step + Math.random() * 0.5);
      });
    }, 40);

    return () => clearInterval(interval);
  }, [imagesReady]);

  // When images load mid-bar (past 92), immediately push to 100
  useEffect(() => {
    if (imagesReady && loadProgress >= 92) {
      setLoadProgress(100);
    }
  }, [imagesReady]);

  // When loading reaches 100%, trigger parting transition into the revealed screen
  useEffect(() => {
    if (loadProgress === 100 && phase === 'LOADING') {
      const timer = setTimeout(() => {
        triggerCloudParting();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [loadProgress, phase]);

  const triggerCloudParting = () => {
    sounds.playTravelSwoosh();
    setPhase('PARTING');

    // Parting duration: 1.6s
    setTimeout(() => {
      setPhase('REVEALED');
    }, 1600);
  };

  const handleModeChoose = (mode: 'STORY' | 'NORMAL') => {
    sounds.playTravelSwoosh();
    if (mode === 'STORY') {
      // Show the coming-soon video first, then proceed
      setShowStoryVideo(true);
      return;
    }
    if (onSelectMode) {
      onSelectMode(mode);
    }
    onEnterRealm();
  };

  const handleStoryVideoEnd = () => {
    // Video paused at last frame — just mark as ended, show Continue button
    setVideoEnded(true);
  };

  const handleContinueFromVideo = () => {
    setShowStoryVideo(false);
    setVideoEnded(false);
    if (onSelectMode) onSelectMode('STORY');
    onEnterRealm();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#04060c] text-white select-none">
      {/* ============================================================== */}
      {/* LAYER 0: SCENE 3 - BALCONY TERRACE (MODE SELECTION BACKGROUND)  */}
      {/* ============================================================== */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-out ${phase === 'MODE_SELECT'
            ? 'opacity-100 z-10'
            : 'opacity-0 pointer-events-none'
          }`}
      >
        <img
          src="/realm/balcony_terrace.jpg"
          alt="Citadel Balcony Terrace"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
        {/* Subtle cinematic atmosphere overlay */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* LAYER 1: SCENE 2 - THE CLEAN REVEALED KINGDOM PANORAMA         */}
      {/* ============================================================== */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-out ${phase === 'REVEALED'
            ? 'opacity-100'
            : phase === 'PARTING'
              ? 'opacity-100 filter blur-xs'
              : 'opacity-0 pointer-events-none'
          }`}
      >
        <img
          src="/realm/revealed_kingdom.jpg"
          alt="WatchRealm - Kingdom Revealed"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>

      {/* ============================================================== */}
      {/* LAYER 2: SCENE 0 - CLOUD VEIL (LOADING & PARTING CURTAINS)     */}
      {/* ============================================================== */}
      {phase !== 'REVEALED' && phase !== 'MODE_SELECT' && (
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
          {/* Center Cloud Background */}
          <div
            className={`absolute inset-0 transition-all duration-1500 ease-in-out ${phase === 'PARTING'
                ? 'scale-[2.2] opacity-0 filter blur-xl'
                : 'scale-100 opacity-100'
              }`}
          >
            <img
              src="/realm/0.png"
              alt="The Cloud Veil"
              className="w-full h-full object-cover select-none"
            />
          </div>

          {/* Left Cloud Curtain Parting */}
          <div
            className={`absolute top-0 bottom-0 left-0 w-[55%] transition-transform duration-1600 ease-in-out ${phase === 'PARTING' ? '-translate-x-[110%] -rotate-2' : 'translate-x-0'
              }`}
            style={{
              backgroundImage: 'url(/realm/0.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'left center',
              maskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
            }}
          />

          {/* Right Cloud Curtain Parting */}
          <div
            className={`absolute top-0 bottom-0 right-0 w-[55%] transition-transform duration-1600 ease-in-out ${phase === 'PARTING' ? 'translate-x-[110%] rotate-2' : 'translate-x-0'
              }`}
            style={{
              backgroundImage: 'url(/realm/0.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'right center',
              maskImage: 'linear-gradient(to left, black 65%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 65%, transparent 100%)',
            }}
          />

          {/* Center Light Flash */}
          <div
            className={`absolute inset-0 bg-white transition-opacity duration-1200 ${phase === 'PARTING' ? 'opacity-25' : 'opacity-0'
              }`}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* UI: SCREEN 1 - INITIAL LOADING STATE (MATCHING USER IMAGE 1)  */}
      {/* ============================================================== */}
      {phase === 'LOADING' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
          <div className="flex flex-col items-center w-full max-w-lg">
            {/* Harry Potter Typography Title - Refined, Sleek Cinematic Scale */}
            <h1 className="font-harry-potter text-5xl sm:text-6xl md:text-7xl text-white tracking-[0.08em] drop-shadow-[0_0_24px_rgba(186,230,253,0.65)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] select-none">
              WATCHREALM
            </h1>

            {/* Fine Silver Ornamental Divider Line with Central Diamond - Compact & Elegant */}
            <div className="flex items-center justify-center w-full max-w-[180px] sm:max-w-[220px] md:max-w-[240px] my-3 sm:my-4 opacity-80">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-sky-200/50 to-sky-100" />
              <div className="mx-2 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-100 drop-shadow-[0_0_6px_rgba(186,230,253,0.85)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {/* Central Diamond Star */}
                  <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
                  <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
                  {/* Subtle horizontal spur accents */}
                  <path d="M4 12L8 10.8V13.2Z" fill="#93c5fd" opacity="0.8" />
                  <path d="M20 12L16 10.8V13.2Z" fill="#93c5fd" opacity="0.8" />
                </svg>
              </div>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-sky-200/50 to-sky-100" />
            </div>

            {/* Fantasy Loading Bar - Sleek, Thin Razor-Sharp Track with Metallic End Caps */}
            <div className="relative flex items-center justify-center w-full max-w-[240px] sm:max-w-[290px] md:max-w-[330px]">
              {/* Left Silver Metallic End Cap */}
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 -mr-1 flex-shrink-0 text-slate-200 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] z-10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22 5L7 12L22 19L18 12L22 5Z" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="0.8" />
                <path d="M7 12L2 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <polygon points="12,9 15,12 12,15 9,12" fill="#ffffff" />
              </svg>

              {/* Main Bar Track with Dark Slate Fill (6px to 8px height) */}
              <div className="relative flex-1 h-1.5 sm:h-2 bg-[#060a12]/95 border-y border-sky-200/40 shadow-[0_0_16px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(0,0,0,0.8)] overflow-visible">
                {/* Glowing Cyan/Blue Progress Fill */}
                <div
                  className="h-full bg-gradient-to-r from-blue-700 via-sky-400 to-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.9),0_0_22px_rgba(56,189,248,0.5)] transition-all duration-200 ease-out relative"
                  style={{ width: `${loadProgress}%` }}
                >
                  {/* Diamond Star Sparkle at Progress Tip */}
                  {loadProgress > 2 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 pointer-events-none z-20">
                      <div className="absolute -inset-1.5 bg-cyan-300 rounded-full blur-[3px] animate-pulse opacity-90" />
                      <svg className="w-3 h-3 text-white drop-shadow-[0_0_6px_#ffffff]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8L10 0Z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Cloaked Character on Broomstick Flying Along the Top of the Bar */}
                <div
                  className="absolute -top-9 sm:-top-10 -translate-x-1/2 pointer-events-none transition-all duration-200 ease-out z-30"
                  style={{
                    left: `${Math.max(2, Math.min(98, loadProgress))}%`,
                  }}
                >
                  <img
                    src="/assets/broom_rider.png"
                    alt="Broomstick Rider"
                    className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]"
                    style={{
                      transform: `translateY(${Math.sin((loadProgress / 100) * Math.PI * 4) * 1.8}px)`,
                    }}
                  />
                </div>
              </div>

              {/* Right Silver Metallic End Cap */}
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 -ml-1 flex-shrink-0 text-slate-200 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] z-10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2 5L17 12L2 19L6 12L2 5Z" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="0.8" />
                <path d="M17 12L22 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <polygon points="12,9 15,12 12,15 9,12" fill="#ffffff" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* UI: SCREEN 2 - REVEALED KINGDOM & ORNATE "ENTER REALM" BUTTON  */}
      {/* ============================================================== */}
      {phase === 'REVEALED' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end items-center pb-[7vh] sm:pb-[9vh] md:pb-[10vh] pointer-events-none animate-fade-in">
          {/* Authentic Ornate Golden Button - Clicking Transitions to Mode Selection */}
          <button
            onClick={() => {
              sounds.playTravelSwoosh();
              setPhase('MODE_SELECT');
            }}
            className="pointer-events-auto cursor-pointer group focus:outline-none select-none transition-all duration-300 transform hover:scale-105 active:scale-95"
            aria-label="Enter Realm"
          >
            <img
              src="/assets/enter_realm_button.png"
              alt="Enter Realm"
              className="w-52 sm:w-60 md:w-64 lg:w-72 h-auto object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.95)] group-hover:drop-shadow-[0_0_28px_rgba(245,158,11,0.9)] transition-all duration-300"
            />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* UI: SCREEN 3 - MODE SELECTION (STORY MODE & NORMAL MODE)       */}
      {/* ============================================================== */}
      {phase === 'MODE_SELECT' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 pointer-events-auto animate-fade-in">
          {/* Subtle Top Back Button to Return to Cliff Panorama */}
          <button
            onClick={() => {
              sounds.playTravelSwoosh();
              setPhase('REVEALED');
            }}
            className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 hover:border-amber-400/40 text-xs font-serif tracking-widest text-amber-200/80 hover:text-amber-200 transition-all cursor-pointer backdrop-blur-md shadow-lg flex items-center gap-2 select-none"
          >
            <span>← BACK</span>
          </button>

          {/* The Two Ornate Mode Selection Cards Side-by-Side */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 md:gap-14 max-w-5xl w-full">
            {/* STORY MODE CARD */}
            <button
              onClick={() => handleModeChoose('STORY')}
              className="group relative cursor-pointer focus:outline-none select-none transition-all duration-300 transform hover:scale-105 active:scale-95"
              aria-label="Story Mode"
            >
              <img
                src="/assets/mode_story.png"
                alt="Story Mode"
                className="w-56 sm:w-64 md:w-72 lg:w-80 h-auto object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.95)] group-hover:drop-shadow-[0_0_38px_rgba(245,158,11,0.95)] transition-all duration-300"
              />
            </button>

            {/* NORMAL MODE CARD */}
            <div className="relative flex flex-col items-center">
              <button
                onClick={() => handleModeChoose('NORMAL')}
                className="group relative cursor-pointer focus:outline-none select-none transition-all duration-300 transform hover:scale-105 active:scale-95"
                aria-label="Normal Mode"
              >
                <img
                  src="/assets/mode_normal.png"
                  alt="Normal Mode"
                  className="w-56 sm:w-64 md:w-72 lg:w-80 h-auto object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.95)] group-hover:drop-shadow-[0_0_38px_rgba(186,230,253,0.95)] transition-all duration-300"
                />
              </button>
              {/* Preferred Badge */}
              <div
                className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full select-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(232,194,122,0.18), rgba(200,150,40,0.10))',
                  border: '1px solid rgba(232,194,122,0.45)',
                  boxShadow: '0 0 16px rgba(232,194,122,0.25)',
                  fontFamily: '"Cinzel", Georgia, serif',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  color: '#e8c27a',
                }}
              >
                <span style={{ fontSize: '10px' }}>★</span>
                <span>PREFERRED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* World Map Modal (toggleable via 'M' key) */}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onFastTravel={(_dest) => {
          setIsMapOpen(false);
          sounds.playTravelSwoosh();
          onEnterRealm();
        }}
      />

      {/* ============================================================== */}
      {/* STORY MODE — COMING SOON VIDEO OVERLAY                          */}
      {/* Pauses on last frame; user clicks Continue to proceed           */}
      {/* ============================================================== */}
      {showStoryVideo && (
        <div
          className="fixed inset-0 z-[999] bg-black flex items-center justify-center"
          style={{ animation: 'storyVideoFadeIn 0.5s ease forwards' }}
        >
          <video
            src="/story-mode-coming-soon.mp4"
            autoPlay
            playsInline
            onEnded={handleStoryVideoEnd}
            className="absolute inset-0 w-full h-full"
            style={{ display: 'block', objectFit: 'cover' }}
          />

          {/* Continue button — visible from start, disabled until video ends */}
          <button
            onClick={videoEnded ? handleContinueFromVideo : undefined}
            disabled={!videoEnded}
            className="absolute bottom-10 right-10 transition-all duration-500 select-none"
            style={{
              fontFamily: '"Harry Potter", "Cinzel", Georgia, serif',
              fontSize: 'clamp(14px, 2vw, 20px)',
              letterSpacing: '0.18em',
              color: videoEnded ? '#f5e8c0' : '#8a7a5a',
              textShadow: videoEnded
                ? '0 0 18px rgba(232,194,122,0.95), 0 0 40px rgba(200,150,50,0.6)'
                : 'none',
              background: videoEnded
                ? 'linear-gradient(135deg, rgba(8,6,3,0.94), rgba(18,14,6,0.90))'
                : 'rgba(8,6,3,0.60)',
              border: videoEnded
                ? '1px solid rgba(232,194,122,0.45)'
                : '1px solid rgba(140,120,70,0.2)',
              borderRadius: '10px',
              padding: '10px 28px',
              backdropFilter: 'blur(10px)',
              boxShadow: videoEnded
                ? '0 0 30px rgba(200,150,30,0.25), 0 8px 30px rgba(0,0,0,0.8)'
                : '0 4px 16px rgba(0,0,0,0.6)',
              cursor: videoEnded ? 'pointer' : 'not-allowed',
              opacity: videoEnded ? 1 : 0.45,
              transform: videoEnded ? 'scale(1)' : 'scale(0.97)',
            }}
          >
            {videoEnded ? 'Continue to Normal Mode →' : 'Continue to Normal Mode →'}
          </button>

          <style>{`
            @keyframes storyVideoFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
