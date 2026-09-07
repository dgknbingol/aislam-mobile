import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const assetsDir = path.resolve('assets');
const sourcePath = path.join(assetsDir, 'splash-source.png');
const refAspectPath =
  'C:/Users/dgknb/.cursor/projects/c-Users-dgknb-Desktop-Proje-Mobil-aislam-mobile/assets/c__Users_dgknb_AppData_Roaming_Cursor_User_workspaceStorage_cda3537b913bfd7db83bc15d89069351_images_asill-c6aaf053-1136-4452-8677-24dd0af8b590.png';

const refMeta = await sharp(refAspectPath).metadata();
const targetWidth = 1080;
const targetHeight = Math.round(targetWidth * (refMeta.height / refMeta.width));

console.log(`Target canvas: ${targetWidth}x${targetHeight} (ref ${refMeta.width}x${refMeta.height})`);

const sourceMeta = await sharp(sourcePath).metadata();
const scaledHeight = Math.round(targetWidth * (sourceMeta.height / sourceMeta.width));
const padTop = Math.floor((targetHeight - scaledHeight) / 2);
const padBottom = targetHeight - scaledHeight - padTop;

const scaled = await sharp(sourcePath).resize(targetWidth, scaledHeight, { fit: 'fill' }).toBuffer();

const skyStrip = await sharp(sourcePath)
  .extract({
    left: 0,
    top: 0,
    width: Math.round(sourceMeta.width * 0.4),
    height: 100,
  })
  .toBuffer();

const topFill = await sharp(skyStrip).resize(targetWidth, padTop, { fit: 'fill' }).toBuffer();

const bottomFill = await sharp(skyStrip)
  .flip()
  .resize(targetWidth, padBottom, { fit: 'fill' })
  .toBuffer();

const portraitSplash = await sharp({
  create: {
    width: targetWidth,
    height: targetHeight,
    channels: 4,
    background: { r: 8, g: 14, b: 32, alpha: 1 },
  },
})
  .composite([
    { input: topFill, top: 0, left: 0 },
    { input: scaled, top: padTop, left: 0 },
    { input: bottomFill, top: padTop + scaledHeight, left: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();

const splashOut = path.join(assetsDir, 'splash-screen.png');
const splashLegacy = path.join(assetsDir, 'splash.png');
fs.writeFileSync(splashOut, portraitSplash);
fs.writeFileSync(splashLegacy, portraitSplash);
console.log('splash-screen.png + splash.png written');

// App icon: center crop (logo + e-İslam text), unchanged pixels from source
const iconSize = 920;
const iconLeft = Math.round((sourceMeta.width - iconSize) / 2);
const iconTop = Math.round((sourceMeta.height - iconSize) / 2) - 20;

const icon1024 = await sharp(sourcePath)
  .extract({
    left: Math.max(0, iconLeft),
    top: Math.max(0, iconTop),
    width: Math.min(iconSize, sourceMeta.width),
    height: Math.min(iconSize, sourceMeta.height),
  })
  .resize(1024, 1024, { fit: 'cover' })
  .png({ compressionLevel: 9 })
  .toBuffer();

for (const name of ['icon.png', 'logo.png', 'splash-icon.png', 'favicon.png']) {
  fs.writeFileSync(path.join(assetsDir, name), icon1024);
}

const fg432 = await sharp(icon1024).resize(432, 432, { fit: 'cover' }).png().toBuffer();
fs.writeFileSync(path.join(assetsDir, 'android-icon-foreground.png'), fg432);

const wordmark = await sharp(sourcePath)
  .extract({
    left: Math.round(sourceMeta.width * 0.28),
    top: Math.round(sourceMeta.height * 0.72),
    width: Math.round(sourceMeta.width * 0.44),
    height: Math.round(sourceMeta.height * 0.22),
  })
  .resize(800, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
fs.writeFileSync(path.join(assetsDir, 'brand-wordmark.png'), wordmark);

for (const f of ['splash-screen.png', 'icon.png']) {
  const stat = fs.statSync(path.join(assetsDir, f));
  const m = await sharp(path.join(assetsDir, f)).metadata();
  console.log(f, `${m.width}x${m.height}`, `${Math.round(stat.size / 1024)}KB`);
}
