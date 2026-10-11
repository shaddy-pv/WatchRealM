import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { sounds } from '../audio/soundManager';

interface CrossroadSignProps {
  position: [number, number, number];
  onSelectDestination: (dest: string) => void;
}

interface SignPlankProps {
  position: [number, number, number];
  rotation: [number, number, number];
  text: string;
  color: string;
  destination: string;
  onSelect: (dest: string) => void;
}

const SignPlank: React.FC<SignPlankProps> = ({
  position,
  rotation,
  text,
  color,
  destination,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Group>(null);
  const targetY = position[1] + (hovered ? 0.08 : 0);
  const targetRotY = rotation[1] + (hovered ? 0.08 : 0);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, targetY, 10, delta);
      meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetRotY, 10, delta);
    }
  });

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        sounds.playClick();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        sounds.playTravelSwoosh();
        onSelect(destination);
      }}
    >
      {/* Wooden Plank Mesh */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.42, 0.08]} />
        <meshStandardMaterial
          color={hovered ? '#4d3728' : '#38251a'}
          roughness={0.8}
          metalness={0.1}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.35 : 0}
        />
      </mesh>

      {/* Pointed Arrow Tip */}
      <mesh position={[1.18, 0, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.08]} />
        <meshStandardMaterial
          color={hovered ? '#4d3728' : '#38251a'}
          roughness={0.8}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.35 : 0}
        />
      </mesh>

      {/* In-World 3D Text Label */}
      <Html position={[0, 0, 0.06]} center transform distanceFactor={8} pointerEvents="none">
        <div className={`px-2 py-0.5 rounded select-none text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all ${
          hovered ? 'text-white scale-110 drop-shadow-md' : 'text-amber-100/90'
        }`}>
          {text}
        </div>
      </Html>

      {/* Hover Floating Tooltip */}
      {hovered && (
        <Html position={[0, 0.45, 0]} center distanceFactor={10} pointerEvents="none">
          <div className="px-2.5 py-1 rounded-lg bg-black/85 border border-white/20 text-white text-[10px] font-semibold tracking-wide whitespace-nowrap backdrop-blur-md shadow-xl animate-fade-in flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span>Click to Travel to {destination}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

export const CrossroadSign: React.FC<CrossroadSignProps> = ({ position, onSelectDestination }) => {
  return (
    <group position={position}>
      {/* Main Wooden Post */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.18, 4.2, 8]} />
        <meshStandardMaterial color="#2c1d14" roughness={0.9} />
      </mesh>

      {/* Stone Pedestal Base */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.6, 0.4, 8]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.8} />
      </mesh>

      {/* Top Post Cap */}
      <mesh position={[0, 4.15, 0]} castShadow>
        <coneGeometry args={[0.22, 0.4, 8]} />
        <meshStandardMaterial color="#1a120c" roughness={0.7} />
      </mesh>

      {/* 4 Directional Planks */}
      <SignPlank
        position={[0, 3.6, 0]}
        rotation={[0, 0, 0]}
        text="Fantasy Realm ↑"
        color="#f59e0b"
        destination="Fantasy Realm"
        onSelect={onSelectDestination}
      />
      <SignPlank
        position={[0, 3.0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        text="Sci-Fi City →"
        color="#06b6d4"
        destination="Sci-Fi City"
        onSelect={onSelectDestination}
      />
      <SignPlank
        position={[0, 2.4, 0]}
        rotation={[0, Math.PI / 2, 0]}
        text="← Anime Village"
        color="#ec4899"
        destination="Anime Village"
        onSelect={onSelectDestination}
      />
      <SignPlank
        position={[0, 1.8, 0]}
        rotation={[0, Math.PI, 0]}
        text="Gaming Arena ↓"
        color="#10b981"
        destination="Gaming Arena"
        onSelect={onSelectDestination}
      />
    </group>
  );
};
