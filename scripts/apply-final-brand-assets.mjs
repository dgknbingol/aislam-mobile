import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const assetsDir = path.resolve('assets');
const logoSrc =
  'C:/Users/dgknb/.cursor/projects/c-Users-dgknb-Desktop-Proje-Mobil-aislam-mobile/assets/c__Users_dgknb_AppData_Roaming_Cursor_User_workspaceStorage_cda3537b913bfd7db83bc15d89069351_images_son_logo-0daad8de-87a4-420a-ab7a-df9490e99f81.png';
const bannerSrc =
  'C:/Users/dgknb/.cursor/projects/c-Users-dgknb-Desktop-Proje-Mobil-aislam-mobile/assets/c__Users_dgknb_AppData_Roaming_Cursor_User_workspaceStorage_cda3537b913bfd7db83bc15d89069351_images_son_banner-c71f6b2f-1d3d-4f7b-91db-5c008b47d7eb.png';

fs.copyFileSync(logoSrc, path.join(assetsDir, 'logo-source.jpg'));
fs.copyFileSync(bannerSrc, path.join(assetsDir, 'splash-source.jpg'));

const icon1024 = await sharp(logoSrc)
  .resize(1024, 1024, { fit: 'cover' })
  .png({ compressionLevel: 9 })
  .toBuffer();

for (const name of ['icon.png', 'logo.png', 'splash-icon.png', 'favicon.png']) {
  fs.writeFileSync(path.join(assetsDir, name), icon1024);
}

const androidFg = await sharp(icon1024).resize(432, 432, { fit: 'cover' }).png().toBuffer();
fs.writeFileSync(path.join(assetsDir, 'android-icon-foreground.png'), androidFg);

const brandWordmark = await sharp(logoSrc)
  .extract({ left: 0, top: Math.round(852 * 0.68), width: 852, height: Math.round(852 * 0.28) })
  .resize(800, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
fs.writeFileSync(path.join(assetsDir, 'brand-wordmark.png'), brandWordmark);

const bannerMeta = await sharp(bannerSrc).metadata();
const targetWidth = 1080;
const targetHeight = Math.round(targetWidth * (bannerMeta.height / bannerMeta.width));

const splash = await sharp(bannerSrc)
  .resize(targetWidth, targetHeight, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toBuffer();

fs.writeFileSync(path.join(assetsDir, 'splash-screen.png'), splash);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splash);

for (const file of ['icon.png', 'splash-screen.png']) {
  const meta = await sharp(path.join(assetsDir, file)).metadata();
  const size = fs.statSync(path.join(assetsDir, file)).size;
  console.log(`${file}: ${meta.width}x${meta.height}, ${Math.round(size / 1024)}KB`);
}
