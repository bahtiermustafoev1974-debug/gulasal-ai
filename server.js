
/**
 * GULASAL AI — Main Server
 * Mobile + Desktop HTTP Server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim()
      .replace(/^(['"])(.*)\1$/, '$2');

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const corsMiddleware = require('./server/middleware/cors.middleware');
const loggerMiddleware = require('./server/middleware/logger.middleware');
const apiRouter = require('./server/routes/api.routes');

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const UPLOADS_DIR = path.join(ROOT_DIR, 'storage', 'uploads');
const AUDIO_DIR = path.join(ROOT_DIR, 'storage', 'audio');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(AUDIO_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf'
};

function sendError(res, status, message) {
  if (res.headersSent || res.destroyed || res.writableEnded) return;

  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });

  res.end(message);
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*');
}

function safePath(baseDir, requestedPath) {
  try {
    const base = fs.realpathSync(baseDir);
    const target = path.resolve(base, `.${requestedPath}`);

    if (target !== base && !target.startsWith(base + path.sep)) {
      return null;
    }

    if (!fs.existsSync(target)) return target;

    const realTarget = fs.realpathSync(target);

    if (realTarget !== base && !realTarget.startsWith(base + path.sep)) {
      return null;
    }

    return realTarget;
  } catch {
    return null;
  }
}

function serveFile(req, res, filePath) {
  let stats;

  try {
    stats = fs.statSync(filePath);
  } catch {
    return sendError(res, 404, 'Fayl topilmadi');
  }

  if (!stats.isFile()) {
    return sendError(res, 404, 'Fayl topilmadi');
  }

  const ext = path.extname(filePath).toLowerCase();
  const isCode = ['.js', '.mjs', '.css', '.html', '.json'].includes(ext);

  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Content-Length': stats.size,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': isCode ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600'
  });

  if (req.method === 'HEAD') return res.end();

  const stream = fs.createReadStream(filePath);

  stream.on('error', error => {
    console.error('[FILE ERROR]', error.message);

    if (!res.headersSent) {
      sendError(res, 500, 'Faylni yuklashda xatolik');
    } else {
      res.destroy();
    }
  });

  stream.pipe(res);
  return stream;
}

const server = http.createServer(async (req, res) => {
  try {
    setSecurityHeaders(res);

    const allowedMethods = [
      'GET', 'HEAD', 'POST', 'PUT',
      'PATCH', 'DELETE', 'OPTIONS'
    ];

    if (!allowedMethods.includes(req.method)) {
      res.setHeader('Allow', allowedMethods.join(', '));
      return sendError(res, 405, 'Method ruxsat etilmagan');
    }

    if (corsMiddleware(req, res)) return;

    let parsedUrl;

    try {
      parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch {
      return sendError(res, 400, 'URL noto‘g‘ri');
    }

    let pathname;

    try {
      pathname = decodeURIComponent(parsedUrl.pathname);
    } catch {
      return sendError(res, 400, 'URL kodlanishi noto‘g‘ri');
    }

    if (pathname.includes('\0')) {
      return sendError(res, 400, 'URL noto‘g‘ri');
    }

    loggerMiddleware(req);

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return await apiRouter.handle(req, res, pathname);
    }

    if (pathname === '/client' || pathname.startsWith('/client/')) {
      const requestedPath = pathname.slice('/client'.length) || '/';
      const filePath = safePath(CLIENT_DIR, requestedPath);

      if (!filePath) return sendError(res, 403, 'Ruxsat berilmagan');

      return serveFile(req, res, filePath);
    }

    if (pathname === '/public' || pathname.startsWith('/public/')) {
      const requestedPath = pathname.slice('/public'.length) || '/';
      const filePath = safePath(PUBLIC_DIR, requestedPath);

      if (!filePath) return sendError(res, 403, 'Ruxsat berilmagan');

      return serveFile(req, res, filePath);
    }

    if (pathname === '/uploads' || pathname.startsWith('/uploads/')) {
      const requestedPath = pathname.slice('/uploads'.length) || '/';
      const filePath = safePath(UPLOADS_DIR, requestedPath);

      if (!filePath) return sendError(res, 403, 'Ruxsat berilmagan');

      return serveFile(req, res, filePath);
    }

    if (pathname === '/audio' || pathname.startsWith('/audio/')) {
      const requestedPath = pathname.slice('/audio'.length) || '/';
      const filePath = safePath(AUDIO_DIR, requestedPath);

      if (!filePath) return sendError(res, 403, 'Ruxsat berilmagan');

      return serveFile(req, res, filePath);
    }

    const publicPath = pathname === '/' ? '/index.html' : pathname;
    const staticPath = safePath(PUBLIC_DIR, publicPath);

    if (!staticPath) return sendError(res, 403, 'Ruxsat berilmagan');

    if (fs.existsSync(staticPath)) {
      return serveFile(req, res, staticPath);
    }

    const looksLikeAsset = path.extname(pathname) !== '';

    if (!looksLikeAsset && ['GET', 'HEAD'].includes(req.method)) {
      const indexPath = safePath(PUBLIC_DIR, '/index.html');

      if (indexPath && fs.existsSync(indexPath)) {
        return serveFile(req, res, indexPath);
      }
    }

    return sendError(res, 404, 'Sahifa topilmadi');

  } catch (error) {
    console.error('[SERVER ERROR]', error.message);

    if (!res.headersSent) {
      sendError(res, 500, 'Serverda ichki xatolik yuz berdi');
    } else if (!res.writableEnded) {
      res.destroy();
    }
  }
});

server.requestTimeout = 60000;
server.headersTimeout = 15000;
server.keepAliveTimeout = 5000;

server.listen(PORT, HOST, () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const devices of Object.values(interfaces)) {
    for (const device of devices || []) {
      if (device.family === 'IPv4' && !device.internal) {
        addresses.push(device.address);
      }
    }
  }

  console.log('');
  console.log('======================================');
  console.log('       GULASAL AI ISHGA TUSHDI');
  console.log('======================================');
  console.log(` Kompyuter: http://localhost:${PORT}`);

  addresses.forEach(ip => {
    console.log(` Telefon:   http://${ip}:${PORT}`);
  });

  console.log('======================================');
});

server.on('error', error => {
  console.error('[SERVER ERROR]', error.message);
});

process.on('unhandledRejection', error => {
  console.error('[UNHANDLED REJECTION]', error);
});

process.on('uncaughtException', error => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});
