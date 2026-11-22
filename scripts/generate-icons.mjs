import sharp from 'sharp';
import { resolve } from 'node:path';

const source = resolve('public/icons/icon.svg');

await Promise.all([
  sharp(source).resize(192, 192).png().toFile(resolve('public/icons/icon-192.png')),
  sharp(source).resize(512, 512).png().toFile(resolve('public/icons/icon-512.png')),
]);

console.log('Generated PWA icons.');
