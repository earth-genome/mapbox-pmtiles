const TOKEN_STORAGE_KEY = 'mapbox-pmtiles:token';

/** A token baked in at build time via `VITE_MAPBOX_TOKEN`, if any. */
const ENV_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN ?? '').trim();

/** Read the active Mapbox token: the build-time env var wins, else localStorage. */
export function getMapboxToken(): string {
  if (ENV_TOKEN) return ENV_TOKEN;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

/** Persist a runtime token (used by the in-app token field). Pass '' to clear. */
export function setMapboxToken(token: string): void {
  try {
    const trimmed = token.trim();
    if (trimmed) localStorage.setItem(TOKEN_STORAGE_KEY, trimmed);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore (e.g. storage disabled) */
  }
}

/** True when the token is fixed by the build and not editable at runtime. */
export const TOKEN_FROM_ENV = Boolean(ENV_TOKEN);

/** The active token, resolved once at module load. */
export const MAPBOX_TOKEN = getMapboxToken();

/**
 * CARTO Dark Matter — open-source basemap, no Mapbox token required.
 * @see https://github.com/CartoDB/basemap-styles
 */
export const CARTO_DARK_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

/**
 * The base map style for every demo: Mapbox dark-v11 when a token is
 * configured, otherwise CARTO Dark Matter.
 */
export const BASE_STYLE = CARTO_DARK_STYLE; // MAPBOX_TOKEN ? MAPBOX_STYLE : CARTO_DARK_STYLE;
