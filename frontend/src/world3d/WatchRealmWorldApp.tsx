import React, { useState, useEffect } from 'react';
import { WatchRealmCanvas } from './WatchRealmCanvas';
import { WorldHUD } from './WorldHUD';
import { MapModal } from '../components/MapModal';
import { NPCDialogueModal } from '../components/NPCDialogueModal';
import { CreatePartyModal } from '../components/CreatePartyModal';
import type { CameraMode } from './CameraController';
import { sounds } from '../audio/soundManager';
import { useWatchPartySocket } from '../hooks/useWatchPartySocket';

export interface WatchRealmWorldAppProps {
  onReturnIntro?: () => void;
  onJoinRoom?: (roomId: string, title?: string, videoId?: string, isPrivate?: boolean) => void;
}

export const WatchRealmWorldApp: React.FC<WatchRealmWorldAppProps> = ({
  onReturnIntro,
  onJoinRoom,
}) => {
  const [cameraMode, setCameraMode] = useState<CameraMode>('CINEMATIC_SCROLL');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 1.7, 18]);
  const [isInsideBuilding, setIsInsideBuilding] = useState<boolean>(false);
  const [isSeated, setIsSeated] = useState<boolean>(false);
  const [isCinema, setIsCinema] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Real-time WebSocket hook connected to backend
  const roomSocket = useWatchPartySocket('fantasy-pavilion', 'Explorer');

  // Modals
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isDialogueOpen, setIsDialogueOpen] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // 1. Scroll-driven camera descent when in CINEMATIC_SCROLL mode
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (cameraMode === 'CINEMATIC_SCROLL') {
        setScrollProgress((prev) => {
          const delta = e.deltaY * 0.0012;
          const next = Math.max(0, Math.min(1, prev + delta));
          if (next >= 0.98) {
            // Automatically hand off to First-Person Exploration at ground level
            sounds.playFootstep();
            setCameraMode('FPP_EXPLORATION');
          }
          return next;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [cameraMode]);

  // 2. Global Hotkeys (E, M, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.code === 'KeyM') {
        sounds.playMapOpen();
        setIsMapOpen((prev) => !prev);
      }

      if (e.code === 'Escape') {
        if (isSeated) {
          sounds.playStandUp();
          setIsSeated(false);
          setCameraMode('INSIDE_BUILDING');
        } else if (isInsideBuilding) {
          sounds.playEnterPortal();
          setIsInsideBuilding(false);
          setCameraMode('FPP_EXPLORATION');
        } else if (isMapOpen) {
          setIsMapOpen(false);
        } else if (isDialogueOpen) {
          setIsDialogueOpen(false);
        }
      }

      if (e.code === 'KeyE') {
        // Proximity checks based on playerPos
        if (!isInsideBuilding) {
          // Check proximity to Pavilion entrance at [0, 0, -53]
          const distToEntrance = Math.hypot(playerPos[0] - 0, playerPos[2] - (-53));
          // Check proximity to NPC at [-2.5, 0, -22]
          const distToNPC = Math.hypot(playerPos[0] - (-2.5), playerPos[2] - (-22));

          if (distToEntrance < 7.5) {
            handleEnterBuilding();
          } else if (distToNPC < 5.0) {
            sounds.playClick();
            setIsDialogueOpen(true);
          }
        } else {
          // Inside building: check proximity to empty seat at [0, 0, -68]
          const distToSeat = Math.hypot(playerPos[0] - 0, playerPos[2] - (-68));
          // Check proximity to door at [0, 0, -57]
          const distToDoor = Math.hypot(playerPos[0] - 0, playerPos[2] - (-57));

          if (!isSeated && distToSeat < 3.8) {
            sounds.playSitDown();
            setIsSeated(true);
            setCameraMode('SEATED_WATCHING');
          } else if (!isSeated && distToDoor < 4.5) {
            sounds.playEnterPortal();
            setIsInsideBuilding(false);
            setCameraMode('FPP_EXPLORATION');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, isInsideBuilding, isSeated, isMapOpen, isDialogueOpen]);

  // Handle entering exploration directly from intro
  const handleEnterExploration = () => {
    sounds.playTravelSwoosh();
    setScrollProgress(1);
    setCameraMode('FPP_EXPLORATION');
  };

  // Handle building transitions
  const handleEnterBuilding = () => {
    sounds.playEnterPortal();
    if (onJoinRoom) {
      onJoinRoom('fantasy-pavilion', 'The Elder Watch Pavilion (Eldoria)', roomSocket.currentVideoId);
    } else {
      setIsInsideBuilding(true);
      setCameraMode('INSIDE_BUILDING');
    }
  };

  const handleExitBuilding = () => {
    sounds.playEnterPortal();
    setIsInsideBuilding(false);
    setIsSeated(false);
    setCameraMode('FPP_EXPLORATION');
  };

  const handleToggleSit = () => {
    if (isSeated) {
      sounds.playStandUp();
      setIsSeated(false);
      setCameraMode('INSIDE_BUILDING');
    } else {
      sounds.playSitDown();
      setIsSeated(true);
      setCameraMode('SEATED_WATCHING');
    }
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060810] text-white select-none">
      {/* 1. Full-Screen WebGL Canvas */}
      <WatchRealmCanvas
        cameraMode={cameraMode}
        scrollProgress={scrollProgress}
        playerPos={playerPos}
        onPlayerPosChange={setPlayerPos}
        isInsideBuilding={isInsideBuilding}
        isSeated={isSeated}
        onEnterBuilding={handleEnterBuilding}
        onExitBuilding={handleExitBuilding}
        onToggleSit={handleToggleSit}
        onTalkNPC={() => setIsDialogueOpen(true)}
        onSelectDestination={(dest) => {
          if (onJoinRoom) {
            onJoinRoom(dest, `${dest.toUpperCase()} Watch Room`, roomSocket.currentVideoId);
          } else {
            handleEnterBuilding();
          }
        }}
        isMapOpen={isMapOpen}
        isDialogueOpen={isDialogueOpen}
        currentVideoId={roomSocket.currentVideoId}
        videoTitle={roomSocket.videoTitle}
        playState={roomSocket.playState}
        currentTime={roomSocket.currentTime}
      />

      {/* 2. Non-Intrusive HTML DOM Overlay HUD */}
      <WorldHUD
        cameraMode={cameraMode}
        scrollProgress={scrollProgress}
        playerPos={playerPos}
        isInsideBuilding={isInsideBuilding}
        isSeated={isSeated}
        onEnterExploration={handleEnterExploration}
        onOpenMap={() => setIsMapOpen(true)}
        onOpenCreate={() => setIsCreateOpen(true)}
        onReturnIntro={onReturnIntro}
        onStandUp={() => {
          sounds.playStandUp();
          setIsSeated(false);
          setCameraMode('INSIDE_BUILDING');
        }}
        onToggleCinema={() => setIsCinema(!isCinema)}
        isCinema={isCinema}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        roomSocket={roomSocket}
      />

      {/* 3. Global Interactive Modals */}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onFastTravel={(dest) => {
          setIsMapOpen(false);
          sounds.playTravelSwoosh();
          if (dest === 'fantasy') {
            handleEnterBuilding();
          } else if (onJoinRoom) {
            onJoinRoom(dest, `${dest.toUpperCase()} Watch Room`, roomSocket.currentVideoId);
          } else {
            setCameraMode('FPP_EXPLORATION');
          }
        }}
      />

      <NPCDialogueModal
        isOpen={isDialogueOpen}
        onClose={() => setIsDialogueOpen(false)}
        onEnterParty={() => {
          setIsDialogueOpen(false);
          sounds.playEnterPortal();
          if (onJoinRoom) {
            onJoinRoom('fantasy-pavilion', 'The Elder Watch Pavilion (Eldoria)', roomSocket.currentVideoId);
          } else {
            handleEnterBuilding();
          }
        }}
      />

      <CreatePartyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(data) => {
          setIsCreateOpen(false);
          sounds.playSyncChime();
          if (onJoinRoom) {
            onJoinRoom(data.code, data.title, data.videoUrl);
          } else {
            if (data.videoUrl) {
              roomSocket.changeVideo(data.videoUrl, data.title);
            }
            handleEnterBuilding();
          }
        }}
      />
    </div>
  );
};
