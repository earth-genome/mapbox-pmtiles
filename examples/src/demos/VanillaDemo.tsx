import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { addPmTilesSource } from '@earthgenome/mapbox-pmtiles';

import { BASE_STYLE } from '../config';
import { DATASETS } from '../datasets';

/**
 * Vanilla Mapbox GL JS — no React bindings.
 *
 * `addPmTilesSource` registers the custom source type, reads the archive header
 * for zoom/bounds, and calls `map.addSource` for you. Then add layers as usual.
 */
export function VanillaDemo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const { url, sourceLayer, center, zoom } = DATASETS.buildings;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center,
      zoom,
    });

    map.on('load', async () => {
      await addPmTilesSource(map, 'buildings', { url });

      map.addLayer({
        id: 'buildings-fill',
        type: 'fill',
        source: 'buildings',
        'source-layer': sourceLayer!,
        paint: {
          'fill-color': '#38bdf8',
          'fill-opacity': 0.5,
          'fill-outline-color': '#7dd3fc',
        },
      });
    });

    return () => map.remove();
  }, []);

  return <div ref={containerRef} className="map" />;
}
