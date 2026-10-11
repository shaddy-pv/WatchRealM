import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { CameraController, type CameraMode } from './CameraController';
import { RealmWorld } from './RealmWorld';

interface WatchRealmCanvasProps {
  cameraMode: CameraMode;
  scrollProgress: number;
  playerPos: [number, number, number];
  onPlayerPosChange: (pos: [number, number, number]) => void;
  isInsideBuilding: boolean;
  isSeated: boolean;
  onEnterBuilding: () => void;
  onExitBuilding: () => void;
  onToggleSit: () => void;
  onTalkNPC: () => void;
  onSelectDestination: (dest: string) => void;
  isMapOpen: boolean;
  isDialogueOpen: boolean;
  currentVideoId?: string;
  videoTitle?: string;
  playState?: 'PLAYING' | 'PAUSED';
  currentTime?: number;
}

export const WatchRealmCanvas: React.FC<WatchRealmCanvasProps> = ({
  cameraMode,
  scrollProgress,
  playerPos,
  onPlayerPosChange,
  isInsideBuilding,
  isSeated,
  onEnterBuilding,
  onExitBuilding,
  onToggleSit,
  onTalkNPC,
  onSelectDestination,
  isMapOpen,
  isDialogueOpen,
  currentVideoId,
  videoTitle,
  playState,
  currentTime,
}) => {
  return (
    <div className="absolute inset-0 w-full h-full select-none">
      <Canvas
        shadows
        camera={{ position: [0, 85, 120], fov: 65, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#060810');
          scene.fog = new THREE.FogExp2('#070a14', 0.012);
        }}
        onClick={(e) => {
          // If in exploration mode and not interacting with modal, lock pointer
          if (cameraMode === 'FPP_EXPLORATION' || cameraMode === 'INSIDE_BUILDING') {
            if (!isMapOpen && !isDialogueOpen) {
              e.currentTarget.requestPointerLock?.();
            }
          }
        }}
      >
        {/* Ambient & Directional Moonlight */}
        <ambientLight color="#1e2538" intensity={1.1} />
        <directionalLight
          position={[35, 70, 25]}
          color="#93c5fd"
          intensity={1.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={180}
          shadow-camera-left={-45}
          shadow-camera-right={45}
          shadow-camera-top={45}
          shadow-camera-bottom={-45}
        />

        {/* Dynamic Starry Sky */}
        <Stars radius={180} depth={50} count={2200} factor={4} saturation={0.5} fade speed={1.2} />

        {/* Real 3D Camera Controller */}
        <CameraController
          mode={cameraMode}
          scrollProgress={scrollProgress}
          onPlayerPosChange={onPlayerPosChange}
          isMapOpen={isMapOpen}
          isDialogueOpen={isDialogueOpen}
        />

        {/* Continuous 3D World */}
        <RealmWorld
          playerPos={playerPos}
          isInsideBuilding={isInsideBuilding}
          isSeated={isSeated}
          onEnterBuilding={onEnterBuilding}
          onExitBuilding={onExitBuilding}
          onToggleSit={onToggleSit}
          onTalkNPC={onTalkNPC}
          onSelectDestination={onSelectDestination}
          currentVideoId={currentVideoId}
          videoTitle={videoTitle}
          playState={playState}
          currentTime={currentTime}
        />
      </Canvas>
    </div>
  );
};
