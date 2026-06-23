# @earthgenome/mapbox-pmtiles — examples

A small [Vite](https://vitejs.dev/) + React app that demonstrates every way to
render PMTiles with this package. It powers the live demo on GitHub Pages and
doubles as living documentation — each tab shows a runnable map plus the exact
source for that demo.

Demos:

- **Vanilla Mapbox GL JS** — imperative `addPmTilesSource` (no React bindings).
- **react-map-gl** — the zero-wiring `<PmTilesSource>` from `/react-map-gl`.
- **Universal React hook** — `usePmTilesSource` with a raw `mapboxgl.Map`.
- **Raster archives** — auto-detected raster tiles via the same component.

## Mapbox token (optional)

The demos run **token-free** by default on [CARTO Dark Matter](https://github.com/CartoDB/basemap-styles)
(an open-source basemap — no `mapbox://` resources). Provide a Mapbox **public**
token (`pk.*`) to render on Mapbox dark-v11 instead. There are two ways:

- **In the app** — paste a token into the field in the header (top-right). It's
  saved to `localStorage`, so it stays on your machine and is never committed.
- **At build time** — set `VITE_MAPBOX_TOKEN`. Copy `.env.example` to
  `.env.local` for local dev, or set a repo secret named `MAPBOX_TOKEN` for the
  GitHub Pages deploy (see below). An env token takes precedence and hides the
  in-app field.

Get a token at <https://account.mapbox.com/access-tokens/>.

## Run locally

```bash
# from the repository root, build the library once so its types resolve
npm install
npm run build

# then start the example
cd examples
npm install
npm run dev
```

> The example imports `@earthgenome/mapbox-pmtiles` and its subpaths. In this
> repo a Vite alias points those at `../src` so you always run the latest code
> without rebuilding. In your own app you'd simply
> `npm install @earthgenome/mapbox-pmtiles` and the same imports resolve from
> `node_modules`.

## Build

```bash
npm run build     # outputs to examples/dist
npm run preview   # serve the production build locally
```

## Deployment

The repo's [`Deploy example to GitHub Pages`](../.github/workflows/deploy-example.yml)
workflow builds this app on every push to `main` and publishes `examples/dist`
to GitHub Pages. It sets `BASE_PATH=/<repo>/` so asset URLs resolve correctly
under the project site path.

To enable it: in the repository settings, set **Pages → Build and deployment →
Source** to **GitHub Actions**. Optionally add a **`MAPBOX_TOKEN`** repository
secret to deploy with a Mapbox basemap.
