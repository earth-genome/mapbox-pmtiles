import { Map, Layer } from 'react-map-gl/mapbox';
import { PmTilesSource } from '@earthgenome/mapbox-pmtiles/react-map-gl';

import { BASE_STYLE, MAPBOX_TOKEN } from '../config';
import { DATASETS } from '../datasets';

/**
 * react-map-gl (v8) — zero wiring.
 *
 * Drop `<PmTilesSource>` inside `<Map>`; it grabs the map from context, adds the
 * source, and renders its `<Layer>` children once the source is ready.
 */
export function ReactMapGlDemo() {
  const { url, sourceLayer, center, zoom } = DATASETS.pois;

  return (
    <Map
      initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
      mapStyle={BASE_STYLE}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '500px' }}
    >
      <PmTilesSource id="pois" url={url}>
        <Layer
          id="pois-circle"
          type="circle"
          source="pois"
          source-layer={sourceLayer}
          paint={{
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 16, 5],
            'circle-color': '#f472b6',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 0.6,
          }}
        />
      </PmTilesSource>
    </Map>
  );
}
