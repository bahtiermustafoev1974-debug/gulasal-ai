
const curriculumService = require('../services/curriculum.service');
const authController = require('./auth.controller');

class CurriculumController {
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

  async getSubjects(req, res) {
    try {
      const userId = this.getUserId(req);
      const subjects = curriculumService.getSubjectsWithProgress(userId);
      return this.sendJSON(res, 200, {
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('[CURRICULUM GET SUBJECTS ERROR]', error);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'O‘quv dasturini yuklab bo‘lmadi: ' + error.message
      });
    }
  }

  async getLesson(req, res, lessonId) {
    try {
      const userId = this.getUserId(req);
      const id = decodeURIComponent(lessonId || '').trim();
      if (!id) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Dars identifikatori ko‘rsatilmadi.'
        });
      }

      const detail = curriculumService.getLessonDetail(userId, id);
      return this.sendJSON(res, 200, {
        success: true,
        data: detail
      });
    } catch (error) {
      console.error('[CURRICULUM GET LESSON ERROR]', error);
      const status = error.message.includes('topilmadi') ? 404 : 500;
      return this.sendJSON(res, status, {
        success: false,
        message: error.message || 'Dars ma’lumotini yuklab bo‘lmadi.'
      });
    }
  }

  async getLessonQuiz(req, res, lessonId, forceNew = false) {
    try {
      const userId = this.getUserId(req);
      const id = decodeURIComponent(lessonId || '').trim();
      if (!id) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Dars identifikatori ko‘rsatilmadi.'
        });
      }

      const quizData = await curriculumService.getLessonDynamicQuiz(userId, id, forceNew);
      return this.sendJSON(res, 200, {
        success: true,
        data: quizData
      });
    } catch (error) {
      console.error('[CURRICULUM GET QUIZ ERROR]', error);
      return this.sendJSON(res, 500, {
        success: false,
        message: error.message || 'Test savollarini generatsiya qilib bo‘lmadi.'
      });
    }
  }

  async completeStage(req, res, lessonId, body = {}) {
    try {
      const userId = this.getUserId(req);
      const id = decodeURIComponent(lessonId || '').trim();
      const stageNumber = Number.parseInt(body.stageNumber || body.stage, 10);

      if (!id || !Number.isInteger(stageNumber)) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Dars identifikatori va bosqich raqami talab qilinadi.'
        });
      }

      const updated = curriculumService.completeStage(userId, id, stageNumber);
      return this.sendJSON(res, 200, {
        success: true,
        message: `${stageNumber}-bosqich muvaffaqiyatli yakunlandi!`,
        data: updated
      });
    } catch (error) {
      console.error('[CURRICULUM COMPLETE STAGE ERROR]', error);
      return this.sendJSON(res, 400, {
        success: false,
        message: error.message || 'Bosqichni yakunlashda xatolik yuz berdi.'
      });
    }
  }

  async submitTest(req, res, lessonId, body = {}) {
    try {
      const userId = this.getUserId(req);
      const id = decodeURIComponent(lessonId || '').trim();
      const answers = body.answers || {};

      if (!id) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Dars identifikatori ko‘rsatilmadi.'
        });
      }

      const result = curriculumService.submitTest(userId, id, answers);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Yakuniy test muvaffaqiyatli topshirildi!',
        data: result
      });
    } catch (error) {
      console.error('[CURRICULUM SUBMIT TEST ERROR]', error);
      return this.sendJSON(res, 400, {
        success: false,
        message: error.message || 'Testni tekshirishda xatolik yuz berdi.'
      });
    }
  }

  async generateLesson(req, res, body = {}) {
    try {
      const userId = this.getUserId(req);
      const { topic, subjectHint } = body;
      if (!topic || !String(topic).trim()) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Dars mavzusini kiriting.'
        });
      }
      const aiLessonService = require('../services/aiLesson.service');
      const result = await aiLessonService.generateLesson(userId, topic, subjectHint);
      return this.sendJSON(res, 200, {
        success: true,
        message: '7 bosqichli yangi dars muvaffaqiyatli yaratildi!',
        data: result
      });
    } catch (error) {
      console.error('[GENERATE LESSON ERROR]', error);
      return this.sendJSON(res, 500, {
        success: false,
        message: error.message || 'Dars yaratishda xatolik yuz berdi.'
      });
    }
  }

  async resetLesson(req, res, lessonId) {
    try {
      const userId = this.getUserId(req);
      const id = decodeURIComponent(lessonId || '').trim();
      const reset = curriculumService.resetLesson(userId, id);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Dars progressi qayta o‘rnatildi.',
        data: reset
      });
    } catch (error) {
      return this.sendJSON(res, 500, {
        success: false,
        message: error.message || 'Qayta o‘rnatishda xatolik yuz berdi.'
      });
    }
  }
}

module.exports = new CurriculumController();
