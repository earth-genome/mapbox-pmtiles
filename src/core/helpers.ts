import type mapboxgl from 'mapbox-gl';
import type { Header } from 'pmtiles';

import { PmTilesSource, SOURCE_TYPE } from './PmTilesSource';
import { registerPmTilesSourceType } from './register';
import type { PmTilesOptions } from './types';

/** A Mapbox `Map`, or anything that can be resolved to one. */
type AddSourceSpec = Parameters<mapboxgl.Map['addSource']>[1];

/**
 * Fetch a PMTiles archive header. Thin wrapper around
 * {@link PmTilesSource.getHeader}.
 */
export function getPmTilesHeader(url: string): Promise<Header> {
  return PmTilesSource.getHeader(url);
}

/**
 * Fetch a PMTiles archive's JSON metadata. Thin wrapper around
 * {@link PmTilesSource.getMetadata}.
 */
export function getPmTilesMetadata(url: string): Promise<unknown> {
  return PmTilesSource.getMetadata(url);
}

/**
 * Imperatively add a PMTiles source to a Mapbox map.
 *
 * This registers the custom source type (idempotently), reads the archive
 * header to derive `minzoom`/`maxzoom`/`bounds` (unless you override them), and
 * calls `map.addSource`. It is safe to call repeatedly: if a source with the
 * given `id` already exists, it is left untouched.
 *
 * The returned promise resolves with the PMTiles header (handy for laying out
 * legends, fitting bounds, etc.), or `undefined` if the source already existed
 * before the header could be fetched.
 *
 * @example
 * ```ts
 * import { addPmTilesSource } from '@earthgenome/mapbox-pmtiles';
 *
 * map.on('load', async () => {
 *   await addPmTilesSource(map, 'parcels', { url: PMTILES_URL });
 *   map.addLayer({
 *     id: 'parcels-fill',
 *     type: 'fill',
 *     source: 'parcels',
 *     'source-layer': 'parcels',
 *     paint: { 'fill-color': '#088', 'fill-opacity': 0.4 },
 *   });
 * });
 * ```
 */
export async function addPmTilesSource(
  map: mapboxgl.Map,
  id: string,
  options: PmTilesOptions,
): Promise<Header | undefined> {
  registerPmTilesSourceType();

  if (map.getSource(id)) return undefined;

  const header = await PmTilesSource.getHeader(options.url);

  // Re-check after the await — another call (or React effect) may have added
  // the source while the header request was in flight.
  if (map.getSource(id)) return header;

  const spec = {
    type: SOURCE_TYPE,
    url: options.url,
    minzoom: options.minzoom ?? header.minZoom,
    maxzoom: options.maxzoom ?? header.maxZoom,
    bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat],
    ...(options.promoteId != null ? { promoteId: options.promoteId } : {}),
  };

  map.addSource(id, spec as unknown as AddSourceSpec);

  return header;
}

/**
 * Remove a PMTiles source from a map if it exists. A small convenience that
 * guards the `map.getSource` check for you.
 */
export function removePmTilesSource(map: mapboxgl.Map, id: string): void {
  if (map.getSource(id)) {
    map.removeSource(id);
  }
}
