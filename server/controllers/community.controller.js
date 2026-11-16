
const communityService = require('../services/community.service');
const lessonService = require('../services/lesson.service');
const authController = require('./auth.controller');

class CommunityController {
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

  ensureGoogleUser(req, res) {
    const user = this.getUser(req);
    if (!user?.id || user.type === 'guest') {
      this.sendJSON(res, 401, {
        success: false,
        requireGoogle: true,
        message: 'Ushbu amalni bajarish uchun rasmiy Google hisobi talab qilinadi.'
      });
      return null;
    }
    return user;
  }

  async getProfile(req, res) {
    try {
      const user = this.getUser(req) || { id: 'guest_' + Math.random().toString(36).slice(2, 8), name: 'Mehmon', type: 'guest' };
      const isGuest = !user?.id || user.type === 'guest' || String(user.id).startsWith('guest_');

      let profile;
      if (isGuest) {
        profile = {
          userId: user.id || 'guest_general',
          nickname: user.name || 'Mehmon',
          bio: 'Mehmon foydalanuvchi',
          interest: 'IT & Ta’lim',
          avatar: '',
          isGuest: true,
          isAdmin: false,
          role: 'guest'
        };
      } else {
        profile = communityService.getProfile(user.id, user);
      }

      return this.sendJSON(res, 200, {
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('[COMMUNITY PROFILE GET ERROR]', error.message);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Profilni yuklashda xatolik yuz berdi.'
      });
    }
  }

  async updateProfile(req, res, body = {}) {
    try {
      const user = this.ensureGoogleUser(req, res);
      if (!user) return;

      const profile = communityService.updateProfile(user.id, body, user);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Profilingiz muvaffaqiyatli yangilandi!',
        data: profile
      });
    } catch (error) {
      console.error('[COMMUNITY PROFILE UPDATE ERROR]', error.message);
      return this.sendJSON(res, 400, {
        success: false,
        message: error.message || 'Profilni yangilab bo‘lmadi.'
      });
    }
  }

  async getMembers(req, res) {
    try {
      const user = this.getUser(req);
      if (user && user.type !== 'guest' && !String(user.id).startsWith('guest_')) {
        communityService.getProfile(user.id, user);
      }

      // Return only registered real Google users (guest accounts excluded from list and count)
      const members = communityService.getMembers();
      return this.sendJSON(res, 200, {
        success: true,
        data: members
      });
    } catch (error) {
      console.error('[COMMUNITY MEMBERS ERROR]', error.message);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'A’zolar ro‘yxatini yuklab bo‘lmadi.'
      });
    }
  }

  async getMember(req, res, memberId) {
    try {
      const member = communityService.getMemberProfile(memberId);
      
      // Also get learning progress if available
      try {
        const prog = lessonService.getDailyProgress(memberId);
        member.completedToday = prog.completed || 0;
        member.totalToday = prog.total || 0;
        member.percentageToday = prog.percentage || 0;
      } catch {
        member.completedToday = 0;
        member.totalToday = 0;
        member.percentageToday = 0;
      }

      return this.sendJSON(res, 200, {
        success: true,
        data: member
      });
    } catch (error) {
      console.error('[COMMUNITY MEMBER GET ERROR]', error.message);
      return this.sendJSON(res, 404, {
        success: false,
        message: error.message || 'A’zo profili topilmadi.'
      });
    }
  }

  async getMessages(req, res, since = null) {
    try {
      const messages = communityService.getMessages(since);
      return this.sendJSON(res, 200, {
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('[COMMUNITY MESSAGES ERROR]', error.message);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Xabarlarni yuklab bo‘lmadi.'
      });
    }
  }

  async sendMessage(req, res, body = {}) {
    try {
      const user = this.getUser(req) || { id: 'guest_' + Math.random().toString(36).slice(2, 8), name: 'Mehmon', type: 'guest' };
      const isGuest = !user?.id || user.type === 'guest' || String(user.id).startsWith('guest_');

      let nickname = 'Mehmon';
      let avatar = '';

      if (!isGuest) {
        const profile = communityService.getProfile(user.id, user);
        nickname = profile.nickname || user.name || 'Guruh A’zosi';
        avatar = profile.avatar || user.picture || '';
      } else {
        nickname = user.name || 'Mehmon';
      }

      const text = body.text || body.message || '';
      const imageUrl = body.imageUrl || body.image || null;

      const message = communityService.addMessage(
        user.id,
        nickname,
        avatar,
        text,
        imageUrl
      );

      return this.sendJSON(res, 201, {
        success: true,
        data: message
      });
    } catch (error) {
      console.error('[COMMUNITY SEND ERROR]', error.message);
      return this.sendJSON(res, 400, {
        success: false,
        message: error.message || 'Xabar yuborib bo‘lmadi.'
      });
    }
  }

  async deleteMessage(req, res, messageId) {
    try {
      const user = this.getUser(req);
      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Xabarni o‘chirish uchun qayta tizimga kiring.'
        });
      }

      if (!messageId) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Xabar identifikatori (ID) ko‘rsatilmadi.'
        });
      }

      const isAdmin = Boolean(user.isAdmin || user.role === 'admin');
      const result = communityService.deleteMessage(messageId, user.id, isAdmin);

      return this.sendJSON(res, 200, {
        success: true,
        message: 'Xabar muvaffaqiyatli o‘chirildi.',
        data: result
      });
    } catch (error) {
      console.error('[COMMUNITY DELETE MESSAGE ERROR]', error.message);
      const isForbidden = error.message.includes('faqat o‘zingiz yuborgan');
      return this.sendJSON(res, isForbidden ? 403 : 400, {
        success: false,
        message: error.message || 'Xabarni o‘chirib bo‘lmadi.'
      });
    }
  }

  async clearChat(req, res) {
    try {
      const user = this.getUser(req);
      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Qayta tizimga kiring.'
        });
      }

      const isAdmin = Boolean(user.isAdmin || user.role === 'admin');
      if (!isAdmin) {
        return this.sendJSON(res, 403, {
          success: false,
          message: 'Kechirasiz, guruh chat tarixini tozalash huquqi faqat sayt administratoriga berilgan.'
        });
      }

      const result = communityService.clearAllMessages(user.id, true);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Guruh chatidagi barcha xabarlar tarixi muvaffaqiyatli tozalandi.',
        data: result
      });
    } catch (error) {
      console.error('[COMMUNITY CLEAR CHAT ERROR]', error.message);
      return this.sendJSON(res, 403, {
        success: false,
        message: error.message || 'Chat tarixini tozalab bo‘lmadi.'
      });
    }
  }

  async verifyAdminKey(req, res, body = {}) {
    try {
      const user = this.getUser(req);
      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Qayta tizimga kiring.'
        });
      }

      const key = String(body.key || body.password || '').trim();
      const expectedKey = process.env.ADMIN_KEY || 'gulasal_admin_2026';

      if (key !== expectedKey) {
        return this.sendJSON(res, 403, {
          success: false,
          message: 'Admin maxfiy kaliti noto‘g‘ri kiritildi.'
        });
      }

      // Upgrade user session cookie
      user.isAdmin = true;
      user.role = 'admin';
      authController.setSessionCookie(res, user);

      return this.sendJSON(res, 200, {
        success: true,
        message: 'Administrator huquqlari muvaffaqiyatli faollashtirildi!',
        isAdmin: true
      });
    } catch (error) {
      return this.sendJSON(res, 500, {
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CommunityController();
