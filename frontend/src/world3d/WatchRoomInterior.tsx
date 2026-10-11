import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { sounds } from '../audio/soundManager';

interface WatchRoomInteriorProps {
  onExitRoom: () => void;
  isSeated: boolean;
  onToggleSit: () => void;
  playerPos: [number, number, number];
  currentVideoId?: string;
  videoTitle?: string;
  playState?: 'PLAYING' | 'PAUSED';
  currentTime?: number;
  participantsList?: Array<{ name: string; role: 'HOST' | 'MODERATOR' | 'PARTICIPANT'; color?: string }>;
}

interface SeatedAvatarProps {
  position: [number, number, number];
  color: string;
  role?: 'HOST' | 'MODERATOR' | 'PARTICIPANT';
  name: string;
}

const SeatedAvatar: React.FC<SeatedAvatarProps> = ({ position, color, role, name }) => {
  return (
    <group position={position}>
      {/* Chair / Cushion */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.45, 0.9]} />
        <meshStandardMaterial color="#3b2416" roughness={0.8} />
      </mesh>
      {/* Chair Backrest */}
      <mesh position={[0, 0.85, 0.4]} castShadow>
        <boxGeometry args={[0.9, 0.8, 0.1]} />
        <meshStandardMaterial color="#3b2416" roughness={0.8} />
      </mesh>

      {/* Avatar Torso (Seated) */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.32, 0.8, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      {/* Avatar Head */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#e0c0a0" roughness={0.5} />
      </mesh>

      {/* Role Badge floating over avatar */}
      <Html position={[0, 1.85, 0]} center distanceFactor={8} pointerEvents="none">
        <div className="px-2 py-0.5 rounded-full bg-black/85 border border-white/20 text-[9px] font-bold text-white whitespace-nowrap shadow-md flex items-center gap-1">
          {role === 'HOST' && <span className="text-amber-400 flex items-center gap-1"><span className="text-[7px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded border border-amber-500/40 font-mono">HOST</span> {name}</span>}
          {role === 'MODERATOR' && <span className="text-cyan-400 flex items-center gap-1"><span className="text-[7px] bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/40 font-mono">MOD</span> {name}</span>}
          {(!role || role === 'PARTICIPANT') && <span className="text-white/70 flex items-center gap-1"><span className="text-[7px] bg-white/10 text-white/60 px-1 py-0.5 rounded border border-white/20 font-mono">VIEWER</span> {name}</span>}
        </div>
      </Html>
    </group>
  );
};

export const WatchRoomInterior: React.FC<WatchRoomInteriorProps> = ({
  onExitRoom,
  isSeated,
  onToggleSit,
  playerPos,
  currentVideoId = 'jfKfPfyJRdk',
  videoTitle = 'The Fellowship Watch Party',
  playState = 'PLAYING',
  currentTime: _currentTime = 0,
}) => {
  const [hoverEmptySeat, setHoverEmptySeat] = useState(false);

  // Distance from player to the empty seat at [0, 0, -3]
  const distToSeat = Math.hypot(playerPos[0] - 0, playerPos[2] - (-3));
  const isNearSeat = distToSeat < 3.8;

  // Distance to the door at [0, 0, 8]
  const distToDoor = Math.hypot(playerPos[0] - 0, playerPos[2] - 8);
  const isNearDoor = distToDoor < 4.2;

  return (
    <group position={[0, 0, -65]}>
      {/* 1. Room Floor */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[13, 13, 0.2, 32]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.8} />
      </mesh>

      {/* 2. Room Ceiling Dome */}
      <mesh position={[0, 7.5, 0]}>
        <sphereGeometry args={[13.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#12141c" side={1} roughness={0.9} />
      </mesh>

      {/* 3. Ambient Torches on Walls */}
      <pointLight position={[-9, 4, -4]} color="#ffb74d" intensity={2} distance={15} decay={2} />
      <pointLight position={[9, 4, -4]} color="#ffb74d" intensity={2} distance={15} decay={2} />
      <pointLight position={[0, 5, 6]} color="#ffb74d" intensity={1.8} distance={14} decay={2} />

      {/* 4. Giant Cinema Screen Frame facing the seats */}
      <group position={[0, 4.5, -9]}>
        {/* Frame Outer Bezel */}
        <mesh castShadow>
          <boxGeometry args={[12.4, 7.2, 0.3]} />
          <meshStandardMaterial color="#0a0c12" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Screen Display Surface */}
        <mesh position={[0, 0, 0.18]}>
          <planeGeometry args={[11.8, 6.6]} />
          <meshBasicMaterial color="#050608" />
        </mesh>

        {/* 3D In-World Screen Projection */}
        <Html
          transform
          position={[0, 0, 0.2]}
          distanceFactor={5.6}
          style={{ width: '960px', height: '540px' }}
        >
          <div className="w-[960px] h-[540px] bg-black rounded-lg overflow-hidden border border-white/20 shadow-2xl relative select-none">
            <iframe
              src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=1&controls=0&enablejsapi=1&rel=0`}
              title="3D Cinema Screen"
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            <div className="absolute top-3 left-4 px-3 py-1 bg-black/85 backdrop-blur-md rounded-full border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE CINEMA // {videoTitle}</span>
            </div>
            {playState === 'PAUSED' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <div className="px-4 py-2 rounded-xl bg-black/80 border border-white/20 text-white font-mono text-sm tracking-wider uppercase">
                  PAUSED BY HOST
                </div>
              </div>
            )}
          </div>
        </Html>

        {/* Ambient Backlight casting glow into room */}
        <pointLight position={[0, 0, 1]} color="#8b5cf6" intensity={3.5} distance={20} decay={2} />
      </group>

      {/* 5. Seated Avatars (The Audience) */}
      <SeatedAvatar position={[-2.4, 0, -3.2]} color="#1e3a8a" role="HOST" name="Shadan" />
      <SeatedAvatar position={[2.4, 0, -3.2]} color="#065f46" role="MODERATOR" name="Rahul" />
      <SeatedAvatar position={[-4.5, 0, -1.8]} color="#374151" role="PARTICIPANT" name="Aryan" />
      <SeatedAvatar position={[4.5, 0, -1.8]} color="#374151" role="PARTICIPANT" name="Aman" />
      <SeatedAvatar position={[-2.2, 0, 0]} color="#374151" role="PARTICIPANT" name="Kavya" />
      <SeatedAvatar position={[2.2, 0, 0]} color="#374151" role="PARTICIPANT" name="Ritik" />

      {/* 6. The Empty Seat (Clickable / Proximity Interactive) at [0, 0, -3] */}
      <group
        position={[0, 0, -3]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoverEmptySeat(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoverEmptySeat(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          sounds.playSitDown();
          onToggleSit();
        }}
      >
        {/* Chair Mesh */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.45, 0.9]} />
          <meshStandardMaterial
            color={hoverEmptySeat ? '#b45309' : '#3b2416'}
            emissive={hoverEmptySeat ? '#f59e0b' : '#000000'}
            emissiveIntensity={hoverEmptySeat ? 0.35 : 0}
            roughness={0.7}
          />
        </mesh>
        <mesh position={[0, 0.85, 0.4]} castShadow>
          <boxGeometry args={[0.9, 0.8, 0.1]} />
          <meshStandardMaterial
            color={hoverEmptySeat ? '#b45309' : '#3b2416'}
            roughness={0.7}
          />
        </mesh>

        {/* Empty Seat Marker Beacon */}
        {!isSeated && (
          <mesh position={[0, 0.6, 0]}>
            <ringGeometry args={[0.4, 0.48, 24]} />
            <meshBasicMaterial color="#f59e0b" side={2} />
          </mesh>
        )}

        {/* Proximity [E] SIT Prompt */}
        {!isSeated && (isNearSeat || hoverEmptySeat) && (
          <Html position={[0, 1.2, 0]} center distanceFactor={7}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                sounds.playSitDown();
                onToggleSit();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase shadow-2xl flex items-center gap-1.5 cursor-pointer animate-bounce select-none"
            >
              <span className="px-1.5 py-0.5 rounded bg-black text-amber-400 text-[10px]">E</span>
              <span>Sit Down & Watch</span>
            </div>
          </Html>
        )}
      </group>

      {/* 7. Exit Door at [0, 0, 8] */}
      <group position={[0, 0, 8]}>
        <mesh position={[-2.8, 2.5, 0]}>
          <boxGeometry args={[0.5, 5, 0.5]} />
          <meshStandardMaterial color="#2b1a10" />
        </mesh>
        <mesh position={[2.8, 2.5, 0]}>
          <boxGeometry args={[0.5, 5, 0.5]} />
          <meshStandardMaterial color="#2b1a10" />
        </mesh>
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[6.1, 0.5, 0.5]} />
          <meshStandardMaterial color="#2b1a10" />
        </mesh>

        {/* Exit Doorway Prompt */}
        {!isSeated && isNearDoor && (
          <Html position={[0, 2.5, 0]} center distanceFactor={8}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                sounds.playEnterPortal();
                onExitRoom();
              }}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl select-none"
            >
              <span className="px-1.5 py-0.5 rounded bg-white text-black text-[10px]">E</span>
              <span>Exit to Realm</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};
