// ========================================================
// GULASAL AI — SUPPORT CONTROLLER 2026
// Admin & User Endpoints • Authorization Checks
// ========================================================

const supportService = require('../services/support.service');
const authController = require('./auth.controller');

class SupportController {
  sendJSON(res, status, data) {
    if (res.headersSent || res.destroyed || res.writableEnded) return;
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    return res.end(JSON.stringify(data));
  }

  getUser(req) {
    return authController.getAuthenticatedUser(req);
  }

  async getConversation(req, res) {
    try {
      const user = this.getUser(req);
      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Support chatdan foydalanish uchun tizimga kiring.'
        });
      }

      const conversation = supportService.getConversation(user.id, user, true);
      return this.sendJSON(res, 200, {
        success: true,
        conversation
      });
    } catch (e) {
      console.error('[SUPPORT GET CONV ERROR]', e.message);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Suhbatni yuklab bo‘lmadi.'
      });
    }
  }

  async sendMessage(req, res, body = {}) {
    try {
      const user = this.getUser(req);
      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Xabar yuborish uchun tizimga kiring.'
        });
      }

      const text = body.text || body.message || '';
      const images = body.images || (body.image ? [body.image] : []);

      const result = supportService.sendMessage(user.id, user, text, images);
      return this.sendJSON(res, 201, result);
    } catch (e) {
      console.error('[SUPPORT SEND MSG ERROR]', e.message);
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Xabar yuborishda xatolik.'
      });
    }
  }

  // ADMIN METHODS
  async getInbox(req, res) {
    try {
      const user = this.getUser(req);
      if (!user || !authController.isUserAdmin(user)) {
        return this.sendJSON(res, 403, {
          success: false,
          message: 'Kirish taqiqlangan: faqat administrator uchun.'
        });
      }

      const inbox = supportService.getInbox();
      return this.sendJSON(res, 200, {
        success: true,
        inbox
      });
    } catch (e) {
      console.error('[SUPPORT GET INBOX ERROR]', e.message);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Inbox ro‘yxatini yuklab bo‘lmadi.'
      });
    }
  }

  async getAdminConversation(req, res, targetUserId) {
    try {
      const user = this.getUser(req);
      if (!user || !authController.isUserAdmin(user)) {
        return this.sendJSON(res, 403, {
          success: false,
          message: 'Kirish taqiqlangan: faqat administrator uchun.'
        });
      }

      supportService.markAdminRead(targetUserId);
      const conversation = supportService.getConversation(targetUserId, null, false);
      return this.sendJSON(res, 200, {
        success: true,
        conversation
      });
    } catch (e) {
      console.error('[SUPPORT GET ADM CONV ERROR]', e.message);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Suhbatni yuklab bo‘lmadi.'
      });
    }
  }

  async sendAdminReply(req, res, body = {}) {
    try {
      const user = this.getUser(req);
      if (!user || !authController.isUserAdmin(user)) {
        return this.sendJSON(res, 403, {
          success: false,
          message: 'Kirish taqiqlangan: faqat administrator uchun.'
        });
      }

      const targetUserId = body.userId;
      const text = body.text || body.message || '';
      const images = body.images || (body.image ? [body.image] : []);

      if (!targetUserId) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Foydalanuvchi ID ko‘rsatilmadi.'
        });
      }

      const result = supportService.sendAdminReply(targetUserId, user, text, images);
      return this.sendJSON(res, 201, result);
    } catch (e) {
      console.error('[SUPPORT ADM REPLY ERROR]', e.message);
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Javob yuborishda xatolik.'
      });
    }
  }
}

module.exports = new SupportController();
