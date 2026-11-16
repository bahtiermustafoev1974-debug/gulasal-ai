const quizBattleService = require('../services/quizBattle.service');

class QuizBattleController {
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

  start(req, res) {
    try {
      const userId = this.getUserId(req);
      const data = quizBattleService.startBattle(userId);
      return this.sendJSON(res, 200, {
        success: true,
        data
      });
    } catch (e) {
      return this.sendJSON(res, 500, {
        success: false,
        message: e.message || 'Jangni boshlashda xatolik yuz berdi.'
      });
    }
  }

  submit(req, res, body = {}) {
    try {
      const userId = this.getUserId(req);
      const { battleId, answers } = body;
      if (!battleId) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'battleId ko‘rsatilmadi.'
        });
      }
      const data = quizBattleService.submitBattle(userId, battleId, answers || {});
      return this.sendJSON(res, 200, {
        success: true,
        data
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Jang natijasini hisoblashda xatolik.'
      });
    }
  }
}

module.exports = new QuizBattleController();
