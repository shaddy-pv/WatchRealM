import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { sounds } from '../audio/soundManager';

interface FantasyPavilionProps {
  position: [number, number, number];
  onEnter: () => void;
  playerDistance: number;
}

export const FantasyPavilion: React.FC<FantasyPavilionProps> = ({ position, onEnter, playerDistance }) => {
  const [hovered, setHovered] = useState(false);
  const isNear = playerDistance < 7.5;

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        sounds.playEnterPortal();
        onEnter();
      }}
    >
      {/* Stone Foundation Base */}
      <mesh position={[0, 0.4, 0]} receiveShadow>
        <cylinderGeometry args={[14, 14.5, 0.8, 24]} />
        <meshStandardMaterial
          color={hovered ? '#3a3f50' : '#282d3b'}
          roughness={0.8}
        />
      </mesh>

      {/* Main Pavilion Roof Canopy */}
      <mesh position={[0, 8.5, 0]} castShadow>
        <coneGeometry args={[13.5, 7.5, 12]} />
        <meshStandardMaterial
          color={hovered ? '#312552' : '#241b3d'}
          roughness={0.7}
          emissive={hovered ? '#4c1d95' : '#000000'}
          emissiveIntensity={hovered ? 0.25 : 0}
        />
      </mesh>

      {/* Roof Spire Finial */}
      <mesh position={[0, 13, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.4, 2.2, 8]} />
        <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Timber Support Pillars */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        // Leave front entrance clear
        if (Math.abs(angle - Math.PI / 2) < 0.35) return null;
        const x = Math.cos(angle) * 11;
        const z = Math.sin(angle) * 11;
        return (
          <mesh key={i} position={[x, 3.8, z]} castShadow>
            <cylinderGeometry args={[0.35, 0.4, 6.8, 8]} />
            <meshStandardMaterial color="#2b1a10" roughness={0.8} />
          </mesh>
        );
      })}

      {/* Front Entrance Archway Beams */}
      <mesh position={[-4.2, 3.8, 11]} castShadow>
        <boxGeometry args={[0.7, 7, 0.7]} />
        <meshStandardMaterial color="#2b1a10" roughness={0.8} />
      </mesh>
      <mesh position={[4.2, 3.8, 11]} castShadow>
        <boxGeometry args={[0.7, 7, 0.7]} />
        <meshStandardMaterial color="#2b1a10" roughness={0.8} />
      </mesh>
      <mesh position={[0, 7.2, 11]} castShadow>
        <boxGeometry args={[9.5, 0.8, 0.8]} />
        <meshStandardMaterial color="#2b1a10" roughness={0.8} />
      </mesh>

      {/* Glowing Entrance Portal Membrane */}
      <mesh position={[0, 3.6, 10.9]}>
        <planeGeometry args={[7.8, 6.2]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={hovered ? 0.45 : 0.28}
          side={2}
        />
      </mesh>

      {/* Interior Ambient Torch Light */}
      <pointLight position={[0, 5, 2]} color="#ffb74d" intensity={2.8} distance={22} decay={2} />

      {/* Physical 3D Signboard Attached to Facade */}
      <Html position={[0, 8.2, 11.2]} center distanceFactor={14}>
        <div className="px-4 py-2 rounded-xl bg-black/85 border border-amber-500/50 backdrop-blur-md shadow-2xl text-center select-none whitespace-nowrap">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400">LIVE NOW</span>
            <span className="text-[10px] text-white/50">• 24 Watching</span>
          </div>
          <div className="text-xs font-black tracking-wide text-amber-200 uppercase">
            The Fellowship Watch Pavilion
          </div>
        </div>
      </Html>

      {/* Proximity Interaction Prompt [E] ENTER */}
      {(isNear || hovered) && (
        <Html position={[0, 3.6, 12]} center distanceFactor={10}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              sounds.playEnterPortal();
              onEnter();
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase shadow-2xl shadow-amber-500/60 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all animate-bounce"
          >
            <span className="px-1.5 py-0.5 rounded bg-black text-amber-400 text-[10px]">E</span>
            <span>Enter Watch Party</span>
          </div>
        </Html>
      )}
    </group>
  );
};
