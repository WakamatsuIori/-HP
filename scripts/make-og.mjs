/**
 * OGP画像（SNSシェア時のカード画像）を生成するスクリプト（開発時に手動実行・ビルドには含めない）。
 *
 * 横長キービジュアル(1920×1080)を OGP 標準の 1200×630 に変換して public/og.jpg を作る。
 * fit:contain なので絵を一切切らず、足りない左右は元画像の角の色（=背景色）で埋める
 *   → 黒背景KVなら帯も黒で見えない。比率は正確な 1200×630。
 *
 * 依存: sharp（Astro が内部で使用＝既にインストール済み。新規依存なし）。
 *
 * 使い方:
 *   cd vtuber-hp
 *   node scripts/make-og.mjs
 *
 * 別のキービジュアルにしたい場合は SRC を src/assets/IMG_5833.png（グレー背景）等に変える。
 */
import sharp from 'sharp';

const SRC = 'src/assets/IMG_5834.png'; // 黒背景のキービジュアル
const OUT = 'public/og.jpg';
const W = 1200;
const H = 630;

// 元画像の角の色を取得し、レターボックス帯の色に使う（帯を背景に溶け込ませる）。
const corner = await sharp(SRC)
  .extract({ left: 0, top: 0, width: 4, height: 4 })
  .raw()
  .toBuffer({ resolveWithObject: true });
const background = { r: corner.data[0], g: corner.data[1], b: corner.data[2] };

const info = await sharp(SRC)
  .resize(W, H, { fit: 'contain', background })
  .flatten({ background }) // 透過があっても背景色で塗りつぶす（JPEGは透過不可）
  .jpeg({ quality: 82, mozjpeg: true, progressive: true })
  .toFile(OUT);

const kb = info.size / 1024;
console.log(`元: ${SRC}`);
console.log(`出力: ${OUT}  ${info.width}x${info.height}  ${kb.toFixed(1)} KB`);
console.log(`帯の色(角): rgb(${background.r}, ${background.g}, ${background.b})`);
