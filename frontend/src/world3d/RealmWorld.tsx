import React from 'react';
import * as THREE from 'three';
import { CrossroadSign } from './CrossroadSign';
import { GuideNPC } from './GuideNPC';
import { FantasyPavilion } from './FantasyPavilion';
import { WatchRoomInterior } from './WatchRoomInterior';
import { createCobblestoneTexture } from '../three/textureGenerator';

interface RealmWorldProps {
  playerPos: [number, number, number];
  isInsideBuilding: boolean;
  isSeated: boolean;
  onEnterBuilding: () => void;
  onExitBuilding: () => void;
  onToggleSit: () => void;
  onTalkNPC: () => void;
  onSelectDestination: (dest: string) => void;
  currentVideoId?: string;
  videoTitle?: string;
  playState?: 'PLAYING' | 'PAUSED';
  currentTime?: number;
}

export const RealmWorld: React.FC<RealmWorldProps> = ({
  playerPos,
  isInsideBuilding,
  isSeated,
  onEnterBuilding,
  onExitBuilding,
  onToggleSit,
  onTalkNPC,
  onSelectDestination,
  currentVideoId,
  videoTitle,
  playState,
  currentTime,
}) => {
  // Cobblestone texture for roads & plazas
  const cobbleTex = React.useMemo(() => {
    const tex = createCobblestoneTexture();
    tex.repeat.set(6, 6);
    return tex;
  }, []);

  const roadTex = React.useMemo(() => {
    const tex = createCobblestoneTexture();
    tex.repeat.set(3, 30);
    return tex;
  }, []);

  // Distance from player to NPC at [-2, 0, -22]
  const distToNPC = Math.hypot(playerPos[0] - (-2), playerPos[2] - (-22));
  // Distance from player to Pavilion entrance at [0, 0, -53]
  const distToPavilion = Math.hypot(playerPos[0] - 0, playerPos[2] - (-53));

  return (
    <group>
      {/* ============================================================== */}
      {/* 1. TERRAIN & NATURAL GROUND                                     */}
      {/* ============================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[350, 350, 48, 48]} />
        <meshStandardMaterial color="#0e131d" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* ============================================================== */}
      {/* 2. DISTANT BACKGROUND LANDMARKS (CASTLE & MOUNTAINS)            */}
      {/* ============================================================== */}
      {/* North Mountain Cliff & Distant Castle */}
      <group position={[0, 18, -130]}>
        {/* Mountain Base */}
        <mesh castShadow receiveShadow>
          <coneGeometry args={[45, 35, 7]} />
          <meshStandardMaterial color="#141824" roughness={0.9} />
        </mesh>
        {/* Distant Castle Silhouette Mesh */}
        <group position={[0, 22, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[4, 5, 12, 8]} />
            <meshStandardMaterial color="#1a2030" roughness={0.8} />
          </mesh>
          <mesh position={[-5, 4, 0]} castShadow>
            <cylinderGeometry args={[2, 2.5, 16, 8]} />
            <meshStandardMaterial color="#1a2030" roughness={0.8} />
          </mesh>
          <mesh position={[5, 4, 0]} castShadow>
            <cylinderGeometry args={[2, 2.5, 16, 8]} />
            <meshStandardMaterial color="#1a2030" roughness={0.8} />
          </mesh>
          {/* Glowing Castle Windows */}
          <pointLight position={[0, 4, 3]} color="#ffb74d" intensity={2} distance={30} decay={2} />
        </group>
      </group>

      {/* East Landmark: Sci-Fi Sky Towers */}
      <group position={[85, 0, -22]}>
        <mesh castShadow>
          <cylinderGeometry args={[3, 5, 45, 8]} />
          <meshStandardMaterial color="#09182a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 25, 0]}>
          <torusGeometry args={[8, 0.4, 8, 32]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        <pointLight position={[0, 25, 0]} color="#00f0ff" intensity={3} distance={40} decay={2} />
      </group>

      {/* West Landmark: Anime Village Pagoda & Torii Gate */}
      <group position={[-85, 0, -22]}>
        <mesh position={[0, 12, 0]} castShadow>
          <coneGeometry args={[9, 16, 4]} />
          <meshStandardMaterial color="#3b1d1d" roughness={0.8} />
        </mesh>
        {/* Glowing Lanterns */}
        <pointLight position={[0, 8, 0]} color="#ec4899" intensity={2.5} distance={35} decay={2} />
      </group>

      {/* ============================================================== */}
      {/* 3. CENTRAL WATCHREALM PLAZA (SPAWN AREA at z = 18)              */}
      {/* ============================================================== */}
      <group position={[0, 0, 18]}>
        {/* Circular Stone Platform */}
        <mesh position={[0, 0.25, 0]} receiveShadow>
          <cylinderGeometry args={[16, 16.5, 0.5, 36]} />
          <meshStandardMaterial map={cobbleTex} roughness={0.75} />
        </mesh>

        {/* Outer Rune Ring */}
        <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[15.6, 16.2, 48]} />
          <meshBasicMaterial color="#a855f7" side={THREE.DoubleSide} />
        </mesh>

        {/* Central Monolith Spire Monument */}
        <group position={[0, 0, 0]}>
          {/* Base Pedestal */}
          <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.6, 2.4, 2.4, 8]} />
            <meshStandardMaterial color="#212638" roughness={0.7} />
          </mesh>

          {/* Floating Energy Crystal */}
          <mesh position={[0, 4.8, 0]} castShadow>
            <octahedronGeometry args={[1.8, 0]} />
            <meshStandardMaterial
              color="#9333ea"
              emissive="#7e22ce"
              emissiveIntensity={1.2}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>

          {/* Vertical Light Beacon */}
          <mesh position={[0, 22, 0]}>
            <cylinderGeometry args={[0.6, 1.8, 42, 16, 1, true]} />
            <meshBasicMaterial
              color="#a855f7"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Beacon Point Light */}
          <pointLight position={[0, 5, 0]} color="#c084fc" intensity={4} distance={35} decay={2} />
        </group>
      </group>

      {/* ============================================================== */}
      {/* 4. MAIN COBBLESTONE ROAD (From Plaza z=18 to Crossroads z=-22) */}
      {/* ============================================================== */}
      <mesh position={[0, 0.26, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.5, 42]} />
        <meshStandardMaterial map={roadTex} roughness={0.8} />
      </mesh>

      {/* Street Lamps along the main road */}
      {[
        [-4.2, 10], [4.2, 10],
        [-4.2, -4], [4.2, -4],
        [-4.2, -18], [4.2, -18],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 3.6, 8]} />
            <meshStandardMaterial color="#1e1e28" roughness={0.6} />
          </mesh>
          <mesh position={[0, 3.7, 0]} castShadow>
            <boxGeometry args={[0.35, 0.45, 0.35]} />
            <meshStandardMaterial color="#ffb74d" emissive="#ffa000" emissiveIntensity={1.4} />
          </mesh>
          <pointLight position={[0, 3.7, 0]} color="#ffa000" intensity={1.4} distance={11} decay={2} />
        </group>
      ))}

      {/* Pine Trees along forest borders */}
      {[
        [-12, 12], [12, 12],
        [-13, -2], [13, -2],
        [-11, -16], [11, -16],
        [-12, -32], [12, -32],
        [-11, -48], [11, -48],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Trunk */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 2.4, 6]} />
            <meshStandardMaterial color="#2d1c13" roughness={0.9} />
          </mesh>
          {/* Foliage */}
          <mesh position={[0, 3.8, 0]} castShadow>
            <coneGeometry args={[2.2, 4.2, 7]} />
            <meshStandardMaterial color="#14261c" roughness={0.9} />
          </mesh>
          <mesh position={[0, 5.8, 0]} castShadow>
            <coneGeometry args={[1.6, 3.2, 7]} />
            <meshStandardMaterial color="#172e22" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* 5. THE CROSSROADS (at z = -22)                                  */}
      {/* ============================================================== */}
      <group position={[0, 0, -22]}>
        {/* Crossroads Stone Circle */}
        <mesh position={[0, 0.25, 0]} receiveShadow>
          <cylinderGeometry args={[9, 9.5, 0.5, 32]} />
          <meshStandardMaterial map={cobbleTex} roughness={0.8} />
        </mesh>

        {/* 3D Wooden Directional Signpost */}
        <CrossroadSign
          position={[2.5, 0, 0]}
          onSelectDestination={onSelectDestination}
        />

        {/* 3D Guide NPC Eldrin the Wayfinder */}
        <GuideNPC
          position={[-2.5, 0, 0]}
          onTalk={onTalkNPC}
          playerDistance={distToNPC}
        />
      </group>

      {/* ============================================================== */}
      {/* 6. NORTH ROAD TO FANTASY PAVILION (z = -22 to z = -60)          */}
      {/* ============================================================== */}
      <mesh position={[0, 0.26, -42]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.5, 38]} />
        <meshStandardMaterial map={roadTex} roughness={0.8} />
      </mesh>

      {/* ============================================================== */}
      {/* 7. THE FANTASY WATCH PAVILION BUILDING (at z = -65)             */}
      {/* ============================================================== */}
      {!isInsideBuilding ? (
        <FantasyPavilion
          position={[0, 0, -65]}
          onEnter={onEnterBuilding}
          playerDistance={distToPavilion}
        />
      ) : (
        <WatchRoomInterior
          onExitRoom={onExitBuilding}
          isSeated={isSeated}
          onToggleSit={onToggleSit}
          playerPos={playerPos}
          currentVideoId={currentVideoId}
          videoTitle={videoTitle}
          playState={playState}
          currentTime={currentTime}
        />
      )}
    </group>
  );
};
