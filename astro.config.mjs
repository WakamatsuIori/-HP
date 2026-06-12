// @ts-check
import { defineConfig } from 'astro/config';

// サイトURLは公開後に pages.dev のURL（後日、独自ドメイン）へ差し替える
export default defineConfig({
  site: 'https://example.pages.dev',
  output: 'static',
});
