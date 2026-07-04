# 演出カタログ #13 — 初回ロード画面 / イントロ演出（Codex担当）

> 位置づけ：**実装寄り（オプション）**。和香松庵サイト(vtuber-hp)の「最初の読み込み時のアニメ＝ロード画面/イントロ」。汎用にも使える。
> きっかけ：本人「わかまつのサイト最初読み込む時のアニメ/ロード画面を調査・研究。Codexと2本（もう1本=#12降る形）」（2026-06-21）。**この#13はCodex(GPT-5.3)担当**をClaudeが統合。
> **大原則**：ロード演出は「待たせる画面」ではなく**「最初の一瞬だけブランドを添えて、すぐ消える薄い幕」**。コンテンツは先にHTML上へ存在させ、上に`position:fixed`のoverlayを被せるだけ。**偽の遅延は禁止**。

---

## 1. 型の分類（使い所・避ける）
1. **ミニマルspinner**：本当に非同期取得が残るUI部品だけ。全体イントロには弱い。和=金の小円/三日月なら可。✕何もロードしてないのに全画面spinner。
2. **進捗%バー**：実進捗が取れる時だけ（画像プリロード等）。✕ダミー0→100%（嘘がバレる）。代替＝上部に細い金罫線が伸びる程度。
3. **ロゴ draw-on / SVG stroke**：ブランドが強いサイトの初回のみ。和香松庵＝**家紋/ロゴを金線で0.8〜1.2s draw-on→fade out**。⭐**第一候補**。
4. **フルスクリーン splash**：初回訪問・記念LP・世界観の入口。✕毎回表示（戻る/遷移で邪魔）→sessionStorageで初回のみ。
5. **カーテン/ワイプ開幕**：和/耽美/劇場感。黒/生成りの幕が開く。安全＝`transform:scaleX/translateY`+opacityのみ。✕clip-path多用や長尺。
6. **skeleton**：NEWS/動画カードなど中身が遅れて入る部分だけ。**Astro静的＋YouTubeビルド時取得なら基本不要**。
7. **初回のみイントロ**：ブランド演出の基本。sessionStorageで1回だけ。2回目以降/遷移はView Transitionsの短いfade程度。

## 2. 使う / 避ける判断
**使う**：初回だけ／1.2秒以内／実コンテンツは裏に既に描画済み／JS失敗時も数秒後に消える／reduced-motionで即スキップ。
**避ける**：偽ロード／LCP要素をoverlay都合でDOMから消す／`body`を`display:none`／長いロゴ演出／毎ページ遷移で全画面splash。

## 3. 性能 / SEO 原則
- コンテンツHTMLは**先に存在**させ、overlayは`position:fixed`で被せるだけ。
- LCP候補のhero画像/見出しを遅延生成しない。**overlay自体がLCP候補にならない**よう巨大画像/大文字を置かない。
- layout shiftを起こさない（overlayは`fixed inset:0`）。`load`/`DOMContentLoaded`/timeoutで確実に除去→removeかhidden。

## 4. Astro実装方針
- critical CSSは`Layout.astro`のheadに**インライン**。overlay HTMLは**body先頭**。`<script is:inline>`で最小JS。
- 2回目以降はsessionStorageで出さない。`ClientRouter`/View Transitions使用時は**ページ遷移は全画面introでなく短いfade/none**。
- Astro ClientRouterは`prefers-reduced-motion`を自動サポートするが、**独自introも自前でreduce対応**する。

## 5. アクセシビリティ
- `prefers-reduced-motion: reduce`では**即skip**。
- `aria-busy`はmain相当のラッパーに一時`true`→消す時`false`。overlayにフォーカスを奪わせない（tabindex不要）。
- 長引くならskipボタン（今回は1秒前後なので不要でも可）。
- **JS失敗時に永遠に隠れない**：CSS animationフォールバック or `<noscript>`で非表示。点滅は1秒3回未満・白フラッシュ禁止。

---

## 6. 最小コード：初回のみロゴ draw-on＋確実除去（推奨）
```astro
---
// Layout.astro の body 先頭に置く想定
---
<div id="site-intro" class="site-intro" aria-hidden="true">
  <svg class="intro-mark" viewBox="0 0 120 120" role="img" aria-label="">
    <circle cx="60" cy="60" r="42" pathLength="1" />
    <path d="M36 64 Q60 30 84 64 Q60 92 36 64Z" pathLength="1" />
  </svg>
</div>
<noscript><style>.site-intro{display:none!important}</style></noscript>

<style is:inline>
  .site-intro{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;
    background:var(--intro-bg,#faf9f6);color:var(--accent,#b89b5e);
    opacity:1;pointer-events:none;transition:opacity .42s ease,visibility .42s ease;
    contain:layout paint style;}
  .site-intro.is-gone{opacity:0;visibility:hidden}
  .intro-mark{width:min(34vw,150px);height:auto;overflow:visible}
  .intro-mark circle,.intro-mark path{fill:none;stroke:currentColor;stroke-width:2.2;
    stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;
    animation:introDraw .9s ease forwards;}
  .intro-mark path{animation-delay:.16s}
  @keyframes introDraw{to{stroke-dashoffset:0}}
  @media (prefers-reduced-motion: reduce){.site-intro{display:none!important}.intro-mark *{animation:none!important}}
</style>

<script is:inline>
(() => {
  const key='wakasho:intro:v1';
  const intro=document.getElementById('site-intro');
  const main=document.querySelector('main');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen=sessionStorage.getItem(key);
  const done=()=>{ if(!intro)return; intro.classList.add('is-gone'); main?.setAttribute('aria-busy','false'); setTimeout(()=>intro.remove(),520); };
  if(!intro||reduce||seen){ intro?.remove(); return; }
  sessionStorage.setItem(key,'1');
  main?.setAttribute('aria-busy','true');
  addEventListener('load',()=>setTimeout(done,260),{once:true});
  setTimeout(done,1800); // loadが来ない/アニメ停止時の保険
})();
</script>
```

## 7. カーテン/ワイプ案（記念・イベント向け）
```html
<div id="site-intro" class="site-intro curtain" aria-hidden="true"><span></span></div>
<style>
.curtain{background:transparent;display:block;overflow:hidden}
.curtain::before,.curtain::after{content:"";position:absolute;inset:0;background:var(--ink,#17131a);transform:scaleX(1);transition:transform .75s cubic-bezier(.65,0,.22,1)}
.curtain::before{right:50%;transform-origin:left}.curtain::after{left:50%;transform-origin:right}
.curtain.is-gone::before,.curtain.is-gone::after{transform:scaleX(0)}
.curtain span{position:absolute;inset:0;margin:auto;width:80px;height:1px;background:var(--accent,#b89b5e);top:50%}
@media (prefers-reduced-motion:reduce){.curtain{display:none!important}}
</style>
```

## 8. skeleton最小（遅延で入るカード部分だけ）
```css
.skeleton{position:relative;overflow:hidden;background:color-mix(in srgb,var(--soft),transparent 65%);border-radius:10px}
.skeleton::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);animation:sk 1.4s infinite}
@keyframes sk{to{transform:translateX(100%)}}
@media (prefers-reduced-motion:reduce){.skeleton::after{animation:none}}
```

## 9. 金粉が集まってロゴ化（背景に薄く・軽量版）
```css
.intro-mark{filter:drop-shadow(0 0 16px color-mix(in srgb,var(--accent),transparent 55%))}
.site-intro::before{content:"";position:absolute;inset:0;opacity:.22;
  background:radial-gradient(circle at 48% 52%,var(--accent) 0 1px,transparent 2px),radial-gradient(circle at 58% 45%,var(--accent) 0 1px,transparent 2px);
  background-size:42px 42px,55px 55px;animation:dustGather 1.1s ease both;}
@keyframes dustGather{from{opacity:.28;transform:scale(1.06)}to{opacity:.08;transform:scale(.96)}}
@media (prefers-reduced-motion:reduce){.site-intro::before{animation:none;opacity:0}}
```

---

## 10. 汎用イントロ/ロード パターン大全（雰囲気別・約37／Claude×Codex統合）
> 「家紋→幕」は和香松庵向けの一例にすぎない。**どのクライアント/活動タイプにも当てられる**よう列挙。各＝合う雰囲気／要点／避ける。安全弁(§2-5)は全部共通。色は`var(--accent)`等で差し替え。

### A. ロゴ/名前/サイン系（ブランド主役）
- **SVGロゴ draw-on** — 高級/和/公式 ／ `pathLength="1"`+dashoffset 1→0 ／ ロゴが複雑すぎ・毎回表示。
- **イニシャル一筆 draw-on** — ロゴ未整備・個人名主役 ／ W/和 等1文字を線画0.7〜1s ／ 何のサイトか伝わらない時。
- **マスクワイプ ロゴ** — ミニマル/クール/企業 ／ `clip-path:inset(0 100% 0 0)→inset(0)` ／ 極小ロゴ・fallback無し。
- **ロゴ ステンシル（塗り抜き）** — ブランド/紋章 ／ 単色板を`mask`でロゴ型に抜く→板をscale/fadeで穴から本体出現 ／ 細密ロゴは穴が潰れる。
- **紋章スタンプ** — 和/ゴシック/周年 ／ emblemを`scale(.92) opacity0→1→fade` ／ 印影が強く公的/宗教的に見える。
- **署名サイン draw-on** — 歌い手/絵師/個人 ／ 手書きサインSVGをstroke描き ／ 本人素材が無い・読めない。
- **単一レター first-paint** — ミニマル/高級/イニシャル ／ 頭文字1字を即表示→letter-spacing/scaleで展開 ／ 頭文字が弱いブランド。

### B. 文字/テキスト系
- **名前タイプライター** — 雑談/ゲーム/レトロ/テック ／ `steps()`+低頻度caret ／ 長い名前・上品和路線。
- **名前 段差出現(stagger)** — かわいい/歌い手/アイドル ／ 文字spanを`translateY+opacity`遅延 ／ 文字数多い。
- **文字ごとマスク（せり上げ）** — エディトリアル/ファッション/上品 ／ 各文字を`overflow:hidden`枠で下→上 ／ 長文（1〜3語向き）。
- **章扉タイトルカード** — シネマ/物語/高級 ／ サイト名+小サブを中央0.8s→fade ／ 毎回長文を読ませる。
- **チェックイン端末風（ACCESS OK）** — サイバー/ゲーム/研究所 ／ 短文をopacityで一瞬 ／ 認証/エラーに見え不安を与える。

### C. 幕・マスク開幕系
- **カーテン左右開幕** — 劇場/ゴシック/和/ライブ ／ `::before/after`を`scaleX`で外へ ／ モバイル重背景・毎ページ。
- **上下スライド幕 / 和紙めくれ** — 和/巻物/幕開け ／ 上下2枚を`translateY`で外（和紙は軽い影付き） ／ 隠す時間が長い・3D回転過多。
- **スプリット斜め開幕** — サイバー/ゲーム/クール ／ `clip-path polygon`/skewの2面幕 ／ clip過多で低端末カクつき。
- **円形マスク拡大 iris** — かわいい/ファンタジー/ゲーム/シネマ ／ `clip-path:circle(0)→circle(150%)`中心=ロゴ位置 ／ LCP要素をマスク内に実配置（overlayだけに）。
- **ハート/星 iris** — アイドル/かわいい/誕生日 ／ `mask-image`/SVG clipPathで形を拡大 ／ mask非対応fallback無し・子供っぽすぎ。
- **白/黒/生成り フェード幕** — 全テーマ（最安全） ／ 幕を`opacity 1→0` ／ 無味になりがち（要アクセント）。
- **グラデ(金)スイープ リベール** — 歌い手/ラグジュアリー/ビューティ ／ 斜め帯を`mask-position`で横断 ／ コントラスト不足で帯が見えない。

### D. 進捗/ローダー系（実ロード同期・偽進捗禁止）
- **数字カウント 0→100** — ゲーマー/サイバー/待機風 ／ 実進捗が無いなら短い装飾カウントに留める ／ 偽ロードに見える時（基本控えめ）。
- **クロック/秒針** — 夜配信/ASMR/落ち着き ／ 細い円と針を1回転 ／ 長時間回転・前庭配慮。
- **細線spinner各種** — ミニマル/クール/汎用fallback ／ 細1色のSVG弧回転・二重リング・ドット三連 ／ ブランド主役には弱い。
- **金罫線ヘアライン プログレス** — 和/高級/エディトリアル ／ 上部1〜2px線を`scaleX`で実進捗同期 ／ %と組んで偽進捗化。
- **カウンター＋バー コンボ** — テック/ゲーマー/制作実績 ／ 数字とバー端を揃え説得力 ／ 超軽量ページ（一瞬）。

### E. テクスチャ/質感変化系
- **ブラー→クリア** — 癒し/ASMR/写真/上品 ／ ロゴor短文だけ`filter:blur(8px)→0`(+scale1.05→1) ／ 本文全体blurで可読性/LCP低下。
- **モザイク/ピクセル 解像** — レトロゲーム/Y2K/ミステリー ／ 小ブロックgridを個別fade（CSS背景で軽く） ／ DOM大量生成。
- **グリッチ一瞬** — サイバー/ゲーム/ホラー少量 ／ 0.2〜0.4sだけclip/translateズレ ／ 点滅・常時glitch・上品系。
- **リキッド/インク リベール** — 和/墨/アート/耽美 ／ 墨滲み(`feTurbulence`)を`mask`しきい値で拡大 ／ SVGフィルタ重い・安手素材。
- **モーフィング ブロブ** — 癒し/ポップ/Y2K ／ SVGパス変形→ロゴへ収束(gooey) ／ 硬派/テック・filter負荷。
- **Hero画像へズームイン** — 一枚絵が強い/イベントLP ／ overlay上の同一hero片を`scale1.04→1`で消す ／ 実hero読込を遅らせる・巨大画像。
- **ポラロイド現像** — レトロ/写真/日常 ／ 白カードを`opacity/contrast`で浮かす ／ 画像待機の本物遅延化。

### F. 雰囲気/モチーフ系
- **粒子が集まってロゴ化** — 幻想/高級/歌い手 ／ 背景radial-gradientを軽くscale/fade＋ロゴdraw-on（canvas粒子は重い） ／ スマホで大量粒子。
- **季節モチーフ落下（桜/雪 1モチーフ）** — 季節/和/癒し ／ 全面でなく1〜3個だけ斜めに流す（#12と連動） ／ 常時降雪・大量DOM。
- **円環シジル（魔法陣）draw-on** — ファンタジー/魔法/占い/ゴシック ／ circle+短pathを少しずつdelay ／ 厨二/宗教的に寄る案件。
- **星座ライン接続** — 幻想/占星/夜配信 ／ SVG lineを`dashoffset`で描き点をfade ／ 点が多すぎて重い。
- **音波ライン** — 歌い手/ASMR/ラジオ ／ 5〜9本の縦線を`scaleY`で一度揺らす ／ 無限に動く・音が鳴る印象。
- **RGBスキャンライン** — ゲーマー/サイバー ／ 細い光線が上→下へ1回通過 ／ 強フラッシュ・高速点滅。
- **スイス カラーブロック順消え** — ミニマル/ポップ/モダン ／ 3〜5本の色面を`scaleY`遅延で順に消す ／ 原色が世界観と無関係。
- **リボンほどけ** — かわいい/誕生日/アイドル ／ 中央リボン線を`scaleX`で左右へ ／ 高級/クール系。

### 要所コード（共通・流用可）
```css
/* iris開き */ .intro{clip-path:circle(150% at 50% 50%);transition:clip-path .7s ease,opacity .4s}
.intro.is-gone{clip-path:circle(0 at 50% 50%);opacity:0}
/* グラデ(金)スイープ */ .intro{ -webkit-mask:linear-gradient(60deg,#000 40%,transparent 60%) 100% 0/300% 100% no-repeat; }
.intro.is-gone{ -webkit-mask-position:0 0; transition:-webkit-mask-position .8s }
```
（除去JS・draw-on・カーテンは §6/§7 を流用。）

---

## 実装推奨（活動タイプ別の当たり）
- **共通の安全装置**（実ロード同期・load/timeout除去・reduced-motion即skip・noscript・初回のみ）は**どのパターンでも必須**（§2-6）。
- **軽量/安全重視**＝D「ヘアライン」or「細線spinner」単体。**ブランド主役**＝A系ロゴ1つ＋退場にC「スプリット/カーテン」。**雰囲気付け**＝ロゴ系＋背景にF「粒子/季節/金スイープ」を薄く。
- 和香松庵（一例）＝A「家紋draw-on」→C「生成り幕fade」＋F「金粉を背景に薄く」。#8 C-1（家紋draw-on `pathLength="1"`）/ #12（降る形）と地続き。

## Sources
- [web.dev: LCP](https://web.dev/articles/lcp) / [Astro View Transitions / ClientRouter](https://docs.astro.build/en/guides/view-transitions/) / [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [MDN aria-busy](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy) / [MDN stroke-dasharray](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray) / [MDN sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
