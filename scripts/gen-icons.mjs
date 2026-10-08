// Renders public/icons/icon.svg into the PNG sizes iOS and the manifest need.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = new URL('../public/icons/', import.meta.url);
const svg = await readFile(new URL('icon.svg', dir));

const out = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
];

for (const [name, size] of out) {
  await sharp(svg, { density: 384 }).resize(size, size).flatten({ background: '#000' }).png().toFile(fileURLToPath(new URL(name, dir)));
  console.log('wrote', name);
}
