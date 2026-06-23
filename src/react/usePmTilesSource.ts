import { useEffect, useRef, useState } from 'react';
import type mapboxgl from 'mapbox-gl';

import { addPmTilesSource } from '../core/helpers';
import { registerPmTilesSourceType } from '../core/register';
import type { PmTilesHeader, PmTilesOptions } from '../core/types';

/** Anything with a `getMap()` accessor (e.g. a react-map-gl `MapRef`). */
interface MapRefLike {
  getMap: () => mapboxgl.Map | null | undefined;
}

/** Anything with a `.current` (e.g. a React `RefObject`). */
interface RefLike {
  current: MapInput;
}

/**
 * Every shape this package knows how to turn into a Mapbox `Map`:
 * a raw `Map`, a react-map-gl `MapRef`, a `RefObject` wrapping either, or
 * nullish (not ready yet).
 */
export type MapInput =
  | mapboxgl.Map
  | MapRefLike
  | RefLike
  | null
  | undefined;

/** Resolve any {@link MapInput} to a concrete Mapbox `Map`, or `null`. */
export function resolveMap(input: MapInput): mapboxgl.Map | null {
  if (!input) return null;
  if ('current' in input) return resolveMap((input as RefLike).current);
  if ('getMap' in input && typeof input.getMap === 'function') {
    return (input as MapRefLike).getMap() ?? null;
  }
  return input as mapboxgl.Map;
}

/** Options for {@link usePmTilesSource}. */
export interface UsePmTilesSourceOptions extends PmTilesOptions {
  /** The source id to register on the map. */
  id: string;
  /**
   * Remove the source from the map when the component unmounts. Defaults to
   * `false` because removing a source that still has layers throws in Mapbox;
   * remove your layers first, or leave this off and let the style own it.
   */
  removeOnUnmount?: boolean;
}

/** Return value of {@link usePmTilesSource}. */
export interface UsePmTilesSourceResult {
  /** `true` once the source has been added to the map. */
  loaded: boolean;
  /** The PMTiles header, available after the source loads. */
  header: PmTilesHeader | null;
  /** Any error encountered while loading the archive or adding the source. */
  error: Error | null;
}

/**
 * Adds a PMTiles source to a Mapbox map and keeps it attached across style
 * reloads — the React-friendly equivalent of {@link addPmTilesSource}.
 *
 * It is deliberately decoupled from any particular React/Mapbox binding: pass
 * it a raw `mapboxgl.Map`, a react-map-gl `MapRef` (e.g. `useMap().current`),
 * or a `RefObject` to one. That makes it work with vanilla Mapbox-in-React as
 * well as any version of react-map-gl.
 *
 * @example Vanilla Mapbox in React
 * ```tsx
 * const mapRef = useRef<mapboxgl.Map | null>(null);
 * usePmTilesSource(mapRef, { id: 'parcels', url: PMTILES_URL });
 * ```
 *
 * @example react-map-gl
 * ```tsx
 * const { current: map } = useMap();
 * usePmTilesSource(map, { id: 'parcels', url: PMTILES_URL });
 * ```
 */
export function usePmTilesSource(
  map: MapInput,
  options: UsePmTilesSourceOptions,
): UsePmTilesSourceResult {
  const { id, url, minzoom, maxzoom, promoteId, removeOnUnmount } = options;

  const [loaded, setLoaded] = useState(false);
  const [header, setHeader] = useState<PmTilesHeader | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Avoid firing overlapping header requests as `styledata` fires repeatedly.
  const inFlight = useRef(false);

  useEffect(() => {
    const resolved = resolveMap(map);
    if (!resolved) return;

    registerPmTilesSourceType();

    let cancelled = false;
    setLoaded(false);

    const isAlive = () => {
      try {
        return !!resolved.getStyle();
      } catch {
        return false;
      }
    };

    const attemptLoad = () => {
      if (cancelled || inFlight.current || !isAlive()) return;

      // `style._loaded` reflects only whether the style can accept
      // `addSource`, independent of per-source loading state — unlike
      // `map.isStyleLoaded()`, which also goes false while sources load.
      const style = (resolved as unknown as { style?: { _loaded?: boolean } })
        .style;
      if (!style?._loaded) return;

      if (resolved.getSource(id)) {
        setLoaded(true);
        return;
      }

      inFlight.current = true;
      addPmTilesSource(resolved, id, { url, minzoom, maxzoom, promoteId })
        .then((h) => {
          if (cancelled) return;
          if (h) setHeader(h);
          setLoaded(true);
        })
        .catch((e: unknown) => {
          if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
        })
        .finally(() => {
          inFlight.current = false;
        });
    };

    // Try immediately (style may already be ready), then on every styledata —
    // `attemptLoad` is idempotent, so re-firing is safe and handles
    // re-navigation races where `style.load` fires before we subscribe.
    attemptLoad();
    resolved.on('styledata', attemptLoad);

    return () => {
      cancelled = true;
      resolved.off('styledata', attemptLoad);
      if (removeOnUnmount && isAlive() && resolved.getSource(id)) {
        try {
          resolved.removeSource(id);
        } catch {
          // ignore: source likely still referenced by layers
        }
      }
    };
  }, [map, id, url, minzoom, maxzoom, promoteId, removeOnUnmount]);

  return { loaded, header, error };
}
