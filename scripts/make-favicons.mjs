// favicon.svg から検索エンジン/各OS用のラスター・アイコンを書き出す。
// Googleはサイトアイコンに PNG(48px以上の正方) や favicon.ico を拾うため、
// SVGだけだと検索結果で汎用アイコン（地球儀）になりがち。PNG/.ico を添えて拾われやすくする。
//
// 使い方: node scripts/make-favicons.mjs
// 生成物（public/ 直下・静的配信）:
//   favicon-48.png … rel="icon" 用
//   apple-touch-icon.png(180) … iOS/SNS共有用
//   favicon.ico (16/32/48 を内包) … 旧来の /favicon.ico フォールバック
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const svg = readFileSync(join(pub, 'favicon.svg'));

// SVGは64pxビューボックス。densityを上げて高解像度でラスタライズしてから縮小（くっきり）。
const render = (size) =>
  sharp(svg, { density: Math.round((72 * size) / 64) * 4 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

// PNG群
const pngs = {
  'favicon-48.png': 48,
  'apple-touch-icon.png': 180,
};
for (const [name, size] of Object.entries(pngs)) {
  const buf = await render(size);
  writeFileSync(join(pub, name), buf);
  console.log(`wrote ${name} (${size}x${size}, ${buf.length}B)`);
}

// favicon.ico … PNG内包ICO（16/32/48）。最近のブラウザ/Googleが解釈可。
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(icoSizes.map(render));
const count = icoPngs.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type=1(icon)
header.writeUInt16LE(count, 4);
const entries = [];
let offset = 6 + count * 16;
icoPngs.forEach((png, i) => {
  const e = Buffer.alloc(16);
  const s = icoSizes[i];
  e.writeUInt8(s >= 256 ? 0 : s, 0); // width
  e.writeUInt8(s >= 256 ? 0 : s, 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8); // size
  e.writeUInt32LE(offset, 12); // offset
  offset += png.length;
  entries.push(e);
});
writeFileSync(join(pub, 'favicon.ico'), Buffer.concat([header, ...entries, ...icoPngs]));
console.log(`wrote favicon.ico (${icoSizes.join('/')}px)`);
