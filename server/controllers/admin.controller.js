// ========================================================
// GULASAL AI — ENTERPRISE ADMIN CONTROLLER 2026
// Strict bahtiermustafoev1974@gmail.com Protection
// Users, Moderation, Broadcast Banner, Promocodes,
// Curriculum Content, AI Health & Audit Logs
// ========================================================

const authController = require('./auth.controller');
const subscriptionService = require('../services/subscription.service');
const supportService = require('../services/support.service');
const lessonService = require('../services/lesson.service');
const communityService = require('../services/community.service');
const moderationService = require('../services/moderation.service');
const announcementService = require('../services/announcement.service');
const promocodeService = require('../services/promocode.service');
const aiHealthService = require('../services/aiHealth.service');
const curriculumService = require('../services/curriculum.service');
const systemSettingsService = require('../services/systemSettings.service');
const notificationService = require('../services/notification.service');
const analyticsService = require('../services/analytics.service');
const paymentService = require('../services/payment.service');
const questionBankService = require('../services/questionBank.service');

class AdminController {
  sendJSON(res, status, data) {
    if (res.headersSent || res.destroyed || res.writableEnded) return;
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    return res.end(JSON.stringify(data));
  }

  getAdmin(req) {
    const user = authController.getAuthenticatedUser(req);
    if (!user || !authController.isUserAdmin(user)) {
      return null;
    }
    return user;
  }

  async checkAdminAuth(req, res) {
    const admin = this.getAdmin(req);
    if (!admin) {
      this.sendJSON(res, 403, {
        success: false,
        message: 'Kirish taqiqlangan! Ushbu bo‘lim faqat rasmiy administrator (bahtiermustafoev1974@gmail.com) uchun mo‘ljallangan.'
      });
      return null;
    }
    return admin;
  }

  // 1. GET ALL USERS (Google & Registered) + MODERATION
  async getUsers(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const registeredUsers = await authController.readUsers();
      const subData = subscriptionService.loadData().subscriptions || {};
      const supportData = supportService.loadData().conversations || {};
      const communityMembers = communityService.getMembers() || [];

      // Unified map of users keyed by ID
      const userMap = new Map();

      // From users.json
      for (const u of registeredUsers) {
        if (!u || !u.id) continue;
        userMap.set(u.id, {
          id: u.id,
          name: u.name || 'Foydalanuvchi',
          email: u.email || '',
          picture: u.picture || '',
          type: u.type || (typeof u.id === 'string' && u.id.startsWith('google_') ? 'google' : 'account'),
          createdAt: u.createdAt || null,
          lastActiveAt: u.lastActiveAt || u.createdAt || null
        });
      }

      // From support conversations
      for (const conv of Object.values(supportData)) {
        if (!conv || !conv.userId) continue;
        if (!userMap.has(conv.userId)) {
          const isGoogle = typeof conv.userId === 'string' && conv.userId.startsWith('google_');
          userMap.set(conv.userId, {
            id: conv.userId,
            name: conv.userName || 'Google Foydalanuvchi',
            email: conv.userEmail || '',
            picture: conv.userAvatar || '',
            type: isGoogle ? 'google' : 'user',
            createdAt: conv.lastMessageAt || null,
            lastActiveAt: conv.lastMessageAt || null
          });
        }
      }

      // From community members
      for (const m of communityMembers) {
        if (!m || !m.id) continue;
        if (!userMap.has(m.id)) {
          const isGoogle = typeof m.id === 'string' && m.id.startsWith('google_');
          userMap.set(m.id, {
            id: m.id,
            name: m.nickname || m.name || 'Guruh A’zosi',
            email: m.email || '',
            picture: m.avatar || '',
            type: isGoogle ? 'google' : 'user',
            createdAt: m.joinedAt || null,
            lastActiveAt: m.lastActiveAt || null
          });
        }
      }

      // Merge subscriptions, moderation & progress
      const usersList = [];
      for (const [id, user] of userMap.entries()) {
        const sub = subscriptionService.getUserSubscription(id);
        const ban = moderationService.isBanned(id);
        const mute = moderationService.isMuted(id);
        let progress = { completed: 0, total: 0, percentage: 0 };
        try {
          progress = lessonService.getDailyProgress(id) || progress;
        } catch {}

        usersList.push({
          ...user,
          moderation: {
            isBanned: Boolean(ban),
            banReason: ban?.reason || null,
            banExpiresAt: ban?.expiresAt || null,
            isMuted: Boolean(mute),
            muteReason: mute?.reason || null,
            muteExpiresAt: mute?.expiresAt || null
          },
          subscription: {
            isVip: sub.isVip,
            planName: sub.planName,
            status: sub.status,
            duration: sub.duration,
            durationLabel: sub.durationLabel || (sub.duration ? `${sub.duration} kun` : 'Cheksiz'),
            validUntil: sub.validUntil,
            daysRemaining: sub.daysRemaining,
            grantedBy: sub.grantedBy,
            grantedAt: sub.grantedAt
          },
          progress: {
            completedLessons: progress.completed || 0,
            percentage: progress.percentage || 0
          }
        });
      }

      // Sort: Google / newest users first
      usersList.sort((a, b) => {
        const tA = new Date(a.lastActiveAt || a.createdAt || 0).getTime();
        const tB = new Date(b.lastActiveAt || b.createdAt || 0).getTime();
        return tB - tA;
      });

      return this.sendJSON(res, 200, {
        success: true,
        count: usersList.length,
        users: usersList
      });
    } catch (e) {
      console.error('[ADMIN GET USERS ERROR]', e);
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Foydalanuvchilarni yuklashda xatolik yuz berdi.'
      });
    }
  }

  // 2. GRANT PRO TO A USER
  async grantPro(req, res, targetUserId, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const days = body.days !== undefined ? body.days : 30;
      const targetEmail = body.email || '';

      const updatedSub = subscriptionService.grantPro(targetUserId, days, admin, targetEmail);

      return this.sendJSON(res, 200, {
        success: true,
        message: `Foydalanuvchiga PRO obunasi muvaffaqiyatli taqdim etildi! Muddat: ${updatedSub.durationLabel}`,
        subscription: updatedSub
      });
    } catch (e) {
      console.error('[ADMIN GRANT PRO ERROR]', e.message);
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'PRO berishda xatolik yuz berdi.'
      });
    }
  }

  // 3. REVOKE PRO FROM A USER
  async revokePro(req, res, targetUserId) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const updatedSub = subscriptionService.revokePro(targetUserId, admin);

      return this.sendJSON(res, 200, {
        success: true,
        message: 'Foydalanuvchining PRO obunasi bekor qilindi.',
        subscription: updatedSub
      });
    } catch (e) {
      console.error('[ADMIN REVOKE PRO ERROR]', e.message);
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'PRO obunasini bekor qilishda xatolik.'
      });
    }
  }

  // ==========================================
  // 4. MODERATION (BAN & MUTE)
  // ==========================================

  async banUser(req, res, targetUserId, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const reason = body?.reason || 'Qoidalarni buzganlik';
      const hours = body?.hours ? parseInt(body.hours, 10) : null;
      const ban = moderationService.banUser(targetUserId, reason, hours, admin.email);

      return this.sendJSON(res, 200, {
        success: true,
        message: `Foydalanuvchi muvaffaqiyatli bloklandi (${reason}).`,
        ban
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Foydalanuvchini bloklashda xatolik.'
      });
    }
  }

  async unbanUser(req, res, targetUserId) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      moderationService.unbanUser(targetUserId);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Foydalanuvchi blokdan chiqarildi.'
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Blokdan chiqarishda xatolik.'
      });
    }
  }

  async muteUser(req, res, targetUserId, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const reason = body?.reason || 'Guruh chatida nojo‘ya so‘zlar';
      const hours = body?.hours ? parseInt(body.hours, 10) : 24;
      const mute = moderationService.muteUser(targetUserId, reason, hours, admin.email);

      return this.sendJSON(res, 200, {
        success: true,
        message: `Foydalanuvchining chatda yozishi ${hours} soatga cheklandi.`,
        mute
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Foydalanuvchini mute qilishda xatolik.'
      });
    }
  }

  async unmuteUser(req, res, targetUserId) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      moderationService.unmuteUser(targetUserId);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Foydalanuvchining chat cheklovi bekor qilindi.'
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Cheklovni yechishda xatolik.'
      });
    }
  }

  async getModerationList(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const list = moderationService.getList();
      return this.sendJSON(res, 200, {
        success: true,
        data: list
      });
    } catch (e) {
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Moderatsiya ro‘yxatini yuklab bo‘lmadi.'
      });
    }
  }

  // ==========================================
  // 5. BROADCAST ANNOUNCEMENT BANNER
  // ==========================================

  async getAnnouncement(req, res) {
    try {
      const ann = announcementService.getAnnouncement();
      return this.sendJSON(res, 200, {
        success: true,
        announcement: ann
      });
    } catch (e) {
      return this.sendJSON(res, 500, {
        success: false,
        message: 'E’lonni yuklab bo‘lmadi.'
      });
    }
  }

  async saveAnnouncement(req, res, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const saved = announcementService.saveAnnouncement(body, admin.email);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'E’lon muvaffaqiyatli yangilandi!',
        announcement: saved
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'E’lonni saqlashda xatolik.'
      });
    }
  }

  // ==========================================
  // 6. PROMOCODES MANAGEMENT
  // ==========================================

  async getPromocodes(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const list = promocodeService.getPromocodes();
      return this.sendJSON(res, 200, {
        success: true,
        promocodes: list
      });
    } catch (e) {
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Promokodlarni yuklab bo‘lmadi.'
      });
    }
  }

  async createPromocode(req, res, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const promo = promocodeService.createPromocode(
        body?.code,
        body?.days,
        body?.maxUses,
        admin.email
      );
      return this.sendJSON(res, 201, {
        success: true,
        message: `«${promo.code}» promokodi muvaffaqiyatli yaratildi!`,
        promocode: promo
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Promokod yaratishda xatolik.'
      });
    }
  }

  async deletePromocode(req, res, code) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      promocodeService.deletePromocode(code);
      return this.sendJSON(res, 200, {
        success: true,
        message: `«${code}» promokodi o‘chirildi.`
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Promokodni o‘chirishda xatolik.'
      });
    }
  }

  async redeemPromocode(req, res, body = {}) {
    try {
      const user = authController.getAuthenticatedUser(req);
      if (!user) {
        return this.sendJSON(res, 401, {
          success: false,
          requireGoogle: true,
          message: 'Promokodni kiritish uchun tizimga kiring.'
        });
      }

      const result = promocodeService.redeemPromocode(body?.code, user);
      return this.sendJSON(res, 200, result);
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Promokoddan foydalanishda xatolik.'
      });
    }
  }

  // ==========================================
  // 7. CONTENT / CURRICULUM MANAGEMENT
  // ==========================================

  async getCurriculumSubjects(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const subjects = curriculumService.getSubjectsSummary();
      return this.sendJSON(res, 200, {
        success: true,
        subjects
      });
    } catch (e) {
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Fanlar ro‘yxatini yuklab bo‘lmadi.'
      });
    }
  }

  async addCurriculumTopic(req, res, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const newTopic = curriculumService.addTopic(body?.subjectId, {
        title: body?.title,
        description: body?.description
      });
      return this.sendJSON(res, 201, {
        success: true,
        message: `«${newTopic.title}» mavzusi muvaffaqiyatli qo‘shildi!`,
        topic: newTopic
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Mavzuni qo‘shishda xatolik.'
      });
    }
  }

  async updateCurriculumTopic(req, res, subjectId, topicId, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const updated = curriculumService.updateTopic(subjectId, topicId, {
        title: body?.title,
        description: body?.description
      });
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Mavzu muvaffaqiyatli yangilandi!',
        topic: updated
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Mavzuni yangilashda xatolik.'
      });
    }
  }

  async deleteCurriculumTopic(req, res, subjectId, topicId) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      curriculumService.deleteTopic(subjectId, topicId);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Mavzu muvaffaqiyatli o‘chirildi.'
      });
    } catch (e) {
      return this.sendJSON(res, 400, {
        success: false,
        message: e.message || 'Mavzuni o‘chirishda xatolik.'
      });
    }
  }

  // ==========================================
  // 8. AI HEALTH & LATENCY MONITOR
  // ==========================================

  async getAiHealth(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const health = await aiHealthService.checkHealth();
      return this.sendJSON(res, 200, {
        success: true,
        health
      });
    } catch (e) {
      return this.sendJSON(res, 500, {
        success: false,
        message: 'AI holatini tekshirishda xatolik yuz berdi.'
      });
    }
  }

  // 9. AUDIT LOGS
  async getAuditLogs(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const logs = subscriptionService.getAuditLogs(100);
      return this.sendJSON(res, 200, {
        success: true,
        logs
      });
    } catch (e) {
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Audit loglarni yuklab bo‘lmadi.'
      });
    }
  }

  // 10. DASHBOARD STATS
  async getDashboardStats(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const registeredUsers = await authController.readUsers();
      const subData = subscriptionService.loadData().subscriptions || {};
      const proCount = Object.values(subData).filter(s => s && s.isVip).length;
      const inbox = supportService.getInbox();
      const unreadTickets = inbox.filter(c => c.unreadByAdmin > 0).length;
      const communityMembers = communityService.getMembers() || [];
      const messages = communityService.getMessages() || [];
      const mod = moderationService.getList();
      const promoList = promocodeService.getPromocodes();

      return this.sendJSON(res, 200, {
        success: true,
        stats: {
          totalUsers: Math.max(registeredUsers.length, inbox.length),
          proUsers: proCount,
          totalTickets: inbox.length,
          unreadTickets,
          communityMembers: communityMembers.length,
          communityMessages: messages.length,
          bannedCount: mod.banned.length,
          mutedCount: mod.muted.length,
          activePromocodes: promoList.filter(p => p.active).length,
          uptime: process.uptime(),
          serverTime: new Date().toISOString()
        }
      });
    } catch (e) {
      return this.sendJSON(res, 500, {
        success: false,
        message: 'Statistikani yuklab bo‘lmadi.'
      });
    }
  }
  // ==========================================
  // 11. MAINTENANCE MODE & SYSTEM SETTINGS
  // ==========================================

  async getMaintenance(req, res) {
    try {
      const data = systemSettingsService.getMaintenance();
      return this.sendJSON(res, 200, { success: true, maintenance: data });
    } catch (e) {
      return this.sendJSON(res, 500, { success: false, message: 'Profilaktika holatini yuklab bo‘lmadi.' });
    }
  }

  async setMaintenance(req, res, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const updated = systemSettingsService.setMaintenance(body, admin.email);
      return this.sendJSON(res, 200, {
        success: true,
        message: updated.enabled ? 'Texnik profilaktika rejimi faollashtirildi!' : 'Texnik profilaktika rejimi o‘chirildi.',
        maintenance: updated
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message || 'Xatolik yuz berdi.' });
    }
  }

  // ==========================================
  // 12. ANALYTICS & TOP LEADERBOARD
  // ==========================================

  async getAnalyticsOverview(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const data = analyticsService.getOverview();
      return this.sendJSON(res, 200, { success: true, analytics: data, overview: data });
    } catch (e) {
      console.error('[ANALYTICS ERROR]', e);
      return this.sendJSON(res, 500, { success: false, message: 'Analitika ma’lumotlarini yuklab bo‘lmadi.' });
    }
  }

  // ==========================================
  // 13. DIRECT PERSONAL NOTIFICATIONS
  // ==========================================

  async sendUserNotification(req, res, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const notif = notificationService.sendNotification(body?.userId, {
        title: body?.title,
        message: body?.message,
        type: body?.type
      }, admin.email);

      return this.sendJSON(res, 201, {
        success: true,
        message: 'Foydalanuvchiga shaxsiy bildirishnoma yuborildi!',
        notification: notif
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message || 'Bildirishnoma yuborishda xatolik.' });
    }
  }

  async getUserNotifications(req, res) {
    try {
      const user = authController.getAuthenticatedUser(req);
      if (!user) {
        return this.sendJSON(res, 200, { success: true, notifications: [] });
      }

      const list = notificationService.getUserNotifications(user.id);
      return this.sendJSON(res, 200, { success: true, notifications: list });
    } catch (e) {
      return this.sendJSON(res, 500, { success: false, message: 'Bildirishnomalarni yuklab bo‘lmadi.' });
    }
  }

  async markNotificationRead(req, res, notifId) {
    try {
      const user = authController.getAuthenticatedUser(req);
      if (!user) return this.sendJSON(res, 401, { success: false, message: 'Avtorizatsiya talab qilinadi.' });

      notificationService.markAsRead(user.id, notifId);
      return this.sendJSON(res, 200, { success: true, message: 'O‘qilgan deb belgilandi.' });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message });
    }
  }

  // ==========================================
  // 14. AI ENGINE SETTINGS
  // ==========================================

  async getAiSettings(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const data = systemSettingsService.getAiSettings();
      return this.sendJSON(res, 200, { success: true, settings: data });
    } catch (e) {
      return this.sendJSON(res, 500, { success: false, message: 'AI sozlamalarini yuklab bo‘lmadi.' });
    }
  }

  async saveAiSettings(req, res, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const updated = systemSettingsService.setAiSettings(body, admin.email);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'AI model va uslub sozlamalari muvaffaqiyatli saqlandi!',
        settings: updated
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message || 'AI sozlamalarini saqlashda xatolik.' });
    }
  }

  // ==========================================
  // 15. PAYMENTS & SUBSCRIPTIONS (OFFICIAL CARD: 9860 1606 3566 3802)
  // ==========================================

  async getPayments(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const url = new URL(req.url, 'http://localhost');
      const statusFilter = url.searchParams.get('status') || 'all';
      const payments = paymentService.getPayments(statusFilter);
      const pendingCount = paymentService.getPendingCount();

      return this.sendJSON(res, 200, {
        success: true,
        payments,
        pendingCount,
        config: paymentService.getConfig()
      });
    } catch (e) {
      return this.sendJSON(res, 500, { success: false, message: 'To‘lovlarni yuklashda xatolik: ' + e.message });
    }
  }

  async approvePayment(req, res, paymentId) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const result = paymentService.approvePayment(paymentId, admin);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'To‘lov tasdiqlandi va foydalanuvchiga PRO obuna avtomatik faollashtirildi! 🎉',
        payment: result.payment,
        subscription: result.subscription
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message });
    }
  }

  async rejectPayment(req, res, paymentId, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const reason = body?.reason || 'To‘lov cheki tasdiqlanmadi.';
      const result = paymentService.rejectPayment(paymentId, reason, admin);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'To‘lov rad etildi va foydalanuvchiga bildirishnoma yuborildi.',
        payment: result.payment
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message });
    }
  }

  // User payment endpoints
  async submitUserPayment(req, res, body = {}) {
    const user = authController.getAuthenticatedUser(req);
    if (!user) {
      return this.sendJSON(res, 401, { success: false, message: 'Iltimos, tizimga kiring.' });
    }

    try {
      const payment = paymentService.submitPayment({
        userId: user.id,
        userEmail: user.email || '',
        userName: user.name || '',
        planId: body.planId || '1_month',
        receiptImage: body.receiptImage || null,
        note: body.note || '',
        senderCard: body.senderCard || ''
      });

      return this.sendJSON(res, 200, {
        success: true,
        message: 'To‘lov chekingiz muvaffaqiyatli qabul qilindi! Administrator tekshirib tasdiqlashi bilan (5-15 daqiqa) PRO faollashadi.',
        payment
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message });
    }
  }

  async getPaymentConfig(req, res) {
    try {
      const config = paymentService.getConfig();
      return this.sendJSON(res, 200, { success: true, ...config });
    } catch (e) {
      return this.sendJSON(res, 500, { success: false, message: e.message });
    }
  }

  async getUserRecentPayment(req, res) {
    const user = authController.getAuthenticatedUser(req);
    if (!user) {
      return this.sendJSON(res, 401, { success: false, message: 'Iltimos, tizimga kiring.' });
    }

    try {
      const payment = paymentService.getUserRecentPayment(user.id);
      return this.sendJSON(res, 200, { success: true, payment });
    } catch (e) {
      return this.sendJSON(res, 500, { success: false, message: e.message });
    }
  }

  // ==========================================
  // 16. QUESTION BANK (TESTLAR VA SAVOLLAR BANKI)
  // ==========================================

  async getQuestions(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const url = new URL(req.url, 'http://localhost');
      const subject = url.searchParams.get('subject') || 'all';
      const difficulty = url.searchParams.get('difficulty') || 'all';
      const search = url.searchParams.get('search') || '';

      const data = questionBankService.getQuestions({ subject, difficulty, search });
      return this.sendJSON(res, 200, { success: true, ...data });
    } catch (e) {
      return this.sendJSON(res, 500, { success: false, message: 'Savollarni yuklab bo‘lmadi: ' + e.message });
    }
  }

  async createQuestion(req, res, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const question = questionBankService.createQuestion(body, admin.email);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Yangi test savoli muvaffaqiyatli qo‘shildi!',
        question
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message });
    }
  }

  async updateQuestion(req, res, id, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const updated = questionBankService.updateQuestion(id, body, admin.email);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Test savoli muvaffaqiyatli yangilandi!',
        question: updated
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message });
    }
  }

  async deleteQuestion(req, res, id) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const deleted = questionBankService.deleteQuestion(id, admin.email);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'Test savoli muvaffaqiyatli o‘chirildi!',
        question: deleted
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message });
    }
  }

  // ==========================================
  // 17. AI USAGE STATS & RATE LIMITS
  // ==========================================

  async getAiUsage(req, res) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const stats = systemSettingsService.getAiUsageStats();
      return this.sendJSON(res, 200, { success: true, stats });
    } catch (e) {
      return this.sendJSON(res, 500, { success: false, message: 'AI statistikasini yuklashda xatolik: ' + e.message });
    }
  }

  async saveAiLimits(req, res, body = {}) {
    const admin = await this.checkAdminAuth(req, res);
    if (!admin) return;

    try {
      const updated = systemSettingsService.setAiSettings(body, admin.email);
      return this.sendJSON(res, 200, {
        success: true,
        message: 'AI kunlik limiti va model parametrlari saqlandi!',
        settings: updated
      });
    } catch (e) {
      return this.sendJSON(res, 400, { success: false, message: e.message });
    }
  }
}

module.exports = new AdminController();
