/**
 * @earthgenome/mapbox-pmtiles/react — framework-agnostic React helpers.
 *
 * These depend only on `react` (plus the `mapbox-gl`/`pmtiles` peers). They do
 * NOT depend on react-map-gl, so they work in vanilla Mapbox-in-React apps and
 * with any version of react-map-gl. For a zero-wiring component that reads the
 * map from react-map-gl context, import from `@earthgenome/mapbox-pmtiles/react-map-gl`.
 */
export { PmTilesSource } from './PmTilesSource';
export type { PmTilesSourceProps } from './PmTilesSource';

export {
  usePmTilesSource,
  resolveMap,
} from './usePmTilesSource';
export type {
  MapInput,
  UsePmTilesSourceOptions,
  UsePmTilesSourceResult,
} from './usePmTilesSource';

// Re-export the core, framework-agnostic surface for convenience.
export {
  SOURCE_TYPE,
  registerPmTilesSourceType,
  isPmTilesSourceTypeRegistered,
  addPmTilesSource,
  removePmTilesSource,
  getPmTilesHeader,
  getPmTilesMetadata,
  TileType,
} from '../index';
export type { PmTilesOptions, PmTilesHeader } from '../core/types';
