# 演出カタログ #15 — 背景演出（フルページ／セクションの“地”）

> 位置づけ：**📦 運用者モードの裏在庫（新軸）**。ページ全体の雰囲気を一発で決める「背景」の演出。既存（文字/粒子/3D/装飾/降る形）とは別軸。
> きっかけ：本人「研究カタログを別軸で深掘り→見本帳に足す」（2026-06-21）。汎用（色は`var(--accent)`/`--soft`/`--deep`）。
> 安全弁：動かすのは`transform`/`opacity`/`@property`変数のみ・**filter(blur)値は固定**・基底OFF→`@media (prefers-reduced-motion: no-preference)`でON・点滅毎秒3回未満・画面外はIO停止・本文が読めるよう**スクリム必須**。

---

## 1. 背景15種（雰囲気・技法・地雷・perf・themeable）
1. **アニメグラデ** — 万能。`@property --angle`の`conic-gradient`角度を回す（位置シフトより滑らか）。地雷：未対応で角度補間不可→`@supports`で静止フォールバック。位置シフト方式は全面リペイントで重い。
2. **オーロラ** — 神秘/夜。数個のラジアルblobを`filter:blur(80-120px)`+`mix-blend:screen`、**transformだけ**ゆっくり動かす。blob 2-4個まで。
3. **メッシュグラデ** — モダン/上質。1要素に`radial-gradient`複数（4-6個・各`transparent`止め）。静止なら激安。
4. **星空/瞬き** — 夜空。`box-shadow`で点を量産（3層に分割）or Canvas。瞬きは`opacity`で（box-shadow値変化はリペイント爆発）。
5. **低密度パーティクル/ボケ** — 浮遊する光。Canvas20-60個・DPR対応・タブ非表示でrAF停止。
6. **グリッド/ドット** — テック/整然。`radial-gradient`+`background-size`、端を`mask`でフェード。
7. **斜線/ハッチング** — レトロ/装飾。`repeating-linear-gradient(45deg,...)`。
8. **ノイズ/グレイン** — フィルム質感。SVG`feTurbulence`をdata-URI→低opacityで重ねる。**静止推奨**（アニメは激重）。
9. **オーガニックブロブ** — 柔/かわいい。`border-radius`複数値を往復（疑似モーフ）。本格はSVG`d`補間。
10. **アニメSVG波** — 水/癒し。波パス3-4層を`translateX`で速度ずらしループ（2倍幅で`-50%`移動＝継ぎ目無し）。
11. **パララックス多層** — 没入/奥行き。scroll-driven(`animation-timeline:scroll()`)かポインタ`--mx/--my`で層別`translate`。`background-attachment:fixed`はモバイル不安定→使わない。
12. **コニック回転/放射光** — 後光/祝祭。`repeating-conic-gradient`を`@property`角度で低速回転＋`mask`でフェード。
13. **CRT/走査線** — レトロ/サイバー。`repeating-linear-gradient(rgba(0,0,0,.15) 0 1px,transparent 1px 3px)`オーバーレイ。フリッカーは毎秒3回以下＋PRM停止。
14. **スポットライト追従** — 高級/誘導。`radial-gradient(circle at var(--x) var(--y),...)`をmousemoveで（rAFスロットル）。タッチは自動巡回。
15. **ぼかしブロブ（SaaS定番）** — 今っぽい/清潔。色付き円2-4個を親`filter:blur(60-100px)`、ほぼ静止or超低速。最も汎用・安全。

---

## 2. 可読性ルール（背景の上で本文が読めること・必須）
- **スクリム**：背景と本文の間に半透明レイヤー（暗地`rgba(0,0,0,.4)`／明地は白）。テキスト帯だけ濃くする方向グラデが上品。
- **コントラスト**：本文4.5:1／大文字3:1（WCAG AA）。背景は場所で明度が変わる→**複数地点で測る**。
- **text-shadow**軽く。同系色被り（金文字×金地）回避。本文直下の背景は動きを弱める/PRMで静止。

## 3. perf（重要）
- **blur/filterが最重**→値は固定、動かすのは`transform`/`opacity`のみ、blur面積は小さく親にまとめる。
- CSSグラデ優先。常時重いなら逆にWebGL/Canvasの方がGPU効率良。`will-change:transform`は要所のみ。
- 画面外は`animation-play-state:paused`／タブ非表示でrAF停止。**モバイルは静止フォールバック**（blur↓・粒子↓・アニメ無効）。`@supports`で`@property`非対応に静止版。

---

## このプロジェクトへの当たり
- **安全＆今っぽい本命**：#15ぼかしブロブ／#3メッシュ／#1角度グラデ。負荷低めで上品。
- テーマ別：夜/音楽→#2オーロラ・#4星空／テック→#6グリッド・#13CRT／癒し→#10波・#9ブロブ／祝祭→#12放射光。
- 全て`var(--accent)`差し替え。本文を載せるならスクリム1枚を必ず。
- 見本帳.htmlに「背景」タブとして主要を実装（CSS中心）。

## Sources
- [Ryan Mulligan: @property](https://ryanmulligan.dev/blog/css-property-new-style/) / [MDN conic-gradient](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/conic-gradient) / [Afif: animate CSS gradient](https://dev.to/afif/we-can-finally-animate-css-gradient-kdk)
- [Aurora CSS](https://daltonwalsh.com/blog/aurora-css-background-effect/) / [Glowing blurred bg](https://andrewwalpole.com/blog/glowing-blurred-backgrounds-with-css/) / [Mesh gradient guide](https://better-gradient.com/blog/mesh-gradient-css-guide)
- [Starry CSS bg](https://ibdul.medium.com/shining-bright-the-starry-css-background-that-lit-up-my-ui-d19acb862dff) / [Starfield canvas](https://codeshack.io/interactive-starfield-canvas-background/)
- [Grainy gradients](https://css-tricks.com/grainy-gradients/) / [MDN feTurbulence](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence) / [SVG waves](https://www.cssscript.com/animated-waves-svg/)
- [CSS scroll effects](https://prismic.io/blog/css-scroll-effects) / [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) / [Smashing: text over images](https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/) / [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
