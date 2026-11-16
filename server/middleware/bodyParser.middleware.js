
const MAX_BODY_SIZE = 12 * 1024 * 1024;

module.exports = function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    let finished = false;

    const finish = (error, result) => {
      if (finished) return;
      finished = true;

      if (error) reject(error);
      else resolve(result);
    };

    req.on('data', chunk => {
      size += chunk.length;

      if (size > MAX_BODY_SIZE) {
        const error = new Error('So‘rov hajmi 5 MB dan oshdi');
        error.statusCode = 413;
        finish(error);
        req.resume();
        return;
      }

      body += chunk.toString('utf8');
    });

    req.on('end', () => {
      if (finished) return;

      if (!body.trim()) {
        return finish(null, {});
      }

      const contentType = req.headers['content-type'] || '';

      if (!contentType.includes('application/json')) {
        const error = new Error('Faqat JSON format qabul qilinadi');
        error.statusCode = 415;
        return finish(error);
      }

      try {
        const data = JSON.parse(body);

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          const error = new Error('JSON obyekti yuborilishi kerak');
          error.statusCode = 400;
          return finish(error);
        }

        finish(null, data);
      } catch {
        const error = new Error('JSON formati noto‘g‘ri');
        error.statusCode = 400;
        finish(error);
      }
    });

    req.on('error', error => {
      finish(error);
    });
  });
};
