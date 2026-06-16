# 調査まとめ（マスター要約） — 和香松庵 公式HP リソース

3回のクローリング（計14班）と素材取得・フォント導入の成果を1枚にまとめた索引です。
詳細は各カタログへ。サンプルは `D:\クロード作業用\effect-demos\` のHTMLを直接開いて確認。

---

## 📁 成果物の一覧

| 区分 | 場所 | 中身 |
|---|---|---|
| エフェクト集 | [effects-catalog.md](effects-catalog.md) | 8要素・約100エフェクト（純CSS優先・出典URL付き） |
| エフェクト深掘り＋再提案 | [effects-catalog-2-2026-deep.md](effects-catalog-2-2026-deep.md) | 2025–2026最新CSS/ティアダウン/Astro実装/性能・A11y＋実装優先順位（第1〜3波） |
| ヒーロー リバランス調査＋再提案 | [hero-rebalance-research.md](hero-rebalance-research.md) | 競合VTuberヒーロー解剖＋UX一次資料→CTA3→1・カウントダウン整理の再設計（PC/スマホ） |
| フォント精査 | [fonts-catalog.md](fonts-catalog.md) | 商用可フォント（日本語明朝/装飾/楷書/欧文）＋和欧ペアリング＋おすすめ |
| HP制作リソース | [hp-resources-catalog.md](hp-resources-catalog.md) | 素材/UI部品/最適化/SEO/機能案/配色/ツール |
| 動くサンプル | `effect-demos/index.html` | 要素別テストページ11枚＋フォント見本 |
| フォント実体 | `D:\クロード作業用\fonts\` | OFLフォント（DL済み・45ファミリー） |
| PC導入手順 | `effect-demos/フォントのPCインストール手順.md` | 右クリック/一括スクリプト |

✅ **フォントはPCにインストール済み**（ユーザー単位・99件成功）。PowerPoint等のアプリでも使用可。

---

## 🎯 結論サマリ（採用の当たり）

### フォント（3用途）
- **見出し**：しっぽり明朝（耽美寄り）or Zen Old Mincho（鉄板・現行続投）
- **ロゴ（ローマ字）**：Cinzel（＋繊細版 Cormorant Garamond）。数字は tabular
- **装飾アクセント**：黒華明朝（要DL＋見出しサブセット）／和名一語に佑字 肅（楷書）
- **本文**：ゴシック（游ゴシック/Noto Sans系）のまま＝可読性。明朝は見出し限定

### エフェクト
- **常設ベース（全部純CSS◎）**：金箔グラデ文字／立ち絵 浮遊＋呼吸＋後光／フィルムグレイン／金ヘアライン罫線／ホバー下線／:focus-visible金リング
- **トップ1箇所のリッチ枠（1つ選ぶ）**：Ken Burns背景 ／ カーソル追従の灯り ／ 純CSSパララックス
- **遷移**：Astro `<ClientRouter/>` のfade＋ロゴ `transition:name` 持続
- 重い案（GSAP/WebGL/tsParticles）は当面見送り

### 黒×金 配色（WCAG安全策）
- 背景は純黒を避け `#121212` 系／本文に使う金は明るめ（`#D0A900`級）、濃い金は見出し・罫線限定
- 本命トーン：背景`#F7F4EC` 墨`#1C1A17` くすみ金`#A8884E` 淡金線`#C9B68C`（実測必須）

---

## 🗺 推奨ロードマップ（見た目スプリント）

1. **フォント確定**（見本ページで選定）→ サブセット導入（既存 `scripts/subset_fonts.py` 流用・新依存ゼロ）
2. **OGP画像＋カードmeta**（astro-og-canvas or Satori）＝SNSシェアの第一印象
3. **配色コントラスト改善＋常設エフェクト**（金箔文字・立ち絵演出・グレイン・罫線）
4. **トップ1箇所のリッチ枠を1つ実装**（Ken Burns 推奨）
5. **機能セクションを段階追加**（FAQ→世界観/Lore→お便り→ニュース→ディスコグラフィ…）
6. その後 Phase 2 機能（YouTube/ライブ判定/カレンダー書き戻し/BOOTH）

### ガードレール（全工程）
新依存ゼロ志向／純CSL・Web標準優先／モバイル軽量／`prefers-reduced-motion` 対応／金のコントラストはWebAIM実測。

---

## 次の一手
`effect-demos/index.html` → `fonts.html` を見て、**採用フォント（見出し/ロゴ/装飾）とエフェクト（常設＋リッチ枠1つ）** を指定してください。決まり次第 `vtuber-hp` 本体へ実装します。
