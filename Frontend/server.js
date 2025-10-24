// server.js
const { createServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');
const next = require('next');

try {
  require('dotenv').config();
} catch {}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const HOST = process.env.NEXT_PUBLIC_FRONTEND_HOST || 'localhost';
const HTTPS_PORT = Number(process.env.NEXT_PUBLIC_FRONTEND_Port || 9000);
const HTTP_PORT = Number(process.env.NEXT_PUBLIC_FRONTEND_Port || 9050);
console.log('HTTP_PORT', HTTPS_PORT, HTTP_PORT);
// Certs in ./certificate (or override via env)
const CERT_DIR = path.resolve(__dirname, 'certificate');
const KEY_PATH = process.env.SSL_KEY_PATH || path.join(CERT_DIR, 'server.key');
const CERT_PATH =
  process.env.SSL_CERT_PATH || path.join(CERT_DIR, 'server.crt');

if (!fs.existsSync(KEY_PATH)) {
  console.error('❌ SSL key not found:', KEY_PATH);
  process.exit(1);
}
if (!fs.existsSync(CERT_PATH)) {
  console.error('❌ SSL cert not found:', CERT_PATH);
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(KEY_PATH),
  cert: fs.readFileSync(CERT_PATH),
};

app.prepare().then(() => {
  // HTTPS app
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(HTTPS_PORT, HOST, () => {
    console.log(`✅ HTTPS at https://${HOST}:${HTTPS_PORT}`);
  });

  // Optional HTTP→HTTPS redirect
  createHttpServer((req, res) => {
    const host = (req.headers.host || '').replace(/:\d+$/, `:${HTTPS_PORT}`);
    res.writeHead(301, { Location: `https://${host}${req.url}` });
    res.end();
  }).listen(HTTP_PORT, HOST, () => {
    console.log(
      `➡️  Redirecting http://${HOST}:${HTTP_PORT} → https://${HOST}:${HTTPS_PORT}`
    );
  });
});
