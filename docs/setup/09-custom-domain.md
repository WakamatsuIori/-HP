# 09. 独自ドメイン（wakamatsu-iori.com）を Cloudflare Pages につなぐ

このサイトは Cloudflare Pages（プロジェクト名: vtuber-hp）で公開しています。
独自ドメイン `wakamatsu-iori.com` は **Cloudflare Registrar で購入済み**なので、
DNS が最初から Cloudflare 管理 ＝ **ネームサーバー変更が不要**で、いちばん簡単な手順です。

> 所要時間: 操作5〜10分＋反映待ち（通常すぐ〜数分、長くて数時間）。

---

## 手順

1. **Cloudflare ダッシュボード**（https://dash.cloudflare.com）にログイン。
2. 左メニュー **「Workers & Pages」** → **`vtuber-hp`** プロジェクトを開く。
3. 上のタブ **「カスタム ドメイン（Custom domains）」** → **「ドメインを設定（Set up a domain）」**。
4. 入力欄に **`wakamatsu-iori.com`** と入れて **「ドメインを続行 / Continue」**。
   - Cloudflare が「このドメインはあなたのアカウントにあります」と認識し、**必要な DNS レコードを自動作成**します（手入力不要）。
   - 確認画面で **「ドメインをアクティブ化 / Activate domain」**。
5. しばらくすると状態が **「アクティブ（Active）」** になり、SSL証明書も自動発行されます。
   - `https://wakamatsu-iori.com` にアクセスして、サイトが表示されればOK。

### （任意）www もつなぐ
`www.wakamatsu-iori.com` でもアクセスできるようにしたい場合：
- 手順3〜4を **`www.wakamatsu-iori.com`** でもう一度実行。
- 「www → wakamatsu-iori.com に統一したい」なら、Cloudflare の **ルール（Redirect Rules）** で
  `www.wakamatsu-iori.com/*` → `https://wakamatsu-iori.com/$1`（301）にリダイレクト設定。
  （無くても両方表示はできますが、SEO上は片方に寄せる方が綺麗です。canonical は apex を指しています）

---

## つないだ後の確認
- [ ] `https://wakamatsu-iori.com/` でトップが出る
- [ ] `https://wakamatsu-iori.com/schedule` などサブページも出る
- [ ] ページのソースで `<link rel="canonical" href="https://wakamatsu-iori.com/...">` になっている
- [ ] SNS（X等）にURLを貼ったとき、OGP画像（横長キービジュアル）が出る
      ※ 反映直後はキャッシュで古い表示のことあり。X は「Post Card Validator」等で再取得可。

## 補足（やらなくてもよい）
- **Discord連携のエンドポイント**は `https://vtuber-hp.pages.dev/discord/interactions` のままでも動きます。
  独自ドメインに統一したい場合のみ、Discord Developer Portal の
  「Interactions Endpoint URL」を `https://wakamatsu-iori.com/discord/interactions` に変更。
- pages.dev のURL（`vtuber-hp.pages.dev`）は引き続き有効です（消えません）。
