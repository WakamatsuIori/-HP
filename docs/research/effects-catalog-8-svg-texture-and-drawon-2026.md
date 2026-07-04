# 演出カタログ #8 — 和×耽美の質感＆線描き（SVGフィルタ/マスク/draw-on/金）

> 位置づけ：**📦 運用者モードの裏在庫（深掘り第2弾）**。クライアントUIには全部出さず、運用者＋AIが仕上げ時に引く引き出し。
> きっかけ：本人指示「CSS装飾#1〜#7をもっと深掘り＋拡張してクロール、コーデックスと共同」（2026-06-21）。Claude×サブエージェント3班＋Codex分担の成果。
> 守る安全弁（#2・早見表と同じ）：**動かすのは `transform`/`opacity`/`stroke-dashoffset`/`@property`登録変数のみ**・基底は無アニメ→`@media (prefers-reduced-motion: no-preference)`でオプトイン・点滅1秒3回未満・新規JSライブラリ追加なし（スクロール起動は `animation-timeline: view()` か IntersectionObserver 数行）・モバイルは焼いた画像へ縮退。
> 対象：和香松庵（耽美/和風/金）＋VTuber向けLP制作ツール両用。

---

## A. SVGフィルタで「質感」を出す（墨・和紙・金）

### A-1. 墨ぼかし／和紙にじみ（feTurbulence + feDisplacementMap / feGaussianBlur）
- **効果**：`feTurbulence`でノイズを生成→`feDisplacementMap`がその色値ぶん元画像のピクセルをずらす＝直線エッジが筆っぽく揺らぐ。`feGaussianBlur`を足すと墨のにじみ・もや・煙。
- **用途**：見出しの下線/枠を「筆で引いた」風に・ヒーロー背景にうっすら漂う墨煙・画像縁を矩形から和の有機形へ。
- **最小コード**：
```html
<svg width="0" height="0"><defs>
  <filter id="sumi-edge">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018"
                  numOctaves="3" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="14"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs></svg>
```
```css
.brush-edge { filter: url(#sumi-edge); }
```
- **目安**：`baseFrequency`小=大きな揺れ（0.01前後＝筆）／大=細かい（霧）。`scale`=揺れ強さ（10〜20上品・30超で荒れる）。`seed`で別の筆跡。
- **地雷**：`feDisplacementMap`は重く**小領域限定**（線/縁/1見出し）。`filter`要素は新スタッキングコンテキスト＋クリップ発生→揺れぶん切れるなら親に余白。アニメ化は高コスト→**静的運用**。
- **コスト回避（本命）**：ライブフィルターをやめ**完成形をPNG/静的SVGに焼く**。Astroビルド時に1枚作って`background-image`で貼れば描画コストゼロ。

### A-2. グレイン／ノイズ（feTurbulence fractalNoise → CSS背景 data-URI）
- **効果**：`fractalNoise`ノイズ矩形をdata-URIで全面に薄く重ね、フィルムグレイン・和紙の地合い。**追加リクエスト0・解像度非依存・Retina無料**。
- **用途**：生成りクリーム#faf9f6に紙質感／黒×金カードにフィルム粒／くすみ金グラデの安っぽさ消し。
- **最小コード**：
```css
.grain::after {
  content:""; position:absolute; inset:0; pointer-events:none;
  opacity:.06;                 /* 上品さ＝薄さ: 0.04〜0.08死守 */
  mix-blend-mode:multiply;     /* 明背景=multiply / 暗背景=overlay,soft-light */
  background-image:url("data:image/svg+xml,\
<svg xmlns='http://www.w3.org/2000/svg'>\
<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'\
 numOctaves='3' stitchTiles='stitch'/></filter>\
<rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
```
- **目安**：`baseFrequency` 0.65〜0.9＝フィルム粒・`numOctaves='3'`定番・`stitchTiles='stitch'`で継ぎ目消し（必須）。
- **地雷**：opacity上げすぎ厳禁（即安っぽい）。`mix-blend-mode`はブラウザ差→実機確認。`will-change`付けない。重いなら焼いた小PNGをタイルに切替。

### A-3. 金トーン／デュオトーン／金ベタ／グーイ（feColorMatrix / feFlood / feComposite）
- **効果**：`feColorMatrix`で色変換（グレー化→金デュオトーン、グーイのアルファ強調）／`feFlood`+`feComposite operator="in"`で形だけ金ベタ塗り。
- **用途**：モノクロ写真を「くすみ金デュオトーン」に統一・ロゴに金箔流し込み・SNSアイコンが寄ると水滴融合するグーイ（ホバー1箇所）。
- **金デュオトーン**：
```html
<filter id="gold-duo">
  <feColorMatrix type="matrix"
    values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0
            0.33 0.33 0.33 0 0  0 0 0 1 0"/>
  <feComponentTransfer>
    <feFuncR type="linear" slope="0.78" intercept="0.18"/>
    <feFuncG type="linear" slope="0.62" intercept="0.10"/>
    <feFuncB type="linear" slope="0.30" intercept="0.04"/>
  </feComponentTransfer>
</filter>
```
- **金ベタ**：`<feFlood flood-color="#c6a14e"/>` ＋ `<feComposite operator="in" in2="SourceGraphic"/>`。
- **地雷**：**グーイは超高コスト**（小アイコン群＋静的のみ）。属性は`type="matrix"`（`mode`は誤記）。blur半径を上げると枠外に滲み切れ→filter領域を広げる。

---

## B. マスク／clip-path でセクションを切る（破れ紙・筆エッジ・拭き取り）

### B-1. 区切り・フェード境界（mask-image グラデ／SVGマスク）
- **使い分け**：mask=アルファ/輝度で**ぼかし・にじみ可**（紙の毛羽・墨かすれ）／clip-path=パスでスパッと（半透明不可・影が消える・斜め分割向き）。
- **フェード境界**：`mask-image:linear-gradient(to bottom,#000 70%,transparent)`（`-webkit-`併記必須）。
- **破れ紙/筆の縁**：A-1で作った白黒テクスチャを焼き、`-webkit-mask` の2枚重ね＋`mask-composite:exclude`（webkit=`destination-out`）で「墨のかすれ縁」。
- **斜め分割**：`clip-path:polygon(0 0,100% 0,100% 92%,0 100%)`。
- **地雷**：`-webkit-mask`接頭辞必須。`mask-composite`の値は規格(`exclude`)とwebkit(`destination-out`)で別物→両方併記。マスクSVGは輝度基準（白=表示/黒=透明）。clip-pathは影/borderを切り落とす→影は外側ラッパーに。

### B-2. 「拭き取り」リビール（mask-position アニメ＝opacityフェードの上品な代替）
- **効果**：要素より大きいグラデマスク（300%等）を当て、`mask-position`を動かすと透明→不透明の帯が通過しワイプ登場。CSSはグラデ同士を補間できないので「形は固定・位置だけ動かす」のが定石。
- **最小コード**：
```css
.reveal{
  -webkit-mask-image:linear-gradient(90deg,#000 0 33%,transparent 66% 100%);
          mask-image:linear-gradient(90deg,#000 0 33%,transparent 66% 100%);
  -webkit-mask-size:300% 100%; mask-size:300% 100%;
  -webkit-mask-position:0 0; mask-position:0 0;   /* 既定＝全部見える（消失事故防止）*/
}
@media (prefers-reduced-motion: no-preference){
  .reveal{ animation: wipe 1s ease forwards;
           animation-timeline: view(); animation-range: cover 10% cover 40%; }
}
@keyframes wipe{ from{ mask-position:100% 0; } to{ mask-position:0 0; } }
```
- **地雷**：reduced-motion/非対応時に「隠れ位置」固定だと**中身が消える**→**基底は `mask-position:0`（全表示）**にし、no-preference内でだけ開始位置を与える。

### B-3. clip-path リビール＆モーフ（@property で割合補間・スクロール連動）
- **効果**：`clip-path:inset()/polygon()`の範囲をアニメ。`@property`で割合を`<percentage>`登録すると滑らかに補間＋スクロール連動可。
- **最小コード**：
```css
@property --c{ syntax:'<percentage>'; inherits:false; initial-value:0%; }
.card{ clip-path: inset(0 0 var(--c) 0); }      /* 既定＝全表示 */
@media (prefers-reduced-motion: no-preference){
  .card{ clip-path: inset(0 0 100% 0);          /* 開始＝隠れ */
    animation: open linear both;
    animation-timeline: view(block); animation-range: cover 15% contain 40%; }
}
@keyframes open{ to{ --c:0%; } }
```
- **地雷**：**polygonモーフは始点終点で頂点数を一致**させないと飛ぶ。割合補間は`@property`登録必須（未登録だとjumpy）。`path()`モーフは重い→モバイルはinset中心。2025〜26で`shape()`がBaseline化したが主力はinset/polygon。

---

## C. 線描き＆金の演出（draw-on / 金グラデ / 金継ぎ）

### C-1. SVG stroke draw-on（家紋・ロゴ・下線を「描く」）
- **効果**：線を破線扱いにし、隙間を線全体ぶんずらして未描画→`stroke-dashoffset`を0へ動かすと一筆書き。
- **用途**：和香松庵の紋をヒーローで一筆描き・ロゴ下の金下線をスーッと・見出し脇の罫線。
- **パス長**：従来はJSで`getTotalLength()`。**今のおすすめは `pathLength="1"` トリック**＝実寸無関係に長さ1へ正規化、`stroke-dasharray:1; stroke-dashoffset:1`だけでJS不要。
- **最小コード（純CSS・スクロール起動）**：
```html
<path d="…" pathLength="1" class="crest"/>
```
```css
.crest{ fill:none; stroke:#c9a24a; stroke-width:2; stroke-linecap:round;
  stroke-dasharray:1; stroke-dashoffset:0; }     /* 基底＝完成形（消失事故防止）*/
@media (prefers-reduced-motion: no-preference){
  .crest{ stroke-dashoffset:1;                    /* 一旦未描画に戻して */
          animation: draw 1.6s ease forwards;
          animation-timeline: view(); animation-range: cover 0% cover 35%; }
}
@keyframes draw{ to{ stroke-dashoffset:0; } }
```
- **地雷**：`stroke-dashoffset`使用には`stroke-dasharray`指定が必須。%はviewport基準で直感とズレる→`pathLength="1"`で扱う。**基底を完成形(offset:0)**にして、no-preference内で戻してからアニメ。

### C-2. アニメ金グラデ文字／金の艶（@property で角度・位置を動かす）
- **効果**：`@property`で`--shine`/`--angle`を登録→従来補間できないグラデを「位置/角度」経由で動かし、金の艶（sheen）がタイトルを滑る。
- **最小コード（艶の流れ・文字塗り）**：
```css
@property --shine{ syntax:'<percentage>'; inherits:false; initial-value:0%; }
.title{
  color:#c9a24b;                          /* フォールバック（clip非対応/RM時に残す）*/
  background:linear-gradient(100deg,#8a6d2f,#c9a24a 40%,#f6f2c0 50%,#c9a24a 60%,#8a6d2f);
  background-size:300% 100%; background-position:var(--shine) 0;
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
}
@media (prefers-reduced-motion: no-preference){ .title{ animation: sheen 6s linear infinite; } }
@keyframes sheen{ to{ --shine:100%; } }
```
- **地雷**：`@property`はChrome85+/Safari16.4+→**非対応は「静的な金グラデ文字」として成立**するよう設計（背景グラデ＋clipは古くから動く＝それ自体がフォールバック）。`-webkit-background-clip:text`接頭辞必須。透明文字は**必ず`color:`実色を先に**置く（消失＆コントラスト対策）。本文不可・見出し限定。

### C-3. 金継ぎ（kintsugi）金の亀裂
- **効果**：画像上にSVG path（割れ線）を重ね、strokeに金のlinearGradientを当てる。`mix-blend-mode`で地と馴染ませ、C-1の`stroke-dashoffset`と組めば「ヒビが金で走って埋まる」演出。
- **用途**：キービジュアル/セクション境界に金の一本筋・ロゴの「割れ→金で繋ぐ」ブランドモチーフ（再生・継承＝和香“松庵”の物語性に合う）。
- **最小コード**：
```html
<svg class="kin" viewBox="0 0 800 500">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#B88746"/><stop offset=".5" stop-color="#f6f2c0"/>
    <stop offset="1" stop-color="#8a6d2f"/></linearGradient></defs>
  <path d="M120,40 L260,180 L230,300 L360,420" pathLength="1"
        fill="none" stroke="url(#g)" stroke-width="3"
        stroke-linecap="round" stroke-linejoin="round" style="mix-blend-mode:screen"/>
</svg>
```
- **地雷**：`mix-blend-mode`は下に背景がある前提（`isolation:isolate`で意図せぬ混色防止）。金は単色だと安っぽい→**多段グラデ＋淡ハイライト(#f6f2c0)を1点**で金属感。太すぎると稲妻化→細め＋分岐＋太さムラ。blend/filter多用はモバイル重い→静止画ベイクも選択肢。

---

## D. アクセシビリティ＆パフォーマンス（横断・必読）

**重さランク（高い順）**：①feDisplacementMap・大半径feGaussianBlur・グーイ（致命的・動かすな）②feTurbulence生成（毎フレーム再計算なら重い／静的なら一度きりで軽い）③feColorMatrix/feFlood/feComposite（軽め）④静的mask/clip-path（軽い・アニメ時のみ合成コスト）。

**鉄則**：
- **動かさない・小領域・焼いて配る**。重いフィルターは線/縁/小アイコンのみ、全画面・大カードに当てない。
- **基底＝完成形**（描き終わり・全表示・色確定）。アニメは`@media (prefers-reduced-motion: no-preference)`内だけ＝reduce/JS失敗/非対応で**中身が消えない**。
- 動かすのは`transform`/`opacity`/`stroke-dashoffset`/`@property`登録変数のみ（レイアウト再計算を避ける）。`will-change`乱用禁止。`pointer-events:none`をオーバーレイに。
- スクロール起動は`animation-timeline: view()`＋`animation-range`優先（依存ゼロ・非対応は静止に自然劣化）。JSなら`IntersectionObserver`数行＋発火後`unobserve`。
- **モバイル/RM縮退**例：
```css
@media (max-width:640px),(prefers-reduced-motion:reduce){
  .brush-edge{ filter:none; }
  .grain::after{ background-image:url("/img/grain-baked.png"); } /* 焼いた軽い画像 */
  .reveal,.crest,.card{ animation:none; -webkit-mask:none; mask:none; }
}
```
- グレイン/金は**文字の可読性（WCAG AA）を割らない**（グレインは文字レイヤーの下・金グラデは本文不可）。

---

## このLPへの当たり（推奨の優先度）
- **常用（低リスク・質感大）**：A-2グレイン（data-URI, opacity .05前後）を全面に。
- **アクセント（静的）**：A-1筆エッジ・B-1破れ紙マスクを「見出し下線」「セクション境界」に。C-1家紋draw-onをヒーローに1つ。
- **ブランド演出**：C-2金グラデ文字（店名/ロゴ・フォールバック必須）。C-3金継ぎは物語性が要る1箇所だけ。
- **要注意**：A-3グーイは小アイコン群のホバー1箇所まで。
- **全体**：動かさない・小領域・モバイルは焼いた画像。これで耽美さと60fps両立。

---

## Sources
- feTurbulence/feDisplacementMap：[MDN feTurbulence](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence) / [MDN feDisplacementMap](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap) / [Codrops: Creating Texture with feTurbulence](https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/) / [bengammon: Rough CSS borders](https://bengammon.co.uk/rough-css-borders-with-svg-filters/)
- グレイン：[CSS-Tricks: Grainy Gradients](https://css-tricks.com/grainy-gradients/) / [freeCodeCamp: Grainy CSS Backgrounds](https://www.freecodecamp.org/news/grainy-css-backgrounds-using-svg-filters/)
- 色/グーイ：[Codrops: Creative Gooey Effects](https://tympanus.net/codrops/2015/03/10/creative-gooey-effects/) / [LogRocket: CSS filters with SVGs](https://blog.logrocket.com/complete-guide-using-css-filters-svgs/) / [W3C SVG Filter Effects](https://www.w3.org/TR/SVG11/filters.html)
- マスク/clip：[ishadeed: CSS Masking](https://ishadeed.com/article/css-masking/) / [MDN mask-image](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image) / [web.dev: CSS masking](https://web.dev/articles/css-masking) / [Smashing: Revealing Images With CSS Mask Animations](https://www.smashingmagazine.com/2023/09/revealing-images-css-mask-animations/) / [utilitybend: Animating clip-paths on scroll with @property](https://utilitybend.com/blog/animating-clip-paths-on-scroll-with-at-property-in-css) / [CSS-Tricks: Animating with clip-path](https://css-tricks.com/animating-with-clip-path/)
- draw-on：[MDN stroke-dashoffset](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dashoffset) / [CSS-Tricks: How SVG Line Animation Works](https://css-tricks.com/svg-line-animation-works/) / [Stefan Judis: pathLength](https://www.stefanjudis.com/today-i-learned/pathlength-makes-makes-svg-path-animations-easier-to-manage/)
- 金グラデ/blend：[theosoti: Animated Text Gradients](https://theosoti.com/short/animated-text-gradient/) / [expensive.toys: Fancy CSS reveal effects](https://expensive.toys/blog/fancy-css-reveal-effects) / [MDN: Gradients in SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Gradients) / [ishadeed: Blending Modes in CSS](https://ishadeed.com/article/blending-modes-css/)
