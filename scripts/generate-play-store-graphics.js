const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..', 'assets');
const out = path.join(root, 'store');

async function main() {
  fs.mkdirSync(out, { recursive: true });

  await sharp(path.join(root, 'icon.png')).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(out, 'play-icon-512.png'));

  const logo = await sharp(path.join(root, 'logo.png'))
    .resize(280, 280, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const wordmark = await sharp(path.join(root, 'brand-wordmark.png'))
    .resize({ width: 420, fit: 'inside' })
    .png()
    .toBuffer();

  const svg = Buffer.from(`<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#021734"/>
      <stop offset="100%" stop-color="#032A55"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#g)"/>
  <circle cx="820" cy="100" r="180" fill="#C9A227" fill-opacity="0.08"/>
  <circle cx="200" cy="420" r="140" fill="#C9A227" fill-opacity="0.06"/>
</svg>`);

  await sharp(svg)
    .composite([
      { input: logo, left: 80, top: 110 },
      { input: wordmark, left: 400, top: 180 },
    ])
    .png()
    .toFile(path.join(out, 'play-feature-1024x500.png'));

  console.log('Created:');
  for (const f of fs.readdirSync(out)) {
    console.log('-', path.join(out, f), fs.statSync(path.join(out, f)).size, 'bytes');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
