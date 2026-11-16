// ========================================================
// GULASAL AI — PRO SUBSCRIPTION SERVICE 2026
// Admin Manual Grant • Duration Control • Strict Validation
// ========================================================

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'subscriptions.json');
const AUDIT_PATH = path.join(__dirname, '..', 'database', 'admin_audit.json');

class SubscriptionService {
  constructor() {
    this.ensureDataFiles();
  }

  ensureDataFiles() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const initial = { subscriptions: {} };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      }
      if (!fs.existsSync(AUDIT_PATH)) {
        fs.writeFileSync(AUDIT_PATH, '[]', 'utf8');
      }
    } catch (e) {
      console.warn('[SUB DB INIT WARN]', e);
    }
  }

  loadData() {
    try {
      this.ensureDataFiles();
      const content = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(content);
    } catch {
      return { subscriptions: {} };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[SUB DB SAVE WARN]', e);
    }
  }

  logAudit(action, adminEmail, targetUserId, details = {}) {
    try {
      this.ensureDataFiles();
      let audit = [];
      try {
        audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'));
      } catch {
        audit = [];
      }
      audit.push({
        id: 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        action,
        adminEmail: adminEmail || 'admin',
        targetUserId,
        details,
        timestamp: new Date().toISOString()
      });
      // Keep last 1000 logs
      if (audit.length > 1000) audit = audit.slice(-1000);
      fs.writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2), 'utf8');
    } catch (e) {
      console.warn('[AUDIT LOG WARN]', e);
    }
  }

  getAuditLogs(limit = 100) {
    try {
      this.ensureDataFiles();
      const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'));
      return Array.isArray(audit) ? audit.slice(-limit).reverse() : [];
    } catch {
      return [];
    }
  }

  getUserSubscription(userId) {
    const data = this.loadData();
    const id = String(userId || '').trim() || 'guest_demo_user';
    const sub = data.subscriptions[id];

    if (!sub) {
      return {
        userId: id,
        planId: 'free',
        planName: 'Standart (Bepul)',
        isVip: false,
        status: 'active',
        validUntil: null,
        daysRemaining: null
      };
    }

    if (!sub.isVip) {
      return {
        ...sub,
        isVip: false,
        status: sub.status || 'free',
        daysRemaining: 0
      };
    }

    // Check expiration if validUntil is set (null means unlimited / Cheksiz)
    if (sub.validUntil) {
      const now = Date.now();
      const expiry = new Date(sub.validUntil).getTime();
      if (expiry <= now) {
        return {
          ...sub,
          isVip: false,
          status: 'expired',
          daysRemaining: 0
        };
      }
      const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
      return {
        ...sub,
        isVip: true,
        status: 'active',
        daysRemaining
      };
    }

    // Unlimited / Cheksiz
    return {
      ...sub,
      isVip: true,
      status: 'active',
      daysRemaining: 'unlimited'
    };
  }

  grantPro(userId, days = 30, adminUser = null, userEmail = '') {
    if (!userId) throw new Error('Foydalanuvchi ID ko‘rsatilmadi.');

    const data = this.loadData();
    const id = String(userId).trim();
    const adminEmail = adminUser?.email || 'bahtiermustafoev1974@gmail.com';

    let validUntil = null;
    let durationLabel = 'Cheksiz';
    let durationDays = null;

    if (days === 'unlimited' || days === 'cheksiz' || days === 0 || days === '0' || !days) {
      validUntil = null;
      durationLabel = 'Cheksiz (Muddatsiz)';
      durationDays = 'unlimited';
    } else {
      const numDays = parseInt(days, 10);
      if (isNaN(numDays) || numDays <= 0) {
        validUntil = null;
        durationLabel = 'Cheksiz';
        durationDays = 'unlimited';
      } else {
        durationDays = numDays;
        durationLabel = `${numDays} kun`;
        const d = new Date();
        d.setDate(d.getDate() + numDays);
        validUntil = d.toISOString();
      }
    }

    const sub = {
      userId: id,
      userEmail: userEmail || data.subscriptions[id]?.userEmail || '',
      planId: 'pro',
      planName: 'PRO Obuna',
      isVip: true,
      status: 'active',
      duration: durationDays,
      durationLabel,
      grantedAt: new Date().toISOString(),
      grantedBy: adminEmail,
      validUntil
    };

    data.subscriptions[id] = sub;
    this.saveData(data);

    // Audit
    this.logAudit('GRANT_PRO', adminEmail, id, {
      duration: durationDays,
      durationLabel,
      validUntil,
      userEmail
    });

    // Notify user via Support Chat automated system message
    try {
      const supportService = require('./support.service');
      supportService.addSystemNotification(
        id,
        `🎉 Tabriklaymiz! Administrator sizning hisobingizga PRO obunasini sovg‘a qildi! Muddat: ${durationLabel}. Endi siz AI Chatda bir vaqtda bir nechta rasm yuklash va barcha premium imkoniyatlardan to‘liq foydalana olasiz.`
      );
    } catch (e) {
      console.warn('[SUPPORT NOTIFY PRO WARN]', e.message);
    }

    return sub;
  }

  revokePro(userId, adminUser = null) {
    if (!userId) throw new Error('Foydalanuvchi ID ko‘rsatilmadi.');

    const data = this.loadData();
    const id = String(userId).trim();
    const adminEmail = adminUser?.email || 'bahtiermustafoev1974@gmail.com';

    if (!data.subscriptions[id]) {
      data.subscriptions[id] = {
        userId: id,
        planId: 'free',
        planName: 'Standart (Bepul)',
        isVip: false,
        status: 'revoked'
      };
    } else {
      data.subscriptions[id].isVip = false;
      data.subscriptions[id].status = 'revoked';
      data.subscriptions[id].revokedAt = new Date().toISOString();
      data.subscriptions[id].revokedBy = adminEmail;
    }

    this.saveData(data);

    this.logAudit('REVOKE_PRO', adminEmail, id, {
      revokedAt: new Date().toISOString()
    });

    try {
      const supportService = require('./support.service');
      supportService.addSystemNotification(
        id,
        `ℹ️ Administrator tomonidan PRO obunangiz to‘xtatildi. Savollar bo‘lsa, administratorga ushbu chat orqali murojaat qilishingiz mumkin.`
      );
    } catch (e) {
      console.warn('[SUPPORT NOTIFY REVOKE WARN]', e.message);
    }

    return data.subscriptions[id];
  }
}

module.exports = new SubscriptionService();
