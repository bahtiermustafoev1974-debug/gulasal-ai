// ========================================================
// GULASAL AI — TELEGRAM INTEGRATION SERVICE 2026
// Telegram WebApp • Daily Streak Reminders • Bot Webhook
// ========================================================

const fs = require('fs');
const path = require('path');

const TG_DB_PATH = path.join(__dirname, '..', 'database', 'telegram_users.json');

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.ensureDataFile();
  }

  ensureDataFile() {
    try {
      if (!fs.existsSync(TG_DB_PATH)) {
        fs.writeFileSync(TG_DB_PATH, JSON.stringify({ subscribers: [] }, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[TG DB INIT WARN]', e);
    }
  }

  loadData() {
    try {
      this.ensureDataFile();
      return JSON.parse(fs.readFileSync(TG_DB_PATH, 'utf8'));
    } catch {
      return { subscribers: [] };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(TG_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[TG DB SAVE WARN]', e);
    }
  }

  linkTelegramUser(userId, telegramData = {}) {
    const data = this.loadData();
    const existingIdx = data.subscribers.findIndex(s => s.userId === userId || s.tgId === telegramData.id);

    const record = {
      userId,
      tgId: telegramData.id,
      firstName: telegramData.first_name || '',
      username: telegramData.username || '',
      streakReminderEnabled: true,
      linkedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      data.subscribers[existingIdx] = { ...data.subscribers[existingIdx], ...record };
    } else {
      data.subscribers.push(record);
    }

    this.saveData(data);
    return { success: true, subscriber: record };
  }

  async sendNotification(chatId, message) {
    if (!this.botToken || !chatId) {
      console.log(`[TG NOTIFICATION SIMULATED to ${chatId}]: ${message}`);
      return { success: true, simulated: true };
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
      const data = await res.json();
      return { success: data.ok, data };
    } catch (err) {
      console.warn('[TG SEND NOTIFICATION ERROR]', err.message);
      return { success: false, error: err.message };
    }
  }

  async sendDailyStreakReminder(userId, streak = 1) {
    const data = this.loadData();
    const sub = data.subscribers.find(s => s.userId === userId && s.streakReminderEnabled);
    if (!sub || !sub.tgId) {
      return { success: false, message: 'Foydalanuvchi Telegram bilan ulanmagan' };
    }

    const text = `🔥 <b>Gulasal AI — Kunlik Eslatma!</b>\n\nSalom, ${sub.firstName || 'o‘quvchi'}!\nSizning uzluksiz o‘qish zanjiringiz: <b>${streak} kun</b>.\n\nBugungi 6 ta yangi mashq savollaringiz tayyor. Olovchangiz o‘chib qolmasligi uchun hoziroq kirib bajaring! 🚀\n\n👉 <a href="https://t.me/gulasal_ai_bot/app">Ilovani ochish</a>`;

    return await this.sendNotification(sub.tgId, text);
  }
}

module.exports = new TelegramService();
