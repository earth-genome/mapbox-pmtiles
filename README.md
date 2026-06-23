# @earthgenome/mapbox-pmtiles

Render [PMTiles](https://github.com/protomaps/PMTiles) vector **and** raster
archives directly in [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) —
with first-class, framework-agnostic React helpers.

- **Type-safe** `PmTilesSource` custom source for Mapbox GL JS v3.
- **Auto-detects** vector vs. raster archives and reads `minzoom` / `maxzoom` /
  bounds straight from the PMTiles header.
- **Use it your way.** A tiny imperative API for vanilla Mapbox, a universal
  React hook/component that works with **any** version of `react-map-gl`, and a
  zero-wiring `<PmTilesSource>` for `react-map-gl` v8.
- **No forced dependency.** `react` and `react-map-gl` are *optional* peers —
  pull in only what you actually import.

> Built on the excellent [`mapbox-pmtiles`](https://github.com/am2222/mapbox-pmtiles)
> source, repackaged for TypeScript and React.

## Installation

```bash
npm install @earthgenome/mapbox-pmtiles mapbox-gl pmtiles
```

`mapbox-gl` and `pmtiles` are peer dependencies. Add `react` and/or
`react-map-gl` only if you use the React entry points.

## Entry points

| Import path | Needs | What you get |
| --- | --- | --- |
| `@earthgenome/mapbox-pmtiles` | `mapbox-gl`, `pmtiles` | `PmTilesSource` class + imperative helpers. No React. |
| `@earthgenome/mapbox-pmtiles/react` | `+ react` | `usePmTilesSource` hook & a `<PmTilesSource map={...}>` component. Works with vanilla Mapbox-in-React and any `react-map-gl` version. |
| `@earthgenome/mapbox-pmtiles/react-map-gl` | `+ react-map-gl` (v8) | A zero-wiring `<PmTilesSource>` that reads the map from `react-map-gl` context. |

---

## Vanilla Mapbox GL JS

```ts
import mapboxgl from 'mapbox-gl';
import { addPmTilesSource } from '@earthgenome/mapbox-pmtiles';

const PMTILES_URL =
  'https://r2-public.protomaps.com/protomaps-sample-datasets/protomaps-basemap-opensource-20230408.pmtiles';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/empty-v9',
  accessToken: 'pk....',
});

map.on('load', async () => {
  // Registers the custom source type, fetches the header, and adds the source
  // with the right minzoom/maxzoom/bounds.
  await addPmTilesSource(map, 'protomaps', { url: PMTILES_URL });

  map.addLayer({
    id: 'places',
    type: 'circle',
    source: 'protomaps',
    'source-layer': 'places',
    paint: { 'circle-color': 'steelblue' },
  });
});
```

Prefer to wire it up yourself? Register the type and add the source manually:

```ts
import mapboxgl from 'mapbox-gl';
import { PmTilesSource, registerPmTilesSourceType } from '@earthgenome/mapbox-pmtiles';

registerPmTilesSourceType(); // or: mapboxgl.Style.setSourceType(PmTilesSource.SOURCE_TYPE, PmTilesSource)

const header = await PmTilesSource.getHeader(PMTILES_URL);
map.addSource('protomaps', {
  type: PmTilesSource.SOURCE_TYPE,
  url: PMTILES_URL,
  minzoom: header.minZoom,
  maxzoom: header.maxZoom,
});
```

---

## react-map-gl (v8) — zero wiring

Drop `<PmTilesSource>` anywhere inside a `<Map>`; it grabs the map from context,
adds the source, and renders its child layers once the source is ready.

```tsx
import { Map, Layer } from 'react-map-gl/mapbox';
import { PmTilesSource } from '@earthgenome/mapbox-pmtiles/react-map-gl';

export function MyMap() {
  return (
    <Map
      mapboxAccessToken="pk...."
      initialViewState={{ longitude: 0, latitude: 0, zoom: 2 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      <PmTilesSource id="parcels" url={PMTILES_URL}>
        <Layer
          id="parcels-fill"
          type="fill"
          source="parcels"
          source-layer="parcels"
          paint={{ 'fill-color': '#088', 'fill-opacity': 0.4 }}
        />
      </PmTilesSource>
    </Map>
  );
}
```

---

## Any React + Mapbox setup (universal)

The `@earthgenome/mapbox-pmtiles/react` entry point doesn't depend on `react-map-gl`,
so it works with vanilla Mapbox-in-React **and** every `react-map-gl` version
(including the legacy `react-map-gl/mapbox-legacy` binding). Just hand it the
map.

### The hook

```tsx
import { useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePmTilesSource } from '@earthgenome/mapbox-pmtiles/react';

function useParcels(map: mapboxgl.Map | null) {
  const { loaded, header, error } = usePmTilesSource(map, {
    id: 'parcels',
    url: PMTILES_URL,
  });
  // ...add your layers once `loaded` is true
}
```

`usePmTilesSource` accepts a raw `mapboxgl.Map`, a `react-map-gl` `MapRef`
(`useMap().current`), or a `RefObject` to either — whatever you already have.

### The component

```tsx
import { useMap, Layer } from 'react-map-gl/mapbox-legacy';
import { PmTilesSource } from '@earthgenome/mapbox-pmtiles/react';

function Parcels() {
  const { current: map } = useMap();
  return (
    <PmTilesSource map={map} id="parcels" url={PMTILES_URL}>
      <Layer id="parcels-fill" type="fill" source="parcels"
        source-layer="parcels" paint={{ 'fill-color': '#088' }} />
    </PmTilesSource>
  );
}
```

> The source is added once the map's style is ready and is automatically
> re-added across style reloads/navigations — a common foot-gun handled for you.

> **Next.js / RSC:** the React helpers run in the browser (they use hooks and
> the Mapbox runtime). Import them from a Client Component — i.e. a file with
> `'use client'` at the top — just like `react-map-gl` itself. The core,
> non-React exports (e.g. `getPmTilesHeader`) are safe to use anywhere.

---

## API

### Core (`@earthgenome/mapbox-pmtiles`)

- `PmTilesSource` — the Mapbox custom source class. `PmTilesSource.SOURCE_TYPE`,
  `PmTilesSource.getHeader(url)`, `PmTilesSource.getMetadata(url)`.
- `SOURCE_TYPE` — the `'pmtile-source'` type string.
- `registerPmTilesSourceType(mapbox?)` — idempotently register the source type.
- `addPmTilesSource(map, id, options)` — register + fetch header + `addSource`;
  resolves with the PMTiles header.
- `removePmTilesSource(map, id)` — remove the source if present.
- `getPmTilesHeader(url)` / `getPmTilesMetadata(url)`.
- `TileType` (re-exported from `pmtiles`).
- Types: `PmTilesOptions`, `PmTilesHeader`.

### React (`@earthgenome/mapbox-pmtiles/react`)

- `usePmTilesSource(map, options)` → `{ loaded, header, error }`.
- `<PmTilesSource map={...} id url ...>` component.
- `resolveMap(input)` utility.
- Types: `MapInput`, `UsePmTilesSourceOptions`, `UsePmTilesSourceResult`.
- Re-exports the full core surface for convenience.

### react-map-gl (`@earthgenome/mapbox-pmtiles/react-map-gl`)

- `<PmTilesSource id url ...>` — context-aware (reads `useMap()` from
  `react-map-gl/mapbox`). Accepts an optional `map` prop to override context.

#### Options (`PmTilesOptions`)

| Field | Type | Description |
| --- | --- | --- |
| `url` | `string` | The PMTiles archive URL. |
| `minzoom` | `number?` | Override the header's min zoom. |
| `maxzoom` | `number?` | Override the header's max zoom. |
| `promoteId` | `PromoteIdSpecification?` | Property to use as a feature id (for feature state). |

## License

MIT
