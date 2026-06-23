import { useEffect, useState, type ComponentType } from 'react';

import {
  TOKEN_FROM_ENV,
  getMapboxToken,
  setMapboxToken,
} from './config';
import { DATASETS } from './datasets';
import { VanillaDemo } from './demos/VanillaDemo';
import { ReactMapGlDemo } from './demos/ReactMapGlDemo';
import { UniversalHookDemo } from './demos/UniversalHookDemo';
import { RasterDemo } from './demos/RasterDemo';
import { CodeBlock } from './CodeBlock';

// The displayed source is the real demo file, imported verbatim via Vite's
// `?raw` loader — so the docs can never drift from what actually runs.
import vanillaCode from './demos/VanillaDemo.tsx?raw';
import reactMapGlCode from './demos/ReactMapGlDemo.tsx?raw';
import universalCode from './demos/UniversalHookDemo.tsx?raw';
import rasterCode from './demos/RasterDemo.tsx?raw';

interface Demo {
  id: string;
  title: string;
  tagline: string;
  description: string;
  importPath: string;
  Component: ComponentType;
  code: string;
  attribution: string;
}

const DEMOS: Demo[] = [
  {
    id: 'vanilla',
    title: 'Vanilla Mapbox GL JS',
    tagline: 'No React bindings · imperative',
    description:
      'Use the framework-agnostic helpers directly on a `mapboxgl.Map`. ' +
      '`addPmTilesSource` registers the custom source type, reads the header for ' +
      'zoom/bounds, and adds the source — then you add layers as normal.',
    importPath: "import { addPmTilesSource } from '@earthgenome/mapbox-pmtiles'",
    Component: VanillaDemo,
    code: vanillaCode,
    attribution: DATASETS.buildings.attribution,
  },
  {
    id: 'react-map-gl',
    title: 'react-map-gl',
    tagline: 'Zero wiring · declarative',
    description:
      'Drop `<PmTilesSource>` anywhere inside a react-map-gl `<Map>`. It reads ' +
      'the map from context, adds the source, and renders its `<Layer>` children ' +
      'once the source is ready.',
    importPath:
      "import { PmTilesSource } from '@earthgenome/mapbox-pmtiles/react-map-gl'",
    Component: ReactMapGlDemo,
    code: reactMapGlCode,
    attribution: DATASETS.pois.attribution,
  },
  {
    id: 'universal-hook',
    title: 'Universal React hook',
    tagline: 'Any React + Mapbox setup',
    description:
      '`usePmTilesSource` works without react-map-gl. Hand it any map you have — ' +
      'a raw `mapboxgl.Map`, a react-map-gl `MapRef`, or a ref to either — and it ' +
      'keeps the source attached across style reloads.',
    importPath:
      "import { usePmTilesSource } from '@earthgenome/mapbox-pmtiles/react'",
    Component: UniversalHookDemo,
    code: universalCode,
    attribution: DATASETS.buildings.attribution,
  },
  {
    id: 'raster',
    title: 'Raster archives',
    tagline: 'Auto-detected · same API',
    description:
      'PMTiles can hold raster tiles too. The source detects the archive’s tile ' +
      'type and configures itself as a raster source automatically — a plain ' +
      '`type="raster"` layer is all you need.',
    importPath:
      "import { PmTilesSource } from '@earthgenome/mapbox-pmtiles/react-map-gl'",
    Component: RasterDemo,
    code: rasterCode,
    attribution: DATASETS.rasterWhitney.attribution,
  },
];

const REPO_URL = 'https://github.com/earthgenome/mapbox-pmtiles';

function useHashRoute(defaultId: string): [string, (id: string) => void] {
  const read = () => window.location.hash.replace(/^#\/?/, '') || defaultId;
  const [id, setId] = useState(read);

  useEffect(() => {
    const onHash = () => setId(read());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = (next: string) => {
    window.location.hash = `/${next}`;
  };
  return [id, navigate];
}

export default function App() {
  const [activeId, navigate] = useHashRoute(DEMOS[0].id);
  const active = DEMOS.find((d) => d.id === activeId) ?? DEMOS[0];
  const { Component } = active;

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <h1>@earthgenome/mapbox-pmtiles</h1>
          <p>
            Render PMTiles vector &amp; raster sources in Mapbox GL JS — with
            first-class React helpers.
          </p>
        </div>
        <div className="app__actions">
          <TokenControl />
          <a
            className="app__repo"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      <nav className="tabs">
        {DEMOS.map((d) => (
          <button
            key={d.id}
            className={`tab${d.id === active.id ? ' tab--active' : ''}`}
            onClick={() => navigate(d.id)}
          >
            <span className="tab__title">{d.title}</span>
            <span className="tab__tagline">{d.tagline}</span>
          </button>
        ))}
      </nav>

      <main className="demo">
        <section className="demo__info">
          <h2>{active.title}</h2>
          <p
            className="demo__desc"
            dangerouslySetInnerHTML={{ __html: renderInlineCode(active.description) }}
          />
          <code className="demo__import">{active.importPath}</code>
        </section>

        <section className="demo__stage">
          {/* Remount the map when switching demos so each gets a clean map. */}
          <Component key={active.id} />
          <p className="demo__attr">Data: {active.attribution}</p>
        </section>

        <section className="demo__code">
          <div className="demo__code-head">
            <span>{`demos/${pascalToFile(active.id)}`}</span>
            <CopyButton text={active.code} />
          </div>
          <CodeBlock code={active.code} />
        </section>
      </main>
    </div>
  );
}

function TokenControl() {
  const [value, setValue] = useState(() => getMapboxToken());
  const hasToken = value.trim().length > 0;

  const apply = (token: string) => {
    setMapboxToken(token);
    // Reload so every map re-initialises with the new token / base style.
    window.location.reload();
  };

  if (TOKEN_FROM_ENV) {
    return (
      <div className="token token--env" title="Provided via VITE_MAPBOX_TOKEN">
        <span className="token__dot token__dot--on" />
        Token from env
      </div>
    );
  }

  return (
    <form
      className="token"
      onSubmit={(e) => {
        e.preventDefault();
        apply(value);
      }}
    >
      <span className={`token__dot${hasToken ? ' token__dot--on' : ''}`} />
      <input
        className="token__input"
        type="password"
        placeholder="Mapbox token (pk.…) — optional"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        aria-label="Mapbox access token"
      />
      <button className="token__btn" type="submit">
        Save
      </button>
      {hasToken ? (
        <button
          className="token__btn token__btn--ghost"
          type="button"
          onClick={() => {
            setValue('');
            apply('');
          }}
        >
          Clear
        </button>
      ) : (
        <a
          className="token__help"
          href="https://account.mapbox.com/access-tokens/"
          target="_blank"
          rel="noreferrer"
        >
          Get one ↗
        </a>
      )}
    </form>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/** Turn `` `code` `` spans in descriptions into <code> elements. */
function renderInlineCode(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
}

function pascalToFile(id: string): string {
  const map: Record<string, string> = {
    vanilla: 'VanillaDemo.tsx',
    'react-map-gl': 'ReactMapGlDemo.tsx',
    'universal-hook': 'UniversalHookDemo.tsx',
    raster: 'RasterDemo.tsx',
  };
  return map[id] ?? `${id}.tsx`;
}
