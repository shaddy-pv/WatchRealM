import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { sounds } from '../audio/soundManager';

export type CameraMode = 'CINEMATIC_SCROLL' | 'FPP_EXPLORATION' | 'INSIDE_BUILDING' | 'SEATED_WATCHING';

interface CameraControllerProps {
  mode: CameraMode;
  scrollProgress: number; // 0 to 1
  onPlayerPosChange: (pos: [number, number, number]) => void;
  isMapOpen: boolean;
  isDialogueOpen: boolean;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  mode,
  scrollProgress,
  onPlayerPosChange,
  isMapOpen,
  isDialogueOpen,
}) => {
  const { camera, gl } = useThree();

  // Internal state for FPP controls
  const playerState = useRef({
    position: new THREE.Vector3(0, 1.7, 18), // Start at Plaza
    velocity: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    sprint: false,
    stepTimer: 0,
  });

  const onPlayerPosChangeRef = useRef(onPlayerPosChange);
  onPlayerPosChangeRef.current = onPlayerPosChange;

  // Keyboard Event Listeners for Movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      const p = playerState.current;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          p.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          p.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          p.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          p.moveRight = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          p.sprint = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const p = playerState.current;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          p.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          p.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          p.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          p.moveRight = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          p.sprint = false;
          break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement && !isMapOpen && !isDialogueOpen) {
        const sensitivity = 0.0022;
        playerState.current.yaw -= e.movementX * sensitivity;
        playerState.current.pitch -= e.movementY * sensitivity;
        playerState.current.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, playerState.current.pitch));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl.domElement, isMapOpen, isDialogueOpen]);

  // Main Frame Loop
  useFrame((_, delta) => {
    const p = playerState.current;

    // ==============================================================
    // MODE 1: CINEMATIC SCROLL DESCENT
    // ==============================================================
    if (mode === 'CINEMATIC_SCROLL') {
      // Interpolate camera along cinematic path based on scrollProgress (0 to 1)
      const t = scrollProgress;

      // Start: High aerial kingdom view [0, 85, 120]
      // Mid: Descends past mountain castle [0, 28, 55]
      // End: Lands at Central Plaza [0, 1.7, 18]
      const camX = Math.sin(t * Math.PI) * 12;
      const camY = THREE.MathUtils.lerp(85, 1.7, Math.pow(t, 0.85));
      const camZ = THREE.MathUtils.lerp(120, 18, t);

      camera.position.set(camX, camY, camZ);
      const lookTarget = new THREE.Vector3(0, THREE.MathUtils.lerp(25, 2, t), THREE.MathUtils.lerp(0, 0, t));
      camera.lookAt(lookTarget);

      p.position.set(0, 1.7, 18);
      onPlayerPosChangeRef.current([0, 1.7, 18]);
      return;
    }

    // ==============================================================
    // MODE 2: SEATED WATCHING MODE (In the Watch Room)
    // ==============================================================
    if (mode === 'SEATED_WATCHING') {
      // Seated eye-level on the empty cushion/chair facing the screen
      // Empty chair is at [0, 0, -68]. Seated eye height is 0.85m.
      const targetPos = new THREE.Vector3(0, 0.85, -68);
      camera.position.lerp(targetPos, 5 * delta);

      // Look directly at cinema screen at [0, 4.5, -74]
      const screenTarget = new THREE.Vector3(0, 4.2, -74);
      camera.lookAt(screenTarget);

      onPlayerPosChangeRef.current([0, 0.85, -68]);
      return;
    }

    // ==============================================================
    // MODE 3: INSIDE BUILDING (Standing in Theater Room)
    // ==============================================================
    if (mode === 'INSIDE_BUILDING') {
      // Inside theater room at [0, 0, -65]. Room radius is 12m.
      const speed = (p.sprint ? 7.5 : 5.0) * delta;
      const moveVec = new THREE.Vector3();

      if (!isMapOpen && !isDialogueOpen) {
        if (p.moveForward) moveVec.z -= 1;
        if (p.moveBackward) moveVec.z += 1;
        if (p.moveLeft) moveVec.x -= 1;
        if (p.moveRight) moveVec.x += 1;

        if (moveVec.lengthSq() > 0) {
          moveVec.normalize();
          moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);
          p.position.addScaledVector(moveVec, speed);

          p.stepTimer += delta;
          if (p.stepTimer > 0.44) {
            sounds.playFootstep();
            p.stepTimer = 0;
          }
        }
      }

      // Constrain within room cylinder bounds
      p.position.x = Math.max(-10, Math.min(10, p.position.x));
      p.position.z = Math.max(-75, Math.min(-56, p.position.z));
      p.position.y = 1.7;

      camera.position.copy(p.position);
      camera.rotation.set(0, 0, 0);
      camera.rotation.y = p.yaw;
      camera.rotation.x = p.pitch;

      onPlayerPosChangeRef.current([p.position.x, p.position.y, p.position.z]);
      return;
    }

    // ==============================================================
    // MODE 4: FIRST-PERSON EXPLORATION (Grounded 3D Walking)
    // ==============================================================
    if (mode === 'FPP_EXPLORATION') {
      const speed = (p.sprint ? 9.5 : 6.0) * delta;
      const moveVec = new THREE.Vector3();

      if (!isMapOpen && !isDialogueOpen) {
        if (p.moveForward) moveVec.z -= 1;
        if (p.moveBackward) moveVec.z += 1;
        if (p.moveLeft) moveVec.x -= 1;
        if (p.moveRight) moveVec.x += 1;

        if (moveVec.lengthSq() > 0) {
          moveVec.normalize();
          moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);
          p.position.addScaledVector(moveVec, speed);

          p.stepTimer += delta;
          if (p.stepTimer > (p.sprint ? 0.32 : 0.45)) {
            sounds.playFootstep();
            p.stepTimer = 0;
          }
        }
      }

      // Ground terrain boundary clamping
      p.position.x = Math.max(-32, Math.min(32, p.position.x));
      p.position.z = Math.max(-75, Math.min(34, p.position.z));
      p.position.y = 1.7;

      camera.position.copy(p.position);
      camera.rotation.set(0, 0, 0);
      camera.rotation.y = p.yaw;
      camera.rotation.x = p.pitch;

      onPlayerPosChangeRef.current([p.position.x, p.position.y, p.position.z]);
    }
  });

  return null;
};
