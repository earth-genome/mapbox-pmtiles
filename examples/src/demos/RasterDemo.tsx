import { Map, Layer } from 'react-map-gl/mapbox';
import { PmTilesSource } from '@earthgenome/mapbox-pmtiles/react-map-gl';

import { BASE_STYLE, MAPBOX_TOKEN } from '../config';
import { DATASETS } from '../datasets';

/**
 * Raster PMTiles — same API, no extra config.
 *
 * The source inspects the archive's tile type and switches itself to a raster
 * source automatically, so a plain `type="raster"` layer just works.
 */
export function RasterDemo() {
  const { url, center, zoom } = DATASETS.rasterWhitney;

  return (
    <Map
      initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
      mapStyle={BASE_STYLE}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '500px' }}
    >
      <PmTilesSource id="whitney" url={url}>
        <Layer id="whitney-raster" type="raster" source="whitney" />
      </PmTilesSource>
    </Map>
  );
}
