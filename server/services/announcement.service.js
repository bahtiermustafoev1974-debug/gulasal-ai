// ========================================================
// GULASAL AI — BROADCAST ANNOUNCEMENT SERVICE 2026
// Global Header Banner for All Users
// ========================================================

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'announcement.json');

class AnnouncementService {
  constructor() {
    this.ensureFile();
  }

  ensureFile() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const initial = {
          active: true,
          text: "🎉 Xush kelibsiz! Gulasal AI platformasi yangi funksiyalar bilan yangilandi.",
          type: "info", // "info" | "warning" | "success"
          updatedAt: new Date().toISOString(),
          updatedBy: "admin"
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[ANNOUNCEMENT INIT WARN]', e);
    }
  }

  getAnnouncement() {
    try {
      this.ensureFile();
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
      return {
        active: false,
        text: "",
        type: "info"
      };
    }
  }

  saveAnnouncement(data, adminEmail = 'admin') {
    try {
      this.ensureFile();
      const payload = {
        active: Boolean(data.active),
        text: String(data.text || '').trim(),
        type: ['info', 'warning', 'success'].includes(data.type) ? data.type : 'info',
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(payload, null, 2), 'utf8');
      return payload;
    } catch (e) {
      console.error('[ANNOUNCEMENT SAVE ERROR]', e);
      throw e;
    }
  }
}

module.exports = new AnnouncementService();
