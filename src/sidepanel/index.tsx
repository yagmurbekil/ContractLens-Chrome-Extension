import React from 'react';
import { createRoot } from 'react-dom/client';
import { SidepanelApp } from './SidepanelApp';
import '../styles/index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SidepanelApp />);
}
