import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') {
    // reset zoom
    import('./state/store').then(({ useStore }) => {
      useStore.getState().setZoom(0, 100 * 12);
    });
  }
});



