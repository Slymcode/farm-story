/** Registers the offline app-shell service worker in production builds only (never in `vite dev`). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { /* the app works fine without it */ }); });
}
