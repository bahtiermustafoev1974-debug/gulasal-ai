// ========================================================
// GULASAL AI — NOTIFICATION SERVICE 2026
// Direct Personal Admin Notices & Celebration Messages
// ========================================================

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'notifications.json');

class NotificationService {
  constructor() {
    this.ensureFile();
  }

  ensureFile() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ notifications: {} }, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[NOTIFICATIONS INIT WARN]', e);
    }
  }

  loadData() {
    try {
      this.ensureFile();
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
      return { notifications: {} };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[NOTIFICATIONS SAVE ERROR]', e);
    }
  }

  sendNotification(userIdOrObj, dataArg = {}, adminEmailArg = 'admin') {
    let userId;
    let title;
    let message;
    let type;
    let adminEmail = adminEmailArg;

    if (typeof userIdOrObj === 'object' && userIdOrObj !== null) {
      userId = userIdOrObj.userId;
      title = userIdOrObj.title;
      message = userIdOrObj.message;
      type = userIdOrObj.type;
      if (typeof dataArg === 'string') adminEmail = dataArg;
    } else {
      userId = userIdOrObj;
      title = dataArg.title;
      message = dataArg.message;
      type = dataArg.type;
    }

    if (!userId) throw new Error('Foydalanuvchi ID ko‘rsatilmadi.');
    const cleanTitle = String(title || '').trim() || 'Administrator Xabari';
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) throw new Error('Xabar matni bo‘sh bo‘lishi mumkin emas.');

    const data = this.loadData();
    data.notifications = data.notifications || {};
    data.notifications[userId] = data.notifications[userId] || [];

    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: cleanTitle,
      message: cleanMessage,
      type: ['celebration', 'info', 'warning'].includes(type) ? type : 'info',
      sentAt: new Date().toISOString(),
      sentBy: adminEmail,
      read: false
    };

    data.notifications[userId].unshift(newNotif);
    // Keep max 20 notifications per user
    if (data.notifications[userId].length > 20) {
      data.notifications[userId] = data.notifications[userId].slice(0, 20);
    }

    this.saveData(data);
    return newNotif;
  }

  getUserNotifications(userId) {
    if (!userId) return [];
    const data = this.loadData();
    return data.notifications && data.notifications[userId] ? data.notifications[userId] : [];
  }

  getUnreadNotifications(userId) {
    return this.getUserNotifications(userId).filter(n => !n.read);
  }

  markAsRead(arg1, arg2) {
    if (!arg1 || !arg2) return false;
    let userId = arg1;
    let notifId = arg2;
    if (String(arg1).startsWith('notif_')) {
      notifId = arg1;
      userId = arg2;
    }
    const data = this.loadData();
    if (!data.notifications || !data.notifications[userId]) return false;

    const notif = data.notifications[userId].find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      this.saveData(data);
      return true;
    }
    return false;
  }

  deleteNotification(userId, notifId) {
    if (!userId || !notifId) return false;
    const data = this.loadData();
    if (!data.notifications || !data.notifications[userId]) return false;

    data.notifications[userId] = data.notifications[userId].filter(n => n.id !== notifId);
    this.saveData(data);
    return true;
  }
}

module.exports = new NotificationService();
