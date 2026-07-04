# エフェクト・カタログ #5 — 演出の別軸（構図・セクション・ヒーロー・遷移・マイクロインタラクション）2026

> 📦 **位置づけ＝運用者モードの裏在庫**（拡張トークンは凍結・需要ドリブン）。実戦で出すのは「ヒーロー型→セクション→反応強度」の3つだけ。[批評](research-critique-2026-06-20.md)参照。

> [#1](effects-catalog.md)／[#2](effects-catalog-2-2026-deep.md)／[#3 降りもの＋文字装飾](effects-catalog-3-falling-and-text-2026.md)／[#4 テーマ別プリセット](effects-catalog-4-themes-2026.md) の続編。
> #3/#4が「質感・色・粒子・テーマ」なら、**本書は“情報設計と体験の振付”の軸**。ここを外すと「見た目は凝っているのに導線が弱いページ」になる（Codex）。
> **作り方＝Claude（母艦・4並列エージェントWeb調査）＋ Codex(GPT-5.3, agmsg) の共同研究**（諮問記録は末尾）。
> 前提：VTuber公式HP/LP・純CSS/CSS Grid優先・Astro静的(ClientRouter)・モバイル・`prefers-reduced-motion` 必須・WCAG配慮。
> 用途：LP制作ツールの設計素材。**#4の6点セット（colors/typography/motion/texture/particles/uiShape）に、本書の layout/section/hero/transition/microInteraction を足す**のがゴール。

---

## ★ メタ結論（Codexの横断指摘）

- **この軸は世界観テーマと“分離できる器”**。構図・ヒーロー・遷移・反応は骨格であり、色/質感（#4）を後から流し込む。3層分離＝「①型を選ぶ→②テーマを当てる→③立ち絵/コピー/CTAを差す」。
- **#4の6点セットを拡張**：`[data-theme]` に **layoutトークン＋microInteractionトークン＋section presets＋heroType/imageFocus＋transition/loaderトークン**を足す。→ **テーマを選ぶだけで構図・セクション・動きまで自動で変わる**状態が最強。
- **一番事故るのは（#4に続き）「動きの性格(motion)」**。reveal/hover/transition/particleの速度をテーマで統一。
- **本人に触らせる軸は最小化**、細部は運用者AI側に隠す（後述の振り分け）。

---

## 1. レイアウト/構図（テーマ非依存の“器”）

**型の選択肢**（特徴／向く用途／モバイル）
- **Centered**：中央にロゴ/立ち絵＋上下情報。**最も事故りにくい**・最軽量。モバイルもそのまま。
- **Split（2分割）**：左テキスト＋CTA／右ビジュアル。自己紹介・案件導線に強い。モバイルは上下スタック（ビジュアル上・テキスト下）。
- **Bento グリッド**：最新動画/SNS/NEWS/予定をタイルで整理。**鮮度レイヤーと相性最高**。6〜12枚まで。モバイルは重要順1列＋補助のみ2列。
- **Asymmetric / Magazine**：大ビジュアル＋ずらしカード／セクションごとに余白・リズムを変える。世界観は出るが**素材が弱いと崩れる・上級者向け**。モバイルは素直に1カラムへ。
- **Sticky 2カラム**：立ち絵やナビを片側固定。長文・プロフィールに。**モバイルはsticky解除**。
- **Timeline/stack**：活動履歴・NEWS・予定向き。

**余白・リズム・階層**：8ptスケール（要素4/8/16・ブロック24/32・セクション64〜96px）。本文16〜18px・measure 65〜85字・見出しは比率1.25〜1.333を`clamp()`で可変。視覚階層＝サイズ×コントラスト×配置。**余白を詰めると“管理画面”に見える**（VTuberの世界観が消える）。

**CSS技術の使い分け（2026は実戦OK）**：外枠=**Grid**／中身=**Flex**／カード内の行揃え=**subgrid**（全エバーグリーン対応済）／部品の自律可変=**container queries**（ビューポート非依存・ブレークポイント激減）。Astro静的＋純CSSで完結。

**VTuberで効く**：縦長1カラムLPが基本。最初は **Split hero ＋ Bento activity ＋ Profile cards** が強い（立ち絵で“誰か”→bentoで最新活動→カードでリンク/案件/ガイドラインへ逃がす）。視線誘導は **立ち絵→名前→一言→主要CTA→最新活動** に固定。

**事故る点**：bentoの詰め込み＝ダッシュボード化／非対称のモバイル崩れ／px固定の溢れ（`rem/%/clamp/minmax/auto-fit`で流動化）／画像溢れ（`max-width:100%;height:auto;object-fit`）／Gridの`order`でDOM順とズレ→キーボード/読み上げ崩れ。

**テーマ変数化（Codex）**：`--layout-density / --section-gap / --card-radius / --card-border / --visual-overlap / --bento-gap`。pop=丸く密度高め／gothic=余白大／cyber・gamer=グリッド強め／natural=余白ゆったり。

## 2. セクション別の見せ方（“どう見せるか”の型）

> 各セクション＝型の選択肢／情報設計のコツ／やりがちな失敗。演出はreveal/hover控えめ・reduced-motionで停止が共通。

| セクション | 型の選択肢（推奨太字） | 情報設計／失敗 |
|---|---|---|
| **ヒーロー(FV)** | **A.立ち絵大+キャッチ+CTA1**／B.動画/Ken Burns背景+立ち絵／C.split | 名前(読み仮名必須)・肩書き一言・主CTA1つ。**カルーセル避ける**。失敗=CTA複数/重画像でLCP悪化/モバイルで顔切れ |
| **プロフィール** | **A.立ち絵+スペック表**／B.短文ストーリー+ハイライト／C.公式設定/中の人タブ | 短い自己紹介+タグ+活動ジャンル+**初見向け代表動画**。失敗=年表/設定詰めすぎ・読み仮名なし |
| **配信スケジュール** | **次回/今週/定例の3段**／週間グリッド／リスト | 直近1件をピン留め・**空でも破綻しない文言**・更新日表示。失敗=空カレンダー・古い予定残り・画像1枚(検索/コピー不可) |
| **動画** | **A.代表動画ピックアップ+下にグリッド**／グリッド／カルーセル | **最新(鮮度)と代表(入口)を分ける**。失敗=YouTube直埋め多用で激重→`lite-youtube`/ファサード(1243kB→約28kB) |
| **SNSリンク** | **A.目的別(見る/フォロー/連絡/支援)リンクカード**／アイコン列／縦ボタン | **最重要1つ(X or YT)を最上位**。失敗=全部同列で優先度ゼロ・リンク切れ放置 |
| **ストア/グッズ** | **商品カード3件以内+全部見る**／注目1点+一覧／外部バナー | 価格/販売状態/期間明示。**準備中表示を綺麗に**。失敗=売切れ放置・価格非表示・空 |
| **支援/メンバー** | **ティア比較カード(推奨1枚強調)**／比較表／単一誘導 | **プランは3つまで**・金額/特典/対象を揃える。失敗=プラン乱立・特典差が曖昧 |
| **お知らせ(NEWS)** | **日付+見出しの縦リスト3〜5件**／タグ付き／カード3枚 | 日付・種別・短文・リンク。**トップは鮮度表示が命**。失敗=長文ブログ化・古いNEWS残り |
| **FAQ** | **アコーディオン(`<details>`)**／羅列／カテゴリ別 | 二次創作/切り抜き/案件/ツール/連絡。**最重要は初期展開可**。失敗=ARIA誤用・全閉でNGが見えない |
| **ガイドライン** | **OK/NG 2カラム(OK先出し)**／箇条書き+詳細リンク／専用ページ+要約 | やっていい事を先に(萎縮防止)・営利/成人/AI/切り抜き可否。失敗=禁止だけで冷たい・曖昧 |
| **お問い合わせ/案件** | **用途別(案件/個人)ボタン or フォーム**／リンクのみ／専用ページ+実績 | **案件可否を明記(受付中/休止)**・連絡先・返信目安・NG。Astro静的はFormspree等/`mailto`。失敗=可否なしで機会損失・DMだけで相手が不安 |

**VTuber特有4要素の配置**：活動ステータス＝ヒーローのバッジ＋スケジュール直近ピン＋NEWS鮮度で多重補強／代表動画＝動画の「ピックアップ」固定＋ヒーローCTAから直行／案件可否・連絡先＝お問い合わせ＋FAQに併設・常時表示／二次創作ガイドライン＝専用セクション＋FAQから1行サマリ。

**テーマ変数化（Codex）**：各セクションに型を直接持たせるより、**テーマ側に section presets** を持つ（例 gothic profile=frame／cyber links=panel／natural faq=paper）。

## 3. ヒーローの型（テーマ非依存アーキタイプ）

| 型 | 構成 | 向くキャラ/テーマ | モバイル／事故 |
|---|---|---|---|
| **全身立ち絵(フルブリード)** | 全身ドーン＋キャッチを余白へ | **VTuber最強**・キャラが商品・gothic/fantasy/和 | **バストアップにクロップ**(`object-position`頭〜胸)・顔切れ注意 |
| **Split** | 左テキスト+CTA／右ビジュアル | 情報量多・案件/コラボ導線・pop/gamer/cyber | 縦積み・量産SaaS感に注意(背景質感で接地) |
| **中央ロゴ/キャッチ** | 中央寄せ+背景 | ロゴ/紋章が強い・準備中勢・horror・**最も安全** | そのまま中央・顔が見えず誰か不明→プロフ導線必須 |
| **動画/Ken Burns背景** | 背景に動画orズーム+前面キャッチ | 空気感重視 | **純CSS Ken Burns優先**・動画はモバイルでポスター差替・LCP重荷 |
| **Poster/キービジュアル** | 一枚絵主役 | 一枚絵が強い・新衣装/イベントLP | 画像依存で情報導線が薄くなる |
| **Bento hero** | 立ち絵+最新活動+SNS+NEWSをFVに | ストリーマー/情報量多 | 玄人向け・初見が迷う |

**立ち絵の見せ方**：全身=キャラ性最大(フルブリード向き・モバイルはクロップ)／バストアップ=split/小ヒーローに最適・破綻しにくい／表情差分=カルーセル・インタラクション向き／三面図=ヒーロー不向き(about へ)。顔を三分割構図の交点に、テキストは視線の先 or 反対の余白。
**FVに必ず入れる4点**：①誰/何者か ②世界観の一言 ③初見導線 ④主CTA1個。
**事故る点**：重い動画背景(LCP筆頭・ポスターを`fetchpriority=high`)／画像直乗せで文字が読めない(暗幕/シャドウ)／ヒーロー画像に`loading=lazy`を付けない／CTA渋滞。
**テーマ噛み合い(Codex)**：gothic/fantasy=全身 or poster(余白・額縁)／pop/gamer=bento or split(勢い)／cyber=split+HUD／natural=centered or soft split／horror=poster/中央ロゴ(情報絞る)／和=全身+縦リズム/和紙帯。
**トークン**：`heroType` ＋ `imageFocus`。本人には「立ち絵を大きく/ロゴを主役/最新活動も見せる」程度の選択肢で十分。

## 4. ローディング/ページ遷移

**型**：**No loader（基本・最速）**／Skeleton/shimmer（取得部分だけ）／Brand splash（ロゴ/紋章を一瞬・初回のみ）／Astro view transitions（ページ間の自然な切替）／Section reveal（初回スクロール時だけ）。
**プリローダーの作法**：`sessionStorage`で初回のみ。**3秒以上は論外**・偽ローディングは悪手。JS失敗で白画面固着しないようCSSフェイルセーフ（一定時間で必ず解除/`<noscript>`非表示）。「設計が良ければ初回ペイントは十分速くスプラッシュは本来不要」（ベンダー見解）＝演出と割り切る。
**Astro `<ClientRouter/>`（view transitions）**：`<head>`に1個。`transition:name`=共有要素モーフ／`transition:animate`=`fade`(既定)/`slide`/`initial`/`none`／`transition:persist`=BGM等を遷移またぎ維持。**`prefers-reduced-motion`を自動無効化**・FOUC対策・`fallback`=animate/swap/none。404に`data-astro-reload`、再実行は`data-astro-rerun`、`astro:page-load`で再バインド。
**使い分け**：fade=万能・上品／slide=階層移動／共有要素モーフ=同一物が動く関係に限定(乱用で酔う)。体感200〜400ms。
**テーマ変数化(Codex)**：`--transition-style: fade/slide/clip/none`・`--transition-duration: 180〜700ms`・`--loader-style: none/logo/skeleton`・`--reveal-distance`・`--reveal-stagger`。gothic/fantasy=fade/blur長め／pop/gamer/cyber=quick slide/clip短め／natural=fade最小／horror=短い暗転可・点滅禁止。

## 5. マイクロインタラクション（小さな反応・振付）

**上品の黄金律＝「速くて小さい」**：反応 **120〜220ms / ease-out**、移動 **8〜24px**、scale **±5%以内**。reveal/入退場 200〜500ms(上限600)。同時に複数の動きを重ねない。
- **クリック/タップ**：押し込み`:active{scale(.97)}`(純CSS・最軽)／リップル(JS小)／**コピー完了**(チェックにモーフ+`aria-live`、1〜2sでリセット)。`-webkit-tap-highlight-color:transparent`で自前feedbackに統一。
- **ホバー**：ボタン=色1段+影+`translateY(-1〜2px)`150〜200ms／カード=影+`scale(1.02)`／リンク=下線draw(`background-size`)／画像=`scale(1.03〜1.08)`。**必ず`@media (hover:hover) and (pointer:fine)`で囲い、hoverに情報を隠さない**。
- **スクロールreveal**：フェードアップ(`opacity`+`translateY 16〜24px`)400〜600ms・stagger 60〜100ms。実装=IntersectionObserver(全ブラウザ)／`animation-timeline:view()`(Chrome/Edge/Safari18+・`@supports`でフォールバック)。**reduce時は必ず`opacity:1`保証**(初期`opacity:0`のまま永久非表示の事故防止)・no-JSフォールバック必須。
- **カーソル演出**：カスタムカーソル/追従グロー/スポットライト＝**PC限定**(`hover:hover`内のみ)・`pointermove`→CSS変数+`transform:translate3d`+rAF throttle。`cursor:none`はJS失敗で操作不能→確実なフォールバック。
- **フォーム**：`:focus-visible`必須(2px・コントラスト3:1)・`outline:none`単独はWCAG違反・入力欄16px以上(iOSズーム防止)・送信完了は`aria-live`。
**WCAG3点**：2.3.3(操作起因の動きをreduceで無効)・2.3.1(点滅1秒3回未満)・2.4.7(focus可視)。
**テーマ変数化(Codex)**：`--hover-lift / --hover-scale / --hover-glow / --press-depth / --focus-ring / --reveal-style / --reveal-duration`。pop=scale／cyber=glow／natural=shadow／gothic=border／gamer=quick press。

---

## ★ 拡張トークン（#4の6点セットに足す）

```css
[data-theme]{
  /* …#4の colors/typography/motion/texture/particles/uiShape … */
  /* + 構図 */     --layout-density; --section-gap; --card-radius; --card-border; --visual-overlap; --bento-gap;
  /* + 遷移 */     --transition-style; --transition-duration; --loader-style; --reveal-distance; --reveal-stagger;
  /* + 反応 */     --hover-lift; --hover-scale; --hover-glow; --press-depth; --focus-ring; --reveal-style; --reveal-duration;
}
/* セクション/ヒーローは「型の選択」をデータで持つ */
/* sectionPreset(例 gothic profile=frame, cyber links=panel, natural faq=paper) / heroType / imageFocus */
```
→ **テーマを選ぶと構図・セクション・遷移・反応まで一括で変わる**。

## ★ LPツール実装方針（Codex）

**まず実装すべき軸トップ3**
1. **ヒーロー型**（一番見た目が変わり本人も選びやすい：立ち絵主役/split/ロゴ主役/最新活動あり）
2. **セクション別の見せ方プリセット**（プロフ/最新活動/SNS/NEWS/FAQ…＝鮮度レイヤー直結）
3. **マイクロインタラクションの強度プリセット**（なし/控えめ/しっかり＝本人にはこれだけ）
※次点＝レイアウト密度（強いが本人には迷うのでテーマ側に抱かせる）。

**本人に触らせてよい**：ヒーローの主役(立ち絵/ロゴ/最新活動)／雰囲気テーマ／動きの強さ(なし/控えめ/しっかり)／目的テンプレ(初見/案件/活動まとめ)／載せるセクションON/OFF。
**運用者AI側に隠す**：非対称の細調整／bentoのカード比率・順序・密度／view transitionsの種類・duration／粒子数・速度・opacity／scroll revealのstagger・距離／モバイルの要素順／hero画像のobject-position・focus point／セクション個別の背景質感・枠線。

## 共通安全弁（再掲）
- 基底=無アニメ→`@media (prefers-reduced-motion: no-preference)`でreveal/smooth-scrollをオプトイン。reduce時=粒子停止/静止・revealはopacityのみ・hoverは色変化だけ。
- 動かすのは`transform`/`opacity`(＋`filter:drop-shadow`)。タップ44px・`:focus-visible`維持・ネイティブHTML(`<details>`/`<button>`)優先。
- ヒーロー画像はLCP優先（`fetchpriority=high`・WebP/AVIF・lazy禁止）。動画/埋め込みは遅延・モバイルで軽量化。

---

## 諮問記録（共同研究のメタ）
- **Claude（母艦・4並列エージェント）**：①レイアウト/構図 ②セクション別の見せ方 ③ヒーローの型+遷移 ④マイクロインタラクション をWeb調査（web.dev/MDN/CSS-Tricks/Codrops/Astro docs/Prismic/LogRocket/STUDIO・lit.link解説/声すた！等・出典は各節）。
- **Codex(GPT-5.3, agmsg経由)**：同5軸に独立回答＋横断知見＝「この軸は情報設計と体験の振付／#4の6点セットに layout・microInteraction トークンと section/hero プリセットを足す／テーマを選ぶと構図・セクション・動きまで変わる状態が最強／実装トップ3=ヒーロー型+セクション型+反応強度／本人露出 vs 運用者隠しの振り分け」。本書の拡張トークン・実装方針・テーマ別の構図/遷移傾向は主にCodex由来。
- **収束点**：両者が「型(構図/ヒーロー/遷移/反応)はテーマ非依存の器→#4のトークンに統合し、テーマ選択で一括適用」へ一致。
