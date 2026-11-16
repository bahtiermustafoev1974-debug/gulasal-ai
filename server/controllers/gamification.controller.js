const authController = require('./auth.controller');
const gamificationService = require('../services/gamification.service');

class GamificationController {
  getProfile(req, res) {
    try {
      const user = authController.getAuthenticatedUser(req);
      const userId = user?.id || req.headers['x-user-id'] || 'guest_demo_user';
      const userName = user?.name || (req.headers['x-user-id'] ? 'Talaba' : 'Mehmon O‘quvchi');
      const profile = gamificationService.getProfile(userId, userName);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, profile }));
    } catch (error) {
      console.error('[GAMIFICATION GET PROFILE ERROR]', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: error.message }));
    }
  }

  getLeaderboard(req, res) {
    try {
      const user = authController.getAuthenticatedUser(req);
      const currentUserId = user?.id || req.headers['x-user-id'] || 'guest_demo_user';
      const leaderboard = gamificationService.getLeaderboard(currentUserId);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, leaderboard }));
    } catch (error) {
      console.error('[GAMIFICATION LEADERBOARD ERROR]', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: error.message }));
    }
  }

  claimDaily(req, res) {
    try {
      const user = authController.getAuthenticatedUser(req);
      const userId = user?.id || req.headers['x-user-id'] || 'guest_demo_user';
      const userName = user?.name || 'Mehmon O‘quvchi';
      const result = gamificationService.recordActivity(userId, 'daily_claim', { userName });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, ...result }));
    } catch (error) {
      console.error('[GAMIFICATION CLAIM ERROR]', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, message: error.message }));
    }
  }
}

module.exports = new GamificationController();
