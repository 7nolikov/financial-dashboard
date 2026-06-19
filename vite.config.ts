import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Content-Security-Policy injected into the built index.html only. It's applied
// at build time (not in dev) because Vite's dev server relies on inline scripts
// and eval for HMR, which a strict CSP would block.
//   - script-src 'self': only the hashed bundle runs (the inline JSON-LD block
//     is data, not executed, so it's unaffected).
//   - style-src 'unsafe-inline': React/Visx emit inline style attributes.
//   - img-src data: blob:: inline SVG favicon + html-to-image export.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Note: frame-ancestors is intentionally omitted — it's ignored in a <meta>
  // CSP and would need an HTTP header, which GitHub Pages doesn't allow.
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), cspPlugin()],
  base: '/financial-dashboard/',
});
