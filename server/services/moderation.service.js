// ========================================================
// GULASAL AI — MODERATION SERVICE 2026
// User Ban (Site Access) & Mute (Community Chat)
// ========================================================

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'moderation.json');

class ModerationService {
  constructor() {
    this.ensureFile();
  }

  ensureFile() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ bannedUsers: {}, mutedUsers: {} }, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[MODERATION INIT WARN]', e);
    }
  }

  loadData() {
    try {
      this.ensureFile();
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
      return { bannedUsers: {}, mutedUsers: {} };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[MODERATION SAVE ERROR]', e);
    }
  }

  isBanned(userId) {
    if (!userId) return false;
    const data = this.loadData();
    const ban = data.bannedUsers ? data.bannedUsers[userId] : null;
    if (!ban) return false;
    if (ban.expiresAt && new Date(ban.expiresAt).getTime() <= Date.now()) {
      delete data.bannedUsers[userId];
      this.saveData(data);
      return false;
    }
    return ban;
  }

  isMuted(userId) {
    if (!userId) return false;
    const data = this.loadData();
    const mute = data.mutedUsers ? data.mutedUsers[userId] : null;
    if (!mute) return false;
    if (mute.expiresAt && new Date(mute.expiresAt).getTime() <= Date.now()) {
      delete data.mutedUsers[userId];
      this.saveData(data);
      return false;
    }
    return mute;
  }

  banUser(userId, reason = 'Qoidalarni buzganlik', hours = null, adminEmail = 'admin') {
    const data = this.loadData();
    data.bannedUsers = data.bannedUsers || {};
    let expiresAt = null;
    if (hours && hours > 0) {
      expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    }
    data.bannedUsers[userId] = {
      userId,
      reason: reason || 'Qoidalarni buzganlik',
      bannedAt: new Date().toISOString(),
      expiresAt,
      bannedBy: adminEmail
    };
    this.saveData(data);
    return data.bannedUsers[userId];
  }

  unbanUser(userId) {
    const data = this.loadData();
    if (data.bannedUsers && data.bannedUsers[userId]) {
      delete data.bannedUsers[userId];
      this.saveData(data);
      return true;
    }
    return false;
  }

  muteUser(userId, reason = 'Chat qoidalarini buzganlik', hours = 24, adminEmail = 'admin') {
    const data = this.loadData();
    data.mutedUsers = data.mutedUsers || {};
    let expiresAt = null;
    if (hours && hours > 0) {
      expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    }
    data.mutedUsers[userId] = {
      userId,
      reason: reason || 'Guruh chat qoidalarini buzganlik',
      mutedAt: new Date().toISOString(),
      expiresAt,
      mutedBy: adminEmail
    };
    this.saveData(data);
    return data.mutedUsers[userId];
  }

  unmuteUser(userId) {
    const data = this.loadData();
    if (data.mutedUsers && data.mutedUsers[userId]) {
      delete data.mutedUsers[userId];
      this.saveData(data);
      return true;
    }
    return false;
  }

  getList() {
    const data = this.loadData();
    return {
      banned: Object.values(data.bannedUsers || {}),
      muted: Object.values(data.mutedUsers || {})
    };
  }
}

module.exports = new ModerationService();
