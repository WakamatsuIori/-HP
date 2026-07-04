# 演出カタログ #14 — 文字エフェクトを「動かす/変形する」OBS→Web 移植マップ

> 位置づけ：**📦 裏在庫＋実装メモ**。きっかけ＝Codex経由の調査依頼「FontEffectTools(OBS用Cプラグイン)をHP/Webに応用できる？文字を動かす/変形できるよね・組み込み方・優先順位」（2026-06-21）。
> 対象＝[FontEffectTools](https://github.com/503bad/font_effect_tools)（OBS Studio用・C＋FreeType・**GPL-2.0**・34エフェクト）。汎用（色は`var(--accent)`）。

---

## 0. ライセンス結論（最重要・先に読む）
- FontEffectToolsは**GPL-2.0**。**ソースコードをコピーしてWeb製品に組み込むのは不可**（組み込むと自分のサイトコードもGPL公開義務が生じる）。
- だが**そもそも流用する必要がない**：中身は**C＋OBS API＋FreeType**で、Webブラウザでは1行も動かない。
- **エフェクト（見た目・挙動のアイデア）は著作権・GPLの対象外**。「見て、CSS/SVG/Canvasで**自前で作り直す**（クリーンルーム）」は完全に合法・安全。
- ＝**コード流用＝NG＆無意味／アイデア流用＝OK**。実際に必要なのは「同じ見た目をWeb標準で再現」だけ。

---

## 1. Webでの「文字を動かす/変形する」2層（ここを理解すると早い）
- **A. アフィン変形（移動/回転/拡大/傾き/3D）**＝CSS `transform`。軽い・**文字は本物のテキストのまま**（SEO・読み上げOK）。OBSエフェクトの大半はこれで再現可。
- **B. 形そのものの歪み（ウェーブ/スライム/液状/さざ波）**＝**SVGフィルタ**(`feTurbulence`+`feDisplacementMap`を`<text>`に)か**Canvas/WebGL**。重い。SVG`<text>`+フィルタなら文字のまま歪められる（Canvas化すると選択/SEO不可）。
- 結論：**「動かす」はCSSで安く・SEO安全。「グニャッと変形」はSVGフィルタで一点豪華に**（多用しない）。

---

## 2. 34エフェクト → Web再現マップ（実装難度・手法）
凡例：🟢CSSだけ（安・SEO安全）／🟡SVG or 少しJS／🔴Canvas/重い・装飾用。★=既存カタログに実装メモあり。

### 静的/発光系
| OBS効果 | Web手法 | 難度 |
|---|---|---|
| Neon | `text-shadow`多重+flickerアニメ | 🟢 ★#9 |
| Bloom | `text-shadow`+`opacity`パルス | 🟢 |
| Rainbow | `@property`でグラデ位置/角度アニメ+`background-clip:text` | 🟢 ★#8/#9 |
| Spotlight sweep | グラデ帯を`mask-position`/`background-position`で横断 | 🟢 ★#13 |
| Chromatic glow | テキスト複製2層をRGBずらし+`mix-blend` | 🟡 ★#9 |
| God rays | 放射`conic/radial-gradient`+`mask` | 🟡 |
| Scanlines | `repeating-linear-gradient`オーバーレイ | 🟢 ★#8 |
| Electric arc | SVG path+`stroke-dashoffset`を不規則に | 🟡 |
| Current circuit | 縁取り+glowパルス | 🟢 |
| Sparkle | ✦をtwinkle（scale/opacity）/Canvas | 🟢〜🔴 ★#11/#12 |

### 登場/幾何変形系（per-char＝文字分割が要る）
| OBS効果 | Web手法 | 難度 |
|---|---|---|
| Side bounce align / Hop | 文字spanを`translateY`+squash、`animation-delay`でstagger | 🟢 ★#9 |
| Vertical slide-in | 文字を上下交互に`translateY`登場 | 🟢 |
| Random jitter | 各文字に小さな`transform`ランダム | 🟢 |
| Flip | 各文字`rotateY`(疑似3D) | 🟢 ★#9/#11 |
| Pseudo-3D thickness | `text-shadow`段重ね（押し出し）+ゆれ | 🟢 ★#8 ext3d |
| Cube unfold | CSS 3D（`rotateX/Y`+`perspective`） | 🟡 ★#11 |
| Counter（スロット） | 数字列を`translateY`ループ（縦回転） | 🟡 |
| Korokoro（転がり） | `rotate`+`translate`連動 | 🟡 |
| Slice | `clip-path`の帯でスライドイン | 🟡 ★#8 |
| Puzzle | グリッド片を個別`transform`で集合 | 🔴(分割必要) |
| Storyteller（奥行きクロール） | CSS 3D `rotateX`+`translateZ`（Star Wars風） | 🟡 |
| Font switch | 一定間隔で`font-family`差し替え | 🟢 |
| Outliner（描き起こし） | SVG`<text>`を`stroke-dashoffset`で描く | 🟡 ★#8 draw-on |

### 歪み/液状系（＝B層・SVGフィルタ or Canvas）
| OBS効果 | Web手法 | 難度 |
|---|---|---|
| Wave（さざ波） | per-charなら🟢／真の波打ちはSVG`feTurbulence`+`feDisplacementMap` | 🟢/🔴 ★#9 |
| Slime（ぷるぷる） | SVGゴム的ゆがみ(`feDisplacementMap`アニメ) or グーイ`feGaussianBlur`+`feColorMatrix` | 🔴 ★#8 |
| Water Surface（水鏡） | 反射=`transform:scaleY(-1)`+グラデmask／波紋=SVG displacement | 🟡〜🔴 |
| Glitch | clip帯ズレ+RGBずらし（短時間） | 🟡 ★#9/#13 |
| Cartoon（手描き・インク滲み） | `steps()`低フレーム+SVG`feTurbulence`縁滲み | 🔴 |

### 粒子系（＝Canvas/低密度・#12と地続き）
| OBS効果 | Web手法 | 難度 |
|---|---|---|
| Flame / Dust plume | 上昇粒子（Canvas低密度・温色/煙） | 🔴 ★#12 |
| Water Drip | 落下＋トレイル粒子 | 🔴 ★#12 |
| Image decoration（落ちるハート/星/画像） | **#12の「降る形」そのもの**（clip-path/SVG/絵文字/mask） | 🟢〜🔴 ★#12 |

---

## 3. HPへの「組み込み方」
- **プラグインではない**：Webでは単に**LPのHTML/CSS/JS**として書くだけ（OBSのようなインストールは不要）。
- **適用先**：見出し・ロゴ・キャッチ・セクション番号など“ここぞ”の短文に。本文には掛けない。
- **本物のテキストで**：`<h1>`等の実テキストに効果を当てる（CSS/SVG`<text>`）。Canvas化や画像化は**SEO・読み上げ・選択を失う**ので避け、どうしても必要な歪みだけ局所SVGで。
- **依存**：基本ゼロ（CSS/SVG）。per-char分割は最小JS（Splitting.js等）かビルド時出力。GSAP/anime.jsは「複数の複雑演出を量産」したい時だけ＝今は不要。

## 4. パフォーマンス / SEO / アクセシビリティ
- 動かすのは`transform`/`opacity`/`@property`登録変数。`feDisplacementMap`/Canvas/blendは重い→**小要素・1〜2箇所・静止画ベイクも検討**。
- **文字分割は`aria-label`＋可視span`aria-hidden`**（SRの一字読み防止）。基底は読める静止状態→`@media (prefers-reduced-motion: no-preference)`でオプトイン。
- 点滅は毎秒3回未満（Neon/Glitch/Electric arc要注意）。グラデ文字は`color:`フォールバックで消失防止。
- 画面外は`IntersectionObserver`で停止。色は`var(--accent)`で差し替え。

## 5. 実装の当たり（優先順位）
1. **すぐ：CSSの🟢群**（Neon/Rainbow/Wave/Bounce/Hop/Flip/3D厚み/Outline/Scanlines/Sparkle）＝既存#8/#9/#11/#12でほぼ実装メモ済。見本帳の「文字・タイポ」「装飾」タブに既出。
2. **アクセントで：🟡**（Glitch/Slice/Cube/Storyteller/Chromatic）を1〜2箇所。
3. **一点豪華で：🔴**（Slime/WaterSurface/Flame/Cartoon）はSVGフィルタ/Canvasで“ここだけ”。多用しない。
- 「文字を変形できる？」への答え＝**Yes。移動/回転/3DはCSSで安全・即／グニャ変形はSVGフィルタで一点**。OBSの34効果は**ほぼWeb再現可**（粒子/液状だけ重い）。

> 関連：[#8 SVG質感/draw-on](effects-catalog-8-svg-texture-and-drawon-2026.md)／[#9 キネティックタイポ](effects-catalog-9-kinetic-type-and-vertical-2026.md)／[#11 3D/グラス](effects-catalog-11-3d-perspective-and-glass-2026.md)／[#12 降る形](effects-catalog-12-falling-shapes-2026.md)／[#13 イントロ](effects-catalog-13-loading-intro-2026.md)。本#14はそれらを「OBS文字エフェクト」視点で索引し直したもの。
