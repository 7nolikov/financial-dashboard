#!/usr/bin/env node
// Generates public/og-image.png from public/og-image.svg
// Run: node scripts/generate-og-image.mjs
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function main() {
  const svgPath = join(root, 'public', 'og-image.svg');
  const pngPath = join(root, 'public', 'og-image.png');

  const svgData = readFileSync(svgPath);

  try {
    const { Resvg } = await import('@resvg/resvg-js');
    const resvg = new Resvg(svgData, {
      fitTo: { mode: 'width', value: 1200 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    writeFileSync(pngPath, pngBuffer);
    console.log('✅ og-image.png generated at', pngPath);
  } catch (err) {
    console.error('❌ PNG generation failed:', err.message);
    console.log('ℹ️  og-image.svg is available as fallback');
    process.exit(1);
  }
}

main();
