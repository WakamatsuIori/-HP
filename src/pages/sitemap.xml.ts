import type { APIRoute } from 'astro';

// サイトマップに載せるページ。新しいページを足したらここに追記する。
const paths = [
  '/',
  '/schedule/',
  '/videos/',
  '/goods/',
  '/about/',
  '/work/',
  '/guidelines/',
  '/privacy/',
];

export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() ?? 'https://wakamatsu-iori.com/').replace(/\/$/, '');
  const urls = paths.map((p) => `  <url><loc>${base}${p}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
