import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';
import App from './App';
import { MAPBOX_TOKEN } from './config';

// Set once globally so the imperative (vanilla / hook) demos pick it up.
mapboxgl.accessToken = MAPBOX_TOKEN;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
