import { defineConfig } from 'vite';

// Vite config for the Black Aesthetics 3D storefront.
// See AGENTS.md §6 and ba_spec_v2.md §3 for stack conventions.
export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: { port: 5173, open: true },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // keep GLB/KTX2 as separate files
    target: 'es2020',
  },
  // GLB/Draco/KTX2 assets live in /assets and /public; referenced from src/.
});
