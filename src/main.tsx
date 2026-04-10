import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { useStore } from './state/store';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Keyboard shortcuts — skip when the user is typing into a form control
// so shortcuts don't hijack input in date/number/text fields, selects, or
// contenteditable areas.
window.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement | null;
  if (target) {
    const tag = target.tagName;
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }
  }
  // Ignore when modifier keys are held — those are browser shortcuts.
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key.toLowerCase() === 'r') {
    // reset zoom
    useStore.getState().setZoom(0, 100 * 12);
  }
});

// Service Worker registration for PWA / offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/financial-dashboard/sw.js', { scope: '/financial-dashboard/' })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}



