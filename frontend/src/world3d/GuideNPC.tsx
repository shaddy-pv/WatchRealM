import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { sounds } from '../audio/soundManager';

interface GuideNPCProps {
  position: [number, number, number];
  onTalk: () => void;
  playerDistance: number;
}

export const GuideNPC: React.FC<GuideNPCProps> = ({ position, onTalk, playerDistance }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const staffLightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);

  // Idle animation & light pulse
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (groupRef.current) {
      // Subtle breathing motion
      groupRef.current.position.y = position[1] + Math.sin(time * 1.8) * 0.04;
    }
    if (headRef.current) {
      // Gentle subtle looking around
      headRef.current.rotation.y = Math.sin(time * 0.8) * 0.15;
    }
    if (staffLightRef.current) {
      staffLightRef.current.intensity = 1.6 + Math.sin(time * 3) * 0.4;
    }
  });

  const isNear = playerDistance < 5.5;

  return (
    <group
      ref={groupRef}
      position={position}
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
        sounds.playClick();
        onTalk();
      }}
    >
      {/* Robe / Body */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.7, 2.2, 12]} />
        <meshStandardMaterial
          color={hovered ? '#2d3752' : '#1e2436'}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Cloak Shoulders */}
      <mesh position={[0, 2.05, 0]} castShadow>
        <coneGeometry args={[0.8, 0.7, 12]} />
        <meshStandardMaterial color="#3b4870" roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 2.45, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#deb887" roughness={0.6} />
      </mesh>

      {/* Guide Traveler Hat */}
      <mesh position={[0, 2.7, 0]} castShadow>
        <coneGeometry args={[0.65, 0.45, 12]} />
        <meshStandardMaterial color="#221812" roughness={0.9} />
      </mesh>

      {/* Lantern Staff */}
      <mesh position={[0.6, 1.5, 0.25]} rotation={[0, 0, -0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 3.0, 8]} />
        <meshStandardMaterial color="#3d271a" roughness={0.9} />
      </mesh>

      {/* Glowing Staff Lantern */}
      <mesh position={[0.65, 2.85, 0.25]} castShadow>
        <boxGeometry args={[0.22, 0.32, 0.22]} />
        <meshStandardMaterial
          color="#ffb74d"
          emissive="#ffa000"
          emissiveIntensity={1.2}
          roughness={0.2}
        />
      </mesh>

      {/* Point Light Casting Ambient Glow */}
      <pointLight
        ref={staffLightRef}
        position={[0.65, 2.85, 0.25]}
        color="#ffa000"
        distance={9}
        decay={2}
      />

      {/* Proximity Interaction Indicator [E] TALK */}
      {(isNear || hovered) && (
        <Html position={[0, 3.3, 0]} center distanceFactor={10}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onTalk();
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-950/90 border border-purple-400/60 backdrop-blur-md text-white text-xs font-bold tracking-wide shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-all animate-bounce"
          >
            <span className="px-1.5 py-0.5 rounded bg-white text-purple-950 text-[10px] font-extrabold">E</span>
            <span>Talk with Eldrin</span>
          </div>
        </Html>
      )}
    </group>
  );
};
