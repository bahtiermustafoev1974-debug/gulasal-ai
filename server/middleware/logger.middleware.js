
module.exports = function loggerMiddleware(req) {
  const now = new Date();

  const timestamp = now.toLocaleTimeString('uz-UZ', {
    hour12: false,
    timeZone: 'Asia/Tashkent'
  });

  const method = req.method || 'UNKNOWN';

  // Query parametrlaridagi maxfiy ma'lumotlarni logga chiqarmaslik
  let pathname = '/';

  try {
    pathname = new URL(
      req.url || '/',
      'http://localhost'
    ).pathname;
  } catch {
    pathname = '/invalid-url';
  }

  const ip = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'local';
  console.log(
    `[${timestamp}] [${ip}] ${method.padEnd(7)} ${pathname}`
  );
};
