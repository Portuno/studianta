
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';

// Additional safety check for process
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: { API_KEY: '' } };
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    // StrictMode deshabilitado temporalmente para evitar doble renderizado en desarrollo
    // que puede causar recargas molestas al cambiar de pestaña
    <App />
  );
}
