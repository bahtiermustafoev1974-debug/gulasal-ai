const mistakesService = require('../services/mistakes.service');

class MistakesController {
  getUserId(req) {
    if (req.user?.id) return req.user.id;
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/sessionId=([^;]+)/);
    return match ? `guest_${match[1].slice(0, 16)}` : 'guest_general';
  }

  sendJSON(res, status, data) {
    if (res.headersSent) return;
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  }

  async getMistakes(req, res) {
    try {
      const userId = this.getUserId(req);
      const list = mistakesService.getMistakes(userId);
      return this.sendJSON(res, 200, {
        success: true,
        data: list,
        count: list.length
      });
    } catch (error) {
      return this.sendJSON(res, 500, {
        success: false,
        message: error.message || 'Xatolar ro‘yxatini olishda xatolik yuz berdi.'
      });
    }
  }

  async recordMistake(req, res, body = {}) {
    try {
      const userId = this.getUserId(req);
      const record = mistakesService.recordMistake(userId, body);
      return this.sendJSON(res, 200, {
        success: true,
        data: record
      });
    } catch (error) {
      return this.sendJSON(res, 400, {
        success: false,
        message: error.message || 'Xatolikni saqlashda muammo yuz berdi.'
      });
    }
  }

  async deleteMistake(req, res, mistakeId) {
    try {
      const userId = this.getUserId(req);
      const success = mistakesService.deleteMistake(userId, mistakeId);
      return this.sendJSON(res, 200, {
        success: true,
        message: success ? 'Xato muvaffaqiyatli o‘chirildi.' : 'Topilmadi.'
      });
    } catch (error) {
      return this.sendJSON(res, 500, {
        success: false,
        message: error.message
      });
    }
  }

  async explainMistake(req, res, mistakeId) {
    try {
      const userId = this.getUserId(req);
      const explanation = await mistakesService.explainMistake(userId, mistakeId);
      return this.sendJSON(res, 200, {
        success: true,
        data: { explanation }
      });
    } catch (error) {
      return this.sendJSON(res, 500, {
        success: false,
        message: error.message || 'AI tahlilida xatolik yuz berdi.'
      });
    }
  }
}

module.exports = new MistakesController();
