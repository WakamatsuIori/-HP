# 演出カタログ #10 — モダンCSS 2026 実戦棚卸し（Codex担当）

> 位置づけ：**🧱 基盤候補＋📦裏在庫の混在**。新機能ごとに「すぐ採用／UI部品限定／実験」を仕分けた。
> きっかけ：本人指示「#1〜#7を深掘り＋拡張・クロール・コーデックス共同」（2026-06-21）。**この#10はCodex(GPT-5.3)担当ぶん**をClaudeが統合。
> 大前提：**VTuber LPでは新機能を主役にしない**。基本は静的に成立→対応ブラウザで上品に強化。安全弁＝`@supports`＋`prefers-reduced-motion`＋transform/opacity中心・依存追加なし。

---

## 1. Scroll-driven animations（`animation-timeline: scroll()/view()`）
- **何ができる**：スクロール位置/要素の表示進捗をCSSアニメの時間軸にできる。**JSのscrollリスナー無し**で進捗バー・セクションreveal・背景のゆるい視差。
- **LP用途**：ヒーロー下の金罫線が伸びる／プロフィールカードがview進捗で薄く浮く／年表・NEWSの進捗演出。scrollytellingは1ページLPの山場だけ。
- **対応**：MDNで Limited availability。2026でも全ブラウザ前提にしない＝**enhancement扱い**。
- **fallback**：従来のIntersectionObserver方式reveal、非対応は静止表示。
- **最小コード**：
```css
@supports (animation-timeline: view()) {
  .reveal{ animation: fadeUp both; animation-timeline: view(); animation-range: entry 15% cover 35%; }
}
@media (prefers-reduced-motion: reduce){ .reveal{ animation:none; } }
```
- **地雷**：`animation`ショートハンドは`animation-timeline`をresetし得る→**timeline指定はanimation後に書く**。全セクションに入れると読み疲れ。大型parallaxは前庭症状配慮でNG。
- Source: [MDN animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)

## 2. `@property`（型付きカスタムプロパティ）
- **何ができる**：CSS変数に型・初期値・継承可否を与え、数値/角度/色を**滑らかにアニメ**（従来は不可）。
- **LP用途**：金箔シマー角度・グラデ位置・カード光沢・和紙ノイズ濃度・ボタン押下深度。JSなしでテーマ変数を演出に接続。
- **対応**：**Baseline 2024＝実戦投入OK**。
- **fallback**：未対応でも通常CSS変数の静的値で成立。
- **最小コード**：
```css
@property --shine-x{ syntax:'<percentage>'; inherits:false; initial-value:0%; }
.gold-line{ --shine-x:0%;
  background:linear-gradient(90deg,#8a7142,#f6e6a8 var(--shine-x),#8a7142);
  transition:--shine-x .8s ease; }
.gold-line:hover{ --shine-x:100%; }
```
- **地雷**：登録しすぎると管理が重い。**色の可読性補正を@propertyアニメに任せない**（重要色は#6でビルド時に確定）。
- Source: [MDN @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)

## 3. Container queries（`@container` / `cqi`）
- **何ができる**：viewportでなく**親コンテナ幅**でカード内部レイアウトを変える。`cqi`等はコンテナ基準の単位。
- **LP用途**：bento/動画/SNSリンク群/プロフィールカードが「置かれた幅」で自律変形＝LP/HP/サイドバー流用に強い。
- **対応**：`container-type`は広く利用可（2023以降）。**すぐ採用OK**。
- **fallback**：flex/grid＋media queryで大枠→`@container`は上乗せ。
- **最小コード**：
```css
.card-wrap{ container: vt-card / inline-size; }
.profile-card{ display:grid; gap:1rem; }
@container vt-card (width > 520px){
  .profile-card{ grid-template-columns:160px 1fr; }
  .profile-card h2{ font-size:clamp(1.4rem,4cqi,2.2rem); }
}
```
- **地雷**：`container-type:size/inline-size`はcontainmentで子サイズ依存を切る→高さ未定要素で崩れやすい。何でもcontainer化しない。
- Sources: [MDN container-type](https://developer.mozilla.org/en-US/docs/Web/CSS/container-type) / [MDN Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)

## 4. `@starting-style` + `transition-behavior: allow-discrete`
- **何ができる**：DOM追加直後・`display:none`→表示・popover/dialog/top-layerの入退場をCSS transitionで扱える。`display`/`overlay`等の離散プロパティも遷移対象に。
- **LP用途**：お知らせモーダル・画像プレビュー・「リンクコピー完了」popover・FAQ/提出ガイドの軽い入退場。
- **対応**：両方 **Baseline 2024**（一部差あり）。**UI部品限定で採用**。
- **fallback**：opacity/transformのみtransition、display切替は即時。
- **最小コード**：
```css
.notice[popover]{ opacity:0; transform:translateY(8px);
  transition: opacity .25s, transform .25s, display .25s allow-discrete, overlay .25s allow-discrete; }
.notice:popover-open{ opacity:1; transform:none; }
@starting-style{ .notice:popover-open{ opacity:0; transform:translateY(8px); } }
```
- **地雷**：`@starting-style`はCSS transitions用（keyframesには不要）。順序/詳細度で負けると効かない。LP本体のrevealよりUI部品向き。
- Sources: [MDN @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) / [MDN transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior)

## 5. Anchor positioning（`anchor-name` / `position-anchor` / `position-area`）
- **何ができる**：tooltip/popover/badgeを特定要素にCSSだけで係留。
- **LP用途**：SNSアイコンの説明吹き出し・グッズカードの「NEW」バッジ・画像注釈・スケジュール表の補足tooltip。
- **対応**：`anchor-name`は **Baseline 2026**（機能差あり）。**enhancement／UI部品限定**。
- **fallback**：通常absolute配置、またはpopoverを中央/下部固定。
- **最小コード**：
```css
.icon{ anchor-name:--yt; }
.tip{ position:absolute; position-anchor:--yt; position-area:top center; margin-bottom:.5rem; }
@supports not (anchor-name:--x){ .tip{ position:absolute; right:0; bottom:100%; } }
```
- **地雷**：hidden/display:noneのanchorには係留不可。overflow時のfallback設計が要る。**モバイルはtooltipより下部sheet/常時ラベルが安全**。
- Source: [MDN anchor-name](https://developer.mozilla.org/en-US/docs/Web/CSS/anchor-name)

## 6. `light-dark()` / `color-scheme`
- **何ができる**：light/dark両対応色をCSS内で簡潔に。`color-scheme`はUA部品/スクロールバー/フォームにも色モードを伝える。
- **LP用途**：ミッドナイト/ホワイト切替・フォーム部品の自然な色合わせ・テーマトークンのlight/dark差分。
- **対応**：`color-scheme`は広く利用可、`light-dark()`は **Baseline 2024**（color-scheme設定とセット）。**すぐ採用OK**。
- **fallback**：通常のCSS変数＋`prefers-color-scheme`。
- **最小コード**：
```css
:root{ color-scheme: light dark; }
body{ color: light-dark(#332b22,#f4ead8); background: light-dark(#faf9f6,#0f0d10); }
```
- **地雷**：**自動dark化任せにしない**。和香松庵の生成り×金はdark反転で世界観が壊れる→ブランドテーマは手動トークン優先。
- Sources: [MDN light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) / [MDN color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)

## 7. `text-wrap: balance / pretty`
- **何ができる**：見出し/短文の改行を見栄えよく。balance＝短い見出し、pretty＝本文寄りの孤立語回避。
- **LP用途**：ヒーローコピー・セクション見出し・キャッチ・プロフィール冒頭＝和/耽美の余白感に効く。
- **対応**：**Baseline 2024**（値ごとに支援差・性能差）。**すぐ採用OK**。
- **最小コード**：`.hero-copy{ text-wrap:balance; } .profile-lead{ text-wrap:pretty; }`
- **地雷**：**prettyは性能負荷**→長文全部に掛けない。日本語は禁則/約物/手動改行との相性確認。見出し=balance、本文=必要箇所だけpretty。
- Source: [MDN text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap)

## 8. `interpolate-size: allow-keywords`（高さ0→autoのtransition）
- **何ができる**：`height:0→auto/max-content`等、数値とintrinsic size間のtransition。
- **LP用途**：FAQ・プロフィール詳細・NEWS折りたたみ・素材提出ガイドの開閉。
- **対応**：Limited availability／Experimental。**本番必須にしない（実験/裏メモ）**。
- **fallback**：max-height方式、`grid-template-rows:0fr→1fr`、details/summary静的開閉。
- **最小コード**：
```css
@supports (interpolate-size: allow-keywords){
  :root{ interpolate-size: allow-keywords; }
  .faq-body{ height:0; overflow:hidden; transition:height .25s ease; }
  details[open] .faq-body{ height:max-content; }
}
```
- **地雷**：intrinsic同士は不可（片側はlength-percentage必要）。未対応で壊れないfallback必須。FAQは開閉できれば十分＝必須演出にしない。
- Source: [MDN interpolate-size](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size)

## 9. `field-sizing: content`（入力欄が内容で伸縮）
- **何ができる**：input/textarea/selectを内容に合わせ伸縮。
- **用途**：**LP制作ツール側の編集UI向き**（タグ入力・短い肩書き・リンクラベル・NEWS種別select）。公開LPより編集UI。
- **対応**：Limited availability。**必須にしない（実験/裏メモ）**。
- **fallback**：min/max width、textarea auto-grow JS、rows指定。
- **最小コード**：
```css
@supports (field-sizing: content){
  .tag-input{ field-sizing:content; min-width:8ch; max-width:100%; }
  textarea.note{ field-sizing:content; min-block-size:4lh; max-block-size:14lh; }
}
```
- **地雷**：固定width/heightと競合。未入力時に細すぎ→**min指定必須**。textareaは伸びすぎ防止にmax-block-size。
- Source: [MDN field-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing)

---

## 採用優先度（和香松庵／VTuber LP向け・Codex判定）
1. **すぐ採用**：container queries・text-wrap:balance・@property・color-scheme/light-dark
2. **UI部品限定で採用**：@starting-style + transition-behavior・anchor positioning
3. **実験/裏メモ**：scroll-driven animations・interpolate-size・field-sizing

## 実装ルール（このプロジェクトの掟）
- 新機能は必ず `@supports` 内。**非対応時に静的で美しい状態を先に作る**。
- motionは transform/opacity 中心。scroll-drivenは全ページでなく1〜2箇所。
- `prefers-reduced-motion` で scroll-driven/shimmer/reveal を停止。
- **依存追加なし**。CSSだけで強化、必要なら既存JSの小補助まで。

> #6配色システムと併用前提：色の最終値は#6 ensureReadableで確定し、@propertyアニメには「演出（角度/位置/濃度）」だけ任せる＝可読性をアニメに委ねない。
