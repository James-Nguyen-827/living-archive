import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const port = Number(process.argv[2] ?? 4322);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

async function existingFile(candidates) {
  for (const candidate of candidates) {
    const absolute = resolve(root, candidate);
    if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) continue;
    try {
      if ((await stat(absolute)).isFile()) return absolute;
    } catch {}
  }
  return null;
}

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const relative = pathname.replace(/^\/+/, '');
  const candidates = pathname === '/'
    ? ['index.html']
    : extname(relative)
      ? [relative]
      : [`${relative}/index.html`, `${relative}.html`];
  const file = await existingFile(candidates) ?? resolve(root, '404.html');
  const body = await readFile(file);
  response.writeHead(file.endsWith('404.html') ? 404 : 200, {
    'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  response.end(body);
}).listen(port, '127.0.0.1', () => {
  console.log(`Static preview ready at http://127.0.0.1:${port}`);
});
