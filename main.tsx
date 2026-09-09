import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import Home from './app/page';
import './app/globals.css';
const root = document.getElementById('root')!;
const app = (
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
