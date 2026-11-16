
const mentorService = require('../services/mentor.service');
const authController = require('./auth.controller');

class MentorController {
  getUser(req, res) {
    const user = authController.getAuthenticatedUser(req);

    if (!user?.id) {
      return { id: 'guest_general', name: 'Foydalanuvchi', email: 'guest@ustoz.ai' };
    }

    return user;
  }

  send(res, status, data) {
    if (res.headersSent || res.destroyed || res.writableEnded) {
      return;
    }

    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });

    return res.end(JSON.stringify(data));
  }

  handleError(res, error) {
    console.error('[MENTOR ERROR]', error.message);

    if (res.headersSent) {
      if (!res.writableEnded) res.end();
      return;
    }

    const status = error.statusCode || 500;

    return this.send(res, status, {
      success: false,
      message: status < 500
        ? error.message
        : 'Mentor xizmatida ichki xatolik yuz berdi.'
    });
  }

  getDashboard(req, res) {
    try {
      const user = this.getUser(req, res);
      if (!user) return;

      return this.send(res, 200, {
        success: true,
        data: mentorService.getDashboard(user.id)
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  addGoal(req, res, body = {}) {
    try {
      const user = this.getUser(req, res);
      if (!user) return;

      mentorService.addGoal(user.id, body);

      return this.send(res, 201, {
        success: true,
        message: 'Maqsad qo‘shildi.',
        data: mentorService.getDashboard(user.id)
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  updateGoal(req, res, goalId, body = {}) {
    try {
      const user = this.getUser(req, res);
      if (!user) return;

      mentorService.updateGoal(user.id, goalId, body);

      return this.send(res, 200, {
        success: true,
        message: 'Maqsad yangilandi.',
        data: mentorService.getDashboard(user.id)
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  deleteGoal(req, res, goalId) {
    try {
      const user = this.getUser(req, res);
      if (!user) return;

      mentorService.deleteGoal(user.id, goalId);

      return this.send(res, 200, {
        success: true,
        message: 'Maqsad o‘chirildi.'
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  addTask(req, res, body = {}) {
    try {
      const user = this.getUser(req, res);
      if (!user) return;

      mentorService.addTask(user.id, body);

      return this.send(res, 201, {
        success: true,
        message: 'Vazifa qo‘shildi.',
        data: mentorService.getDashboard(user.id)
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  updateTask(req, res, taskId, body = {}) {
    try {
      const user = this.getUser(req, res);
      if (!user) return;

      mentorService.updateTask(user.id, taskId, body);

      return this.send(res, 200, {
        success: true,
        message: 'Vazifa yangilandi.',
        data: mentorService.getDashboard(user.id)
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  deleteTask(req, res, taskId) {
    try {
      const user = this.getUser(req, res);
      if (!user) return;

      mentorService.deleteTask(user.id, taskId);

      return this.send(res, 200, {
        success: true,
        message: 'Vazifa o‘chirildi.'
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  savePlan(req, res, body = {}) {
    try {
      const user = this.getUser(req, res);
      if (!user) return;

      mentorService.savePlan(user.id, body);

      return this.send(res, 200, {
        success: true,
        message: 'Kunlik reja saqlandi.',
        data: mentorService.getDashboard(user.id)
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

module.exports = new MentorController();
