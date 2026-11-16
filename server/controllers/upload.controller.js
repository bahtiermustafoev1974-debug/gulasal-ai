
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const authController = require('./auth.controller');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'storage', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'text/plain': '.txt'
};

function verifyMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType.includes('png')) {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  // WEBP: RIFF .... WEBP
  if (mimeType.includes('webp') && buffer.length >= 12) {
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }

  // PDF: %PDF (25 50 44 46)
  if (mimeType.includes('pdf')) {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // DOCX / Office Open XML (Zip signature: PK 03 04)
  if (mimeType.includes('wordprocessingml') || mimeType.includes('officedocument') || mimeType.includes('docx')) {
    return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  }

  // DOC (Legacy Word: D0 CF 11 E0)
  if (mimeType.includes('msword')) {
    return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
  }

  // Plain text
  if (mimeType.includes('text/plain')) {
    return true;
  }

  return false;
}

class UploadController {
  constructor() {
    this.ensureUploadsDir();
  }

  ensureUploadsDir() {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  sendJSON(res, status, data) {
    if (res.headersSent || res.destroyed || res.writableEnded) return;
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    return res.end(JSON.stringify(data));
  }

  async uploadImage(req, res, body = {}) {
    try {
      const user = authController.getAuthenticatedUser(req);
      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Rasm yuklash uchun avval tizimga kiring.'
        });
      }

      const rawData = body.data || body.image || body.base64;
      if (!rawData || typeof rawData !== 'string') {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Rasm ma’lumotlari topilmadi.'
        });
      }

      // Parse data URL: data:image/png;base64,.... or raw base64
      let mimeType = 'image/jpeg';
      let base64String = rawData;

      const dataUrlMatch = rawData.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1].toLowerCase();
        base64String = dataUrlMatch[2];
      } else if (body.mimeType) {
        mimeType = String(body.mimeType).toLowerCase();
      }

      const extension = ALLOWED_MIME_TYPES[mimeType];
      if (!extension) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Faqat JPG, PNG, WEBP, PDF yoki DOCX formatidagi fayllar qo‘llab-quvvatlanadi.'
        });
      }

      let buffer;
      try {
        buffer = Buffer.from(base64String, 'base64');
      } catch {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Rasm kodlanishi (base64) noto‘g‘ri.'
        });
      }

      if (buffer.length === 0) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Rasm fayli bo‘sh.'
        });
      }

      if (buffer.length > MAX_FILE_SIZE) {
        return this.sendJSON(res, 413, {
          success: false,
          message: 'Rasm hajmi 5 MB dan oshmasligi kerak.'
        });
      }

      if (!verifyMagicBytes(buffer, mimeType)) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Fayl haqiqiy rasm formatiga to‘g‘ri kelmadi.'
        });
      }

      this.ensureUploadsDir();

      const fileName = `${crypto.randomUUID()}${extension}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${fileName}`;

      return this.sendJSON(res, 201, {
        success: true,
        url: publicUrl,
        size: buffer.length,
        mimeType
      });
    } catch (error) {
      console.error('[IMAGE UPLOAD ERROR]', error.message);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Rasmni yuklashda xatolik yuz berdi.'
      });
    }
  }
}

module.exports = new UploadController();
