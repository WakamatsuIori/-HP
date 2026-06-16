# エフェクト深掘り調査（2025–2026）＋ 再提案

> 既存 [effects-catalog.md](effects-catalog.md)（約100件・収集版）の続編。専門リサーチ4方向（最新CSS技術／高級・耽美サイトのティアダウン／Astro静的での実装／性能・アクセシビリティ）で深掘りし、**和香松庵に今すぐ効く“次の一手”**へ落とし込んだもの。
> 前提：オフホワイト×くすみ金(#9c8f6b)×明朝(Zen Old Mincho)／Astro `output:'static'`→Cloudflare Pages／純CSS優先・依存最小／リッチ演出はトップ1箇所／モバイル軽量／`prefers-reduced-motion` 必須／WCAG配慮。
> **既に実装済み**（重複しない）：Ken Burns背景・CSSスパークル・フェードアップ出現(IO)・ナビ下線リビール・カードリフト・金CTAシャイン一閃・帯セクション灯りボケ漂い・`:focus-visible`金リング・`::selection`金トーン・金ヘアライン罫・大英字ウォーターマーク見出し。

---

## A. 2025–2026 本番投入できる最新CSS技術

| 技術 | 対応状況 | 使いどころ（和香松庵） | コスト | reduced-motion |
|---|---|---|---|---|
| **`text-wrap: balance`** | **Baseline 2024**（全エンジン）安全 | 明朝の屋号・キャッチ・h1/h2の折返しを整え孤立行を消す | 小 | 無関係（常時有効） |
| **`color-mix()` / 相対色 `rgb(from…)` `oklch(from…)`** | `color-mix` Baseline／相対色は `@supports`ガード推奨 | 金 #9c8f6b 一色から影・グロー・ホバー・罫色を**動的生成**しトーン統一 | 小〜中 | 無関係 |
| **`@property`（型付きカスタムプロパティ）** | **Baseline 2024** 安全 | 金グラデの**低速回転/にじみ**（角度・色を補間）＝CTAシャイン/金罫の格上げ | 中 | 停止で静的グラデ |
| **`mask-image`＋`@property` ワイプ開帳** | masking は新しめ・`-webkit-` 併記必須 | 明朝大見出しを“筆で書き出す”開帳、立ち絵下端の霞 | 中 | マスク解除で即全表示 |
| **`background-clip:text` 金箔＋無限シマー** | 安全（`-webkit-`併記・`@supports`） | 屋号 or 主CTA **1〜2箇所限定**の金箔光沢 | 小 | 停止で静的グラデ |
| **CSS Scroll-driven（`animation-timeline: view()`/`scroll()`）** | **非Baseline**（Safari/Firefoxに穴・2026前半） | あくまで“上乗せ装飾”。IO版は撤去せず `@supports` で限定併用 | 中 | `animation-timeline:none` |
| **View Transitions（`@view-transition` / Astro `<ClientRouter/>`）** | ClientRouterは全ブラウザ動作（非対応はfade擬似） | ロゴ・立ち絵を**全ページ持続**（没入感） | 中〜大 | Astro自動尊重＋`::view-transition-group`停止 |

**最小パターン例**
```css
/* text-wrap */
h1,h2,.about__catch{ text-wrap: balance; }
p{ text-wrap: pretty; } /* 未対応は通常折返しに無害劣化 */

/* color-mix で金から派生（ハードコード削減） */
:root{ --accent:#9c8f6b; }
.btn:hover{ background: color-mix(in oklch, var(--accent), black 12%); }
.glow{ box-shadow: 0 0 24px color-mix(in srgb, var(--accent), transparent 60%); }

/* @property で金グラデ回転（要 initial-value） */
@property --ang{ syntax:"<angle>"; inherits:false; initial-value:0deg; }
.foil-ring{ background: conic-gradient(from var(--ang), #9c8f6b,#d8c79a,#9c8f6b); }
@media (prefers-reduced-motion: no-preference){ .foil-ring{ animation: spin 8s linear infinite; } }
@keyframes spin{ to{ --ang:360deg; } }

/* mask + @property ワイプ開帳 */
@property --wipe{ syntax:"<percentage>"; inherits:false; initial-value:0%; }
.wipe{ -webkit-mask-image:linear-gradient(90deg,#000 var(--wipe),transparent 0);
        mask-image:linear-gradient(90deg,#000 var(--wipe),transparent 0); }
@media (prefers-reduced-motion: no-preference){ .wipe{ animation: wipe 1.1s ease both; } }
@keyframes wipe{ to{ --wipe:100%; } }
```
出典: [MDN Scroll-driven](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) ／ [caniuse text-wrap balance](https://caniuse.com/css-text-wrap-balance) ／ [web.dev @property Baseline](https://web.dev/blog/at-property-baseline) ／ [Chrome 相対色](https://developer.chrome.com/blog/css-relative-color-syntax) ／ [web.dev CSS masking](https://web.dev/articles/css-masking) ／ [Fancy reveal with masks & @property](https://expensive.toys/blog/fancy-css-reveal-effects)

---

## B. 高級・耽美サイトのティアダウン（“上品な動き”の作法）

**通底する規律**：動きで飾らず「間（ま）・余白・一枚画」で格を出す。動きは pace / reveal / weight のために使う。金は「面」でなく**線・粒・縁**に限定。

**上品に見える数値の傾向**（Codropsのマスク遷移技法ほか）：イージング `power3.out`（減速感）／scroll-scrub `2.0–2.5`（慣性追従）／要素 stagger `each 0.02s`／モバイルは**列数を削りアニメ時間は据え置きリズム維持**。

**参考サイト**（長文引用なし・URLのみ）
- Hayashi Whisky（金箔×森・段階リビール）: https://houseofgiants.com/work/hayashi
- 星のや京都（静止画＋余白＝“間”で格）: https://www.hoshinoresorts.com/jp/cards/b55kkgbcsf/
- Garden Eight（Awwwards SOTM・抑制的モーション）: https://www.awwwards.com/sites/garden-eight ／ https://garden-eight.com/
- monopo（タイポ・モーション設計）: https://www.awwwards.com/sites/monopo-portfolio
- 和デザインの作法（縦書き・間・抑えた配色）: https://www.utsubo.com/blog/japanese-web-design-style-guide
- Codrops マスク遷移の数値: https://tympanus.net/codrops/2026/03/11/svg-mask-transitions-on-scroll-with-gsap-and-scrolltrigger/

**和香松庵へ移植できる“新しい作法”7（既存実装とは別物）**
1. 明朝見出しの**下端マスク・行リビール**（1行ずつ昇る／stagger 0.06–0.1s）〔純CSS＋軽IO・モバイル可〕
2. **縦書きリードの一字フェード**（屋号/惹句を縦組み・上→下）〔純CSS・モバイルは簡略〕
3. セクション間の**「墨を拭う」マスク遷移**（斜めワイプ・power3.out）〔要JS・モバイルはフェード格下げ〕
4. **sticky pin で一枚画を読ませる**（背景固定・明朝だけ流す）〔CSS sticky＋軽JS・モバイル可〕
5. 金の**縁取りドロー**（`stroke-dashoffset` で線が描かれる）〔純CSS/SVG・モバイル可〕
6. ごく微パララックス **4–8px**（灯り/装飾だけ逆方向に気配）〔軽JS or scroll-timeline・モバイル無効〕
7. **blur→focus 入場**（明朝が万年筆のにじみからくっきり）〔純CSS・モバイルは時間短縮〕

優先：**1・2・5・7（純CSS・モバイル安全）→ 3・4・6（JS／モバイル簡略前提）**。

---

## C. Astro静的サイトでの実装（依存を増やさない範囲）

- **`<ClientRouter />`（旧ViewTransitions）**：`<head>` に1個置くだけでMPAをSPA的に。`transition:name`＝同名要素のモーフ移動／`transition:persist`＝**再生成せず状態ごと持ち越し**（立ち絵・ヘッダーをチラつかせない）。Astroが `prefers-reduced-motion` を**自動尊重**。
- **ライブラリ判断**：黒×金の落ち着いた演出はほぼ純CSSで完結。**Lenis（慣性スクロール）は入れない**（モバイル酔い・スクロール乗っ取り・reduced-motion非整合）。どうしても複雑なタイムラインが要る時だけ **Motion One の mini `animate`（≈2.3KB）を島に限定**して `client:visible`。GSAPは≈69KBで過剰。
- **画像×モーション**：ヒーローは `loading="eager"`＋`fetchpriority="high"`＋preload。**Ken Burnsは `<img>` 直変形でなくラッパーに当てる**（再ペイント/LCP判定の悪化回避）。`width/height` 必須（CLS）。LCP確定後に演出開始。
- **スクロール演出の持ち方**：小さなリビールは `is:inline` の最小IO が最も堅い。**ClientRouter併用時は `astro:page-load` で再バインド**しないと2ページ目以降で演出が死ぬ。
- **初回スプラッシュ**：`sessionStorage` で初回判定→CSSフェード。判定スクリプトは `is:inline` でヘッダー先頭（FOUC防止）。

**Cloudflare/静的の地雷**
- Pagesのつもりが Workers に振り分け（`*.workers.dev` が兆候）→設定の **"Shift to Pages"**。
- 過去のSSR用 `@astrojs/cloudflare` アダプタ残骸で server 扱いに→`output:'static'` 明示・不要アダプタ削除。
- カスタム404×View Transitions の既知バグ→404行きリンクに `data-astro-reload`（[astro#9570](https://github.com/withastro/astro/issues/9570)）。
- `transition:animate` 回帰報告（[astro#13974](https://github.com/withastro/astro/issues/13974)）／v6×CF static デプロイ失敗報告（[astro#15650](https://github.com/withastro/astro/issues/15650)）→バージョン固定＆ビルド後目視。

出典: [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/) ／ [ClientRouter考察](https://events-3bg.pages.dev/jotter/astro-view-transitions/) ／ [Motion: GSAP vs Motion（サイズ）](https://motion.dev/docs/gsap-vs-motion) ／ [PageSpeedFix: Astro画像/LCP](https://www.pagespeedfix.com/blog/astro-image-optimization/) ／ [Astro on Cloudflareの罠](https://www.gmkennedy.com/blog/deploy-astro-cloudflare-pages/)

---

## D. 性能・アクセシビリティ（“軽さ”と“配慮”の最新作法）

**鉄則**
- アニメで触ってよいのは **`transform / opacity / filter` のみ**（合成スレッドで処理＝INPに影響せず・CLS非計上）。`width/top/margin/box-shadow/background-position` のアニメはNG。
- **`will-change` は乱用厳禁**：常時合成される無限アニメ要素だけ静的許容。ホバー演出には付けない（必要時JSで一時付与→除去）。
- **`content-visibility: auto; contain-intrinsic-size: 0 800px;`** を長い画面外セクションに付与＝レンダ/ペイントをスキップ（初期描画・INP改善、2025/9 全エンジンBaseline）。読み上げ・検索に影響なし。
- **無限アニメは画面外で止める**：IntersectionObserver→`animation-play-state` 切替（宣言的にやるなら「既定paused／`.is-visible`でrunning」）。非アクティブタブはブラウザが自動スロットル。
- **ホバー演出は `@media (hover:hover) and (pointer:fine)`** で囲う（タッチ端末で誤発火させない）。
- **`prefers-reduced-transparency: reduce` / `prefers-contrast: more`** で透過装飾（灯りボケ）を弱める。`prefers-reduced-data` の間引きは任意。
- WCAG：**2.3.1**（点滅1秒3回未満）・**2.3.3**（インタラクション起因の動きを無効化可能に）・**2.2.2**（自動・5秒超・並行する動きに停止手段）。

**和香松庵チェックリスト10**
1. アニメは transform/opacity/filter のみ
2. 装飾モーションは `@media (prefers-reduced-motion: no-preference)` の中だけ／reduce時は最終フレーム静止
3. `will-change` は無限アニメ要素のみ
4. ホバーは `(hover:hover) and (pointer:fine)`
5. 全無限アニメに IO で画面外 `paused`
6. 背景の動きに停止手段（reduced-motion尊重で可）＝2.2.2
7. スパークル/シマーは点滅1秒3回未満・淡い低コントラスト金・赤閃光なし＝2.3.1
8. パララックスは最小・reduced-motionで完全停止＝2.3.3・前庭配慮
9. 長い静的セクションに `content-visibility:auto`
10. `prefers-reduced-transparency`/`prefers-contrast` フォールバック

**既に入れた無限アニメへの改善**
- **Ken Burns**：`<img>` 直変形→**ラッパーに当てる**（LCP配慮）。`will-change:transform` はこの要素のみ許容。reduce時は中間scaleで静止。
- **灯りボケ**：transform/opacityのみ維持（✔現状そう）。`prefers-reduced-transparency`/`prefers-contrast` で透過を下げる。帯は初期画面外→**IOで画面外paused が最も効く**。
- **スパークル twinkle**：点滅1秒3回未満・淡い金（✔現状4.5sで満たす）。IOで画面外停止。

出典: [idealo: CSS Animations & INP](https://medium.com/idealo-tech-blog/how-to-build-css-animations-without-sacrificing-the-inp-0fd3db4f0064) ／ [web.dev content-visibility](https://web.dev/articles/content-visibility) ／ [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) ／ [Deque 2.3.3](https://dequeuniversity.com/resources/wcag2.1/2.3.3-animations-from-interactions) ／ [W3C 2.2.2](https://w3c.github.io/wcag21/understanding/pause-stop-hide.html) ／ [CSS-Tricks play/pause](https://css-tricks.com/how-to-play-and-pause-css-animations-with-css-custom-properties/)

---

## ★ 再提案：和香松庵に足す優先順位

### 第1波：クイックウィン（Baseline安全・低リスク・既存の穴も塞ぐ）
1. **`text-wrap: balance` を全見出しへ** — 明朝の折返しが即整う。コスト小・モーション無し。
2. **金パレットを `color-mix()` で派生に統一** — 影/グロー/focus/`::selection` を #9c8f6b 一元管理。保守減・トーン一貫。
3. **無限アニメ（Ken Burns/灯りボケ/スパークル）を画面外でIO停止** — バッテリー/INP/WCAG 2.2.2 を満たす。**今あるコードの実質的な品質改善**。
4. **ホバーを `(hover:hover) and (pointer:fine)` に統一** — タッチ端末の誤発火を防止。
5. **長い静的セクションに `content-visibility:auto`** — 初期描画/INP改善。

### 第2波：上品さの格上げ（中コスト・トップ1箇所厳守）
6. **`@property` で金グラデの微シマー/にじみ** — CTAシャイン・金罫を耽美に格上げ（低速・低コントラスト）。
7. **明朝大見出しの mask ワイプ or blur→focus 入場** — ヒーロー/ABOUTの“せり上がり/にじみ”。
8. **（任意）縦書きリードの一字フェード** — 掛軸・暖簾の和の格。

### 第3波：没入の作り込み（別タスク・要検証）
9. **Astro `<ClientRouter />`＋`transition:persist`** でロゴ・立ち絵を全ページ持続。404に `data-astro-reload`、`astro:page-load` 再バインド必須。

> 推奨スタート＝**第1波**（特に③は今あるエフェクトの性能・アクセシビリティの穴を塞ぐので最優先）。第2波はトップ1箇所に絞って耽美さを足す。第3波はAstro設定変更を伴うため独立フェーズ化。
