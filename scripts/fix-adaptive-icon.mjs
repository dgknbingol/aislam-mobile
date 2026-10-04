/**
 * Android adaptive icon: foreground'u safe-zone'a küçült (şeffaf kenar),
 * böylece launcher squircle/mask köşeleri görünür — daire "pul" etkisi azalır.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const assetsDir = path.resolve('assets');
const source = path.join(assetsDir, 'icon.png');
const size = 1024;
/** Adaptive icon safe zone ~66% */
const contentSize = Math.round(size * 0.66);
const offset = Math.round((size - contentSize) / 2);
const bg = { r: 11, g: 26, b: 51, alpha: 255 }; // #0B1A33

const content = await sharp(source)
  .resize(contentSize, contentSize, { fit: 'cover' })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: size,
    height: size,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: content, left: offset, top: offset }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(assetsDir, 'android-icon-foreground.png'));

await sharp({
  create: {
    width: size,
    height: size,
    channels: 3,
    background: bg,
  },
})
  .png({ compressionLevel: 9 })
  .toFile(path.join(assetsDir, 'android-icon-background.png'));

const fgMeta = await sharp(path.join(assetsDir, 'android-icon-foreground.png')).metadata();
const bgMeta = await sharp(path.join(assetsDir, 'android-icon-background.png')).metadata();
console.log(`foreground: ${fgMeta.width}x${fgMeta.height} hasAlpha=${fgMeta.hasAlpha}`);
console.log(`background: ${bgMeta.width}x${bgMeta.height}`);
console.log('OK — yeni native build gerekir (eas build).');
