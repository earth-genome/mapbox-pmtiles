import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts',
    'react-map-gl/index': 'src/react-map-gl/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers external so consumers control the versions.
  external: [
    'mapbox-gl',
    'pmtiles',
    'react',
    'react/jsx-runtime',
    // Matches `react-map-gl` and any subpath export (e.g. `react-map-gl/mapbox`).
    /^react-map-gl(\/.*)?$/,
  ],
});
