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

// レターボックス帯＆透過部の塗り色 = 元画像の「支配色（最頻色）」。
// 角ピクセルを直接読む方式は、四隅が透過の画像（IMG_5834 等）だと alpha を無視して
// rgb(0,0,0) を拾うなど誤検出しうる。ヒストグラムから地色を決める stats().dominant なら
// 黒地KVは黒・灰地KVは灰が安定して得られ、SRC を差し替えても安全。
const { dominant } = await sharp(SRC).stats();
const background = { r: dominant.r, g: dominant.g, b: dominant.b };

const info = await sharp(SRC)
  .resize(W, H, { fit: 'contain', background })
  .flatten({ background }) // 透過があっても背景色で塗りつぶす（JPEGは透過不可）
  .jpeg({ quality: 82, mozjpeg: true, progressive: true })
  .toFile(OUT);

const kb = info.size / 1024;
console.log(`元: ${SRC}`);
console.log(`出力: ${OUT}  ${info.width}x${info.height}  ${kb.toFixed(1)} KB`);
console.log(`帯・地の色(支配色): rgb(${background.r}, ${background.g}, ${background.b})`);
