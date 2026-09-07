import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const assetsDir = path.resolve('assets');
const navy = { r: 11, g: 26, b: 51, alpha: 1 };

async function optimizeIcon() {
  const input = path.join(assetsDir, 'icon.png');
  const output = path.join(assetsDir, 'splash-emblem.png');
  const iconOptimized = path.join(assetsDir, 'icon.optimized.png');

  await sharp(input)
    .resize(640, 640, { fit: 'contain', background: navy })
    .png({ compressionLevel: 9, palette: true })
    .toFile(output);

  await sharp(input)
    .resize(1024, 1024, { fit: 'contain', background: navy })
    .png({ compressionLevel: 9 })
    .toFile(iconOptimized);

  fs.renameSync(iconOptimized, input);

  console.log('icon.png + splash-emblem.png optimized');
}

async function createPortraitSplash() {
  const emblem = await sharp(path.join(assetsDir, 'splash-emblem.png'))
    .resize(900, 900, { fit: 'contain', background: navy })
    .toBuffer();

  await sharp({
    create: {
      width: 1080,
      height: 1920,
      channels: 4,
      background: navy,
    },
  })
    .composite([{ input: emblem, top: 420, left: 90 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(assetsDir, 'splash-screen.png'));

  console.log('splash-screen.png created (1080x1920)');
}

async function optimizeSupporting() {
  const targets = [
    ['android-icon-foreground.png', 432, 432],
    ['brand-wordmark.png', 800, 160],
    ['favicon.png', 192, 192],
  ];

  for (const [file, width, height] of targets) {
    const filePath = path.join(assetsDir, file);
    if (!fs.existsSync(filePath)) continue;

    const temp = `${filePath}.tmp`;
    await sharp(filePath)
      .resize(width, height, { fit: 'contain', background: navy })
      .png({ compressionLevel: 9 })
      .toFile(temp);
    fs.renameSync(temp, filePath);
    console.log(`${file} optimized`);
  }

  await sharp(path.join(assetsDir, 'icon.png'))
    .resize(192, 192, { fit: 'contain', background: navy })
    .png({ compressionLevel: 9 })
    .toFile(path.join(assetsDir, 'splash-icon.png'));

  await sharp(path.join(assetsDir, 'icon.png'))
    .resize(512, 512, { fit: 'contain', background: navy })
    .toFile(path.join(assetsDir, 'logo.png'));
}

await optimizeIcon();
await createPortraitSplash();
await optimizeSupporting();

for (const file of ['icon.png', 'splash-emblem.png', 'splash-screen.png', 'splash-icon.png']) {
  const stat = fs.statSync(path.join(assetsDir, file));
  console.log(file, `${Math.round(stat.size / 1024)}KB`);
}
