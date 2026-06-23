import type { ReactNode } from 'react';

import {
  usePmTilesSource,
  type MapInput,
  type UsePmTilesSourceOptions,
} from './usePmTilesSource';

/** Props for the `./react` {@link PmTilesSource} component. */
export interface PmTilesSourceProps extends UsePmTilesSourceOptions {
  /**
   * The map to attach to. Accepts a raw `mapboxgl.Map`, a react-map-gl
   * `MapRef` (e.g. `useMap().current`), or a `RefObject` to either.
   */
  map: MapInput;
  /**
   * Layers (or anything else) that depend on this source. By default they are
   * only rendered once the source is on the map, so child `<Layer>`s never
   * reference a missing source.
   */
  children?: ReactNode;
  /**
   * Render `children` immediately, before the source finishes loading.
   * Defaults to `false`.
   */
  renderBeforeLoad?: boolean;
}

/**
 * A declarative PMTiles source for React apps, framework-agnostic by design —
 * it takes the map as a prop rather than reading any particular context, so it
 * works with vanilla Mapbox-in-React and every version of react-map-gl.
 *
 * For zero-config use inside a react-map-gl `<Map>` (no `map` prop needed),
 * import the component from `@earthgenome/mapbox-pmtiles/react-map-gl` instead.
 *
 * @example
 * ```tsx
 * import { PmTilesSource } from '@earthgenome/mapbox-pmtiles/react';
 * import { Layer, useMap } from 'react-map-gl/mapbox';
 *
 * function Parcels() {
 *   const { current: map } = useMap();
 *   return (
 *     <PmTilesSource map={map} id="parcels" url={PMTILES_URL}>
 *       <Layer id="parcels-fill" type="fill" source="parcels"
 *         source-layer="parcels" paint={{ 'fill-color': '#088' }} />
 *     </PmTilesSource>
 *   );
 * }
 * ```
 */
export function PmTilesSource({
  map,
  children,
  renderBeforeLoad = false,
  ...options
}: PmTilesSourceProps): ReactNode {
  const { loaded } = usePmTilesSource(map, options);

  if (!loaded && !renderBeforeLoad) return null;
  return children;
}
