import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs';

/** Fills the service worker's precache list with the files this build actually produced (no extra dependency). */
function serviceWorkerManifest(): Plugin {
  let outDir = 'dist';
  const files: string[] = [];
  return {
    name: 'farm-story-sw-manifest',
    apply: 'build',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },
    generateBundle(_o, bundle) { Object.keys(bundle).filter((f) => !f.endsWith('.map')).forEach((f) => files.push(`/${f}`)); },
    closeBundle() {
      const swPath = path.join(outDir, 'sw.js');
      if (!fs.existsSync(swPath)) return;
      const publicFiles = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
      const list = Array.from(new Set([...publicFiles, ...files])).sort();
      const version = String(Date.now().toString(36));
      fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replaceAll('__PRECACHE__', JSON.stringify(list)).replaceAll('__VERSION__', version));
    },
  };
}

// In development, /api is proxied to the NestJS backend so no CORS setup is needed.
export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorkerManifest()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } } },
  build: { chunkSizeWarningLimit: 700 },
});
