import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const clientDir = path.join(distDir, 'client');
const serverEntryFile = path.join(distDir, 'server', 'server.js');

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

if (!existsSync(serverEntryFile)) {
  throw new Error(`Missing production server bundle: ${serverEntryFile}. Run "npm run build" first.`);
}

const { default: serverEntry } = await import(`file://${serverEntryFile}`);

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    const response = await serverEntry.fetch(
      new Request(url.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await readRequestBody(req),
      }),
      {},
      {},
    );

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-length') {
        res.setHeader(key, value);
      }
    });

    const body = Buffer.from(await response.arrayBuffer());
    if (body.length > 0) {
      res.setHeader('Content-Length', String(body.length));
      res.end(body);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('SSR request failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<html><body><h1>500 Internal Server Error</h1></body></html>');
  }
});

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

server.listen(port, host, () => {
  console.log(`Cornus app running on http://${host}:${port}`);
});

const clientAssetNames = new Set([
  'favicon.ico',
  'robots.txt',
  'nevjegy.png',
  'hazirend.pdf',
]);

async function serveStaticFile(req, res, pathname) {
  if (!pathname || pathname === '/') return;

  const safePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  if (clientAssetNames.has(safePath) || safePath.startsWith('assets/')) {
    const filePath = path.join(clientDir, safePath);
    if (existsSync(filePath)) {
      const content = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain; charset=utf-8',
      }[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mime);
      res.end(content);
      return true;
    }
  }
  return false;
}
