# エフェクト・カタログ #6 — 配色システム（自動配色の作り方）2026

> 🧱 **位置づけ＝基盤（要実装）**。装飾でなくコントラスト破綻を塞ぐ土台。[早見表](effects-quick-reference-2026.md)参照。

> [#4 テーマ別](effects-catalog-4-themes-2026.md)の色を「破綻なく自動生成」する仕組み。LP制作ツールの「おまかせカラー（§14-2）＋ensureReadable」の設計図。
> **作り方＝Claude（母艦・Web調査）＋ Codex(GPT-5.3, agmsg・サブエージェント) の共同研究**。両者ほぼ完全一致。
> 前提：純CSS/Astro静的・WCAG・モバイル。※これは「装飾の追加」でなく、これまで繰り返し出たコントラスト問題の根を塞ぐ**基盤**。

---

## ★ 結論（両者一致）
**自動配色は「綺麗なハーモニー生成」より「破綻しない役割割当＋自動補正」が主役。** 本人が選ぶ色は**世界観のシード**であって、背景/本文/CTAにそのまま使う素材ではない。芯＝**①明度(L)で役割を決める ②OKLCHで扱う ③ensureReadableで必ず補正**。**自由度より生存性**。

---

## 1. 内部はOKLCH、入力はHSLでよい
- **入力UI**：本人にはHSL的な分かりやすさでOK。
- **内部処理**：**OKLCH/Lab**。HSLの`lightness`は知覚の明るさとズレる（同じLでも黄は明るく青は暗い）→「Lで背景/本文を振り分ける」と読めなくなる。
- **出力**：CSS変数。**主要色（bg/body/heading/cta/ctaText）はビルド時/生成時に確定値**で持つ。`color-mix()`/相対色は **hover/border/glow/surface など補助派生に限定**。

## 2. アルゴリズム（シード色→役割→補正）
```
1. seed colors N個を受け取る（メイン/サブ/差し色/髪/瞳/衣装 など）
2. 全seedを OKLCH へ変換
3. 役割へ割り当て：bg / surface / heading / body / muted / border / cta / ctaText / accent / decor
   - 役割は色相でなく「明度(土台)＋彩度ピーク(CTA)」で決める。本人の“メイン順”は色相の好みとして装飾優先度に使う
4. 背景はseedそのものでなく派生：light bg = L0.96-0.99/C0.01-0.04、dark bg = L0.08-0.16/C0.01-0.05
5. 本文はブランド色を避けニュートラル寄り（近黒チャコール）
6. heading はブランド色を少し反映してよい
7. CTA はスコアで選ぶ：score = contrastScore + chromaScore + brandPriority - dangerPenalty
8. ensureReadable で必ず補正：body/bg≥4.5、heading/bg≥4.5、ctaText/cta≥4.5
   - 割れたら「明度(L)だけ」を二分探索で寄せる（色相・彩度は触らない＝ブランド色を壊さない）
   - ctaText は MVP=白黒二択／品質を上げるなら「白/黒/色味つき暗色/色味つき明色」から選択
9. dark/light は単純反転しない。色相は維持し L/C を再計算（ダークは彩度Cをやや下げ滲み防止）
```

## 3. ハーモニーの使い所（テーマ別）
- **類似色**：癒し/幻想/ASMR（まとまる）／**補色**：CTA・差し色向き（面積増やすと安っぽい）／**トライアド**：pop/Y2K/gamer（彩度制限必須）／**モノクロマティック**：minimal/cinema/luxury（寂しくなるのでtexture併用）。

## 4. WCAG2 vs APCA
- **MVPはWCAG2を合格ライン**（本文4.5:1/大文字3:1）。**APCAは品質スコア/警告として併用**（「WCAG通るが実は読みにくい」を検出）。
- WCAG2の弱点＝`#a0a0a0`より暗い領域で予測が崩れる→暗色テーマはAPCA警告が効く。自動生成でAPCAのみ採用は説明コスト増。

## 5. color-mix()/相対色の派生例（補助色のみ）
```css
--cta-hover: color-mix(in oklch, var(--cta), white 12%);
--border:    color-mix(in oklch, var(--body), transparent 82%);
--glow:      color-mix(in oklch, var(--accent), transparent 65%);
--surface-2: color-mix(in oklch, var(--surface), var(--accent) 6%);
/* 相対色：1アクセントから影/サーフェス */
--accent-shadow: oklch(from var(--accent) calc(l - 0.20) calc(c * 0.8) h);
--surface:       oklch(from var(--accent) 0.97 calc(c * 0.15) h);
```
※対応：相対色/`color-mix`は Chrome119+/Edge119+/Firefox128+/Safari16.x+。古環境はビルド時に確定値フォールバック（culori）。

## 6. ライブラリ
- **culori**＝OKLCH/Lab変換・補間・色域処理。**最推し**（Astroビルド時に派生＆フォールバックCSS出力）。
- **chroma.js**＝プロトタイプ/コントラスト比計算。**colorjs.io**＝CSS Color仕様検証。**apca-w3**＝APCA確認。**wcag-contrast**＝WCAG比。**Adobe Leonardo/Huetone**＝生成ロジックの参考・人間の確認用（ランタイム依存は不要）。**Style Dictionary**＝トークン多出力が要るなら。

## 7. 地雷
- HSLのlighten/darkenだけで自動生成／高彩度ピンク・シアン・紫を本文や背景に／黄・薄ピンク・水色CTAに白文字／ダークで彩度上げすぎて滲む／半透明白黒だけでsurfaceを作る（背景次第で破綻）／本文にブランド色／中間色だらけで階層がない／sRGB混色で濁る（→`color-mix(in oklch)`）。

## ★ LPツールへの落とし込み（1パイプライン）
4色を全部OKLCH化 → L昇順で役割割当（CTAは彩度ピーク）→ 影/hover/罫/glow/surfaceを`oklch(from…)`/`color-mix(in oklch)`で派生 → 全ペアをWCAG2で測り割れたらL二分探索で補正（CTA文字は白黒二択）→ light/dark独立補正＋APCAは警告として運用者に提示。**culoriでビルド時(Astro)に確定値＋フォールバックCSS変数を吐く**。

## 諮問記録
Claude（Web調査：色彩理論/OKLCH/ensureReadable/ツール）＋ Codex(GPT-5.3・サブエージェント：役割割当アルゴリズム/スコアCTA選択/ライブラリ)。両者独立に「ハーモニー生成より役割割当＋自動補正／OKLCH内部処理／WCAG2線＋APCA警告／culori」へ一致。
