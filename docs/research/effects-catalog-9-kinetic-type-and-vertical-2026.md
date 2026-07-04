# 演出カタログ #9 — キネティック・タイポ／可変フォント／縦書き

> 位置づけ：**📦 運用者モードの裏在庫（深掘り第2弾）**。文字まわりの演出。耽美/和では「文字」が主役級なので独立カタログ化。
> きっかけ：本人指示「#1〜#7を深掘り＋拡張・クロール・コーデックス共同」（2026-06-21）。
> 安全則（共通）：**動かすのは `transform`/`opacity`/`@property`で型付けしたフォント軸のみ**・基底は読める静止状態・`@media (prefers-reduced-motion: no-preference)`でオプトイン・点滅禁止・新規JS最小（文字分割はビルド時かSplitting系を最小限）。

---

## 1. 可変フォント軸アニメ（タイトルが「呼吸」する）
- **効果**：variable fontの`wght`/`opsz`/カスタム軸をCSSで連続変化。`font-variation-settings`は直接keyframeだと補間が不安定なので、**`@property`で軸値を`<number>`登録して参照**すると滑らか。
- **用途**：ヒーローの「和香松庵」が数秒周期で細→太→細へ脈打つ「呼吸する見出し」。耽美でゆったり上品。
- **最小コード**：
```css
@property --wght{ syntax:'<number>'; inherits:false; initial-value:300; }
.title{ font-variation-settings:'wght' var(--wght); }   /* 基底＝静止 */
@media (prefers-reduced-motion: no-preference){
  .title{ animation: breathe 6s ease-in-out infinite; }
}
@keyframes breathe{ 0%,100%{ --wght:300; } 50%{ --wght:620; } }
```
- **地雷**：`font-weight:700`の名前付きと`font-variation-settings`の混在は競合→軸は片方に統一。重さ往復は幅変動を起こす→コンテナ幅固定で隣を揺らさない。**サブセット版に使う軸が残っているか確認**（軸を削った軽量版だと動かない）。短い見出し限定。

## 2. キネティック／段差つき文字出現（staggered reveal）
- **効果**：文字/単語を時間差で出現。CSSに`::nth-letter`は無いので**分割は最小JS（Splitting.js等）かビルド時テンプレート分割**。各spanに`--i`を持たせ`animation-delay:calc(var(--i)*60ms)`で段差（アニメ用JSは不要）。
- **用途**：キャッチコピーが墨が滲むように一文字ずつ立ち上がる。和の「間」。
- **最小コード**：
```css
/* <span class="char" style="--i:0">和</span> ... と出力 */
.char{ display:inline-block; }              /* 基底＝表示済み（消失事故防止）*/
@media (prefers-reduced-motion: no-preference){
  .char{ opacity:0; animation: rise .6s ease forwards; animation-delay:calc(var(--i)*60ms); }
}
@keyframes rise{ from{opacity:0; transform:translateY(.4em)} to{opacity:1; transform:none} }
```
- **地雷（最重要＝スクリーンリーダー）**：文字をspan分割するとSRが一字ずつ読んで意味崩壊→**可視spanに`aria-hidden="true"`、要素本体に`aria-label="和香松庵"`**（Splitting系は自動でやらない＝手当て必須）。基底を`opacity:0`にするとRM/JS失敗時に消える→基底は表示、no-preference内でだけ隠す。将来`sibling-index()`でCSS側index計算が可能になるが2026は未普及→ビルド時にindex焼き込み。

## 3. マーキー／流れるテキスト（安全実装）
- **効果**：旧`<marquee>`はWCAG2.2.2違反（止められない動き）。CSSで`transform:translateX`を無限ループ＋**内容複製**でシームレス。
- **用途**：「Bar Bluebell」「次回配信◯/◯」のお知らせ帯を静かに流す。
- **最小コード**：
```css
.marquee{ overflow:hidden; }
.track{ display:flex; gap:3rem; width:max-content; }
@media (prefers-reduced-motion: no-preference){
  .track{ animation: scroll 20s linear infinite; }
  .marquee:hover .track,.marquee:focus-within .track{ animation-play-state:paused; }
}
@keyframes scroll{ to{ transform:translateX(-50%); } }   /* 複製2セットで-50% */
```
- **地雷**：複製側に`aria-hidden="true"`（二重読み防止）。RMでは`animation:none`で全文静止表示。`:hover`だけでなく`:focus-within`でも停止（キーボード配慮）。横はみ出し注意。

## 4. グラデ文字塗り＆縁取り（金のタイトル）
- **効果**：`background:linear-gradient`+`background-clip:text`+`-webkit-text-fill-color:transparent`で文字面にグラデ。`-webkit-text-stroke`で金輪郭。アニメは`@property --angle`で角度補間。
- **最小コード（フォールバック付き）**：
```css
.gold{
  color:#c9a24b;                          /* フォールバック（clip非対応/RM時に残す）*/
  background:linear-gradient(180deg,#cfc09f 27%,#ffecb3 40%,#6b521f 90%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
}
```
- **地雷**：`-webkit-`は2026もSafari/旧Chromeに必須（prefix＋無印両方）。`text-fill-color:transparent`のままclipが効かないと**文字が消える**→必ず`color:`実色を先に。`background-clip:text`の要素は`box-shadow`/背景画像を併用不可（装飾は別レイヤー）。アニメは`background-position`旧法より`@property --angle`新法。**本文不可・見出し限定＋明暗差確保**。

## 5. 縦書き 耽美セクション（writing-mode）
- **効果**：`writing-mode:vertical-rl`で日本語縦組み。`text-orientation`で英字制御、`text-combine-upright`で縦中横（2桁数字）、`ruby`でルビ、`line-break:strict`で禁則。
- **用途**：プロフィール/口上を縦書き一段に＝執事Cafe&Barの上品さ・和の世界観。
- **最小コード**：
```css
.tate{ writing-mode:vertical-rl; text-orientation:mixed; line-height:2; line-break:strict; }
.tate .num{ text-combine-upright:all; }   /* <span class="num">26</span> を縦中横 */
.tate ruby{ ruby-position:over; }
```
- **地雷**：`text-combine-upright:digits 2`は未対応多い→`all`を使い対象数字を`<span>`で囲む（3桁以上は潰れる＝2桁まで）。`<select>`の選択肢は縦にならない・スクロールバー起点がGecko/Blinkで上下逆。半角英数は既定で横倒し→立てたい箇所だけ局所`text-orientation:upright`（全体uprightは読みにくい）。縦書きは横スクロールが出やすい→高さ固定or章を短く。縦書き自体は静的（動かすならtransform/opacityのみ）。

---

## アクセシビリティ横断（全演出共通）
- **基底＝読める静止状態**。アニメは`@media (prefers-reduced-motion: no-preference)`の内側だけ（reduce側に書くのでなくno-preferenceでオプトイン）。
- **文字分割は必ず`aria-label`＋可視span`aria-hidden`**（SRの一字読み防止）。マーキー複製も`aria-hidden`。
- グラデ/金文字は`color:`フォールバックで消失防止＋コントラスト確保・見出し限定。
- 点滅・3回/秒超の明滅禁止（光感受性）。金の明滅も避けゆっくり。
- 可変フォントはWOFF2＋`font-display:swap`（FOIT回避）。CJKは巨大（Noto CJKフル約16MB）→**使用字種をサブセット＋必要軸を残す**。上記の呼吸/グラデは見出し数文字なので影響小。

---

## このLPへの当たり（推奨）
- **常用**：4 金グラデ見出し（店名/ロゴ・フォールバック必須）。低リスクで耽美の核。
- **アクセント**：1 呼吸する見出し（ヒーロー1つ）。2 一字出現はキャッチ1行だけ（aria必須）。
- **世界観の決め手**：5 縦書きでプロフィール/口上を一段（和の上品さ）。
- **控えめに**：3 マーキーはお知らせ帯1本まで（止められること必須）。

---

## Sources
- 可変フォント：[css-irl: Variable Font Animation](https://css-irl.info/variable-font-animation-with-css-and-splitting-js/) / [Val Head: Animating variable fonts](https://valhead.com/2020/11/15/animating-variable-fonts-with-css/) / [Dinamo: Using Variable Fonts on the Web](https://abcdinamo.com/news/using-variable-fonts-on-the-web)
- stagger：[CSS-Tricks: Staggered Animation](https://css-tricks.com/different-approaches-for-creating-a-staggered-animation/) / [Cloud Four: Staggered Animations with CSS Custom Properties](https://cloudfour.com/thinks/staggered-animations-with-css-custom-properties/) / [Chrome: CSS Wrapped 2025 (sibling-index)](https://chrome.dev/css-wrapped-2025/)
- マーキーa11y：[GetWCAG 2.2.2](https://getwcag.com/en/accessibility-guide/marquee) / [olavihaapala: Modern accessible marquee](https://olavihaapala.fi/2021/02/23/modern-marquee.html)
- グラデ/縁取り：[texteffects.dev: Gold Text Effect](https://texteffects.dev/posts/gold-text-effect) / [Divya Manian: background-clip fallback](https://nimbupani.com/using-background-clip-for-text-with-css-fallback.html) / [Chen Hui Jing: Hacking background-clip](https://chenhuijing.com/blog/hacking-background-clip-with-gradient-colour-stops/)
- 縦書き：[W3C i18n: Styling vertical text](https://www.w3.org/International/articles/vertical-text/) / [MDN text-combine-upright](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-combine-upright) / [MDN text-orientation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-orientation) / [CSS Writing Modes Level 4](https://www.w3.org/TR/css-writing-modes-4/)
- フォント性能：[Web Almanac 2025: Fonts](https://almanac.httparchive.org/en/2025/fonts) / [DebugBear: Font Performance](https://www.debugbear.com/blog/website-font-performance)
