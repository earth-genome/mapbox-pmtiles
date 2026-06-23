import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Resolve the library's package name to its source in this monorepo so the
// example always demos the latest code without a separate build step. In a real
// app you'd just `npm install @earthgenome/mapbox-pmtiles` and these imports
// would resolve from node_modules.
const lib = (p: string) =>
  fileURLToPath(new URL(`../src/${p}`, import.meta.url));

// GitHub Pages serves project sites under `/<repo>/`. The deploy workflow sets
// BASE_PATH accordingly; locally we serve from the root.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: [
      // Order matters: subpaths must come before the bare package name.
      {
        find: '@earthgenome/mapbox-pmtiles/react-map-gl',
        replacement: lib('react-map-gl/index.ts'),
      },
      {
        find: '@earthgenome/mapbox-pmtiles/react',
        replacement: lib('react/index.ts'),
      },
      {
        find: '@earthgenome/mapbox-pmtiles',
        replacement: lib('index.ts'),
      },
    ],
    // Ensure a single copy of these is shared between the app, the library
    // source, and react-map-gl.
    dedupe: ['react', 'react-dom', 'mapbox-gl', 'pmtiles'],
  },
  server: {
    // Allow Vite to read the library source that lives outside `examples/`.
    fs: { allow: ['..'] },
  },
});
