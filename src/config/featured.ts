/**
 * おすすめ（PICK UP）の吹き出しラベル。3枚ぶん。
 * featuredVideoIds と同じ順でラベルが対応する。
 */
export const featuredLabels: string[] = [
  'はじめましての方はこちら！',
  'いちおし配信！',
  'もう一杯どうぞ！',
];

/**
 * おすすめ（PICK UP）に固定表示する動画ID（featuredLabels と同じ順で対応）。
 * 空配列なら従来どおり「最新動画の上位3本」を自動表示する。
 * ID＝YouTube URL の `watch?v=○○○` または `/shorts/○○○` の○○○部分。
 */
export const featuredVideoIds: string[] = [
  'oHdlgT6KETw', // はじめましての方はこちら！
  'uIHqgRM4Mc4', // いちおし配信！
  '2_IxzzRJlq8', // もう一杯どうぞ！（Short）
];
