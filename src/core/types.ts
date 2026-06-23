import type { PromoteIdSpecification } from 'mapbox-gl';
import type { Header } from 'pmtiles';

/**
 * The PMTiles archive header, as returned by {@link PmTilesSource.getHeader}.
 *
 * This is re-exported from the `pmtiles` package so consumers get a single,
 * stable type to work with (notably `minZoom`, `maxZoom`, `minLon`, `minLat`,
 * `maxLon`, `maxLat`, and `tileType`).
 */
export type PmTilesHeader = Header;

/**
 * Options accepted when constructing a {@link PmTilesSource} (i.e. the object
 * you pass to `map.addSource(id, options)`).
 */
export interface PmTilesOptions {
  /** The PMTiles archive URL (e.g. `https://example.com/tiles.pmtiles`). */
  url: string;

  /**
   * A property to use as a feature id (for feature state). See
   * [`promoteId`](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#vector-promoteId).
   */
  promoteId?: PromoteIdSpecification | null;

  /** Minimum zoom level. Defaults to the value from the PMTiles header. */
  minzoom?: number;

  /** Maximum zoom level. Defaults to the value from the PMTiles header. */
  maxzoom?: number;
}
