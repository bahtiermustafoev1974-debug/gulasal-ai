
const lessonService = require('../services/lesson.service');
const authController = require('./auth.controller');

class LessonController {
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

  getUserId(req) {
    const user = this.getUser(req);
    return user?.id || 'guest_general';
  }

  async getDaily(req, res) {
    try {
      const userId = this.getUserId(req);
      const progress = lessonService.getDailyProgress(userId);
      return this.sendJSON(res, 200, {
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('[LESSON GET ERROR]', error.message);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Darslar ma’lumotini yuklab bo‘lmadi.'
      });
    }
  }

  async toggle(req, res, body = {}) {
    try {
      const userId = this.getUserId(req);
      const lessonId = typeof body.lessonId === 'string' ? body.lessonId.trim() : '';
      if (!lessonId) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Dars ID kiritilishi shart.'
        });
      }

      const completed = typeof body.completed === 'boolean' ? body.completed : null;
      const progress = lessonService.toggleLesson(userId, lessonId, completed);

      return this.sendJSON(res, 200, {
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('[LESSON TOGGLE ERROR]', error.message);
      return this.sendJSON(res, 400, {
        success: false,
        message: error.message || 'Dars holatini o‘zgartirib bo‘lmadi.'
      });
    }
  }
}

module.exports = new LessonController();
