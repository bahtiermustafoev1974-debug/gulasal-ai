const eilistService = require('../services/eilist.service');
const authController = require('./auth.controller');

class EilistController {
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

  async getToday(req, res) {
    try {
      const user = this.getUser(req);
      const userId = user?.id || 'guest_general';

      const data = await eilistService.getTodayLesson(userId);
      return this.sendJSON(res, 200, {
        success: true,
        data
      });
    } catch (error) {
      console.error('[EILIST GET TODAY ERROR]', error);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Eilist darsini yuklashda xatolik: ' + error.message
      });
    }
  }

  async completeSection(req, res, body = {}) {
    try {
      const user = this.getUser(req);
      const userId = user?.id || 'guest_general';
      const sectionKey = String(body.section || '').trim();

      if (!sectionKey) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Bo‘lim ko‘rsatilmadi.'
        });
      }

      const updated = await eilistService.completeSection(userId, sectionKey);
      return this.sendJSON(res, 200, {
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('[EILIST COMPLETE SECTION ERROR]', error);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Bo‘limni yakunlashda xatolik: ' + error.message
      });
    }
  }

  async submitTest(req, res, body = {}) {
    try {
      const user = this.getUser(req);
      const userId = user?.id || 'guest_general';
      const answers = body.answers || {};

      const result = await eilistService.submitListeningTest(userId, answers);
      return this.sendJSON(res, 200, {
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[EILIST SUBMIT TEST ERROR]', error);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Listening testini tekshirishda xatolik: ' + error.message
      });
    }
  }
}

module.exports = new EilistController();
