import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePmTilesSource } from '@earthgenome/mapbox-pmtiles/react';

import { BASE_STYLE } from '../config';
import { DATASETS } from '../datasets';

/**
 * The universal hook — React + Mapbox without react-map-gl.
 *
 * `usePmTilesSource` accepts any map you already have (a raw `mapboxgl.Map`, a
 * react-map-gl `MapRef`, or a ref to either) and keeps the source attached
 * across style reloads. Add your layers once it reports `loaded`.
 */
export function UniversalHookDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const { url, sourceLayer, center, zoom } = DATASETS.buildings;

  useEffect(() => {
    if (!containerRef.current) return;
    const m = new mapboxgl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center,
      zoom,
    });
    setMap(m);
    return () => {
      setMap(null);
      m.remove();
    };
  }, [center, zoom]);

  const { loaded } = usePmTilesSource(map, { id: 'buildings', url });

  useEffect(() => {
    if (!map || !loaded || map.getLayer('buildings-fill')) return;
    map.addLayer({
      id: 'buildings-fill',
      type: 'fill',
      source: 'buildings',
      'source-layer': sourceLayer!,
      paint: { 'fill-color': '#34d399', 'fill-opacity': 0.5 },
    });
  }, [map, loaded, sourceLayer]);

  return <div ref={containerRef} className="map" />;
}
