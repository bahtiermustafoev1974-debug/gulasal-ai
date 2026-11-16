// ========================================================
// GULASAL AI — AI HEALTH & METRICS MONITOR 2026
// Live Pings for Groq & Gemini APIs + Daily AI Counters
// ========================================================

const fs = require('fs');
const path = require('path');

const METRICS_FILE = path.join(__dirname, '..', 'database', 'ai_metrics.json');

class AiHealthService {
  constructor() {
    this.ensureFile();
  }

  ensureFile() {
    try {
      if (!fs.existsSync(METRICS_FILE)) {
        const initial = {
          date: new Date().toDateString(),
          dailyRequests: 24,
          totalErrors: 0,
          lastPing: null
        };
        fs.writeFileSync(METRICS_FILE, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[AI METRICS INIT WARN]', e);
    }
  }

  loadMetrics() {
    try {
      this.ensureFile();
      const data = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
      const today = new Date().toDateString();
      if (data.date !== today) {
        data.date = today;
        data.dailyRequests = 0;
        data.totalErrors = 0;
        this.saveMetrics(data);
      }
      return data;
    } catch {
      return { date: new Date().toDateString(), dailyRequests: 0, totalErrors: 0, lastPing: null };
    }
  }

  saveMetrics(data) {
    try {
      fs.writeFileSync(METRICS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[AI METRICS SAVE ERROR]', e);
    }
  }

  recordRequest(isError = false) {
    const metrics = this.loadMetrics();
    metrics.dailyRequests = (metrics.dailyRequests || 0) + 1;
    if (isError) metrics.totalErrors = (metrics.totalErrors || 0) + 1;
    this.saveMetrics(metrics);
  }

  async checkHealth() {
    const metrics = this.loadMetrics();

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const results = {
      groq: {
        provider: 'Groq Cloud',
        model: 'openai/gpt-oss-120b',
        status: 'unknown',
        pingMs: null,
        keyMasked: groqKey ? `${groqKey.slice(0, 7)}...${groqKey.slice(-4)}` : 'O‘rnatilmagan',
        error: null
      },
      gemini: {
        provider: 'Google Gemini',
        model: 'gemini-3.8-flash',
        status: 'unknown',
        pingMs: null,
        keyMasked: geminiKey ? `${geminiKey.slice(0, 7)}...${geminiKey.slice(-4)}` : 'O‘rnatilmagan',
        error: null
      },
      stats: {
        dailyRequests: metrics.dailyRequests || 0,
        totalErrors: metrics.totalErrors || 0,
        serverUptimeHours: (process.uptime() / 3600).toFixed(1),
        checkedAt: new Date().toISOString()
      }
    };

    // Test Groq API
    if (!groqKey) {
      results.groq.status = 'no_key';
      results.groq.error = 'GROQ_API_KEY topilmadi';
    } else {
      const t0 = Date.now();
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${groqKey}` },
          signal: ctrl.signal
        });
        clearTimeout(timeout);
        results.groq.pingMs = Date.now() - t0;
        if (res.ok) {
          results.groq.status = 'active';
        } else {
          results.groq.status = 'error';
          results.groq.error = `HTTP ${res.status}`;
        }
      } catch (err) {
        results.groq.status = 'offline';
        results.groq.error = err.name === 'AbortError' ? 'Timeout (6s)' : err.message;
      }
    }

    // Test Gemini API
    if (!geminiKey) {
      results.gemini.status = 'no_key';
      results.gemini.error = 'GEMINI_API_KEY topilmadi';
    } else {
      const t0 = Date.now();
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`, {
          signal: ctrl.signal
        });
        clearTimeout(timeout);
        results.gemini.pingMs = Date.now() - t0;
        if (res.ok) {
          results.gemini.status = 'active';
        } else {
          results.gemini.status = 'error';
          results.gemini.error = `HTTP ${res.status}`;
        }
      } catch (err) {
        results.gemini.status = 'offline';
        results.gemini.error = err.name === 'AbortError' ? 'Timeout (6s)' : err.message;
      }
    }

    metrics.lastPing = results;
    this.saveMetrics(metrics);
    return results;
  }
}

module.exports = new AiHealthService();
