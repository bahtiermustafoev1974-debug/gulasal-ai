
const dynamicPracticeService = require('../services/dynamicPractice.service');
const authController = require('./auth.controller');

class DynamicPracticeController {
  sendJSON(res, status, data) {
    if (res.headersSent || res.destroyed || res.writableEnded) return;
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    return res.end(JSON.stringify(data));
  }

  getUserId(req) {
    const user = authController.getAuthenticatedUser(req);
    return user?.id || 'guest_general';
  }

  async getSession(req, res, subjectId) {
    try {
      const userId = this.getUserId(req);
      const sub = decodeURIComponent(subjectId || 'math').toLowerCase().trim();
      const session = await dynamicPracticeService.getSession(userId, sub);

      return this.sendJSON(res, 200, {
        success: true,
        data: session
      });
    } catch (error) {
      console.error('[DYNAMIC PRACTICE GET SESSION ERROR]', error);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Savollarni yuklab bo‘lmadi: ' + error.message
      });
    }
  }

  async submitRound(req, res, body = {}) {
    try {
      const userId = this.getUserId(req);
      const subjectId = String(body.subjectId || 'math').toLowerCase().trim();
      const answers = body.answers || {};

      const result = dynamicPracticeService.submitRound(userId, subjectId, answers);

      return this.sendJSON(res, 200, {
        success: true,
        message: `${result.round}-bosqich muvaffaqiyatli tekshirildi!`,
        data: result
      });
    } catch (error) {
      console.error('[DYNAMIC PRACTICE SUBMIT ERROR]', error);
      return this.sendJSON(res, 400, {
        success: false,
        message: error.message || 'Javoblarni tekshirishda xatolik yuz berdi.'
      });
    }
  }

  async getStats(req, res) {
    try {
      const userId = this.getUserId(req);
      const stats = dynamicPracticeService.getUserStats(userId);

      return this.sendJSON(res, 200, {
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[DYNAMIC PRACTICE STATS ERROR]', error);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Statistikani yuklab bo‘lmadi.'
      });
    }
  }
}

module.exports = new DynamicPracticeController();
