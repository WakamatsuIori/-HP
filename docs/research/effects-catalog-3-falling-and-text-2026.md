# エフェクト・カタログ #3 — 降りもの・天候系モーション ＋ 紙/インク系の文字装飾（2026）

> 📦 **位置づけ＝運用者モードの裏在庫**（クライアントUIに全部出さない）。常設は金粉1種に絞る。[早見表](effects-quick-reference-2026.md)／[批評](research-critique-2026-06-20.md)参照。

> [effects-catalog.md](effects-catalog.md)（約100件）／[effects-catalog-2-2026-deep.md](effects-catalog-2-2026-deep.md)（最新CSS・性能/A11y）の続編。
> **今回の主役＝「雪降りのような“降りもの・天候系モーション”」**（既存2本に専用項が無かった穴）と、**紙/インク系の“静的な”文字装飾**。
> **作り方＝Claude（母艦のWeb調査）＋ Codex(GPT-5.3, agmsg経由) の共同研究**。両者が独立に調べ、**ほぼ同じ結論に収束**したので統合した（諮問記録は末尾）。
> 前提（CLAUDE.md／既存カタログ準拠）：世界観＝**明クリーム(生成り #faf9f6)×くすみ金・耽美・上品・執事Cafe&Bar**。リッチ演出はトップ1箇所／モバイル軽量／`prefers-reduced-motion` 必須／WCAG配慮／純CSL・Web標準優先・依存最小。
> ※数値（粒数・速度・不透明度・色）はすべて**本人決定前の“当たり値”**。実装時にトップ1箇所で試して微調整する前提（勝手に確定しない）。
> ※このカタログは **和香松庵HP** と **LP制作ツール（§8モーションライブラリ）** の両方に流用できる。

---

## 0. 結論（先に要点）

- **常設するなら「Canvas 低密度の金粉／埃（dust motes / gold dust）」が世界観に最も合う＝最推し。** “雪”そのものより「**店内の暖かい光に浮く金粉・埃**」として使うと耽美・上品に収まる（ClaudeとCodexの一致見解）。
- **降りもの系は“同時に1種類・トップ1箇所だけ”**。冬=雪／春=花びら／秋=落ち葉…は**季節で中身を差し替える**（同時多重は世界観も性能も壊す）。
- **実装方式の使い分け**：少数（〜数十粒）＝**純CSS**で十分・最軽量／制御重視・常設＝**Canvas**が本命／大量・凝った相互作用＝**ライブラリ(tsParticles)**だがこの世界観では過剰になりがち。
- **文字装飾は“動き”より“紙・金属の質感”で品を出す**：ドロップキャップ／羊皮紙マーカー／インク滲み下線／金縁見出し（全部ほぼ純CSS・静的）。
- 動かすのは **`transform`/`opacity` のみ**（GPU合成＝60fps/INP維持）。`box-shadow`/`filter` 多用は塗りが重い。**reduced-motion で必ず停止/静止**。

---

## A. 降りもの・天候系モーション（主役）

各エフェクト＝(a)純CSS／(b)Canvas自前／(c)ライブラリ の3系統で比較。重さ＝軽/中/重。

### A-1. 雪／埃・金粉フォール（snow / dust motes）★常設の本命
| 系統 | 長所 | 短所 |
|---|---|---|
| (a) 純CSS（box-shadow多重） | div数枚に巨大なカンマ区切り`box-shadow`で数百粒、コンテナだけ`translateY`＝JSゼロ・GPU完結 | `box-shadow`は塗りが重く**100〜150粒で頭打ち**／位置が固定パターンになりやすい／粒の個別挙動不可 |
| (b) Canvas自前 | 粒数・速度・DPR・画面外停止・visibilitychange・reduced-motionを全部握れる。**常設の本命** | 描画ループを自分で回す＝最適化が要る |
| (c) tsParticles snow | 公式snowプリセット・wind・`fpsLimit`内蔵 | JSコスト大。この世界観では過剰 |

- **性能**：`transform`移動に限定すればGPU合成でINP維持。30〜50粒ならCore Web Vitalsへの影響ほぼ無し。モバイルは`@media`で層数・粒数を半減。
- **a11y**：点滅ではないので2.3.1は通常OK。前庭配慮で reduced-motion 時は停止（静的粒へ）。
- **世界観の当たり値（統合）**：粒 **PC 24〜70／モバイル 10〜20**、落下 **12〜32s/画面高**、`opacity 0.08〜0.22`、サイズ 1〜5px、横揺れ 4〜16px。色は純白でなく **`#fffdf7`寄りのオフホワイト**、金粉なら `#c8ad6a`/`#b89b5e` の濃淡。→ **“雪”より“光に浮く金粉/埃”として低密度で**。
- 出典：[Red Stapler 純CSS Snow](https://redstapler.co/pure-css-snow-fall-effect/) ／ [StudioLimb snowfall guide](https://www.studiolimb.com/guides/snowfall-effect-css-guide.html) ／ [tsParticles snow](https://particles.js.org/samples/presets/snow.html)

### A-2. 桜の花びらが舞う（sakura petals）＝季節限定
| 系統 | 長所 | 短所 |
|---|---|---|
| (a) 純CSS | 花びらを`border-radius`＋`translate3d+rotate`で「ひらひら」 | 1枚ずつkeyframeでCSS肥大／300枚級は重い |
| (b) 自前JS(sakura.js) | rAF＋CSSで滑らか・枚数を動的制御 | JS必須 |
| (c) tsParticles | 花びら画像をparticle化・回転/wind | 設定量多い |

- **肝は「回転＋横揺れ」**。`box-shadow`を使わず**疑似要素/画像＋transform**で60fps維持。回転はゆっくり（1枚 16〜32s）。
- **a11y**：回転で動きが大きく見える→前庭配慮を雪より強めに。reduced-motionで非表示か1枚固定。
- **当たり値**：枚数 **PC 8〜30／モバイル 4〜8**、落下 10〜18s、`opacity 0.5〜0.8`、サイズ 8〜14px、横揺れ ±15〜25px。淡ピンク `#f7d9e0`＋わずかに金縁。**春・和イベント用**（常設HPでは季節差し替え）。
- 出典：[純CSS Sakura(ymir)](https://codepen.io/ymir/pen/WNoGQQP) ／ [Canvas版(rudtjd2548)](https://codepen.io/rudtjd2548/pen/qBpVzxP) ／ [sakura.js](https://www.cssscript.com/sakura-falling-effect/)

### A-3. 雨（rain / 窓雨）＝夜・雰囲気区画限定
| 系統 | 長所 | 短所 |
|---|---|---|
| (a) 純CSS | 細い線を`translateY`で高速落下・GPU化しやすい | 数百本＋層で再描画増→重い／波紋(splatter)は不向き |
| (b) Canvas自前 | 物理・高DPI・オブジェクトプールで高速 | 波紋は重くブラウザ差あり |
| (c) tsParticles | 安定・fpsLimit制御 | ライブラリコスト |

- **“外は雨、店内は暖かい”演出**なら世界観に合う。ただし全面雨は暗くなる→**heroや一区画だけ**。`transform`限定＋`contain:strict`＋（必要時のみ）`will-change:transform`。
- **a11y**：一方向の高速直線は前庭刺激が強い部類。reduced-motionで静止（薄い窓粒/線へ）。耽美寄りなら速度を落とす（線 **2.5〜5s**・忙しくしない）。
- **当たり値**：本数 40〜80、`opacity 0.06〜0.4`、細さ1px、色は青でなく**くすみグレー〜金がかったグレー**。
- 出典：[freefrontend CSS Rain集](https://freefrontend.com/css-rain/) ／ [CSS Rain(arickle)](https://codepen.io/arickle/pen/XKjMZY) ／ [Canvas rain(DEV)](https://dev.to/soorajsnblaze333/make-it-rain-in-html-canvas-1fj0)

### A-4. 金粉・きらめきが舞い散る（gold dust / floating sparkles）★世界観適合・最高
| 系統 | 長所 | 短所 |
|---|---|---|
| (a) 純CSS | 金ドットを`opacity`ゆらぎ＋ゆっくり浮遊・少数なら最軽量 | **明滅＝点滅でWCAG2.3.1リスク**／多数の明滅は危険 |
| (b) Canvas自前 | 粒度・発光・密度を細かく制御。**推奨** | 実装量 |
| (c) tsParticles confetti | 色/量/寿命/重力を全カスタム可 | デフォは派手→“上品版”に減衰必須 |

- 既に**金箔シマー（要素単位）**があるので、これは「降りもの」というより**ヒーロー背面の奥行き粒子**として使うのが筋（Codex指摘）。
- **a11y（最重要）**：**1秒に3回超の明滅は禁止**。金粉は「点滅」でなく「**ゆっくりフェード＋移動**」で表現（明滅頻度は1秒1回未満）。白フラッシュ禁止。
- **当たり値**：粒 **PC 18〜36／モバイル 8〜14**、サイズ 1〜3px（大粒最大5px）、`opacity 0.12〜0.35`、浮遊 8〜15s、色は単一でなく `#c9a227`〜`#e8c873` の濃淡2〜3色。`blur`は0〜2px（大きいぼかしは安っぽい）。**最も“やりすぎ”になりやすい**ので低密度厳守。
- 出典：[tsParticles confetti preset](https://particles.js.org/docs/modules/tsParticles_Confetti_Preset.html) ／ [web.dev high-perf animations](https://web.dev/articles/animations-guide)

### A-5. 落ち葉が舞う（autumn leaves）＝秋・季節限定
- 桜と同型（回転＋揺れ）。(a)純CSS（`nth-of-type`で揺れ違い）／(b)GSAP・自前JS／(c)tsParticles。
- **当たり値**：枚数 **PC 12〜25／モバイル 少量**、落下 10〜18s、`opacity 0.4〜0.7`、サイズ 10〜18px、回転 4〜8s/回。色は原色より**くすんだ金茶・えんじ**（`#a86b32`/`#8c5a2b`）。常設は主張が強い→**季節テーマ差し替え用**。
- 出典：[Falling Leaves(maiptn226)](https://codepen.io/maiptn226/pen/Zvvdbq) ／ [Autumn leaves GSAP(MAW)](https://codepen.io/MAW/pen/KdmwMb) ／ [14 CSS Animations for Fall](https://1stwebdesigner.com/14-css-animations-for-fall/)

### A-6. 雪降りの方式・使い分け（box-shadow vs Canvas vs ライブラリ）
- **純CSS box-shadow多重**：軽そうで、数百点を動かすと意外に重い／位置が固定パターン化。**粒が少なく、ループ背景と割り切るなら可（装飾背景向け）**。
- **Canvas**：粒数・速度・DPR・画面外停止・visibilitychange・reduced-motion を全部管理できる。**60fps/INPを気にする常設の雪/金粉は本命**。
- **tsParticles等**：速いが重装備。凝った相互作用や大量パーティクル向け。**この世界観では過剰になりやすく、公式HP/LPの常設装飾なら避けるか限定ページのみ**。

### A-7. 季節での自動出し分け（小ネタ）
- **bodyクラス＋CSS変数**：月を判定して `<body class="season-winter">` を付与、各エフェクトは `body.season-winter .snow{…}` でON/OFF。CSS本体は触らず運用できる。
- **JSワンライナー**：`const m=new Date().getMonth();` → 11,0,1=冬雪／2-4=春桜／5-7=金粉／8-10=落ち葉、でクラス切替。
- **tsParticles**なら設定オブジェクトを季節キーで差し替え＋`fpsLimit:60`固定（速度を端末非依存に）。

---

## B. 文字装飾の新しい手（既存カタログの定番＝金箔グラデ/シマー/clip-path reveal/タイプライター/縦書き 以外）

> 世界観的には「**動き”より“紙・金属の質感”**」が効く（Codex）。下記は明記なき限り**純CSS・軽・モバイル可・reduced-motion無関係（静的）**。

### B-1. 紙/インク系（静的・世界観適合 高）
- **ドロップキャップ（章頭イニシャル）**：プロフィール/物語/ご案内の最初の一文字だけ、くすみ金＋serifで大きく。「メニュー表/招待状」感。`::first-letter`で実装。
- **装飾頭文字（illuminated initial）**：中世写本ほど派手にせず、薄い金枠/角飾りで一文字だけ飾る（純CSS＋SVG背景）。耽美寄りに強い。中。
- **羊皮紙マーカー（parchment highlight）**：重要語の背面に `#d8bf7a` を `opacity 0.18〜0.28` で敷く。角をわずかに歪ませると手触り。
- **インク滲み下線（ink spread underline）**：下線をlinear-gradientでなく mask/blur気味の疑似要素で「紙に染みた」感に。ホバー時だけ 260〜420ms。
- **金縁の細い見出し（gold edge heading）**：`text-shadow`を濃くしすぎず、1px未満相当の金影を複数。**見出し限定・本文に使わない**。使いすぎ注意。
- **小副題ルビ（ruby-like whisper）**：日本語見出しの上に英字サブタイトルを小さく（PROFILE / SCHEDULE / INVITATION）。letter-spacing広げすぎ注意。

### B-2. 2025〜2026の新しめCSS（動き系・reduced-motion配慮要）
- **可変フォント・モーフィング**：weight/widthをアニメして「呼吸する」「太→細」。見出し1語に上品。明滅にならない範囲で。 [cssauthor](https://cssauthor.com/css-text-animation-examples/)
- **`@property`＋グラデ移動**：金箔グラデの角度/位置を型付きカスタムプロパティで補間→「流れる金箔」を滑らかに。 [web.dev Animated Gradient Text](https://web.dev/speedy-css-tip-animated-gradient-text/)
- **Scroll-Driven 見出し出現**：WebGLなしで軽量。late-2025で実用域。非対応ブラウザは静止＝安全。reduced-motion配慮。 [Codrops 3D scroll text](https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/) ／ [2026 CSS features](https://blog.riadkilani.com/2026-css-features-you-must-know/)
- **`text-wrap: balance/pretty`**：装飾でなく“品の底上げ”。見出しの孤立行を消す（既存deep版でも推奨済）。

---

## C. やりすぎ防止の数値ガイド（ClaudeとCodexの統合・すべて当たり値）

**全体ルール**
- 常時動く装飾は**最大2系統・推奨1系統**。降りもの系は**同時1種類・トップ1箇所のみ**。
- heroで動かすなら**他セクションは静的**に。読ませる場所（CTA/本文の近く）では粒子を動かさない。
- 装飾は原則 `pointer-events:none`／コンテンツの下（z-index）。

**数値の目安**
| 項目 | 目安 |
|---|---|
| 粒子数 | PC 20〜40／モバイル 8〜16（上品ライン。雪/埃は最大70まで低密度で） |
| opacity | 背景粒子 0.08〜0.22／金粉ハイライト 0.12〜0.35 |
| duration | 降りもの 12〜32s／ホバー 180〜320ms／reveal 500〜800ms |
| scroll reveal 距離 | 8〜20px（40px超は演出感が強すぎ） |
| shimmer 頻度 | 8〜18sに1回（常時ギラギラ禁止） |
| blur | 背景粒子 0〜2px（大きいぼかし光は安っぽい） |

**色のコントラスト安全値（生成り #faf9f6 背景）**
- 金 `#b89b5e` を**本文にそのまま使わない**（コントラスト不足）。本文は `#332b22`〜`#4b4033`。
- くすみ金は**線/枠/アイコン/小見出しに限定**。CTAは `#7a6335` くらいまで締めると読める。
- 装飾色は `#c8ad6a / #b89b5e / #8a7142` を役割で分ける。
- ※既存 #2/master の「黒×金カード層」は別系統（カードは焦茶地×金アクセント）。本表は明トーン基調側の値。

---

## D. 実装の共通安全弁（降りもの・文字装飾とも）

```css
/* 動きは no-preference 側にだけ書く＝オプトイン設計（最も安全） */
@media (prefers-reduced-motion: no-preference){
  /* ここにアニメを入れる。reduce時は基底=無アニメ＝静止 */
}
.fx-layer{ pointer-events:none; contain: strict; } /* 再描画を隔離 */
```
- 動かすのは **`transform`/`opacity` のみ**（GPU合成＝INP非依存・CLS非計上）。`top/left/margin/box-shadow/background-position` のアニメは不可。
- `will-change:transform` は**乱用厳禁**（恒久付与しない・問題時のみ一時付与）。
- **Canvas**：DPR上限 1.5〜2／rAF（setIntervalでなく）／非表示タブは停止／`IntersectionObserver`でhero外なら停止／pointermove連動はrAFでthrottle。
- **モバイル**：`@media`で粒数を半減〜1/3＋低速化。低電力端末は停止。
- **WCAG**：2.3.1（点滅1秒3回未満・白フラッシュ禁止）／2.2.2（自動の動きに停止手段＝reduced-motion尊重）／2.3.3（前庭：大きな視差/回転/揺れは reduce で停止）。
- tsParticlesを使うなら `motion:{disable:true}`（reduce時）と `fpsLimit:60` を設定。

---

## ★ 推奨（ClaudeとCodexの収束 ＝ “次の一手”）

1. **Canvas 低密度の金粉／埃（dust motes / gold dust）を常設候補に**＝この世界観に一番合う。“雪”より「光に浮く金粉」。常設しても邪魔になりにくい。
2. **紙/インク系の静的文字装飾**（ドロップキャップ＋羊皮紙マーカー＋インク下線＋金縁見出し）＝動きでなく**文字の品**で世界観を作る。軽い・プロフィール/物語/ご案内に好相性。
3. **窓雨・桜・落ち葉は季節/夜テーマ限定**で。常設でなく、イベントや夜配信導線のheroだけに効かせる（執事Cafe&Barの室内感）。

**重ね方の作法**：既存 Ken Burns／金箔シマーと**同時発火させない**。目安＝「**heroは金粉、カードは静的質感、ホバーだけ微動**」。

**非推奨（Codex）**：tsParticlesで大量キラキラ（無料素材っぽい派手さになる）／全画面の高密度 桜・雪 常設（上品さを壊す）／CTA・本文近くで動く粒子。

---

## 諮問記録（共同研究のメタ）
- **Claude（母艦・Web調査）**：降りもの5種を(a)(b)(c)で比較＋性能/a11y/世界観数値＋文字装飾の新手。一次情報＝web.dev/MDN/WCAG/tsParticles公式/Codrops等。
- **Codex(GPT-5.3, agmsg経由)**：同テーマに独立回答。「Canvas低密度の金粉が最適／降りものは季節差し替え／文字は紙・インク系の静的装飾／同時発火を避ける」を提示。色のコントラスト安全値・紙インク系文字装飾6種は主にCodex由来。
- **収束点**：両者が独立に**「Canvas低密度の金粉 ＋ 紙/インク系の静的文字装飾 ＋ 季節限定の窓雨/花びら」**へ一致。相違はほぼ無く、数値はレンジとして統合した。
