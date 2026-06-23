/**
 * @earthgenome/mapbox-pmtiles — core (framework-agnostic) entry point.
 *
 * Everything exported here works with vanilla Mapbox GL JS and has no React
 * dependency. React helpers live in `@earthgenome/mapbox-pmtiles/react` and a
 * react-map-gl component lives in `@earthgenome/mapbox-pmtiles/react-map-gl`.
 */
export { PmTilesSource, SOURCE_TYPE } from './core/PmTilesSource';
export {
  registerPmTilesSourceType,
  isPmTilesSourceTypeRegistered,
} from './core/register';
export {
  addPmTilesSource,
  removePmTilesSource,
  getPmTilesHeader,
  getPmTilesMetadata,
} from './core/helpers';
export type { PmTilesOptions, PmTilesHeader } from './core/types';

// Re-export `TileType` for convenience when inspecting a header's tile type.
export { TileType } from 'pmtiles';
