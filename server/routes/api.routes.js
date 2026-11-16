
const chatController = require('../controllers/chat.controller');
const dataController = require('../controllers/data.controller');
const toolsController = require('../controllers/tools.controller');
const authController = require('../controllers/auth.controller');
const mentorController = require('../controllers/mentor.controller');
const communityController = require('../controllers/community.controller');
const lessonController = require('../controllers/lesson.controller');
const uploadController = require('../controllers/upload.controller');
const eilistController = require('../controllers/eilist.controller');
const curriculumController = require('../controllers/curriculum.controller');
const dynamicPracticeController = require('../controllers/dynamicPractice.controller');
const gamificationController = require('../controllers/gamification.controller');
const subscriptionController = require('../controllers/subscription.controller');
const adminController = require('../controllers/admin.controller');
const supportController = require('../controllers/support.controller');
const mistakesController = require('../controllers/mistakes.controller');
const quizBattleController = require('../controllers/quizBattle.controller');
const telegramService = require('../services/telegram.service');
const parseBody = require('../middleware/bodyParser.middleware');

class ApiRouter {
  async handle(req, res, pathname) {
    console.log('[API ROUTER]', req.method, pathname);

    res.setHeader(
      'Content-Type',
      'application/json; charset=utf-8'
    );

    try {
      // AUTHENTICATION
      if (pathname === '/api/auth/register' && req.method === 'POST') {
        return await authController.register(req, res, await parseBody(req));
      }

      if (pathname === '/api/auth/login' && req.method === 'POST') {
        return await authController.login(req, res, await parseBody(req));
      }

      if (pathname === '/api/auth/google' && req.method === 'POST') {
        return await authController.google(req, res, await parseBody(req));
      }

      if (pathname === '/api/auth/google/callback' && (req.method === 'POST' || req.method === 'GET')) {
        const body = req.method === 'POST' ? await parseBody(req) : {};
        return await authController.googleCallback(req, res, body);
      }

      if (pathname === '/api/auth/config' && req.method === 'GET') {
        return authController.getAuthConfig(req, res);
      }

      if (pathname === '/api/auth/guest' && req.method === 'POST') {
        return await authController.createGuest(req, res);
      }

      if (pathname === '/api/auth/session' && req.method === 'GET') {
        return await authController.getSession(req, res);
      }

      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        return await authController.logout(req, res);
      }

      // HEALTH CHECK
      if (pathname === '/api/health' && req.method === 'GET') {
        res.writeHead(200);
        return res.end(JSON.stringify({
          success: true,
          status: 'ok',
          time: new Date().toISOString()
        }));
      }

      // MENTOR DASHBOARD
      if (pathname === '/api/mentor' && req.method === 'GET') {
        return await mentorController.getDashboard(req, res);
      }

      // GOALS
      if (pathname === '/api/mentor/goals' && req.method === 'POST') {
        return await mentorController.addGoal(
          req, res, await parseBody(req)
        );
      }

      const goalMatch = pathname.match(
        /^\/api\/mentor\/goals\/([^/]+)$/
      );

      if (goalMatch && req.method === 'PATCH') {
        return await mentorController.updateGoal(
          req, res, goalMatch[1], await parseBody(req)
        );
      }

      if (goalMatch && req.method === 'DELETE') {
        return await mentorController.deleteGoal(
          req, res, goalMatch[1]
        );
      }

      // TASKS
      if (pathname === '/api/mentor/tasks' && req.method === 'POST') {
        return await mentorController.addTask(
          req, res, await parseBody(req)
        );
      }

      const taskMatch = pathname.match(
        /^\/api\/mentor\/tasks\/([^/]+)$/
      );

      if (taskMatch && req.method === 'PATCH') {
        return await mentorController.updateTask(
          req, res, taskMatch[1], await parseBody(req)
        );
      }

      if (taskMatch && req.method === 'DELETE') {
        return await mentorController.deleteTask(
          req, res, taskMatch[1]
        );
      }

      // DAILY PLAN
      if (pathname === '/api/mentor/plans' && req.method === 'PUT') {
        return await mentorController.savePlan(
          req, res, await parseBody(req)
        );
      }

      // DAILY LESSONS PROGRESS
      if (pathname === '/api/lessons/daily' && req.method === 'GET') {
        return await lessonController.getDaily(req, res);
      }

      if (pathname === '/api/lessons/toggle' && req.method === 'POST') {
        return await lessonController.toggle(
          req, res, await parseBody(req)
        );
      }

      // CURRICULUM & STAGE PROGRESSION
      if (pathname === '/api/curriculum/subjects' && req.method === 'GET') {
        return await curriculumController.getSubjects(req, res);
      }

      const lessonDetailMatch = pathname.match(/^\/api\/curriculum\/lesson\/([^/]+)$/);
      if (lessonDetailMatch && req.method === 'GET') {
        return await curriculumController.getLesson(req, res, lessonDetailMatch[1]);
      }

      const lessonQuizMatch = pathname.match(/^\/api\/curriculum\/lesson\/([^/]+)\/quiz$/);
      if (lessonQuizMatch && req.method === 'GET') {
        let forceNew = false;
        try {
          const u = new URL(req.url, 'http://localhost');
          forceNew = u.searchParams.get('forceNew') === 'true' || u.searchParams.get('refresh') === 'true';
        } catch {}
        return await curriculumController.getLessonQuiz(req, res, lessonQuizMatch[1], forceNew);
      }

      const lessonStageMatch = pathname.match(/^\/api\/curriculum\/lesson\/([^/]+)\/stage$/);
      if (lessonStageMatch && req.method === 'POST') {
        return await curriculumController.completeStage(
          req, res, lessonStageMatch[1], await parseBody(req)
        );
      }

      const lessonTestMatch = pathname.match(/^\/api\/curriculum\/lesson\/([^/]+)\/test$/);
      if (lessonTestMatch && req.method === 'POST') {
        return await curriculumController.submitTest(
          req, res, lessonTestMatch[1], await parseBody(req)
        );
      }

      const lessonResetMatch = pathname.match(/^\/api\/curriculum\/lesson\/([^/]+)\/reset$/);
      if (lessonResetMatch && req.method === 'POST') {
        return await curriculumController.resetLesson(
          req, res, lessonResetMatch[1]
        );
      }

      // AI LESSON GENERATOR (CUSTOM 7-STAGE LESSONS)
      if (pathname === '/api/curriculum/generate-lesson' && req.method === 'POST') {
        return await curriculumController.generateLesson(
          req, res, await parseBody(req)
        );
      }

      // MISTAKES NOTEBOOK
      if (pathname === '/api/mistakes' && req.method === 'GET') {
        return await mistakesController.getMistakes(req, res);
      }

      if (pathname === '/api/mistakes' && req.method === 'POST') {
        return await mistakesController.recordMistake(
          req, res, await parseBody(req)
        );
      }

      const mistakeExplainMatch = pathname.match(/^\/api\/mistakes\/([^/]+)\/explain$/);
      if (mistakeExplainMatch && req.method === 'POST') {
        return await mistakesController.explainMistake(
          req, res, mistakeExplainMatch[1]
        );
      }

      const mistakeDeleteMatch = pathname.match(/^\/api\/mistakes\/([^/]+)$/);
      if (mistakeDeleteMatch && req.method === 'DELETE') {
        return await mistakesController.deleteMistake(
          req, res, mistakeDeleteMatch[1]
        );
      }

      // 1v1 QUIZ BATTLE
      if (pathname === '/api/quiz-battle/start' && req.method === 'POST') {
        return await quizBattleController.start(req, res);
      }

      if (pathname === '/api/quiz-battle/submit' && req.method === 'POST') {
        return await quizBattleController.submit(
          req, res, await parseBody(req)
        );
      }

      // DYNAMIC ADAPTIVE PRACTICE (6 QUESTIONS PER STAGE)
      const dynamicSessionMatch = pathname.match(/^\/api\/dynamic-practice\/session\/([^/]+)$/);
      if (dynamicSessionMatch && req.method === 'GET') {
        return await dynamicPracticeController.getSession(req, res, dynamicSessionMatch[1]);
      }

      if (pathname === '/api/dynamic-practice/submit' && req.method === 'POST') {
        return await dynamicPracticeController.submitRound(
          req, res, await parseBody(req)
        );
      }

      if (pathname === '/api/dynamic-practice/stats' && req.method === 'GET') {
        return await dynamicPracticeController.getStats(req, res);
      }

      // GAMIFICATION (STREAK, XP, LEADERBOARD, BADGES)
      if (pathname === '/api/gamification/profile' && req.method === 'GET') {
        return gamificationController.getProfile(req, res);
      }

      if (pathname === '/api/gamification/leaderboard' && req.method === 'GET') {
        return gamificationController.getLeaderboard(req, res);
      }

      if (pathname === '/api/gamification/claim-daily' && req.method === 'POST') {
        return gamificationController.claimDaily(req, res);
      }

      // SUBSCRIPTION STATUS
      if (pathname === '/api/subscription/user-status' && req.method === 'GET') {
        return subscriptionController.getUserStatus(req, res);
      }

      if (pathname === '/api/subscription/plans' && req.method === 'GET') {
        return subscriptionController.getPlans(req, res);
      }

      // SUPPORT CHAT (USER ENDPOINTS)
      if (pathname === '/api/support/conversation' && req.method === 'GET') {
        return await supportController.getConversation(req, res);
      }

      if (pathname === '/api/support/message' && req.method === 'POST') {
        return await supportController.sendMessage(req, res, await parseBody(req));
      }

      // ADMIN MANAGEMENT (STRICT bahtiermustafoev1974@gmail.com)
      if (pathname === '/api/admin/users' && req.method === 'GET') {
        return await adminController.getUsers(req, res);
      }

      const grantProMatch = pathname.match(/^\/api\/admin\/user\/([^/]+)\/grant-pro$/);
      if (grantProMatch && req.method === 'POST') {
        return await adminController.grantPro(req, res, grantProMatch[1], await parseBody(req));
      }

      const revokeProMatch = pathname.match(/^\/api\/admin\/user\/([^/]+)\/revoke-pro$/);
      if (revokeProMatch && req.method === 'POST') {
        return await adminController.revokePro(req, res, revokeProMatch[1]);
      }

      // MODERATION (BAN & MUTE)
      const banMatch = pathname.match(/^\/api\/admin\/moderation\/ban\/([^/]+)$/);
      if (banMatch && req.method === 'POST') {
        return await adminController.banUser(req, res, banMatch[1], await parseBody(req));
      }

      const unbanMatch = pathname.match(/^\/api\/admin\/moderation\/unban\/([^/]+)$/);
      if (unbanMatch && req.method === 'POST') {
        return await adminController.unbanUser(req, res, unbanMatch[1]);
      }

      const muteMatch = pathname.match(/^\/api\/admin\/moderation\/mute\/([^/]+)$/);
      if (muteMatch && req.method === 'POST') {
        return await adminController.muteUser(req, res, muteMatch[1], await parseBody(req));
      }

      const unmuteMatch = pathname.match(/^\/api\/admin\/moderation\/unmute\/([^/]+)$/);
      if (unmuteMatch && req.method === 'POST') {
        return await adminController.unmuteUser(req, res, unmuteMatch[1]);
      }

      if (pathname === '/api/admin/moderation/list' && req.method === 'GET') {
        return await adminController.getModerationList(req, res);
      }

      // BROADCAST ANNOUNCEMENT
      if (pathname === '/api/announcement' && req.method === 'GET') {
        return await adminController.getAnnouncement(req, res);
      }

      if (pathname === '/api/admin/announcement' && req.method === 'GET') {
        return await adminController.getAnnouncement(req, res);
      }

      if (pathname === '/api/admin/announcement' && req.method === 'POST') {
        return await adminController.saveAnnouncement(req, res, await parseBody(req));
      }

      // PROMOCODES
      if (pathname === '/api/admin/promocodes' && req.method === 'GET') {
        return await adminController.getPromocodes(req, res);
      }

      if (pathname === '/api/admin/promocodes' && req.method === 'POST') {
        return await adminController.createPromocode(req, res, await parseBody(req));
      }

      const deletePromoMatch = pathname.match(/^\/api\/admin\/promocodes\/([^/]+)$/);
      if (deletePromoMatch && req.method === 'DELETE') {
        return await adminController.deletePromocode(req, res, decodeURIComponent(deletePromoMatch[1]));
      }

      if (pathname === '/api/subscription/redeem-code' && req.method === 'POST') {
        return await adminController.redeemPromocode(req, res, await parseBody(req));
      }

      // CONTENT / CURRICULUM MANAGEMENT
      if (pathname === '/api/admin/curriculum/subjects' && req.method === 'GET') {
        return await adminController.getCurriculumSubjects(req, res);
      }

      if (pathname === '/api/admin/curriculum/topic' && req.method === 'POST') {
        return await adminController.addCurriculumTopic(req, res, await parseBody(req));
      }

      const topicActionMatch = pathname.match(/^\/api\/admin\/curriculum\/topic\/([^/]+)\/([^/]+)$/);
      if (topicActionMatch && req.method === 'PUT') {
        return await adminController.updateCurriculumTopic(req, res, topicActionMatch[1], topicActionMatch[2], await parseBody(req));
      }

      if (topicActionMatch && req.method === 'DELETE') {
        return await adminController.deleteCurriculumTopic(req, res, topicActionMatch[1], topicActionMatch[2]);
      }

      // AI HEALTH MONITOR
      if (pathname === '/api/admin/ai-health' && req.method === 'GET') {
        return await adminController.getAiHealth(req, res);
      }

      // MAINTENANCE MODE
      if (pathname === '/api/system/maintenance' && req.method === 'GET') {
        return await adminController.getMaintenance(req, res);
      }

      if (pathname === '/api/admin/system/maintenance' && req.method === 'POST') {
        return await adminController.setMaintenance(req, res, await parseBody(req));
      }

      // ANALYTICS & TOP LEADERBOARD
      if (pathname === '/api/admin/analytics/overview' && req.method === 'GET') {
        return await adminController.getAnalyticsOverview(req, res);
      }

      // DIRECT PERSONAL NOTIFICATIONS
      if (pathname === '/api/admin/notifications/send' && req.method === 'POST') {
        return await adminController.sendUserNotification(req, res, await parseBody(req));
      }

      if (pathname === '/api/notifications/my' && req.method === 'GET') {
        return await adminController.getUserNotifications(req, res);
      }

      const notifReadMatch = pathname.match(/^\/api\/notifications\/read\/([^/]+)$/);
      if (notifReadMatch && req.method === 'POST') {
        return await adminController.markNotificationRead(req, res, notifReadMatch[1]);
      }

      // AI ENGINE SETTINGS
      if (pathname === '/api/admin/system/ai-settings' && req.method === 'GET') {
        return await adminController.getAiSettings(req, res);
      }

      if (pathname === '/api/admin/system/ai-settings' && req.method === 'POST') {
        return await adminController.saveAiSettings(req, res, await parseBody(req));
      }

      // AI USAGE & RATE LIMITS
      if (pathname === '/api/admin/ai/usage' && req.method === 'GET') {
        return await adminController.getAiUsage(req, res);
      }

      if (pathname === '/api/admin/ai/limits' && req.method === 'POST') {
        return await adminController.saveAiLimits(req, res, await parseBody(req));
      }

      // PAYMENTS & OFFICIAL CARD (9860 1606 3566 3802)
      if (pathname === '/api/payments/config' && req.method === 'GET') {
        return await adminController.getPaymentConfig(req, res);
      }

      if (pathname === '/api/payments/submit' && req.method === 'POST') {
        return await adminController.submitUserPayment(req, res, await parseBody(req));
      }

      if (pathname === '/api/payments/my' && req.method === 'GET') {
        return await adminController.getUserRecentPayment(req, res);
      }

      if (pathname === '/api/admin/payments' && req.method === 'GET') {
        return await adminController.getPayments(req, res);
      }

      const approvePayMatch = pathname.match(/^\/api\/admin\/payments\/([^/]+)\/approve$/);
      if (approvePayMatch && req.method === 'POST') {
        return await adminController.approvePayment(req, res, approvePayMatch[1]);
      }

      const rejectPayMatch = pathname.match(/^\/api\/admin\/payments\/([^/]+)\/reject$/);
      if (rejectPayMatch && req.method === 'POST') {
        return await adminController.rejectPayment(req, res, rejectPayMatch[1], await parseBody(req));
      }

      // QUESTION BANK (TESTLAR & SAVOLLAR BANKI)
      if (pathname === '/api/admin/questions' && req.method === 'GET') {
        return await adminController.getQuestions(req, res);
      }

      if (pathname === '/api/admin/questions' && req.method === 'POST') {
        return await adminController.createQuestion(req, res, await parseBody(req));
      }

      const questionActionMatch = pathname.match(/^\/api\/admin\/questions\/([^/]+)$/);
      if (questionActionMatch && req.method === 'PUT') {
        return await adminController.updateQuestion(req, res, questionActionMatch[1], await parseBody(req));
      }

      if (questionActionMatch && req.method === 'DELETE') {
        return await adminController.deleteQuestion(req, res, questionActionMatch[1]);
      }

      if (pathname === '/api/admin/audit' && req.method === 'GET') {
        return await adminController.getAuditLogs(req, res);
      }

      if (pathname === '/api/admin/stats' && req.method === 'GET') {
        return await adminController.getDashboardStats(req, res);
      }

      if (pathname === '/api/admin/support/inbox' && req.method === 'GET') {
        return await supportController.getInbox(req, res);
      }

      const adminConvMatch = pathname.match(/^\/api\/admin\/support\/conversation\/([^/]+)$/);
      if (adminConvMatch && req.method === 'GET') {
        return await supportController.getAdminConversation(req, res, adminConvMatch[1]);
      }

      if (pathname === '/api/admin/support/reply' && req.method === 'POST') {
        return await supportController.sendAdminReply(req, res, await parseBody(req));
      }

      // TELEGRAM BOT & WEBAPP
      if (pathname === '/api/telegram/link' && req.method === 'POST') {
        const body = await parseBody(req);
        const result = telegramService.linkTelegramUser(body.userId, body.telegramData);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(result));
      }

      if (pathname === '/api/telegram/remind' && req.method === 'POST') {
        const body = await parseBody(req);
        const result = await telegramService.sendDailyStreakReminder(body.userId, body.streak);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(result));
      }

      // COMMUNITY & GIRLS GROUP
      if (pathname === '/api/community/profile' && req.method === 'GET') {
        return await communityController.getProfile(req, res);
      }

      if (pathname === '/api/community/profile' && ['PUT', 'POST'].includes(req.method)) {
        return await communityController.updateProfile(
          req, res, await parseBody(req)
        );
      }

      if (pathname === '/api/community/members' && req.method === 'GET') {
        return await communityController.getMembers(req, res);
      }

      const memberMatch = pathname.match(/^\/api\/community\/member\/([^/]+)$/);
      if (memberMatch && req.method === 'GET') {
        return await communityController.getMember(req, res, memberMatch[1]);
      }

      if (pathname === '/api/community/messages' && req.method === 'GET') {
        let since = null;
        try {
          const u = new URL(req.url, 'http://localhost');
          since = u.searchParams.get('since');
        } catch {}
        return await communityController.getMessages(req, res, since);
      }

      if (pathname === '/api/community/messages' && req.method === 'POST') {
        return await communityController.sendMessage(
          req, res, await parseBody(req)
        );
      }

      const deleteMsgMatch = pathname.match(/^\/api\/community\/messages?\/([^/]+)$/);
      if (deleteMsgMatch && req.method === 'DELETE') {
        return await communityController.deleteMessage(req, res, deleteMsgMatch[1]);
      }

      const deleteActionMatch = pathname.match(/^\/api\/community\/messages?\/([^/]+)\/delete$/);
      if (deleteActionMatch && req.method === 'POST') {
        return await communityController.deleteMessage(req, res, deleteActionMatch[1]);
      }

      if ((pathname === '/api/community/chat/clear' || pathname === '/api/community/messages/clear') && ['POST', 'DELETE'].includes(req.method)) {
        return await communityController.clearChat(req, res);
      }

      if (pathname === '/api/community/admin/verify' && req.method === 'POST') {
        return await communityController.verifyAdminKey(req, res, await parseBody(req));
      }

      // IMAGE UPLOADS
      if (pathname === '/api/upload/image' && req.method === 'POST') {
        return await uploadController.uploadImage(
          req, res, await parseBody(req)
        );
      }

      // CHAT
      if (pathname === '/api/chat' && req.method === 'POST') {
        return await chatController.handleChat(
          req, res, await parseBody(req)
        );
      }

      if (pathname === '/api/chat/history' && req.method === 'GET') {
        return await chatController.getHistory(req, res);
      }

      // TOOLS
      if (pathname === '/api/tools/execute' && req.method === 'POST') {
        return await toolsController.executeTool(
          req, res, await parseBody(req)
        );
      }

      // DATA
      if (pathname === '/api/data' && req.method === 'GET') {
        return await dataController.getAll(req, res);
      }

      if (pathname === '/api/subjects' && req.method === 'GET') {
        return await dataController.getSubjects(req, res);
      }

      if (pathname === '/api/tools' && req.method === 'GET') {
        return await dataController.getTools(req, res);
      }

      if (pathname === '/api/library' && req.method === 'GET') {
        return await dataController.getLibrary(req, res);
      }

      if (pathname === '/api/stats' && req.method === 'GET') {
        return await dataController.getStats(req, res);
      }

      // EILIST (IELTS) ACADEMY
      if (pathname === '/api/eilist/today' && req.method === 'GET') {
        return await eilistController.getToday(req, res);
      }

      if (pathname === '/api/eilist/complete-section' && req.method === 'POST') {
        return await eilistController.completeSection(
          req, res, await parseBody(req)
        );
      }

      if (pathname === '/api/eilist/submit-test' && req.method === 'POST') {
        return await eilistController.submitTest(
          req, res, await parseBody(req)
        );
      }

      // NOT FOUND
      res.writeHead(404);
      return res.end(JSON.stringify({
        success: false,
        message: `API yo'nalishi topilmadi: ${pathname}`
      }));

    } catch (error) {
      console.error('[API XATOSI]', error.message);

      if (res.headersSent) {
        if (!res.writableEnded) res.end();
        return;
      }

      const statusCode = Number.isInteger(error.statusCode)
        ? error.statusCode
        : 500;

      res.writeHead(statusCode);

      return res.end(JSON.stringify({
        success: false,
        message: statusCode < 500
          ? error.message
          : 'Serverda ichki xatolik yuz berdi.'
      }));
    }
  }
}

module.exports = new ApiRouter();
