# 演出カタログ #12 — 降る/浮かぶ装飾の「形」バリエーション

> 位置づけ：**📦 運用者モードの裏在庫**。#3「降りもの」（金粉Canvas低密度を推奨）の拡張＝**任意の形を降らせる/漂わせる**実装知識。
> きっかけ：本人「降る粒子みたいの、粒子だけじゃなく様々な形できると思う→調査。コーデックスと2本(もう1本=ロード画面)」（2026-06-21）。
> 前提：汎用（色は`var(--accent)`で差し替え）・Astro静的・純CSS or 軽量JS・モバイル軽量。安全弁＝transform/opacityのみ・基底OFF→`@media (prefers-reduced-motion: no-preference)`でON・点滅毎秒3回未満・画面外はIO停止・`pointer-events:none`。

---

## 1. 形状カタログ（vibe・用途・動きの性格）
| 形状 | vibe / 用途 | 動きの性格 |
|---|---|---|
| 雪 snow | 冬・清楚 | まっすぐ落下＋横ゆれ小・低速 |
| 桜/花びら petal | 春・和・耽美（和香松庵◎） | 揺れながら落下＋ひらり反転(flip) |
| 紅葉/落葉 leaf | 秋・ノスタルジー | 大きく横滑り＋回転・不規則 |
| 金粉/スパークル | 高級感（既存採用） | ゆっくり漂う＋点滅小 |
| 泡 bubble | 涼・夏 | **下→上に上昇**＋横ゆれ・上端で消滅 |
| 星/きらめき ✦ | 夜空・魔法・祝祭 | その場明滅(scale+opacity) or 緩降下 |
| ハート | 可愛い・投げ銭演出 | 上昇 or ふわふわ落下 |
| 紙吹雪 confetti | 祝祭・達成 | 短冊が高速回転落下・バースト/常駐 |
| 音符 ♪ | 音楽・歌枠 | 上昇＋左右ゆれ＋傾き |
| 羽根 feather | 天使・幻想 | 超低速・大きく弧を描く |
| 蛍/ボケ firefly/bokeh | 夜・幻想・和の夏（耽美バー◎） | ランダムにドリフト＋ぼんやり発光明滅 |
| 火の粉/灰 ember | 焚き火・劇的 | **下→上に上昇**＋揺らぎ・温色 |
| 雨 rain | 憂い・落ち着き | ほぼ垂直高速落下・細長 |
| 幾何形 三角/円 | モダン・ミニマル | 緩い回転＋ドリフト |
| ロゴ/家紋 kamon | ブランディング | 低密度・ゆっくり回転 |
| 絵文字 emoji | 手軽・季節替え | 任意 |

---

## 2. 任意の形をどう描くか（本題・6手法）
### (a) 絵文字/テキストをパーティクルに（最速・汎用）
```css
.particle::before{ content:"🌸"; font-size:18px; }   /* Canvasなら ctx.fillText("🌸",x,y) */
```
- 季節替えが`content`差し替えだけ。**地雷**：OS/ブラウザで見た目が変わる・色は基本固定（varで着色不可）。

### (b) clip-path polygon（星・ハート・三角を1要素で・色替え可）
```css
.star{ clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
.tri{ clip-path:polygon(50% 0,100% 100%,0 100%); }
.particle{ background:var(--accent); }   /* 色は自在 */
```
- **地雷**：形をアニメ補間するなら頂点数を揃える（落下は形固定なのでOK）。ハート綺麗版は頂点多い。

### (c) border-radius トリック（花びら・葉）
```css
.petal{ width:14px;height:20px;background:var(--accent);border-radius:50% 50% 50% 50%/60% 60% 40% 40%; }
.leaf{ border-radius:0 100% 0 100%; }
```
- SVG不要で桜花びら/葉・var着色可・flipと好相性。**地雷**：「ザ・桜」5弁は近似まで。

### (d) SVG path / symbol（精密な家紋・雪結晶・紅葉）
```html
<svg viewBox="0 0 24 24" class="particle" fill="var(--accent)"><path d="M12 2 … Z"/></svg>
<!-- 多数は <symbol id="kamon"> 定義 → <use href="#kamon"> で共有 -->
```
- **既存 `icons\` の家紋SVGをそのまま降らせる最有力**。ベクタで劣化なし・`fill=var(--accent)`で色替え。**地雷**：DOM大量は重い（数十まで）→`<use>`共有、Canvasなら`Path2D`。

### (e) background-image / mask-image（PNG/SVGを画像として）
```css
.particle{ background:var(--accent);
  -webkit-mask:url(petal.svg) center/contain no-repeat; mask:url(petal.svg) center/contain no-repeat; }
```
- **mask方式なら単色元画像でも`background:var(--accent)`で色替え可**（PNG着色問題を回避）。**地雷**：`background-image:url()`直貼りは色固定→色替えするなら必ずmask。`-webkit-`併記。

### (f) box-shadow マルチドット（1要素で多数の点）
```css
.snow{ width:3px;height:3px;border-radius:50%;background:var(--accent);
  box-shadow:20px 30px var(--accent),120px 80px var(--accent),220px 10px var(--accent)/*…数百*/; }
```
- DOM1要素で雪/金粉/星の点を大量に。**地雷**：全点が同形・同色・同動き（個別アニメ不可）。座標はSass/JS生成。点以外は不向き。

---

## 3. 実装方式の比較
| 方式 | 向く場面 | Pros | Cons | 推奨個数 PC/モバイル |
|---|---|---|---|---|
| **CSS-only**(N要素＋keyframes・nth-childで遅延ばらつき) | 少数・静的・依存ゼロ | ビルド不要・RM制御がCSSだけ・合成のみ軽い | 数十超で重い・ランダムは手書き | 〜30/〜15 |
| **Canvas 2D** | 多数・カスタム描画・任意形 | 1要素で数百個・`fillText`/`Path2D`/`drawImage`で何でも・最柔軟 | JS必須・rAF管理・停止/Retina自前 | 〜150/〜60 |
| **SVG**(`<use>`＋CSSアニメ) | 精密形状の少数(家紋数個) | 高精細・`fill=var()`・アクセシブル | 多数で重い・SMILよりCSS推奨 | 〜20/〜10 |
| **tsParticles**(particles.js後継) | 設定でリッチ量産 | shape/動き/相互作用豊富・FPS制限内蔵 | バンドル増・依存。低密度金粉には過剰 | ライブラリ任せ |
- particles.js は**メモリリーク/更新停止で非推奨**→使うなら**tsParticles**。上品・低密度・1〜2形なら**Canvas自前 or CSS-only**が軽い。

---

## 4. モーションレシピ（transform/opacityのみ）
```css
/* ① 横ゆれ落下（雪・花びらの基本） */
@keyframes fall{ 0%{transform:translate(0,-10vh) rotate(0)} 100%{transform:translate(40px,110vh) rotate(360deg);opacity:.9} }
/* ② 花びらフリップ（落下ラッパー＋内側flipの二重掛け） */
@keyframes flip{ 0%{transform:rotateY(0) rotateX(0)} 100%{transform:rotateY(360deg) rotateX(180deg)} }
/* ③ 上昇バブル/火の粉 */
@keyframes rise{ 0%{transform:translateY(0);opacity:0} 10%{opacity:.7} 100%{transform:translateY(-110vh) translateX(20px);opacity:0} }
/* ④ 蛍ドリフト＋緩glow */
@keyframes drift{ 0%{transform:translate(0,0)} 33%{transform:translate(30px,-20px)} 66%{transform:translate(-15px,15px)} 100%{transform:translate(0,0)} }
@keyframes glow{ 0%,100%{opacity:.2} 50%{opacity:.9} }
```
- 紙吹雪：バースト＝`animation-iteration-count:1`＋高速`rotate3d`／常駐＝`infinite`低密度。`left/top`でなく`transform`で動かす・opacityは滑らかに（点滅させない）。

---

## 5. パフォーマンス＆a11y（チェックリスト）
- **密度キャップ**：上品さ優先で低密度。PC 30〜80／モバイル半減（`matchMedia`/画面幅で分岐）。
- **opacity 0.15〜0.6**で主張しすぎない。色は`var(--accent)`。
- **明滅でなくフェード**（遅い`ease-in-out`・毎秒3回未満＝発作対策）。
- **画面外停止**：`new IntersectionObserver(([e])=>e.isIntersecting?start():stop()).observe(layer)`／`content-visibility:auto`。
- **prefers-reduced-motion**：基底OFF→`no-preference`時のみON、reduceは停止/非表示。
- `will-change`は控えめ（多数要素に付けない）・オーバーレイは`position:fixed;inset:0;pointer-events:none;z-index`（本文より上・モーダルより下）。
- **テーマ化**：色は`fill/background:var(--accent)` or mask方式に統一→形だけ差し替えで季節替え。

---

## このプロジェクトへの当たり
- 汎用ツール：テーマに応じ「雪/桜/金粉/星/紙吹雪/蛍/ハート」をプリセット化（色は`var(--accent)`・形は上記(a)〜(f)）。1〜2種・低密度を既定。
- 和香松庵（耽美バー）：**蛍/ボケ**（ドリフト＋緩glow）か**桜花びら**（border-radius＋flip）。家紋を降らすなら(d)SVG`<use>` or (e)mask-imageでくすみ金に着色。多数＝Canvas、数個＝CSS-only。

## Sources
- [MDN clip-path](https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path) / [Clippy(polygon生成)](https://bennettfeely.com/clippy/) / [web.dev shapes/clipping/masking](https://web.dev/learn/css/paths-shapes-clipping-masking)
- [LogRocket border-radius shapes](https://blog.logrocket.com/using-css-border-radius-make-shapes/) / [Modern CSS box-shadow & border-radius](https://moderncss.dev/expanded-use-of-box-shadow-and-border-radius/) / [MDN box-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow)
- [tsParticles](https://particles.js.org/) / [なぜparticles.jsをやめるべきか(メモリリーク)](https://dev.to/tsparticles/why-everyone-should-stop-using-particlesjs-right-now-5eb6)
- [StudioLimb CSS Snowfall](https://www.studiolimb.com/guides/snowfall-effect-css-guide.html) / [Balbooa Falling Confetti](https://www.balbooa.com/help/tutorials/coding/interactions/falling-confetti-animation) / [Speckyboy Bokeh snippets](https://speckyboy.com/8-css-javascript-snippets-for-creating-beautiful-bokeh-effects/)
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) / [Adobe: Animation that fails safely](https://adobe.design/ideas/animation-that-fails-safely-defensive-design-for-motion-sensitive-users)
