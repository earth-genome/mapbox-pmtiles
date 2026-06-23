import type { ReactNode } from 'react';
import { useMap } from 'react-map-gl/mapbox';

import {
  usePmTilesSource,
  type MapInput,
  type UsePmTilesSourceOptions,
} from '../react/usePmTilesSource';

/** Props for the react-map-gl {@link PmTilesSource} component. */
export interface PmTilesSourceProps extends UsePmTilesSourceOptions {
  /**
   * Optional explicit map. When omitted, the map is read from react-map-gl
   * context (`useMap().current`). Pass this if you mount maps with the legacy
   * binding (`react-map-gl/mapbox-legacy`) or a different react-map-gl version,
   * whose context this component cannot read.
   */
  map?: MapInput;
  /**
   * Layers (or anything else) that depend on this source. Rendered only once
   * the source is on the map, unless {@link renderBeforeLoad} is set.
   */
  children?: ReactNode;
  /** Render `children` before the source finishes loading. Defaults to `false`. */
  renderBeforeLoad?: boolean;
}

/**
 * A drop-in PMTiles source for react-map-gl apps. Place it anywhere inside a
 * `<Map>` and it grabs the map from context — no wiring required — then renders
 * its children (typically react-map-gl `<Layer>`s) once the source is ready.
 *
 * @example
 * ```tsx
 * import { Map, Layer } from 'react-map-gl/mapbox';
 * import { PmTilesSource } from '@earthgenome/mapbox-pmtiles/react-map-gl';
 *
 * <Map mapboxAccessToken={TOKEN} initialViewState={...} mapStyle={STYLE}>
 *   <PmTilesSource id="parcels" url={PMTILES_URL}>
 *     <Layer id="parcels-fill" type="fill" source="parcels"
 *       source-layer="parcels" paint={{ 'fill-color': '#088', 'fill-opacity': 0.4 }} />
 *   </PmTilesSource>
 * </Map>
 * ```
 */
export function PmTilesSource({
  map: mapProp,
  children,
  renderBeforeLoad = false,
  ...options
}: PmTilesSourceProps): ReactNode {
  const maps = useMap();
  const map = mapProp ?? (maps.current as MapInput);

  const { loaded } = usePmTilesSource(map, options);

  if (!loaded && !renderBeforeLoad) return null;
  return children;
}
