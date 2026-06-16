# 商用可フォント精査（和香松庵 公式HP）

> 起点：https://goodfreefonts.com/category/commercialization-fonts/ ＋ Google Fonts/BOOTH 等の補完調査。
> 用途＝見出し・ロゴ・装飾アクセント（本文はシステムゴシック据え置き）。
> **ライセンスは正確性最優先**。OFL明記のものを基本に。「要確認」は配布元規約で web `@font-face` 埋め込み可否・帰属要否を必ず確認。

---

## ⭐ おすすめ3選（結論）

| 用途 | フォント | 理由 | ライセンス |
|---|---|---|---|
| **日本語見出し** | **Shippori Mincho（しっぽり明朝）** ※Zen Old Mincho と併用/置換候補 | 墨だまり感が強く文学的。耽美・しっとりした和の情緒が一段濃い | OFL・商用可・帰属不要・埋込可 ◎ |
| **ローマ字ロゴ** | **Cinzel**（＋繊細版に Cormorant Garamond） | ローマ碑文由来の荘厳さが黒×金の紋章トーンに完全一致。大文字中心で超軽量サブセット | OFL・商用可・帰属不要・埋込可 ◎ |
| **装飾アクセント** | **黒華明朝（くろはなみんちょう）** | 源ノ明朝派生の長体＋鋭いウロコの妖艶さ。耽美な執事Cafe&Barを最も体現。**ライセンス明確** | OFL・商用可・埋込可（要サブセット） |

**現行プランの Zen Old Mincho（OFL・商用可）は続投で全く問題なし**（端正で外さない鉄板）。世界観をもう一段「耽美・しっとり」に振るなら Shippori Mincho を見出しに、Zen Old Mincho を本文/サブに、という使い分けが強い。

---

## 候補一覧

### 日本語明朝（ライセンス明確・安心）
- **Zen Old Mincho**（現行採用予定）— 端正・古典的・上品。かな漢字英数記号フル・縦横対応・複数ウェイト。OFL／商用可・帰属不要・埋込可。webフォント化◎。 https://fonts.google.com/specimen/Zen+Old+Mincho
- **Shippori Mincho（しっぽり明朝）** — 古風・文学的・墨だまり感。5ウェイト＋墨強調派生「Shippori Mincho B1」。OFL／◎。 https://fonts.google.com/specimen/Shippori+Mincho
- **BIZ UDPMincho** — 可読性重視・実直。耽美さは弱く本文向き。OFL／○（やや重・サブセット推奨）。 https://fonts.google.com/specimen/BIZ+UDPMincho
- **Klee One（クレー One）** — 楷書系硬筆体。手書きの柔らかさ。執事のサイン/手紙的アクセント。OFL／◎。 https://fonts.google.com/specimen/Klee+One

### 和風・耽美・装飾系日本語（見出し/アクセント）
- **黒華明朝（くろはなみんちょう）** — 源ノ明朝ベース長体＋鋭いウロコ、妖艶・華やか。**黒×金・耽美にドンピシャ**。OFL／商用可・埋込可（字数多く重い→見出し限定サブセット必須）。 https://booth.pm/ja/items/8271642 （作者 lavsic / X:@_lavsic）
- **おとぎの明朝** — 童話的・幻想レトロ。ライセンス**要確認**（web埋込可否は配布元で確認）。 https://goodfreefonts.com/9452/
- **五月雨明朝（さみだれみんちょう）** — IPA明朝ベースの古めかしいオールドスタイル。**要確認**（IPAライセンス＝改変再配布条件あり）。 https://goodfreefonts.com/9623/
- **異國ひらがな** — アンティーク異国情緒、かな中心（漢字限定＝要確認）。**要確認**。 https://goodfreefonts.com/9797/
- **藍原筆文字凜華** — 気品ある毛筆。落款的アクセント。**要確認**。 https://goodfreefonts.com/9654/

### ローマ字ロゴ/サブコピー用 欧文セリフ（OFL・安心）
- **Cinzel** — ローマ碑文風・大文字主体・荘厳。紋章ロゴに映える。OFL／◎（超軽量サブセット可）。装飾版 Cinzel Decorative もあり。 https://fonts.google.com/specimen/Cinzel
- **Cormorant Garamond** — 繊細でコントラスト強・耽美。細身の高級ロゴに。OFL／◎。 https://fonts.google.com/specimen/Cormorant+Garamond
- **EB Garamond** — 正統派ギャラモン。英語サブコピーの上品な受け皿。OFL／◎。 https://fonts.google.com/specimen/EB+Garamond

---

## 運用メモ
- 確実性を優先するなら、ライセンス明文化された **Zen Old Mincho / Shippori Mincho / 黒華明朝 / Cinzel / Cormorant Garamond** の構成が最も安全。
- goodfreefonts 掲載でも「商用可」一覧と web 埋め込み可否は別問題。装飾系（おとぎ/五月雨/異國/藍原）は導入前に配布元規約を要確認。
- 既存プラン（`scripts/subset_fonts.py` で fonttools サブセット → `public/fonts/*.woff2` 同梱、新依存ゼロ）の方式はそのまま流用可能。装飾フォントは「見出しに使う文字だけ」のサブセット必須（重いため）。

---

# 追加精査（第2回クローリング・4班）

> ローカル `D:\クロード作業用\fonts\` に **OFLフォントをDL済み**（Zen Old Mincho全ウェイト・しっぽり明朝/B1・Kaisei各種・Yuji各種・Hina Mincho・Sawarabi明朝・BIZ UD明朝・Cinzel・Cormorant Garamond・EB Garamond・Marcellus/SC・Playfair Display 等）。見本は `effect-demos/fonts.html` で実表示。

## A. Google Fonts OFL 日本語（web埋め込み確実・最安全）
| フォント | 系統 | おすすめ用途 |
|---|---|---|
| しっぽり明朝 / B1 | オールド明朝（築地体・墨だまり） | 本文〜見出し（耽美を一段濃く） |
| Zen Old Mincho | クラシック明朝 | 見出し・本文（鉄板・現行） |
| Hina Mincho | 細身・墨だまり強 | 大見出し映え |
| Kaisei Tokumin（解星特ミン） | 特太明朝 | 大見出し・ロゴ（迫力） |
| Kaisei Decol（解星デコール） | 装飾明朝（星形ドット） | 見出しアクセント |
| Kaisei HarunoUmi / Opti | 揺らぎ/端正明朝 | 見出し |
| Yuji Syuku（佑字 肅） | 肉筆楷書 | 和ブランド名・ロゴ（「和香松庵」に最適） |
| Klee One | 硬筆・楷書 | 手書きアクセント |
| Sawarabi Mincho | 穏やか明朝 | 本文・サブ |
| Noto Serif JP | 万能源ノ明朝系 | 本文（無個性だが安全） |

## B. 源ノ明朝派生 OFL 耽美装飾（BOOTH等・要DL＆見出しサブセット）
- **黒華明朝**（妖艶・耽美ど真ん中／最有力） booth.pm/ja/items/8271642
- **白光明朝**（星装飾の幻想明朝） booth.pm/ja/items/8292561
- **築豊初号明朝OFL**（骨太の見出し明朝） booth.pm/ja/items/6419033
- **源暎こぶり/ちくご明朝**（文芸本文向け） okoneya.jp/font/genei-koburimin.html
- **幻ノにじみ明朝**（古活字・滲みレトロ／READMEだけ要確認） booth.pm/ja/items/5212369
- **源界明朝**（破壊系インパクト一点投入） flopdesign.com/freefont/genkai.html
- いずれもOFL＝web埋め込み可。漢字フルで数MB級→**必ずサブセット**。

## C. 欧文（OFL・ロゴ/数字）
- **Cinzel**（碑文・荘厳／ロゴ本命）・**Cinzel Decorative**（装飾一点）・**Marcellus/Marcellus SC**（フレアセリフ・SCは看板向け）
- **Cormorant Garamond**（極細・耽美／大見出し専用）・**EB Garamond**（正統・oldstyle数字／英語本文）・**Playfair Display**（高コントラスト・華やか告知）・**Bodoni Moda**（硬質モード）・**Della Respira/Cardo**（式典/古典）
- 数字：動くカウントダウン＝`font-feature-settings:"tnum" 1`（等幅でガタつかない）／日付など溶け込ませる＝`"onum" 1`（oldstyle）。

## D. 和欧ペアリング定石
- 原則：**和文=明朝 × 欧文=セリフ**で骨格を揃える。欧文は **110〜130%** 拡大＋**ベースライン微調整**（CSSは `unicode-range` で和欧を別family指定）。
- 推奨組：①しっぽり明朝×Cinzel（ロゴ・大見出し）②Noto Serif JP×EB Garamond（本文・英語）③游/Zen Old Mincho×Cormorant（ヒーロー大見出し・耽美最上級）④しっぽり明朝×Marcellus SC（セクション見出し・看板）⑤Noto Serif JP×Playfair（華やか告知）。
- サブセット取得に google-webfonts-helper（gwfh.mranftl.com）が便利。

## E. 実例・失敗回避（VTuber/高級サイト調査）
- **定石＝見出し明朝×本文ゴシックの二段構え**。明朝一本で本文まで通すと画面で擦れて読みにくい→本文は游ゴシック/Noto Sans系で可読性確保。
- 高級感は**色でなく余白・字間**で作る（見出し字間+10〜20%、金は1アクセントに限定）。
- 墨だまり/筆/破壊系（Hina・しっぽりB1・源界）は**ロゴ・見出し専用**に隔離、本文・UIに流用しない。
- Noto Serif JP全ウェイト読込はモバイル初回が極端に遅い→**サブセット＋ウェイト2〜3種限定**必須。
- 参考：銀座高級クラブ系（piropo.co.jp／jeanne2.jp）＝黒×金＋明朝縦書きが和香松庵に最も近い参照系。

## 結論（更新版おすすめ）
1. **日本語見出し**：しっぽり明朝（or Zen Old Mincho 続投）／和ブランド名の一語に **佑字 肅（楷書）** を一点。
2. **耽美の主役装飾**：**黒華明朝**（DL＋サブセット）。
3. **ローマ字ロゴ**：**Cinzel**（＋繊細版 Cormorant Garamond）。数字はtabular。
4. **本文**：游ゴシック/Noto Sans系のまま（可読性）。明朝は見出し限定。
