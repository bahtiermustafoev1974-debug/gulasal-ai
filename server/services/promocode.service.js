// ========================================================
// GULASAL AI — PROMOCODE SERVICE 2026
// Create Promo Codes • Redeem for PRO Duration
// ========================================================

const fs = require('fs');
const path = require('path');
const subscriptionService = require('./subscription.service');

const DB_PATH = path.join(__dirname, '..', 'database', 'promocodes.json');

class PromocodeService {
  constructor() {
    this.ensureFile();
  }

  ensureFile() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const initial = {
          promocodes: {
            "GULASAL2026": {
              code: "GULASAL2026",
              days: 30,
              maxUses: 100,
              usedCount: 0,
              usedUsers: [],
              active: true,
              createdAt: new Date().toISOString()
            }
          }
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[PROMOCODE INIT WARN]', e);
    }
  }

  loadData() {
    try {
      this.ensureFile();
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
      return { promocodes: {} };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[PROMOCODE SAVE ERROR]', e);
    }
  }

  getPromocodes() {
    const data = this.loadData();
    return Object.values(data.promocodes || {});
  }

  createPromocode(code, days = 30, maxUses = 10, adminEmail = 'admin') {
    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      throw new Error('Promokod kamida 3 ta belgidan iborat bo‘lishi kerak.');
    }
    const data = this.loadData();
    data.promocodes = data.promocodes || {};
    data.promocodes[cleanCode] = {
      code: cleanCode,
      days: parseInt(days, 10) || 30,
      maxUses: parseInt(maxUses, 10) || 10,
      usedCount: 0,
      usedUsers: [],
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: adminEmail
    };
    this.saveData(data);
    return data.promocodes[cleanCode];
  }

  deletePromocode(code) {
    const cleanCode = String(code || '').trim().toUpperCase();
    const data = this.loadData();
    if (data.promocodes && data.promocodes[cleanCode]) {
      delete data.promocodes[cleanCode];
      this.saveData(data);
      return true;
    }
    return false;
  }

  redeemPromocode(code, user) {
    if (!user || !user.id) {
      throw new Error('Promokoddan foydalanish uchun tizimga kirishingiz lozim.');
    }
    const cleanCode = String(code || '').trim().toUpperCase();
    const data = this.loadData();
    const promo = data.promocodes ? data.promocodes[cleanCode] : null;

    if (!promo || !promo.active) {
      throw new Error('Bunday promokod mavjud emas yoki muddati tugagan.');
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      throw new Error('Ushbu promokoddan foydalanish limiti tugagan.');
    }
    promo.usedUsers = promo.usedUsers || [];
    if (promo.usedUsers.includes(user.id)) {
      throw new Error('Siz ushbu promokoddan allaqachon foydalangansiz.');
    }

    // Grant PRO via subscriptionService
    const sub = subscriptionService.grantPro(user.id, promo.days, { email: 'promocode:' + cleanCode }, user.email);
    promo.usedCount = (promo.usedCount || 0) + 1;
    promo.usedUsers.push(user.id);
    this.saveData(data);

    return {
      success: true,
      message: `Tabriklaymiz! Sizga ${promo.days} kunlik PRO obunasi muvaffaqiyatli taqdim etildi!`,
      subscription: sub
    };
  }
}

module.exports = new PromocodeService();
