# HP制作リソース・カタログ（第3回クローリング・6班）

> 和香松庵 公式HP（Astro静的／Cloudflare Pages／黒×金・耽美）の制作に使える素材・部品・手法・ツールを要素別に収集。
> 制約：商用可・ライセンス明確を優先／新依存は最小（純CSS・Web標準・小型lib優先）／モバイル軽量・アクセシブル。

---

## 1. 無料デザイン素材（背景・和柄・テクスチャ・装飾）

### SVGパターン／背景ジェネレーター
- **Hero Patterns** — 反復SVG背景100種超。地紋・フッター。**CC BY 4.0（帰属必須）** https://heropatterns.com/
- **background-svg.com（青海波ジェネレータ）** — 和柄を色/線幅/透明度調整しSVG出力。和の核。 https://background-svg.com/ptn/ptns/seigaiha.html
- **fffuel（nnnoise/gggrain/ffflux 等60種）** — ノイズ・グレイン・流体グラデ。**商用可・帰属不要（再配布禁止）** https://www.fffuel.co/
- **SVG Backgrounds** — 背景＋カスタマイザ。 https://www.svgbackgrounds.com/
- **grab. Noise Generator** — SVGノイズ/グレイン/斜線。 https://usegrab.sh/noise

### 和柄パターン素材
- **パターン素材.website** — 青海波22色・麻の葉等271点。商用可（EPS/JPG）。 http://www.pattern-sozai.website/data/tag/seigaiha
- **Bg-patterns** — 和風＋グランジ調整。 https://bg-patterns.com/?p=280
- **FreeSVG.org（Japanese pattern）** — **CC0**。 https://freesvg.org/japanese-pattern

### テクスチャ（紙・和紙・グレイン・暗マット）
- **Transparent Textures** — タイル395種。**CC BY-SA 3.0（帰属＋継承）** https://www.transparenttextures.com/
- **CC0 Textures (ambientCG)** — 紙/布/金属。**CC0** https://cc0-textures.com/c/paper
- **Unsplash** — 紙・グレイン・金箔の高解像度写真。商用可・帰属不要（API経由は帰属）。 https://unsplash.com/s/photos/gold-foil

### 金箔・ゴールド（CSS/画像）
- **WebGradients** — CSSグラデ180種。金見出し・ボタン。 https://webgradients.com/
- **Metallic Effect Generator** — 金属文字CSS生成。 https://design.dev/tools/metallic-effect-generator/
- **uiGradients（Coffee Gold等）** — MIT・商用可。 https://uigradients.com/

### 装飾あしらい・フレーム・家紋/エンブレム
- **Public Domain Vectors** — 飾り罫・アンティーク枠・アールデコ。**CC0** https://publicdomainvectors.org/en/free-flourish-vector
- **icooon-mono（家紋）** — 商用可・帰属不要・加工可（再配布禁止）。 https://icooon-mono.com/tag/家紋/
- **発光大王堂（家紋3588種）** / **Flop Design（家紋素材集）** — 紋章モチーフ。 https://hakko-daiodo.com/main-0
- **素材Good（和風フレーム）** — 商用可・加工可・透過PNG/AI。 https://sozai-good.com/illust/free-frame/free-japaneseframe/

> 最安全（CC0・帰属不要）＝Public Domain Vectors / FreeSVG / CC0 Textures / icooon-mono。中核素材はここから。帰属必須（Hero Patterns・Transparent Textures）はフッターにクレジット欄が必要。

---

## 2. 軽量UI部品・スニペット（Astro静的・新依存最小）

凡例：◎=Web標準/純CSS（追加0）／○=小型lib（数KB〜十数KB）／△=やや重い

### 埋め込み（LCP/CLSを守る facade 方式）
- **lite-youtube-embed** ◎〜○ — サムネ先行→クリックで本体。Apache-2.0。配信アーカイブ/MV。 https://github.com/paulirish/lite-youtube-embed
- **@justinribeiro/lite-youtube** ○ — Shadow DOM版・MIT。 https://github.com/justinribeiro/lite-youtube
- **Twitch facade（自作）** ◎ — クリックで `player.twitch.tv` 注入（`parent`必須）。
- **軽量Tweet埋め込み** ◎〜○ — ビルド時に静的カード化（公式widgets.jsは重い）。 https://github.com/stefanbohacek/alternative-twitter-embeds

### カルーセル／ギャラリー
- **CSS scroll-snap カルーセル** ◎ — 純CSS。イラスト/グッズ横スワイプ。 https://modern-css.com/articles/build-a-css-only-carousel/
- **CSS Carousel API（::scroll-button/::scroll-marker）** ◎ — ドット/矢印をマークアップ無しで（Chrome135+、段階的強化）。
- **Embla Carousel** ○ — 依存ゼロ・MIT。高度演出時。 https://www.embla-carousel.com/
- **GLightbox** ○ / **LiteLight** ◎〜○ / **PhotoSwipe** △ — ライトボックス（拡大）。MIT。 https://github.com/biati-digital/glightbox

### ネイティブUI（JSほぼ不要・最アクセシブル）
- **details/summary アコーディオン** ◎ — FAQ・規約。`name`で排他開閉。 https://developer.chrome.com/blog/styling-details
- **純CSSタブ（radio+label）** ◎ — プロフィール/予定切替。
- **`<dialog>` モーダル** ◎ — 画像拡大・告知。フォーカストラップ/ESC/`::backdrop`標準。 https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- **Popover API** ◎ — トースト/メニュー。2025/4 Baseline。 https://developer.chrome.com/blog/introducing-popover-api
- **CSS Anchor Positioning** ◎ — ツールチップ位置決め（Floating UI代替）。

### メディア・タイマー
- **FlipDown.js** ○ — フリップ式カウントダウン・MIT。配信/記念日まで。 https://github.com/PButcher/flipdown
- **Essential Audio Player** ○ / **vLitejs** ○ — 楽曲/ボイス試聴・MIT。 https://github.com/Freeedle/Essential-Audio-Player

### Astro公式
- **View Transitions（`<ClientRouter/>`）** ◎ / **astro-icon** ○ / **`<Image>`/`<Picture>`** ◎

---

## 3. 最適化・SEO・アクセシビリティ（Astro実務）

### 画像・パフォーマンス
- **`<Picture>` でAVIF/WebP多形式** — 転送減・LCP改善。 https://docs.astro.build/en/reference/modules/astro-assets/
- **レスポンシブ画像（layout/widths/sizes 自動srcset）** — モバイルで過大画像を読まない。
- **width/height 自動推論でCLS=0** — ローカル画像import で寸法自動。
- **LCP画像 priority** — ヒーロー1枚のみ `<Image priority />`。
- **Astro Fonts API** — preload＋size-adjust fallbackでFOUT/CLS抑制。 https://docs.astro.build/en/guides/fonts/
- **font-display: swap＋サブセット（WOFF2）** — 日本語は効果大。
- **CSS自動インライン化/minify** — `build.inlineStylesheets:'auto'`。
- **PageSpeed Insights / Lighthouse** — LCP/CLS/INP計測。 https://pagespeed.web.dev/

### アクセシビリティ
- **コントラスト4.5:1（黒×金要注意）** — 濃い金は本文不可、見出し/罫線に。 https://webaim.org/articles/contrast/
- **:focus-visible（背景と3:1・2px+）** — `outline:none`の安易な無効化禁止。
- **prefers-reduced-motion** — 立ち絵演出/スクロールアニメを抑制。
- **alt/ARIA/キーボード** — 装飾画像`alt=""`、SNSアイコン`aria-label`、Tab巡回確認。

### SEO/AEO
- **構造化データ Person**（sameAsでSNS相互リンク）/ **Event**（配信予定）/ **VideoObject**（アーカイブ：リッチリザルト適格）。 https://schema.org/Person
- **FAQPage** — リッチリザルトは2026/5廃止だがAEO素材として解析価値残存。
- **OGP/Twitter Card（1200×630）** — `astro-seo`で一括注入。 https://github.com/jonasmerlin/astro-seo
- **OGP自動生成** — Satori+resvg/sharp、または **astro-og-canvas**（最小設定）。 https://github.com/delucis/astro-og-canvas
- **@astrojs/sitemap**（`site`必須）/ **llms.txt + robots.txt**（学習bot Disallow・検索bot Allow）。

### 計測
- **Cloudflare Web Analytics** — Cookieレス・無料・Pages親和。 https://www.cloudflare.com/web-analytics/
- **Google Search Console** — sitemap送信＋リッチリザルトテスト。

---

## 4. VTuber HPの機能・セクション案

凡例：◎すぐ（静的）／○中（埋め込み・運用）／△要API。★=既存の強化案

| # | セクション | 要点 | 難易度 |
|---|---|---|---|
| 1 | プロフィール ★ | 執事ロール設定・衣装ギャラリー導線 | ◎ |
| 2 | 世界観/ストーリー(Lore) | 店の設定・名の由来＝差別化の核・二次創作の土台 | ◎ |
| 3 | FAQ | 手紙/プレゼント/二次創作/切り抜き/依頼窓口 | ◎ |
| 4 | 配信スケジュール ★ | カレンダー連携(案B)・「Cafe営業時間」表記 | △/◎ |
| 5 | 最新動画/アーカイブ | YouTube埋め込み or API・タグ分類 | ○/△ |
| 6 | ハイライト/切り抜き | 公式ピックアップ＋タグ誘導＋ルール明記 | ◎ |
| 7 | ディスコグラフィ | ジャケ金縁・試聴・各サブスク導線 | ○ |
| 8 | ボイス/グッズ(BOOTH) | ロール準拠の商品名・ショップ導線 | ◎/○ |
| 9 | お便り/マシュマロ | 「ご主人様からのお便り」・匿名OK・送付先 | ◎ |
| 10 | ファンアートギャラリー | #FAタグ埋め込み or 金縁キュレーション | ○ |
| 11 | ハッシュタグ&ファンネーム | 配信/FA/切り抜き/総合タグ・「常連様」等 | ◎ |
| 12 | メンバーシップ/FC | ティア表（VIPルーム等）・限定Discord | ○ |
| 13 | お仕事依頼/企業向け ★ | 対応業務・NG・返信目安・メディアキット連携 | ◎ |
| 14 | 二次創作ガイドライン ★ | 章立て整理（範囲/転載/AI/禁止/企業/問合せ） | ◎ |
| 15 | プレス/メディアキット | ロゴ・立ち絵・表記ルール・配色指定をDL化 | ○ |
| 16 | SNSリンク集 ★ | 金枠リンクハブ（配信/X/BOOTH/マシュマロ/FC/楽曲） | ◎ |
| 17 | ニュース/お知らせ | 日付+カテゴリ・トップに最新3件 | ○ |
| 18 | 記念日カウントダウン | 周年/誕生日へのカウント＋記念販売導線 | ○ |

参考：hololive / しぐれうい公式 / ゆにれいど！ / MEWLIVE / Phase Connect / FindPlus 等（各出典は fonts/effects と併せ調査ログに記録）。

---

## 5. 配色・質感・タイポ設計ツール

### 配色・コントラスト
- **Coolors** / **Adobe Color**（コントラスト内蔵）/ **Huemint・Khroma**（AI配色）— パレット生成。
- **WebAIM Contrast Checker** — AA/AAA合否判定（金×黒の最終確定）。 https://webaim.org/resources/contrastchecker/
- **Adobe Leonardo** — 目標比を指定して金を逆算生成。 https://leonardocolor.io
- **Color Safe** / **APCA**（明朝の細線評価）。

### 質感
- **Colorffy Mesh Gradient** — メッシュグラデ→CSS。 https://colorffy.com/mesh-gradient-generator
- **box-shadow.art** — 多層影→CSS。金縁カードの落ち影。 https://box-shadow.art/generator/
- **10015.io Border Radius** / **Glassmorphism Generator**。

### タイポ
- **Type Scale（precise-type.com / typescale.com）** — 見出し階層→CSS出力。
- **明朝見出し推奨**：line-height 150%以上／letter-spacing 0.1〜0.2em／見出しは行間を相対的に締める。出典 https://www.aqworks.com/blog/perfect-japanese-typography

### 黒×金 配色レシピ（HEX）
- **A Rich Luxury**：`#020B13`/`#262626`/金`#DAAB2D`/`#A57A03`/深紫`#400128`
- **B Deep Anchor**：`#010203`/`#1D1D1F`/茶`#3B3130`/金`#D3AC2C`
- **C Gold Gradient**：金`#D0A900`→クリーム`#FFF9E6`（広面積に金を使わない）
- **E 本HP本命（オフ白×くすみ金×明朝）**：背景`#F7F4EC`/墨`#1C1A17`/くすみ金`#A8884E`/淡金線`#C9B68C`/影`#6E6A60` ※WebAIM実測必須
- **金のAA確保**：本文に使うなら明るい金（`#D0A900`級）、濃い金（`#A57A03`級）は見出し/罫線限定。背景は純黒を避け`#121212`系。

---

## 6. アイコン・ファビコン・埋め込み・フォーム

### アイコン
- **Tabler Icons**（MIT・5900+線）/ **Lucide**（ISC・Astroパッケージ）/ **Phosphor**（MIT・duotone）/ **Heroicons**（MIT）。
- **Simple Icons** — SNSブランドSVG（CC0、形状の入手元。商標は各社準拠）。 https://simpleicons.org/
- **公式ブランドリソース**（改変/着色制限あり・自作トレース非推奨）：YouTube / X / Discord / pixiv・BOOTH press-kit。マシュマロは公式配布が確認できず汎用アイコン代替が無難。

### ファビコン/OGP
- **RealFaviconGenerator**（一式生成）/ **astro-favicons**（ビルド統合）。
- **opengraph.xyz / metatags.io / opengraph.dev**（シェア表示の横断プレビュー）。

### フォーム（CLAUDE.md方針：Googleフォーム＋ハニーポット）
- **Googleフォーム埋め込み**（本命・サーバー不要）。
- **ハニーポット**（CSSで隠す囮フィールド。`type=hidden`は非推奨）。
- 代替：**Formspree**（50/月）/ **Web3Forms**（250/月）。

### SNS埋め込み・計測
- **lite-youtube-embed** / **react-tweet・oEmbed** / **Discord公式ウィジェット**（dark固定で黒金に馴染む）。
- **Cloudflare Web Analytics**（本命）/ Plausible / Umami（プライバシー配慮）。
