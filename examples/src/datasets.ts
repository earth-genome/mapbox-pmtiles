export interface Dataset {
  url: string;
  /** Vector tile layer name within the archive (omitted for raster). */
  sourceLayer?: string;
  center: [number, number];
  zoom: number;
  attribution: string;
}

/** Public sample PMTiles archives used across the demos. */
export const DATASETS = {
  /** Overture POIs (points) around Hanoi. */
  pois: {
    url: 'https://r2-public.protomaps.com/protomaps-sample-datasets/overture-pois.pmtiles',
    sourceLayer: 'pois',
    center: [105.8342, 21.0278],
    zoom: 13,
    attribution: 'Overture Maps Foundation · sample hosted by Protomaps',
  },
  /** New Zealand building footprints (polygons), Christchurch. */
  buildings: {
    url: 'https://r2-public.protomaps.com/protomaps-sample-datasets/nz-buildings-v3.pmtiles',
    sourceLayer: 'buildings',
    center: [172.6362, -43.5321],
    zoom: 14,
    attribution: 'LINZ NZ Building Outlines · sample hosted by Protomaps',
  },
  /** USGS topo raster (WebP) over Mt Whitney, California. */
  rasterWhitney: {
    url: 'https://pmtiles.io/usgs-mt-whitney-8-15-webp-512.pmtiles',
    center: [-118.2923, 36.5777],
    zoom: 12,
    attribution: 'USGS topo · sample hosted by Protomaps',
  },
} satisfies Record<string, Dataset>;
