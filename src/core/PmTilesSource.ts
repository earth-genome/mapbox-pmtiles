/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A Mapbox GL JS custom source for PMTiles archives (both vector and raster).
 *
 * This is a typed, lightly-refactored version of the excellent
 * [`mapbox-pmtiles`](https://github.com/am2222/mapbox-pmtiles) source. The
 * runtime behavior is preserved; the source interfaces with several Mapbox GL
 * JS v3 internals (`_requestManager`, `dispatcher`, the worker `Tile` shape,
 * `Style.getSourceType`) that are intentionally not part of Mapbox's public
 * typings, so those boundaries are typed as `any` on purpose.
 */
import mapboxgl, { LngLatBounds, type LngLatBoundsLike } from 'mapbox-gl';
import { PMTiles, Protocol, TileType } from 'pmtiles';
import type { Header } from 'pmtiles';

import type { PmTilesOptions } from './types';

/**
 * The Mapbox source `type` string used to register and reference this source.
 * Pass this as the `type` when calling `map.addSource(id, { type, url })`.
 */
export const SOURCE_TYPE = 'pmtile-source';

/** The constructor signature Mapbox expects for a custom source type. */
type MapboxSourceClass = new (...args: any[]) => any;

// Mapbox's vector source implementation is the base we extend. It is fetched
// from the runtime because it is not exported from the public package.
const VectorTileSourceImpl = mapboxgl.Style.getSourceType(
  'vector',
) as unknown as MapboxSourceClass;

/**
 * Shallow-extends a destination object with one or more source objects.
 * @internal
 */
const extend = <T extends object>(dest: T, ...sources: any[]): T => {
  for (const src of sources) {
    for (const k in src) {
      (dest as any)[k] = src[k];
    }
  }
  return dest;
};

const mercatorXFromLng = (lng: number): number => (180 + lng) / 360;

const mercatorYFromLat = (lat: number): number =>
  (180 -
    (180 / Math.PI) *
      Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) /
  360;

class TileBounds {
  bounds: LngLatBounds;
  minzoom: number;
  maxzoom: number;

  constructor(bounds: LngLatBoundsLike, minzoom: number, maxzoom: number) {
    this.bounds = LngLatBounds.convert(this.validateBounds(bounds));
    this.minzoom = minzoom || 0;
    this.maxzoom = maxzoom || 24;
  }

  validateBounds(bounds: LngLatBoundsLike): LngLatBoundsLike {
    // make sure the bounds property contains valid longitude and latitudes
    if (!Array.isArray(bounds) || bounds.length !== 4)
      return [-180, -90, 180, 90];
    return [
      Math.max(-180, bounds[0] as number),
      Math.max(-90, bounds[1] as number),
      Math.min(180, bounds[2] as number),
      Math.min(90, bounds[3] as number),
    ];
  }

  contains(tileID: CanonicalTileID): boolean {
    const worldSize = Math.pow(2, tileID.z);
    const level = {
      minX: Math.floor(mercatorXFromLng(this.bounds.getWest()) * worldSize),
      minY: Math.floor(mercatorYFromLat(this.bounds.getNorth()) * worldSize),
      maxX: Math.ceil(mercatorXFromLng(this.bounds.getEast()) * worldSize),
      maxY: Math.ceil(mercatorYFromLat(this.bounds.getSouth()) * worldSize),
    };
    return (
      tileID.x >= level.minX &&
      tileID.x < level.maxX &&
      tileID.y >= level.minY &&
      tileID.y < level.maxY
    );
  }
}

class Event {
  type: string;

  constructor(type: string, data: any = {}) {
    extend(this, data);
    this.type = type;
  }
}

class ErrorEvent extends Event {
  error: Error | undefined;

  constructor(error: Error, data: object = {}) {
    super('error', extend({ error }, data));
  }
}

type Callback<T> = (
  error: Error | null | undefined,
  result?: T | null | undefined,
) => void;

/** Mapbox `Map` augmented with the private members this source reaches into. */
type MapboxMap = mapboxgl.Map & {
  _refreshExpiredTiles: any;
  _requestManager: any;
  painter: any;
  style?: { _loaded?: boolean };
};

/** The worker-side tile object Mapbox hands to `loadTile`. @internal */
type Tile = {
  destroy: () => void;
  setTexture(arg0: (data: any) => any, painter: any): unknown;
  request: any;
  aborted: any;
  resourceTiming: any;
  setExpiryData(data: any): unknown;
  loadVectorData(data: any, painter: any): unknown;
  reloadCallback: any;
  tileID: any;
  uid: any;
  tileZoom: any;
  isSymbolTile: any;
  isExtraShadowCaster: any;
  actor: any;
  state: string;
};

type CanonicalTileID = {
  z: number;
  x: number;
  y: number;
};

type TileID = {
  canonical: CanonicalTileID;
};

/**
 * A Mapbox GL JS custom source backed by a PMTiles archive.
 *
 * @remarks
 * The source automatically detects whether the archive is `vector` or `raster`
 * based on the `tileType` in the PMTiles header, and reads `minZoom`,
 * `maxZoom`, and the lon/lat bounds from the header to constrain tile requests.
 *
 * Register it once per `mapboxgl` instance before adding sources of this type:
 *
 * @example
 * ```ts
 * import mapboxgl from 'mapbox-gl';
 * import { PmTilesSource } from '@earthgenome/mapbox-pmtiles';
 *
 * mapboxgl.Style.setSourceType(PmTilesSource.SOURCE_TYPE, PmTilesSource);
 *
 * map.on('load', () => {
 *   map.addSource('example', {
 *     type: PmTilesSource.SOURCE_TYPE,
 *     url: 'https://example.com/tiles.pmtiles',
 *   });
 *   map.addLayer({
 *     id: 'places',
 *     type: 'circle',
 *     source: 'example',
 *     'source-layer': 'places',
 *     paint: { 'circle-color': 'steelblue' },
 *   });
 * });
 * ```
 */
export class PmTilesSource extends VectorTileSourceImpl {
  // Mapbox writes many dynamic properties onto sources at runtime; this index
  // signature keeps those interactions type-safe-by-escape-hatch while the
  // declared members below stay strongly typed for consumers.
  [x: string]: any;

  static SOURCE_TYPE = SOURCE_TYPE;

  id: string;
  scheme = 'xyz';
  minzoom!: number;
  maxzoom!: number;
  tileSize: number;
  attribution: string | undefined;
  tiles: string[];

  roundZoom = true;
  tileBounds: TileBounds | undefined;
  minTileCacheSize: number | undefined;
  maxTileCacheSize: number | undefined;
  type = 'vector';

  scope: string | undefined;
  dispatcher: any = undefined;
  reparseOverscaled = true;
  map!: MapboxMap;

  _loaded = false;
  _dataType = 'vector';
  _implementation: PmTilesOptions | undefined;
  _protocol: Protocol;
  _instance: PMTiles;
  loadTile!: (tile: Tile, callback: Callback<void>) => void;
  tileType!: TileType;
  header: Header | undefined;
  contentType!: string;

  /**
   * Fetch the JSON metadata of a PMTiles archive without adding it to a map.
   * @param url The PMTiles archive URL.
   */
  static async getMetadata(url: string): Promise<unknown> {
    const instance = new PMTiles(url);
    return instance.getMetadata();
  }

  /**
   * Fetch the header of a PMTiles archive without adding it to a map. Useful
   * for reading `minZoom`/`maxZoom`/bounds before creating the source.
   * @param url The PMTiles archive URL.
   */
  static async getHeader(url: string): Promise<Header> {
    const instance = new PMTiles(url);
    return instance.getHeader();
  }

  constructor(
    id: string,
    options: PmTilesOptions,
    _dispatcher: any,
    _eventedParent: any,
  ) {
    super(id, options, _dispatcher, _eventedParent);

    this.id = id;
    this._dataType = 'vector';
    this.dispatcher = _dispatcher;
    this._implementation = options;
    if (!this._implementation) {
      this.fire(
        new ErrorEvent(
          new Error(`Missing options for ${this.id} ${SOURCE_TYPE} source`),
        ),
      );
    }

    const { url } = options;

    this.reparseOverscaled = true;
    this.scheme = 'xyz';
    this.tileSize = 512;
    this._loaded = false;
    this.type = 'vector';

    this._protocol = new Protocol();
    this.tiles = [`pmtiles://${url}/{z}/{x}/{y}`];
    const pmtilesInstance = new PMTiles(url);

    // share one instance across the JS code and the map renderer
    this._protocol.add(pmtilesInstance);
    this._instance = pmtilesInstance;
  }

  /**
   * The extent of the entire source, extracted from the PMTiles header.
   */
  getExtent(): LngLatBoundsLike {
    if (!this.header)
      return [
        [-180, -90],
        [180, 90],
      ];

    const { minLon, minLat, maxLon, maxLat } = this.header;
    return [minLon, minLat, maxLon, maxLat];
  }

  hasTile(tileID: TileID): boolean {
    return !this.tileBounds || this.tileBounds.contains(tileID.canonical);
  }

  fixTile(tile: Tile): void {
    if (!tile.destroy) {
      tile.destroy = () => {};
    }
  }

  async load(callback?: Callback<void>): Promise<void> {
    this._loaded = false;
    this.fire(new Event('dataloading', { dataType: 'source' }));

    // We need both header and metadata.
    return Promise.all([
      this._instance.getHeader(),
      this._instance.getMetadata(),
    ])
      .then(([header, tileJSON]) => {
        // first apply tileJSON-derived properties to the source
        extend(this, tileJSON as object);

        this.header = header;
        const { tileType, minZoom, maxZoom, minLon, minLat, maxLon, maxLat } =
          header;

        const requiredVariables = [
          minZoom,
          maxZoom,
          minLon,
          minLat,
          maxLon,
          maxLat,
        ];

        if (
          !requiredVariables.includes(undefined as any) &&
          !requiredVariables.includes(null as any)
        ) {
          this.tileBounds = new TileBounds(
            [minLon, minLat, maxLon, maxLat],
            minZoom,
            maxZoom,
          );
          this.minzoom = minZoom;
          this.maxzoom = maxZoom;
        }

        // fix for corrupted tileJSON
        this.minzoom = Number.parseInt(this.minzoom.toString()) || 0;
        this.maxzoom = Number.parseInt(this.maxzoom.toString()) || 0;

        this._loaded = true;

        // set after extend to avoid being overwritten
        this.tileType = tileType;

        switch (tileType) {
          case TileType.Png:
            this.contentType = 'image/png';
            break;
          case TileType.Jpeg:
            this.contentType = 'image/jpeg';
            break;
          case TileType.Webp:
            this.contentType = 'image/webp';
            break;
          case TileType.Avif:
            this.contentType = 'image/avif';
            break;
          case TileType.Mvt:
            this.contentType = 'application/vnd.mapbox-vector-tile';
            break;
        }

        if (
          this.tileType === TileType.Jpeg ||
          this.tileType === TileType.Png
        ) {
          this.loadTile = this.loadRasterTile;
          this.type = 'raster';
        } else if (this.tileType === TileType.Mvt) {
          this.loadTile = this.loadVectorTile;
          this.type = 'vector';
        } else {
          this.fire(new ErrorEvent(new Error('Unsupported Tile Type')));
        }

        // `content` is fired to avoid a race where `Style#updateSources` runs
        // before the TileJSON arrives.
        // ref: https://github.com/mapbox/mapbox-gl-js/pull/4347#discussion_r104418088
        this.fire(
          new Event('data', { dataType: 'source', sourceDataType: 'metadata' }),
        );
        this.fire(
          new Event('data', { dataType: 'source', sourceDataType: 'content' }),
        );
      })
      .catch((err: Error) => {
        this.fire(new ErrorEvent(err));
        if (callback) callback(err);
      });
  }

  loaded(): boolean {
    return this._loaded;
  }

  loadVectorTile(tile: Tile, callback: Callback<void>): void {
    const done = (err: Error | null | undefined, data?: any) => {
      delete tile.request;

      if (tile.aborted) return callback(null);

      if (err && (err as any).status !== 404) {
        return callback(err);
      }

      if (data && data.resourceTiming)
        tile.resourceTiming = data.resourceTiming;

      if (this.map?._refreshExpiredTiles && data) tile.setExpiryData(data);
      tile.loadVectorData(data, this.map?.painter);

      callback(null);

      if (tile.reloadCallback) {
        this.loadVectorTile(tile, tile.reloadCallback);
        tile.reloadCallback = null;
      }
    };

    const url = this.map?._requestManager.normalizeTileURL(
      tile.tileID.canonical.url(this.tiles, this.scheme),
    );
    const request = this.map?._requestManager.transformRequest(url, 'Tile');

    const params = {
      request,
      data: {},
      uid: tile.uid,
      tileID: tile.tileID,
      tileZoom: tile.tileZoom,
      zoom: tile.tileID.overscaledZ,
      tileSize: this.tileSize * tile.tileID.overscaleFactor(),
      type: 'vector',
      source: this.id,
      scope: this.scope,
      showCollisionBoxes: this.map?.showCollisionBoxes,
      promoteId: this.promoteId,
      isSymbolTile: tile.isSymbolTile,
      extraShadowCaster: tile.isExtraShadowCaster,
    };

    const afterLoad = (
      error: any,
      data: any,
      cacheControl: any,
      expires: any,
    ) => {
      if (error || !data) {
        done.call(this, error);
        return;
      }

      params.data = {
        cacheControl,
        expires,
        rawData: data,
      };
      // the worker will skip the network request if the data is already there
      if (this.map._refreshExpiredTiles)
        tile.setExpiryData({ cacheControl, expires });
      if (tile.actor)
        tile.actor.send('loadTile', params, done.bind(this), undefined, true);
    };

    this.fixTile(tile);
    if (!tile.actor || tile.state === 'expired') {
      tile.actor = this._tileWorkers[url] =
        this._tileWorkers[url] || this.dispatcher.getActor();

      tile.request = this._protocol.tile({ ...request }, afterLoad);
      // always load tiles on the main thread and pass the result instead of
      // requesting a worker to do so
    } else if (tile.state === 'loading') {
      // schedule tile reloading after it has been loaded
      tile.reloadCallback = callback;
    } else {
      tile.request = this._protocol.tile({ ...tile, url }, afterLoad);
    }
  }

  loadRasterTileData(tile: Tile, data: any): void {
    tile.setTexture(data, this.map.painter);
  }

  loadRasterTile(tile: Tile, callback: Callback<void>): void {
    const done = ({ data, cacheControl, expires }: any) => {
      delete tile.request;

      if (tile.aborted) return callback(null);

      // If the implementation returned `null` as tile data, mark the tile as
      // `loaded` and use an empty image; the map renders nothing in its space.
      if (data === null || data === undefined) {
        const emptyImage = {
          width: this.tileSize,
          height: this.tileSize,
          data: null as any,
        };
        this.loadRasterTileData(tile, emptyImage as any);
        tile.state = 'loaded';
        return callback(null);
      }

      if (data && data.resourceTiming)
        tile.resourceTiming = data.resourceTiming;

      if (this.map._refreshExpiredTiles)
        tile.setExpiryData({ cacheControl, expires });

      const blob = new window.Blob([new Uint8Array(data)], {
        type: 'image/png',
      });
      window
        .createImageBitmap(blob)
        .then((imageBitmap) => {
          this.loadRasterTileData(tile, imageBitmap);
          tile.state = 'loaded';
          callback(null);
        })
        .catch((error: Error) => {
          tile.state = 'errored';
          return callback(
            new Error(
              `Can't infer data type for ${this.id}, only raster data supported at the moment. ${error}`,
            ),
          );
        });
    };

    const url = this.map?._requestManager.normalizeTileURL(
      tile.tileID.canonical.url(this.tiles, this.scheme),
    );
    const request = this.map?._requestManager.transformRequest(url, 'Tile');
    this.fixTile(tile);
    const controller = new AbortController();
    tile.request = { cancel: () => controller.abort() };
    this._protocol
      .tile(request, controller)
      .then(done.bind(this))
      .catch((error: any) => {
        // silence AbortError
        if (error.code === 20) return;
        tile.state = 'errored';
        callback(error);
      });
  }
}

export default PmTilesSource;
