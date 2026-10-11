/**
 * Centralized Application Configuration
 * Handles environment-aware backend URL resolution with production & LAN fallback.
 */
export const BACKEND_URL: string = (() => {
  // 1. Vite environment variable (set during deployment e.g. on Render/Vercel)
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '');
  }

  // 2. Dynamic host detection in browser
  if (typeof window !== 'undefined' && window.location.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:4000`;
    }
    // Local LAN access (e.g. testing via mobile device on same WiFi)
    return `${protocol}//${window.location.hostname}:4000`;
  }

  return 'http://localhost:4000';
})();
