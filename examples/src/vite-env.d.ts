/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional Mapbox public token (pk.*). Enables a Mapbox basemap. */
  readonly VITE_MAPBOX_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
