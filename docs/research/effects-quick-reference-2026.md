# 演出カタログ 早見表 ＆ 分類（2026-06-21）

> カタログ#1〜#7が増えすぎたので、**「どれを実戦で使い、どれを裏在庫にするか」**を1枚に整理。
> きっかけ＝[研究の方針レビュー（辛口批評）](research-critique-2026-06-20.md)。「装飾研究に寄りすぎ→いったん止めて整理」を受けた棚卸し。
> **新規研究はしていない。既存の圧縮のみ。**

---

## 1. カタログの分類（これだけ覚える）

| 区分 | ファイル | 使う場面 |
|---|---|---|
| ⭐ **実戦・第1波** | [#2 deep](effects-catalog-2-2026-deep.md) | **まずここ**。最新CSS・性能・a11y・実装優先(第1〜3波) |
| 🧱 **基盤（要実装）** | [#6 配色システム](effects-catalog-6-color-system-2026.md)／[#10 モダンCSS2026](effects-catalog-10-modern-css-2026.md)の「すぐ採用」群 | 「おまかせ4色」を破綻させない土台＋container query/text-wrap/@property/light-dark |
| 🗂 **アーカイブ（参照用）** | [#1 約100件](effects-catalog.md) | 引き出しが欲しい時だけ引く辞典 |
| 📦 **運用者モードの裏在庫** | [#3 降りもの](effects-catalog-3-falling-and-text-2026.md)／[#4 テーマ別](effects-catalog-4-themes-2026.md)／[#5 演出軸](effects-catalog-5-axes-2026.md)／[#7 追加テーマ](effects-catalog-7-themes-add-and-genre-2026.md)／**[#8 SVG質感/線描き](effects-catalog-8-svg-texture-and-drawon-2026.md)**／**[#9 キネティックタイポ/縦書き](effects-catalog-9-kinetic-type-and-vertical-2026.md)**／**[#11 3D/グラス](effects-catalog-11-3d-perspective-and-glass-2026.md)**／**[#12 降る形](effects-catalog-12-falling-shapes-2026.md)**／**[#13 ロード/イントロ](effects-catalog-13-loading-intro-2026.md)**／**[#14 文字エフェクトOBS→Web](effects-catalog-14-text-effects-obs-to-web-2026.md)**／**[#15 背景演出](effects-catalog-15-backgrounds-2026.md)** | クライアントUIに全部出さない。運用者＋AIが仕上げ時に引く |
| ⚠️ **方針レビュー** | [批評](research-critique-2026-06-20.md) | 次の判断の前に必読 |

> 旧索引＝[00-master-summary.md](00-master-summary.md)（和香松庵HP向けフォント/エフェクトの当たり）。

---

## 2. 実戦で“今すぐ使う”要点だけ（圧縮）

### 配色の鉄則（#6）
- 本人の選んだ色は**シード**。背景/本文/CTAにそのまま使わない。**明度(L)で役割割当→ensureReadableで自動補正**。
- 内部は**OKLCH**（HSLの明度はアテにならない）。本文はニュートラル寄り（金/ブランド色を本文にしない）。CTA文字は白黒二択。
- 判定は**WCAG2を合格ライン**（本文4.5:1/大3:1）、APCAは警告。派生(hover/border/glow/surface)は`color-mix(in oklch)`。
- ライブラリ＝**culori**（Astroビルド時に確定値＋フォールバック）。

### 共通安全弁（全演出・ここに集約）
- 動かすのは **`transform`/`opacity`（＋必要時`filter:drop-shadow`）のみ**。`box-shadow`/`background-position`のループ不可。
- 基底=無アニメ→`@media (prefers-reduced-motion: no-preference)`でオプトイン。reduce時=粒子停止/静止・revealはopacityのみ・hoverは色変化だけ。
- 点滅1秒3回未満(WCAG2.3.1)・`:focus-visible`維持・タップ44px・ホバーは`@media (hover:hover) and (pointer:fine)`・長い画面外に`content-visibility:auto`・無限アニメはIOで画面外停止。

### 第1波の実装（#2・低リスク高効果）
1. 全見出しに`text-wrap: balance`　2. 金パレットを`color-mix()`派生に統一　3. 無限アニメ(Ken Burns/灯り/スパークル)をIOで画面外停止　4. ホバーを`(hover:hover) and (pointer:fine)`に　5. 長い静的セクションに`content-visibility:auto`。

### 降りもの＝**金粉1種だけ**常設（#3）
- “雪”より「光に浮く金粉/埃」。Canvas低密度（PC18〜36/モバイル半減）・`opacity 0.12〜0.35`・点滅でなくゆっくりフェード。季節差し替え・カーソル演出は**やらない**。

### テーマ4種の早見（#4・第1段はこれだけ）
| テーマ | 配色の芯 | 動きの性格 |
|---|---|---|
| 耽美・ゴシック | 漆黒+くすみ金(線/小見出し限定)・本文は骨色 | ゆっくり重い・bounce禁止 |
| かわいい・ポップ | パステル+濃いめピンクCTA・本文は焦茶 | きびきび弾む(overshoot) |
| クール・サイバー | 暗紺+ネオン1〜2色・本文は薄シアン白 | 速い直線・glitch一瞬 |
| ナチュラル・癒し | 生成り+セージ+テラコッタCTA・本文焦茶 | とても遅い呼吸 |

### 演出軸の実装トップ3（#5）
**ヒーロー型 → セクションプリセット → 反応強度(なし/控えめ/しっかり)** をテーマに接続。本人に出すのはこの3つ＋雰囲気テーマ＋好きな色＋目的テンプレ＋セクションON/OFFまで。細部(構図密度/遷移種/粒子数/stagger)は運用者AI側に隠す。

---

## 3. 判断ペンディング（次に決めること）
[批評](research-critique-2026-06-20.md)の推奨＝**装飾研究は打ち止め**。次は (A)制作工程の研究(本人ヒアリング/活動タイプ別テンプレ/素材・権利/鮮度レイヤーのフォールバックUI) か (B)実装・検証(LP ツールに#6配色＋鮮度レイヤー、または実物1件で§15-9の3仮説検証)。→ **本人判断待ち**。
