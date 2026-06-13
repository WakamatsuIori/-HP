// 表示確認用のデモ.icsをローカル配信する小さなサーバー（本番では使わない）。
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ics = readFileSync(join(here, 'fixtures', 'demo.ics'));

createServer((_req, res) => {
  res.setHeader('content-type', 'text/calendar; charset=utf-8');
  res.end(ics);
}).listen(8125, () => console.log('demo ics server on http://127.0.0.1:8125/demo.ics'));
