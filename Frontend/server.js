const { createServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');
const next = require('next');

try {
  require('dotenv').config();
} catch { }

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const HOST = process.env.NEXT_PUBLIC_FRONTEND_HOST;
const HTTPS_PORT = Number(process.env.NEXT_PUBLIC_FRONTEND_Port);
const HTTP_PORT = Number(process.env.NEXT_PUBLIC_FRONTEND_Port);

// Check if we should use HTTPS
const useHTTPS = process.env.HTTPS === 'true' || process.env.HTTPS === '1';

// Certs in ./certificate (or override via env)
const CERT_DIR = path.resolve(__dirname, 'certificate');
const KEY_PATH = process.env.SSL_KEY_PATH || path.join(CERT_DIR, 'server.key');
const CERT_PATH =
  process.env.SSL_CERT_PATH || path.join(CERT_DIR, 'server.crt');

// Check if certificate files exist
const certsExist = fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH);

app.prepare().then(() => {
  if (useHTTPS && certsExist) {
    // HTTPS app
    const httpsOptions = {
      key: fs.readFileSync(KEY_PATH),
      cert: fs.readFileSync(CERT_PATH),
    };

    createServer(httpsOptions, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(HTTPS_PORT, HOST, () => {
      console.log(`✅ HTTPS server running at https://${HOST}:${HTTPS_PORT}`);
    });
  } else {
    // HTTP app (fallback)
    createHttpServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(HTTP_PORT, HOST, () => {
      console.log(`✅ HTTP server running at http://${HOST}:${HTTP_PORT}`);

      if (useHTTPS && !certsExist) {
        console.warn('⚠️  HTTPS requested but certificates not found. Falling back to HTTP.');
        console.warn(`   Key path: ${KEY_PATH}`);
        console.warn(`   Cert path: ${CERT_PATH}`);
      } else if (!useHTTPS) {
        console.log('ℹ️  HTTP mode enabled (HTTPS="false" in .env)');
      }
    });
  }
});