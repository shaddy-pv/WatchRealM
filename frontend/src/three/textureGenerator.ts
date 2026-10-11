import * as THREE from 'three';

// Procedural Canvas Texture Generator
// Creates ultra-crisp, zero-latency textures directly in memory

export function createCobblestoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base stone tone
  ctx.fillStyle = '#262933';
  ctx.fillRect(0, 0, 512, 512);

  // Cobblestone stones
  const rows = 16;
  const cols = 8;
  const h = 512 / rows;
  const w = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (w / 2);
    for (let c = -1; c < cols + 1; c++) {
      const x = c * w + offset + 3;
      const y = r * h + 3;
      const stoneW = w - 6;
      const stoneH = h - 6;

      const shade = Math.floor(45 + Math.random() * 25);
      ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 10})`;
      ctx.beginPath();
      ctx.roundRect(x, y, stoneW, stoneH, 6);
      ctx.fill();

      // Inner highlight
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + Math.random() * 0.05})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark rich oak tone
  ctx.fillStyle = '#3a271d';
  ctx.fillRect(0, 0, 256, 256);

  // Wood grain lines
  for (let y = 0; y < 256; y += 4) {
    const alpha = 0.08 + Math.random() * 0.12;
    ctx.fillStyle = `rgba(180, 120, 80, ${alpha})`;
    ctx.fillRect(0, y, 256, 2);
  }

  // Wooden plank borders
  ctx.strokeStyle = '#1e140d';
  ctx.lineWidth = 3;
  for (let y = 0; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createGlowSpriteTexture(color: string = '#ffd15c'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.2, color);
  gradient.addColorStop(0.6, 'rgba(255, 180, 50, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

export function createParchmentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Aged parchment color
  ctx.fillStyle = '#1c1f2b';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle grid overlay
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
  ctx.lineWidth = 1;
  const step = 32;
  for (let i = 0; i <= 512; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}
