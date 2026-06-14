// @ts-check
import { defineConfig } from 'astro/config';

// サイトURL（独自ドメイン）。canonical/OGP/sitemap/llms.txt の絶対URL生成に使う。
export default defineConfig({
  site: 'https://wakamatsu-iori.com',
  output: 'static',
});
