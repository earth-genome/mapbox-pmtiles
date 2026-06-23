import mapboxgl from 'mapbox-gl';

import { PmTilesSource, SOURCE_TYPE } from './PmTilesSource';

let registered = false;

/**
 * Registers the {@link PmTilesSource} custom source type on a `mapboxgl`
 * instance so that `map.addSource(id, { type: 'pmtile-source', url })` works.
 *
 * This is idempotent and safe to call as many times as you like — only the
 * first call has an effect. It must be called before any map of that instance
 * tries to add a `pmtile-source`.
 *
 * Because `mapbox-gl` is a peer dependency, the instance imported here is the
 * same one your app uses, so the default works in virtually all setups. The
 * optional `mapbox` argument exists only for advanced cases where you have
 * multiple `mapbox-gl` copies and need to register on a specific one.
 *
 * @param mapbox The `mapboxgl` namespace to register on. Defaults to the
 * `mapbox-gl` resolved by this package.
 */
export function registerPmTilesSourceType(
  mapbox: typeof mapboxgl = mapboxgl,
): void {
  if (registered) return;
  // `setSourceType` is a real runtime API but accepts Mapbox's internal source
  // class shape, which our typed subclass widens; the cast bridges that gap.
  mapbox.Style.setSourceType(
    SOURCE_TYPE,
    PmTilesSource as unknown as Parameters<
      typeof mapbox.Style.setSourceType
    >[1],
  );
  registered = true;
}

/** Whether {@link registerPmTilesSourceType} has already run in this session. */
export function isPmTilesSourceTypeRegistered(): boolean {
  return registered;
}
