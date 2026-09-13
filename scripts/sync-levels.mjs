import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const target = resolve(root, 'public/levels');
const levels = [2, 3, 4, 5, 6];

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await Promise.all(levels.map((level) => cp(
  resolve(root, `level${level}.html`),
  resolve(target, `level${level}.html`)
)));

// Existing lessons may refer to the two shared images with relative paths.
for (const asset of ['boy_image.png', 'image-removebg-preview.png']) {
  await cp(resolve(root, asset), resolve(target, asset));
}

console.log(`Synced supplied levels ${levels.join('–')} to public/levels.`);
