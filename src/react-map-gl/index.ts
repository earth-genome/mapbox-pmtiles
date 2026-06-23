/**
 * @earthgenome/mapbox-pmtiles/react-map-gl — a zero-wiring `<PmTilesSource>` that
 * reads the map straight from react-map-gl context.
 *
 * This entry imports from `react-map-gl/mapbox` (the v8 binding). If you use
 * the legacy binding or a different version, either pass the `map` prop
 * explicitly or use the framework-agnostic helpers in
 * `@earthgenome/mapbox-pmtiles/react`.
 */
export { PmTilesSource } from './PmTilesSource';
export type { PmTilesSourceProps } from './PmTilesSource';

export { usePmTilesSource } from '../react/usePmTilesSource';
export type {
  MapInput,
  UsePmTilesSourceOptions,
  UsePmTilesSourceResult,
} from '../react/usePmTilesSource';

export {
  SOURCE_TYPE,
  registerPmTilesSourceType,
  addPmTilesSource,
  removePmTilesSource,
  getPmTilesHeader,
  getPmTilesMetadata,
  TileType,
} from '../index';
export type { PmTilesOptions, PmTilesHeader } from '../core/types';
