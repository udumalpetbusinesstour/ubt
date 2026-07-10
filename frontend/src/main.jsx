import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './app/globals.css';

// Early override of window.alert, window.confirm, and window.prompt to hook into our global React Modal System
let globalShowAlert = null;
let globalShowConfirm = null;
let globalShowPrompt = null;

if (typeof window !== 'undefined') {
  window.alert = (message, title = 'Notification') => {
    if (globalShowAlert) {
      return globalShowAlert(message, title);
    }
    console.warn("Early alert fallback:", message);
    return Promise.resolve();
  };

  window.confirm = (message, title = 'Confirm Action') => {
    if (globalShowConfirm) {
      return globalShowConfirm(message, title);
    }
    console.warn("Early confirm fallback:", message);
    return Promise.resolve(true);
  };

  window.prompt = (message, defaultValue = '', title = 'Input Required') => {
    if (globalShowPrompt) {
      return globalShowPrompt(message, defaultValue, title);
    }
    console.warn("Early prompt fallback:", message);
    return Promise.resolve(defaultValue);
  };
  
  window.__registerModalCallbacks = (showAlert, showConfirm, showPrompt) => {
    globalShowAlert = showAlert;
    globalShowConfirm = showConfirm;
    globalShowPrompt = showPrompt;
  };
}

// Centralized API URL Routing Interceptor for Production (Nginx / same-origin deployment)
// In development (VITE_DEV_SERVER), the Vite proxy forwards /api → localhost:5000.
// In production, the built frontend is served by Nginx on the same origin as the backend,
// so we use window.location.origin (same host/port). VITE_API_URL can override this.
let localApiUrl = 'http://localhost:5000';
if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  localApiUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
}

const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD && typeof window !== 'undefined' 
    ? window.location.origin
    : localApiUrl);

// Global Image URL Resolver to dynamically prepend correct backend domain
if (typeof window !== 'undefined') {
  window.getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:image')) return url;
    
    const backendBase = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    let cleanUrl = url;

    // Convert insecure http links to secure https on SSL environments (like staging/production) to prevent mixed-content blocking
    if (window.location.protocol === 'https:' && cleanUrl.startsWith('http://') && !cleanUrl.includes('localhost') && !cleanUrl.includes('127.0.0.1')) {
      cleanUrl = cleanUrl.replace('http://', 'https://');
    }

    // Replace old local references (both localhost and 127.0.0.1) on production/staging environments
    if (cleanUrl.startsWith('http://localhost:5000')) {
      const replaced = cleanUrl.replace('http://localhost:5000', backendBase);
      if (replaced.includes('/uploads/')) {
        return replaced.replace('/uploads/', '/api/uploads/');
      }
      return replaced;
    }
    if (cleanUrl.startsWith('http://127.0.0.1:5000')) {
      const replaced = cleanUrl.replace('http://127.0.0.1:5000', backendBase);
      if (replaced.includes('/uploads/')) {
        return replaced.replace('/uploads/', '/api/uploads/');
      }
      return replaced;
    }
    
    // Prefix relative paths with correct backend origin (routed via Nginx /api/uploads proxy)
    if (cleanUrl.startsWith('/uploads') || cleanUrl.startsWith('uploads')) {
      const formattedUrl = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
      return `${backendBase}/api${formattedUrl}`;
    }
    
    return cleanUrl;
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
