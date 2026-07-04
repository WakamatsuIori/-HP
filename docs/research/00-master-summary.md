# 調査まとめ（マスター要約） — 和香松庵 公式HP リソース

3回のクローリング（計14班）と素材取得・フォント導入の成果を1枚にまとめた索引です。
詳細は各カタログへ。サンプルは `D:\クロード作業用\effect-demos\` のHTMLを直接開いて確認。

---

## 📁 成果物の一覧

> ⭐ 演出カタログが#1〜#7に増えたため、**まず [演出 早見表＆分類](effects-quick-reference-2026.md) を見る**（実戦で使う部分の圧縮＋どれが裏在庫か）。方針は [辛口批評](research-critique-2026-06-20.md) 参照。

| 区分 | 場所 | 中身 |
|---|---|---|
| エフェクト集 | [effects-catalog.md](effects-catalog.md) | 8要素・約100エフェクト（純CSS優先・出典URL付き） |
| エフェクト深掘り＋再提案 | [effects-catalog-2-2026-deep.md](effects-catalog-2-2026-deep.md) | 2025–2026最新CSS/ティアダウン/Astro実装/性能・A11y＋実装優先順位（第1〜3波） |
| 降りもの＋文字装飾（Claude×Codex共同） | [effects-catalog-3-falling-and-text-2026.md](effects-catalog-3-falling-and-text-2026.md) | 雪/桜/雨/金粉/落ち葉の実装3系統比較＋紙インク系の静的文字装飾＋やりすぎ防止の数値。推し＝Canvas低密度金粉。和香松庵/LPツール両用 |
| テーマ別 演出プリセット集（Claude×Codex共同） | [effects-catalog-4-themes-2026.md](effects-catalog-4-themes-2026.md) | VTuber8テーマ(耽美/かわいい/サイバー/和風/幻想/癒し/ホラー/ゲーマー)別の配色hex・フォント・降りもの・モーション性格・文字装飾・地雷＋CSS変数によるテーマ切替設計。LPツール「世界観テーマ」プリセット用 |
| 演出の別軸（Claude×Codex共同） | [effects-catalog-5-axes-2026.md](effects-catalog-5-axes-2026.md) | 構図/レイアウト・セクション別の見せ方・ヒーローの型・ローディング/ページ遷移・マイクロインタラクション。#4の6点セットに layout/section/hero/transition/microInteraction トークンを足す拡張＋本人露出vs運用者隠しの振り分け |
| 配色システム（Claude×Codex共同） | [effects-catalog-6-color-system-2026.md](effects-catalog-6-color-system-2026.md) | 自動配色の作り方＝シード色→役割割当＋ensureReadable(WCAG自動補正)。OKLCH内部処理・culori・WCAG2線+APCA警告。LPツール「おまかせ4色」の基盤（要実装） |
| 追加テーマ＋ジャンル別マッピング（Claude×Codex共同） | [effects-catalog-7-themes-add-and-genre-2026.md](effects-catalog-7-themes-add-and-genre-2026.md) | 追加テーマ12案(Y2K/レトロ/シネマ/ラグジュアリー/ミニマル/季節/誕生日/歌い手/ASMR/絵師/Vライバー/ゲーム細分)＝裏在庫・需要ドリブン。本命は「ジャンル→推奨テーマ×重点セクション」の活動タイプ軸マッピング |
| 和×耽美の質感＆線描き（Claude×サブエージェント・深掘り第2弾） | [effects-catalog-8-svg-texture-and-drawon-2026.md](effects-catalog-8-svg-texture-and-drawon-2026.md) | SVGフィルタ(墨ぼかし/グレイン/金デュオトーン/グーイ)＋マスク/clip-pathの区切り・拭き取りreveal＋draw-on(家紋/下線 pathLength=1)＋金グラデ文字(@property)＋金継ぎ。全て静的/小領域/焼いて配る。裏在庫 |
| キネティックタイポ／可変フォント／縦書き（深掘り第2弾） | [effects-catalog-9-kinetic-type-and-vertical-2026.md](effects-catalog-9-kinetic-type-and-vertical-2026.md) | 可変フォント軸アニメ(呼吸する見出し)・段差文字出現(aria必須)・安全マーキー・金グラデ見出し・writing-mode縦書き(縦中横/ルビ/禁則)。耽美/和は文字が主役。裏在庫 |
| モダンCSS2026 実戦棚卸し（Codex担当・深掘り第2弾） | [effects-catalog-10-modern-css-2026.md](effects-catalog-10-modern-css-2026.md) | scroll-driven/@property/container query/@starting-style+allow-discrete/anchor positioning/light-dark/text-wrap/interpolate-size/field-sizing を「すぐ採用/UI部品限定/実験」に仕分け。@supports必須・非対応で静的成立。基盤候補＋裏在庫 |
| 3D/パース＆グラスモーフィズム（深掘り第2弾） | [effects-catalog-11-3d-perspective-and-glass-2026.md](effects-catalog-11-3d-perspective-and-glass-2026.md) | ①3Dチルト(マウス追従)②グラスモーフィズム(backdrop-filter)③3Dフリップ④3D層パララックス。冒頭に採否サンプル表。見栄え強いが重い/スマホで効かない/情報隠し事故＝裏在庫。本命はグラス1箇所＋文字対策 |
| 降る/浮かぶ装飾の形バリエーション（#3拡張） | [effects-catalog-12-falling-shapes-2026.md](effects-catalog-12-falling-shapes-2026.md) | 雪/桜/星/ハート/紙吹雪/泡/蛍/家紋/絵文字…＋任意の形を降らす6手法(絵文字/clip-path/border-radius/SVG use/mask/box-shadow)＋方式比較(CSS/Canvas/SVG/tsParticles)＋perf/a11y。色はvar(--accent)。裏在庫 |
| 初回ロード/イントロ演出（Claude×Codex） | [effects-catalog-13-loading-intro-2026.md](effects-catalog-13-loading-intro-2026.md) | 原則(偽遅延禁止・LCP/SEO・Astro/ClientRouter・a11y・noscript・初回のみ)＋**§10 汎用イントロ大全 約37(雰囲気別:ロゴdraw-on/マスクワイプ/タイプ/段差/カーテン/iris/グリッチ/インク/粒子集合/季節/星座/音波/サイン/章扉…合う雰囲気・要点・避ける)**。家紋→幕は一例。最小コード付き |
| 文字エフェクト OBS→Web移植（FontEffectTools調査） | [effects-catalog-14-text-effects-obs-to-web-2026.md](effects-catalog-14-text-effects-obs-to-web-2026.md) | OBS用34文字エフェクトのWeb再現マップ。**GPL-2.0=コード流用不可だがアイデア自前再現はOK**。動かす=CSS transform(SEO安全)／歪み=SVG feDisplacementMap or Canvas。緑(CSS)/黄(SVG)/赤(Canvas)で難度分類＋優先順。#8/#9/#11/#12を文字効果視点で再索引 |
| 背景演出（フルページの地・新軸） | [effects-catalog-15-backgrounds-2026.md](effects-catalog-15-backgrounds-2026.md) | アニメグラデ/オーロラ/メッシュ/星空/粒子/グリッド/斜線/グレイン/ブロブ/波/パララックス/コニック/CRT/スポット/ぼかしブロブ の15種＋可読性(スクリム)＋perf(blur固定)。色はvar(--accent)。見本帳に「背景」タブ実装 |
| ⚠️ 研究の方針レビュー（辛口批評・要本人判断） | [research-critique-2026-06-20.md](research-critique-2026-06-20.md) | Claude独立批評＋Codexサブエージェント批評が一致＝「装飾研究に寄りすぎ・計画§15と衝突・過剰設計の再発。いったん止めて実装/検証(鮮度レイヤー)＋制作工程研究(ヒアリング/情報設計/素材権利/活動タイプ別)へ」 |
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
