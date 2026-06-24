import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './app/globals.css';

// Centralized API URL Routing Interceptor for Production (Nginx / same-origin deployment)
// In development (VITE_DEV_SERVER), the Vite proxy forwards /api → localhost:5000.
// In production, the built frontend is served by Nginx on the same origin as the backend,
// so we use window.location.origin (same host/port). VITE_API_URL can override this.
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD && typeof window !== 'undefined' 
    ? window.location.origin
    : 'http://localhost:5000');

// Global Image URL Resolver to dynamically prepend correct backend domain
if (typeof window !== 'undefined') {
  window.getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:image')) return url;
    
    const backendBase = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

    // Replace old local references on production/staging environments
    if (url.startsWith('http://localhost:5000')) {
      return url.replace('http://localhost:5000', backendBase);
    }
    
    // Prefix relative paths with correct backend origin
    if (url.startsWith('/uploads') || url.startsWith('uploads')) {
      const cleanUrl = url.startsWith('/') ? url : `/${url}`;
      return `${backendBase}${cleanUrl}`;
    }
    
    return url;
  };
}

if (API_URL !== 'http://localhost:5000') {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    if (typeof input === 'string' && input.startsWith('http://localhost:5000')) {
      input = input.replace('http://localhost:5000', API_URL);
    } else if (input instanceof URL && input.href.startsWith('http://localhost:5000')) {
      input = new URL(input.href.replace('http://localhost:5000', API_URL));
    } else if (input && typeof input === 'object' && input.url && input.url.startsWith('http://localhost:5000')) {
      const newUrl = input.url.replace('http://localhost:5000', API_URL);
      input = new Request(newUrl, input);
    }
    return originalFetch(input, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
