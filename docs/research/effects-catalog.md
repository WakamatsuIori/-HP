# VTuber公式HP エフェクト・カタログ（収集版）

> 和香松庵（オフホワイト×くすみ金×明朝／黒×金ブランド／耽美な執事Cafe&Bar）向けに、Web上の実装可能な演出を要素別に収集したもの。
> **採用条件（CLAUDE.md §6 準拠）**：①リッチ演出はトップ1箇所のみ ②モバイル軽量 ③`prefers-reduced-motion` 対応必須。
> 重さ表記：◎=軽い／○=中／△=要注意（重い・モバイル制約あり）。著作物の長文引用なし・出典URL付き。

---

## ⭐ おすすめ早見表（まずここだけ見ればOK）

### 全ページ常設してよい「軽量ベース」（すべて純CSS・◎）
| 演出 | 使いどころ | 重さ |
|---|---|---|
| 金箔グラデ文字（`background-clip:text`） | ロゴ「和香松庵」/ WAKAMATSU IORI / 見出し | ◎ |
| 金箔シャイン・スイープ（1回だけ光る） | ロゴ初期表示・キャッチコピー | ◎ |
| 立ち絵フローティング＋呼吸 | FVの立ち絵 | ◎ |
| 背後の金 radial glow（明滅） | 立ち絵の後光 | ◎ |
| フィルムグレイン（静止SVGノイズ） | 全面に薄く重ねる質感 | ◎ |
| 金のヘアライン罫線 | セクション区切り | ◎ |
| ホバー下線リビール（左/中央から伸びる） | ナビ・本文リンク・SNS | ◎ |
| `:focus-visible` 金フォーカスリング | 全ボタン/リンク（WCAG必須） | ◎ |
| カードのリフト（浮き＋影） | 週間予定/動画/グッズカード | ◎ |
| フェードアップ出現（scroll reveal） | ABOUT・プロフィール・お知らせ | ◎ |

### トップ1箇所だけの「リッチ枠」候補（いずれか1つ厳選）
| 演出 | 雰囲気 | 重さ | モバイル |
|---|---|---|---|
| Ken Burns（背景ゆっくりズーム/パン） | 映画的・静か | ◎ | ◎ |
| マウス追従チルト＋カーソルスポットライト | 「視線を追う」「灯りで照らす」 | ○ | 無効化前提 |
| scroll-driven パララックス（純CSS `scroll()`） | 奥行き | ◎ | ○ |
| 控えめメッシュ/オーロラグラデ背景 | 金の光がにじむ闇 | ○ | ○ |

### 重い「参考」枠（採用は慎重・モバイル要間引き）
GSAP+Lenis パララックス／tsParticles 金粒子／Stripe風WebGLグラデ／VANTA fog／three.js Points

### Astro 静的サイト特典
ページ遷移は **Astro `<ClientRouter />`**（標準・reduced-motion自動無効化）が土台に最適。`transition:name` でロゴ/立ち絵を全ページ持続できる。

---

## 1. ヒーロー演出

- **Ken Burns（ゆっくりズーム＆パン）** — 背景が20秒かけ微拡大＋ドリフト。映画的な呼吸。純CSS（`transform: scale`＋`translate3d`）。◎/◎/◎（reduceで`animation:none`）。 https://oliverjam.es/articles/ken-burns-hero-image / https://www.kirupa.com/html5/ken_burns_effect_css.htm
- **オーロラ/メッシュ・グラデーション背景** — radial層がゆっくり動き光がにじむ。純CSS（複数`radial-gradient`＋`filter:blur`）。○/○/◎。 https://dev.to/albertwalicki/aurora-ui-how-to-create-with-css-4b6g / https://github.com/LunarLogic/auroral
- **パララックス（多層スクロール）** — 背景/立ち絵/前景が速度差で奥行き。軽量は純CSS、リッチはGSAP ScrollTrigger＋Lenis。△/△/○。 https://blog.logrocket.com/create-parallax-scrolling-css/ / https://lenis.darkroom.engineering/
- **scroll-driven アニメ（`animation-timeline`）** — JSなしでスクロール量に応じフェード/拡大。純CSS（`view()`）。◎/◎/◎（非対応ブラウザは静止＝安全）。 https://developer.chrome.com/docs/css-ui/scroll-driven-animations / https://www.joshwcomeau.com/animation/scroll-driven-animations/
- **金箔シマー（タイトル光走り）** — 店名/コピーに金グラデが横切る一閃。純CSS（`background-clip:text`＋`background-position`）。◎/◎/◎。 https://ibelick.com/blog/creating-metallic-effect-with-css
- **フィルムグレイン/ノイズ** — 薄い粒状ノイズでバンディング除去＋質感。SVG `feTurbulence`＋低opacity。○/○/◎（静止なら無負荷）。 https://css-tricks.com/grainy-gradients/
- **カーソル追従スポットライト** — マウス位置に金の光がついて回り暗い画面を照らす。軽量JS（CSS変数`--x/--y`）。◎/△(hover限定)/◎。 https://frontendmasters.com/blog/css-spotlight-effect/
- **浮遊パーティクル（金の塵/ボケ）** — 微粒子がゆっくり上昇。参考tsParticles、軽量は`box-shadow`点の純CSS版。△(lib)/△/○。 https://github.com/tsparticles/tsparticles

## 2. 立ち絵・キャラクター演出

- **フローティング（ふわふわ浮遊）** — 数px上下に往復。純CSS（`@keyframes translateY`）。◎/◎/◎。 https://codepen.io/machi/pen/YymGzP
- **呼吸（micro-scale）** — 1.0↔1.01の僅かな拡縮で呼吸感。純CSS（`transform-origin:bottom center`）。◎/◎/◎。 https://vmar76.medium.com/creating-a-lions-breath-animation-with-css-e7822aae4414
- **背後の光だまり（radial glow / pulse）** — 金の後光がにじみ明滅。純CSS（擬似要素`radial-gradient`＋blur＋opacity明滅）。◎/◎/◎。 https://codepen.io/AshboDev/pen/xEpNyX
- **マウス追従の微傾き（チルト）** — カーソルに合わせ±3〜5°傾く。軽量JS or Vanilla Tilt.js。○/△(hover無効)/◎。 https://micku7zu.github.io/vanilla-tilt.js/
- **髪揺れ・布揺れ** — 髪先/裾を±1〜2°揺らす。純CSS（パーツ分割SVG＋`skewX`/`rotate`）。○/○/◎。 https://blog.logrocket.com/how-to-animate-svg-css-tutorial-examples/
- **視差レイヤー分離（多層）** — 背景/後光/立ち絵/前景を別レイヤーで動かす。軽量はマウス追従JS。○/△/◎。 https://gsap.com/community/forums/topic/38841-parallax-effect-to-hero/
- **スクロール・リベール（フェードアップ登場）** — ビュー入場で下からふわっと。IntersectionObserver自前。◎/◎/◎。 https://medium.com/@cgustin/animate-on-scroll-with-the-intersection-observer-api-ad368d91ebab

## 3. 背景・アンビエント演出

- **アニメ・メッシュグラデ（純CSS）** — radialブロブが流れる上品な下地。◎/◎/◎。最優先候補。 https://codepen.io/P1N2O/pen/pyBNzX
- **アニメ・グラデ背景流し** — `background-size:400%`を往復。◎/◎/◎。 https://dev.to/giuliamalaroda/animated-gradient-background-using-only-css-4e6l
- **フィルムグレイン（SVG feTurbulence）** — 紙/フィルム質感。静止で無負荷・耽美に好相性。◎/◎/◎。 https://css-tricks.com/grainy-gradients/ / https://ibelick.com/blog/create-grainy-backgrounds-with-css
- **グレイニー・グラデ（グラデ＋ノイズ）** — 「霧の中の金」、縞消し。◎/◎/◎。 https://www.freecodecamp.org/news/grainy-css-backgrounds-using-svg-filters/
- **CSS玉ボケ（bokeh）** — 金の光の玉。純CSS（`radial-gradient`＋`box-shadow`）。◎〜○/◎/◎。 https://css-tricks.com/bokeh-with-css3-gradients/ / https://una.im/bokeh
- **フローティング・オーブ（被写界深度）** — レイヤーごとに速度/blurを変え立体玉ボケ。○/○/◎。 https://codepen.io/tonkotsuboy/pen/zJbKNN
- **純CSS ほこり/光の粒** — `mask-image`で縁ぼかし浮遊。◎〜○/◎/◎。 https://csscrafter.com/css-particle-effects/
- **canvasダスト（軽量自前JS）** — 滑らかで密度自在。○/○/○（JS側でreduce検知）。 https://codepen.io/frexuz/pen/eYvBVW
- **tsParticles 金キラ・ボケ** — 設定だけで背景生成。○/○/◎。 https://codepen.io/matteobruni/pen/eYNMeVQ
- **純CSS 星空（twinkle）** — 多重`box-shadow`の星が瞬く。黒×金の夜に最適。◎/◎/◎。 https://codepen.io/semdeck/pen/abQBwKN
- **純CSS 流れ星** — 1〜2本だけ斜めに横切る。◎/◎/◎。 https://codepen.io/YusukeNakaya/pen/XyOaBj
- **純CSS 光線/god rays** — `conic-gradient`で放射光をゆっくり回す。窓光/ランプの雰囲気。◎/◎/◎。 https://codepen.io/yisi/pen/jmEGRB
- **CSS シマー/金箔煌めき（要素単位）** — 見出し/罫線の金スイープ。◎/◎/◎。 https://codepen.io/liuzenan/pen/VwLxPe
- **Granim.js なめらかグラデ遷移** — 約17KB・canvas。○/○/△(reduce自前)。 https://sarcadass.github.io/granim.js/
- **【重め参考】Stripe風WebGLグラデ／VANTA fog／three.js金粒子** — 表現力高だが重く、モバイル要フォールバック。 https://whatamesh.vercel.app/ / https://www.vantajs.com/?effect=fog

## 4. スクロール連動演出

> CSS scroll-driven（`animation-timeline`）は未対応ブラウザでは「普通に表示」されるだけで破綻しない。reduceは基本`animation:none`で即・最終状態。

- **フェードイン＋スライドアップ** — 定番・最も上品。純CSS`view()`/IO自前。◎/◎/◎。 https://www.joshwcomeau.com/animation/scroll-driven-animations/
- **スタッガー（時間差）リスト出現** — カードが順に登場。週間予定/動画グリッド。◎〜○/◎/◎。 https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- **AOS ライブラリ** — `data-aos="fade-up"`属性だけ。reduced-motion自動尊重。○/○/◎。 https://michalsnik.github.io/aos/
- **背景パララックス（速度差）** — 純CSS`scroll()`。◎/○/◎。 https://css-tricks.com/bringing-back-parallax-with-scroll-driven-css-animations/
- **スティッキー・ヒーロー→コンパクトnav変形** — スクロールで縮小固定。純CSS`sticky`＋`scroll()`。◎/○/◎。
- **読書プログレスバー（金線）** — 進捗0→100%。純CSS`scroll(root)`＋`scaleX`。◎/◎/◎。
- **画像クリップ/マスクreveal（inset展開）** — 拭うように開帳。純CSS`view()`＋`clip-path`。◎/◎/◎。 https://utilitybend.com/blog/animating-clip-paths-on-scroll-with-at-property-in-css/
- **数字カウントアップ** — 登録者数/配信回数。IO自前＋rAF or CountUp.js。◎/◎/◎。 https://www.cssscript.com/customizable-count-updown-animations-pure-javascript-countup-js/
- **スクロールスパイ（目次ハイライト）** — IO自前。◎/○/◎。
- **横スクロール・ピン留めギャラリー** — GSAP `pin`＋`scrub`。△/△(モバイル縦積みfallback)/○。 https://blog.jobins.jp/horizontal-scroll-animations-using-gsaps
- **スタッキング・カード（重なり固定）** — `sticky`＋`view()`。物語性。◎/○/◎。 https://prismic.io/blog/css-scroll-effects
- **カバーフロー/3Dカルーセル** — 動画サムネが映える。○/○(スワイプ◎)/○。
- **スクロール連動タイピング** — 進捗で1字ずつ。純CSS`scroll()`＋`steps()`。◎/○/◎。
- **慣性スムーススクロール土台（Lenis）** — 全体の質感底上げ。○/○/◎（reduceで`destroy()`）。 https://www.lenis.dev/
- **背景色のスクロール推移** — オフホワイト→金→黒へ「夜に落ちる」。純CSS`scroll(root)`＋`@property`。◎/◎/◎。

## 5. テキスト・タイポグラフィ演出

- **金箔グラデ文字** — `background-clip:text`でメタリック金。ロゴ/見出し。◎（静止）。 https://texteffects.dev/posts/gold-text-effect
- **金箔シャインスイープ** — ハイライト帯が一度サッと走る。◎/◎/◎。 https://codeshack.io/gradient-text-shine-effect-css/
- **無限シマー** — 常時ゆっくり微光（速度遅め）。◎/◎/◎。 https://theosoti.com/short/animated-text-gradient/
- **多層メタリック（刻印/箔押し）** — 複製＋多重`text-shadow`で厚み。◎（静止）。 https://speckyboy.com/metallic-effects-css-javascript/
- **ホログラフィック箔（conic）** — 彩度抑えてシャンパン寄りに。特別ページ限定。○/○/○。 https://blog.openreplay.com/creating-holographic-effects-css/
- **1字ずつ fade+slide up（SplitType+GSAP）** — 明朝の縦線が順に立つ。○/○/○（reduceで一括表示）。 https://gsap.com/docs/v3/Plugins/SplitText/
- **マスクreveal（下から出現）** — 映画的な「めくれ」。○/○/○。 https://tympanus.net/codrops/2020/06/17/making-stagger-reveal-animations-for-text/
- **clip-path ワイプreveal** — 左→右に拭われ出現。◎/◎/◎。 https://freefrontend.com/css-reveal-animations/
- **タイプライター** — 「ようこそ、和香松庵へ。」執事の語りに。○/○/○。 https://blog.logrocket.com/creating-typewriter-animation-css/
- **キネティック・タイポ（SVG）** — ロゴモーション。○/○/要reduce対応。 https://www.svgator.com/blog/how-to-create-svg-text-animations/
- **ホバー下線：左から伸びる（scaleX）** — ナビ/リンク。◎/◎/◎。 https://www.30secondsofcode.org/css/s/hover-underline-animation/
- **ホバー下線：background-size展開（複数行対応）** — 折返しリンクでも綺麗。◎/◎/◎。 https://www.dannyguo.com/blog/animated-multiline-link-underlines-with-css
- **見出し罫線アニメ（流れる金下線）** — 和の「あしらい」。◎/◎/◎。
- **縦書き見出し（writing-mode）** — 掛軸/暖簾の趣。Cafe&Barに直結。◎/◎(高さ注意)/◎。 https://www.w3.org/International/articles/vertical-text/
- **縦書き×1字fade** — 墨が縦に滴る出現。○/○/○。
- **カウントダウン：フリップ切替** — 機械式「パタン」。○/○/○。 https://pqina.nl/flip/
- **カウントダウン：ロール（数字スライド）** — オドメーター風で静か。○/○/○。 https://www.cssscript.com/animate-number-flip/
- **カウントダウン：円環progress（conic）** — リング＋中央数字。○/○/○。
- **staggerワード・リビール（語単位）** — 文字単位より落ち着いた高級感。◎〜○/◎/◎。

## 6. ボタン・ホバー・カーソル・カードUI演出

> モバイルはホバーが無い＝各案に「タッチ時の代替」を併記。

**ボタン**
- **シャイン・スイープ（光が斜めに走る）** — メインCTA。純CSS。◎。タッチは`:active`/入場once再生で代替。 https://codeshack.io/pure-css-shimmer-button-hover-effect/
- **塗りフィル（背景スライドイン＋文字反転）** — セカンダリCTA。純CSS。◎。 https://www.sliderrevolution.com/resources/css-button-hover-effects/
- **枠線アニメ（金が一周）** — 額縁が完成。純CSS/conic。○。 https://freefrontend.com/css-border-animations/
- **マグネティックボタン（吸着）** — 主役CTA1個だけ。軽量JS。○。モバイル無効。 https://en.inithtml.com/resources/magnetic-hover-effect-creating-cursor-attracted-buttons-with-vanilla-javascript/
- **シャイン追従（光点がカーソル追従）** — 金属プレート質感。軽量JS。○。 https://bholmes.dev/blog/a-shiny-on-hover-effect-that-follows-your-mouse-css/

**フィードバック**
- **リップル（波紋）** — 押下実感、タッチ向き◎。純CSS/軽量JS。◎。 https://css-tricks.com/how-to-recreate-the-ripple-effect-of-material-design-buttons/
- **:focus-visible 金フォーカスリング** — 全要素・WCAG 2.4.7必須。純CSS。◎。 https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible

**カード**
- **リフト（浮き＋影）** — 定番・外さない。純CSS。◎。 https://wpdean.com/css-card-hover-effects/
- **3Dティルト（傾き＋光沢）** — 主役級少数。軽量JS。○。reduceで完全オフ推奨。 https://codepen.io/Juxtopposed/pen/gOKwwgx
- **スポットライト追従** — 黒地に金の光だまり。軽量JS。○。 https://cruip.com/how-to-create-a-spotlight-card-hover-effect-with-tailwind-css/
- **グロー・グラデボーダー（金枠が灯る）** — 注目カード。純CSS conic＋mask。○。 https://www.thecoderashok.com/blog/css-gradient-border-glowing-animation
- **背景グラデのスライド** — 黒→墨→金へ滲む。純CSS。◎。

**質感**
- **グラスモーフィズム（すりガラス）** — ヘッダー/オーバーレイ。`backdrop-filter:blur`。○。可読性注意。 https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide
- **ニューモーフィズム** — アクセント止まり推奨（黒金主役には非推奨）。◎/△(コントラスト)。 https://wpdean.com/css-neumorphism/

**リンク/SNS**
- **アンダーライン・リビール** — 明朝に端正。純CSS。◎。 https://tobiasahlin.com/blog/css-trick-animating-link-underlines/
- **SNSアイコン フィル＋スケール** — 金塗りせり上がり。純CSS。◎。 https://freefrontend.com/css-social-media-icons/

**カーソル**
- **カスタムカーソル＋追従リング** — 金ドット＋遅延追従の輪。軽量JS。○。モバイル完全無効。 https://github.com/iamashruu/cursorly.js
- **カーソル追従グロー** — 背景に灯りがともる執事Bar感。軽量JS（CSS変数）。○。 https://webcrunch.com/posts/mouse-tracking-glow-effect-tailwind-css

## 7. ページ遷移・ローディング演出

- **Astro View Transitions（fade）** — `<ClientRouter/>`置くだけ。reduce自動無効。◎/◎/◎。土台に最適。 https://docs.astro.build/en/guides/view-transitions/
- **Astro transition:name 共有要素モーフ** — ロゴ/立ち絵が全ページ持続。◎/○/◎。 https://docs.astro.build/en/reference/modules/astro-transitions/
- **Astro slide（前進/後退で方向反転）** — めくる系。◎/○/◎。
- **カーテン/ワイプ遷移** — 黒幕→金縁で「開演」。barba.js＋GSAP。○/○/△。 https://tympanus.net/codrops/2026/04/08/creating-custom-page-transitions-in-astro-with-barba-js-and-gsap/
- **サークル/円形リビール** — 灯りが広がるイメージ。○/○/△。
- **オーバーレイ＋ページ名表示** — 執事が次の間へ案内する所作。○/○/△。
- **初回プリローダー/スプラッシュ（紋章フェードイン）** — 黒背景＋金エンブレム。純CSS＋極小JS。◎/◎/◎。 https://www.cssscript.com/loading-indicator-ui-preloader/
- **スケルトンローダー（シマー）** — 画像多め領域。純CSS。◎/◎/◎。 https://frontend-hero.com/how-to-create-skeleton-loader
- **ミニマル・スピナー** — 細い金リング。純CSS。◎/◎/○。
- **Lenis なめらかスクロール** — 長尺LPの縦移動。○/○/◎。 https://github.com/darkroomengineering/lenis

## 8. 和風・金箔・装飾エフェクト（ブランド直結）

- **金箔グラデ文字** — 箔押し風金文字。純CSS。◎。 https://texteffects.dev/posts/gold-text-effect
- **箔の光沢スウィープ（グリント走り）** — CTA/ロゴ/紋章フチ。純CSS。◎。 https://medium.com/@forfrontendofficial/14-css-shine-effects-for-frontend-3194b796c174
- **金のヘアライン罫線（極細＋微グロー）** — セクション区切り。純CSS。◎。 https://www.testmuai.com/blog/glowing-effects-in-css/
- **SVG罫線ドロー（自己描画）** — 唐草/曲線が手書き風に。`stroke-dashoffset`。◎。 https://css-tricks.com/svg-line-animation-works/
- **青海波 薄背景** — 波文様の地紋。SVGタイル低opacity。◎。 https://codepen.io/joosts/pen/GReXqgb
- **麻の葉 薄背景** — 六角星和柄。SVGパターン。◎。 https://hollands-spoor.com/asanoha-seigaiha-and-more/
- **キラキラ/sparkle（純CSS粒子）** — 箔の粉が舞う。○/○/◎。 https://codepel.com/animation/pure-css-sparkle-effect/
- **シマー・グリント（見出し輝き走り）** — キャッチ/「おすすめ」。純CSS。◎。 https://freefrontend.com/css-shimmer/
- **提灯/灯りの暖色グロー（多層shadow）** — 行灯モチーフ・明滅。純CSS。◎。 https://codersblock.com/blog/creating-glow-effects-with-css/
- **コーナー装飾（四隅の金あしらい）** — カードを額縁化。SVG＋CSS。◎。
- **紋章/エンブレム風あしらい** — ヘッダー/フッター/スプラッシュ。SVG＋`drop-shadow`金グロー。◎。 https://uicookies.com/css-glow-effects/
- **箔押しカード光沢（ホバーで箔が傾く）** — おすすめ/グッズカード。純CSS。◎/○/◎。 https://www.amitmerchant.com/shine-animation-on-hover-using-css/
- **水引（結び目）** — 既製ライブラリは無し。SVGパス＋`stroke-dashoffset`で「結ぶ」アニメが最軽量（新規作画前提）。

---

## 実装の型（全演出共通の安全弁）
```css
/* アニメは no-preference 側にだけ書くのが最も安全 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after { animation: none !important; transition: none !important; }
  /* 光る系は static なグラデを残す（abrupt にしない） */
}
```
- transform / opacity のみに限定するとモバイル60fpsを保ちやすい。
- ホバー演出は `@media (hover: hover)` で囲み、タッチ端末では `:active` か入場once再生に置換。
- JS演出（チルト・マグネ・カーソル）は `matchMedia('(prefers-reduced-motion: reduce)')` で分岐。

## このHPへの推奨構成（たたき台）
1. **常設ベース**：金箔グラデ文字＋立ち絵フローティング＋呼吸＋背後glow＋静止フィルムグレイン＋金ヘアライン罫線＋ホバー下線＋`:focus-visible`金リング。（全部純CSS・◎）
2. **トップ1箇所のリッチ枠**：Ken Burns背景 ＋（任意でカーソル追従グロー）。← 最も世界観に合い軽い。
3. **遷移**：Astro `<ClientRouter/>` の fade を土台に、ロゴを `transition:name` で持続。
4. **スクロール**：フェードアップ出現＋clip-path reveal＋（任意で背景色が夜に落ちる推移）。
5. 重い案（GSAP/WebGL/tsParticles）は当面見送り、必要時にトップ1箇所限定で検討。
