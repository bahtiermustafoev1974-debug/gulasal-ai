// ========================================================
// GULASAL AI — SYSTEM SETTINGS SERVICE 2026
// Maintenance Mode, AI Engine & Rate Limiting System
// ========================================================

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'system_settings.json');

class SystemSettingsService {
  constructor() {
    this.ensureFile();
  }

  getTodayString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  ensureFile() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const initial = {
          maintenance: {
            enabled: false,
            message: "Saytda rejaviy yangilanish va texnik profilaktika ishlari olib borilmoqda. Tez orada qaytamiz!",
            estimatedEnd: "Tez orada",
            updatedAt: new Date().toISOString(),
            updatedBy: "admin"
          },
          aiSettings: {
            primaryProvider: "groq", // "groq" | "gemini"
            activeModel: "openai/gpt-oss-120b",
            temperature: 0.7,
            tutorStyle: "friendly", // "friendly" | "academic" | "socratic" | "custom"
            customPrompt: "",
            dailyFreeLimit: 20
          },
          usageStats: {
            dailyTotals: {}, // "2026-11-16": { requests: 140, tokens: 45000 }
            userCounts: {}   // "user_123:2026-11-16": 5
          }
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[SYSTEM SETTINGS INIT WARN]', e);
    }
  }

  loadData() {
    try {
      this.ensureFile();
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (!data.aiSettings) data.aiSettings = {};
      if (!data.aiSettings.dailyFreeLimit) data.aiSettings.dailyFreeLimit = 20;
      if (!data.usageStats) data.usageStats = { dailyTotals: {}, userCounts: {} };
      return data;
    } catch {
      return {
        maintenance: { enabled: false, message: "", estimatedEnd: "" },
        aiSettings: { primaryProvider: "groq", activeModel: "openai/gpt-oss-120b", temperature: 0.7, tutorStyle: "friendly", customPrompt: "", dailyFreeLimit: 20 },
        usageStats: { dailyTotals: {}, userCounts: {} }
      };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[SYSTEM SETTINGS SAVE ERROR]', e);
    }
  }

  // 1. MAINTENANCE MODE
  getMaintenance() {
    const data = this.loadData();
    return data.maintenance || { enabled: false, message: "", estimatedEnd: "" };
  }

  setMaintenance({ enabled, message, estimatedEnd }, adminEmail = 'admin') {
    const data = this.loadData();
    data.maintenance = {
      enabled: Boolean(enabled),
      message: String(message || '').trim() || "Saytda rejaviy yangilanish va texnik profilaktika ishlari olib borilmoqda.",
      estimatedEnd: String(estimatedEnd || '').trim() || "Tez orada",
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };
    this.saveData(data);
    return data.maintenance;
  }

  // 2. AI ENGINE SETTINGS
  getAiSettings() {
    const data = this.loadData();
    return data.aiSettings || {
      primaryProvider: "groq",
      activeModel: "openai/gpt-oss-120b",
      temperature: 0.7,
      tutorStyle: "friendly",
      customPrompt: "",
      dailyFreeLimit: 20
    };
  }

  setAiSettings(settings = {}, adminEmail = 'admin') {
    const data = this.loadData();
    const primaryProvider = ['groq', 'gemini'].includes(settings.primaryProvider) ? settings.primaryProvider : 'groq';
    let temp = parseFloat(settings.temperature);
    if (isNaN(temp) || temp < 0.1 || temp > 1.0) temp = 0.7;

    const tutorStyle = ['friendly', 'academic', 'socratic', 'custom'].includes(settings.tutorStyle)
      ? settings.tutorStyle
      : 'friendly';

    let limit = parseInt(settings.dailyFreeLimit, 10);
    if (isNaN(limit) || limit < 1) limit = 20;

    data.aiSettings = {
      primaryProvider,
      activeModel: String(settings.activeModel || (primaryProvider === 'gemini' ? 'gemini-1.5-flash' : 'openai/gpt-oss-120b')).trim(),
      temperature: temp,
      tutorStyle,
      customPrompt: String(settings.customPrompt || '').trim(),
      dailyFreeLimit: limit,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };

    this.saveData(data);
    return data.aiSettings;
  }

  // 3. RATE LIMITING & TOKEN MONITOR
  checkAndIncrementUsage(userId, isPro = false, estimatedTokens = 400) {
    const data = this.loadData();
    const today = this.getTodayString();
    const limit = data.aiSettings?.dailyFreeLimit || 20;

    if (!data.usageStats) data.usageStats = { dailyTotals: {}, userCounts: {} };
    if (!data.usageStats.dailyTotals) data.usageStats.dailyTotals = {};
    if (!data.usageStats.userCounts) data.usageStats.userCounts = {};

    const userKey = `${userId}:${today}`;
    const currentCount = data.usageStats.userCounts[userKey] || 0;

    if (isPro) {
      // PRO users have unlimited requests
      data.usageStats.userCounts[userKey] = currentCount + 1;
      this.recordDailyTotals(data, today, estimatedTokens);
      this.saveData(data);
      return { allowed: true, isPro: true, count: currentCount + 1, limit: 'unlimited', remaining: 'unlimited' };
    }

    // Free users
    if (currentCount >= limit) {
      return { allowed: false, isPro: false, count: currentCount, limit, remaining: 0 };
    }

    data.usageStats.userCounts[userKey] = currentCount + 1;
    this.recordDailyTotals(data, today, estimatedTokens);
    this.saveData(data);

    return { allowed: true, isPro: false, count: currentCount + 1, limit, remaining: Math.max(0, limit - (currentCount + 1)) };
  }

  recordDailyTotals(data, today, estimatedTokens) {
    if (!data.usageStats.dailyTotals[today]) {
      data.usageStats.dailyTotals[today] = { requests: 0, estimatedTokens: 0 };
    }
    data.usageStats.dailyTotals[today].requests += 1;
    data.usageStats.dailyTotals[today].estimatedTokens += (estimatedTokens || 400);

    // Keep only last 30 days
    const days = Object.keys(data.usageStats.dailyTotals);
    if (days.length > 30) {
      days.sort().slice(0, days.length - 30).forEach(d => delete data.usageStats.dailyTotals[d]);
    }
  }

  getAiUsageStats() {
    const data = this.loadData();
    const today = this.getTodayString();
    const todayTotals = data.usageStats?.dailyTotals?.[today] || { requests: 0, estimatedTokens: 0 };
    const allTotals = data.usageStats?.dailyTotals || {};

    // Count today's active users
    let activeUsersToday = 0;
    const userCounts = data.usageStats?.userCounts || {};
    Object.keys(userCounts).forEach(k => {
      if (k.endsWith(`:${today}`)) activeUsersToday++;
    });

    return {
      today,
      todayRequests: todayTotals.requests,
      todayTokens: todayTotals.estimatedTokens,
      activeUsersToday,
      dailyFreeLimit: data.aiSettings?.dailyFreeLimit || 20,
      activeModel: data.aiSettings?.activeModel || "openai/gpt-oss-120b",
      primaryProvider: data.aiSettings?.primaryProvider || "groq",
      history: allTotals
    };
  }
}

module.exports = new SystemSettingsService();
