# 演出カタログ #11 — 3D/パースペクティブ & グラスモーフィズム

> 位置づけ：**📦 運用者モードの裏在庫**。見栄えは強いが「重い・スマホで効かない・可読性/情報隠し事故」が出やすい遊び寄りの層。本筋（鮮度レイヤー→#6配色）の優先度は不変。
> きっかけ：本人「3D/perspective・グラスモーフィズムってどんなの？」→見本で確認→「一応乗せるだけ乗せて、上のサンプル表を作って」（2026-06-21）。
> 安全則（共通）：動かすのは `transform`/`opacity` 中心・基底は静止＆読める→`@media (prefers-reduced-motion: no-preference)`でオプトイン・PC専用演出は`@media (hover:hover) and (pointer:fine)`で囲う・重い効果（blur）は枚数を絞る・`@supports`で非対応フォールバック・新依存ゼロ。

---

## サンプル表（一覧・採否の当たり）

| 技法 | どんなの | 主CSS | 向く用途（和香松庵LP） | 重さ | スマホ | 主な地雷 | 採否 |
|---|---|---|---|---|---|---|---|
| **① 3Dチルト** | カードが指の方へ傾く（中身を`translateZ`で浮かす） | `perspective`+`rotateX/Y` | プロフィール/グッズ/立ち絵カード | 軽〜中 | △効かない | hover専用・傾け±15°まで | △PC上乗せのみ |
| **② グラスモーフィズム** | 背景がボケて透ける半透明パネル | `backdrop-filter:blur()` | ヒーロー上のお知らせ/プロフ枠/メニュー | **重** | ▲負荷高 | 可読性低下・blur負荷・要fallback | ○1箇所＋文字対策込み |
| **③ 3Dフリップ** | 乗せると裏返る2面カード | `rotateY(180deg)`+`backface-visibility` | 表=プロフ/裏=SNS等の遊び | 軽 | △要タップ化 | 裏面が読めない/触れない＝情報隠すな | ▲遊び限定 |
| **④ 3D層パララックス** | スクロールで前後の層がズレて奥行き | `translate3d`/scroll-driven | ヒーロー背景の奥行き（立ち絵×背景） | 中 | ○可（控えめ） | やりすぎ酔い・前庭配慮 | ○控えめなら可 |

> 結論：耽美の"浮遊感"に効く**②グラスを1箇所だけ**が本命。①③はPCの遊び。④は控えめなら全デバイス可。

---

## ① 3Dチルト（マウス追従）
- **効果**：親に`perspective`、カードに`rotateX/rotateY`をカーソル位置で与える。中の要素を`translateZ`で浮かせると層が立つ。
- **用途**：プロフィール/グッズ/推し立ち絵パネル（PCの気持ちよさ）。
- **最小コード**：
```css
.scene{ perspective:800px; }
.card{ transform-style:preserve-3d; transition:transform .12s ease-out; }
.card .lift{ transform:translateZ(40px); }   /* 中身を手前に浮かす */
@media (hover:hover) and (pointer:fine){ /* JSでrotateを代入。下記参照 */ }
@media (prefers-reduced-motion: reduce){ .card{ transform:none !important; } }
```
```js
const s=document.querySelector('.scene'), c=s.querySelector('.card');
s.addEventListener('mousemove',e=>{const r=s.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
  c.style.transform=`rotateY(${x*18}deg) rotateX(${-y*18}deg)`;});
s.addEventListener('mouseleave',()=>c.style.transform='');
```
- **地雷**：タッチ（スマホ）では効かない＝**PC限定の上乗せ**（`hover:hover`必須）。傾けすぎ安っぽい（±15°目安）。`will-change:transform`は1〜2枚まで。

## ② グラスモーフィズム（すりガラス）
- **効果**：`backdrop-filter:blur()`で背景をぼかし透ける半透明パネル。
- **用途**：ヒーロー上のお知らせ・プロフィール枠・メニュー。耽美な浮遊感。
- **最小コード**：
```css
.glass{
  background:rgba(250,249,246,.22);
  border:1px solid rgba(255,255,255,.45);
  border-radius:14px;
  backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
}
@supports not (backdrop-filter:blur(10px)){
  .glass{ background:rgba(30,24,18,.82); }   /* 非対応＝ただの濃い半透明に */
}
@media (prefers-reduced-motion: no-preference){ /* 動かす要素ではないので原則静的 */ }
```
- **地雷**：**blurはGPU負荷大**＝モバイルで重い/発熱→**枚数1〜2枚**。透けるぶん**文字が読みにくい**→文字に影 or ガラスを濃いめにしてWCAG AA確保。背後に何か（色/画像）が無いと効果が見えない。Firefox一部/古環境は要`@supports`フォールバック。

## ③ 3Dフリップ
- **効果**：`rotateY(180deg)`＋`backface-visibility:hidden`で表裏2面。
- **用途**：表=プロフィール／裏=SNS・配信リンク等の「2面持ち」カード（遊び）。
- **最小コード**：
```css
.flip{ perspective:1000px; }
.flip-inner{ position:relative; transition:transform .6s; transform-style:preserve-3d; }
.flip:hover .flip-inner{ transform:rotateY(180deg); }
.face{ position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; }
.back{ transform:rotateY(180deg); }
@media (prefers-reduced-motion: reduce){ .flip:hover .flip-inner{ transform:none; } }
```
- **地雷**：**裏面はSR/一部端末で読めない・触れない**→重要情報を裏に隠さない（装飾の遊びに留める）。スマホはhoverが無い→タップでトグル（`:focus`/JS）に切替。LP本筋（3秒で誰・何者）と相性弱い。

## ④ 3D層パララックス（奥行き）
- **効果**：前景（立ち絵）と背景を別速度でズラし奥行き。`translate3d`＋scroll-driven（#10-1）か軽量IO。
- **用途**：ヒーローの立ち絵×背景の奥行き、セクション境界の層。
- **最小コード（scroll-driven・依存ゼロ）**：
```css
@supports (animation-timeline: scroll()){
  @media (prefers-reduced-motion: no-preference){
    .layer-bg{ animation:drift linear; animation-timeline:scroll(); }
  }
}
@keyframes drift{ to{ transform:translateY(-6%); } }   /* 控えめ＝6%程度 */
```
- **地雷**：動きすぎると酔う（前庭症状配慮）＝**ズレ幅は小さく**。reduced-motionで停止。全セクションに入れない（1〜2箇所）。

---

## アクセシビリティ＆パフォーマンス（横断）
- **基底＝静止＆読める**。3D/パララックスは`@media (prefers-reduced-motion: no-preference)`内、PC専用（チルト/フリップ）は`@media (hover:hover) and (pointer:fine)`内。reduce/タッチで自然に無効化。
- **glassの可読性**：文字に`text-shadow`、またはガラスを濃く。コントラストWCAG AAを割らない。
- **重さ**：blur・大きな`will-change`・多数の3D要素はモバイルで重い→**点数を絞る/モバイルで切る**。
```css
@media (max-width:640px){ .glass{ backdrop-filter:none; background:rgba(30,24,18,.9); }
  .card{ transform:none; } }
```
- **情報設計**：フリップ裏・チルトで動く要素に**必須情報を載せない**（演出はあくまで上乗せ）。

---

## このLPへの当たり（推奨優先度）
1. **②グラス**を「ヒーロー上のお知らせ枠」1箇所だけ（文字影＋濃さ＋`@supports`フォールバック込み）。耽美に最も効く。
2. **④層パララックス**を立ち絵×背景に控えめに（scroll-driven・ズレ6%）。スマホでも可。
3. **①チルト**はPC来訪者向けのプロフィール/グッズカードに、余力があれば。
4. **③フリップ**は遊びの1枚まで。重要情報は表に。

> 全体：見栄えは強いが「重い/スマホで効かない/情報を隠す」リスク層。**実装の本筋（鮮度レイヤー→#6配色）を先に**。これらは仕上げの差し色として運用者＋AIが引く。
