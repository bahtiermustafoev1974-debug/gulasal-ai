// ========================================================
// GULASAL AI — PAYMENT & AUTOMATED SUBSCRIPTION SERVICE 2026
// Official Card: 9860 1606 3566 3802 (Baxtiyor M.)
// Automated Checkout, Receipt Verification & 1-Click PRO Grant
// ========================================================

const fs = require('fs');
const path = require('path');
const subscriptionService = require('./subscription.service');

const DB_PATH = path.join(__dirname, '..', 'database', 'payments.json');

const OFFICIAL_CARD = {
  cardNumber: '9860 1606 3566 3802',
  cardHolder: 'BAXTIYOR M.',
  bankName: 'Humo / Uzcard',
  status: 'active'
};

const PLANS = {
  '1_month': {
    id: '1_month',
    name: '1 oylik PRO',
    price: '29 000 so‘m',
    amount: 29000,
    days: 30,
    badge: 'Ommabop'
  },
  '3_months': {
    id: '3_months',
    name: '3 oylik PRO (Tejamkor)',
    price: '69 000 so‘m',
    amount: 69000,
    days: 90,
    badge: '⭐ Eng Tejamkor'
  },
  'lifetime': {
    id: 'lifetime',
    name: 'Cheksiz PRO (Muddatsiz)',
    price: '149 000 so‘m',
    amount: 149000,
    days: 'unlimited',
    badge: '👑 Cheksiz'
  }
};

class PaymentService {
  constructor() {
    this.ensureFile();
  }

  ensureFile() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const initial = {
          payments: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[PAYMENT DB INIT WARN]', e);
    }
  }

  loadData() {
    try {
      this.ensureFile();
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(raw);
    } catch {
      return { payments: [] };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[PAYMENT DB SAVE ERROR]', e);
    }
  }

  getConfig() {
    return {
      card: OFFICIAL_CARD,
      plans: Object.values(PLANS)
    };
  }

  submitPayment({ userId, userEmail = '', userName = '', planId = '1_month', receiptImage = null, note = '', senderCard = '' }) {
    if (!userId) throw new Error('Foydalanuvchi ID ko‘rsatilmadi.');

    const plan = PLANS[planId] || PLANS['1_month'];
    const data = this.loadData();

    const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

    const payment = {
      id: paymentId,
      userId: String(userId).trim(),
      userEmail: String(userEmail || '').trim(),
      userName: String(userName || 'Foydalanuvchi').trim(),
      planId: plan.id,
      planName: plan.name,
      amount: plan.amount,
      priceLabel: plan.price,
      days: plan.days,
      receiptImage: receiptImage || null,
      note: String(note || '').trim(),
      senderCard: String(senderCard || '').trim(),
      targetCard: OFFICIAL_CARD.cardNumber,
      status: 'pending', // 'pending' | 'approved' | 'rejected'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.payments.unshift(payment);
    // Keep last 1000 payments
    if (data.payments.length > 1000) data.payments = data.payments.slice(0, 1000);
    this.saveData(data);

    // Notify user in support chat
    try {
      const supportService = require('./support.service');
      supportService.addSystemNotification(
        userId,
        `💳 To‘lov arizangiz qabul qilindi!\nTarif: ${plan.name} (${plan.price}).\nKarta: ${OFFICIAL_CARD.cardNumber} (${OFFICIAL_CARD.cardHolder}).\nAdministrator chekni tekshirgach (5-15 daqiqa), PRO obuna avtomatik faollashadi.`
      );
    } catch (e) {
      console.warn('[SUPPORT NOTIFY PAYMENT WARN]', e.message);
    }

    return payment;
  }

  getPayments(statusFilter = 'all') {
    const data = this.loadData();
    if (statusFilter === 'all') return data.payments;
    return data.payments.filter(p => p.status === statusFilter);
  }

  getPendingCount() {
    const data = this.loadData();
    return data.payments.filter(p => p.status === 'pending').length;
  }

  getUserRecentPayment(userId) {
    if (!userId) return null;
    const data = this.loadData();
    return data.payments.find(p => p.userId === userId && p.status === 'pending') || null;
  }

  approvePayment(paymentId, adminUser = null) {
    if (!paymentId) throw new Error('To‘lov ID topilmadi.');

    const data = this.loadData();
    const payment = data.payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('To‘lov topilmadi.');

    if (payment.status === 'approved') {
      return { success: true, message: 'Ushbu to‘lov allaqachon tasdiqlangan.', payment };
    }

    const adminEmail = adminUser?.email || 'bahtiermustafoev1974@gmail.com';
    payment.status = 'approved';
    payment.approvedAt = new Date().toISOString();
    payment.approvedBy = adminEmail;
    payment.updatedAt = new Date().toISOString();

    this.saveData(data);

    // 1-Click Automated PRO Activation
    const sub = subscriptionService.grantPro(payment.userId, payment.days, adminUser, payment.userEmail);

    // Notify user in support chat
    try {
      const supportService = require('./support.service');
      supportService.addSystemNotification(
        payment.userId,
        `✅ To‘lovingiz muvaffaqiyatli tasdiqlandi!\n🎉 Sizga ${payment.planName} faollashtirildi! Barcha premium AI imkoniyatlari to‘liq ochildi. Gulasal AI dan foydalanganingiz uchun tashakkur!`
      );
    } catch (e) {
      console.warn('[SUPPORT NOTIFY APPROVE WARN]', e.message);
    }

    return { success: true, payment, subscription: sub };
  }

  rejectPayment(paymentId, reason = 'Chek tasdiqlanmadi yoki summa mos kelmadi.', adminUser = null) {
    if (!paymentId) throw new Error('To‘lov ID topilmadi.');

    const data = this.loadData();
    const payment = data.payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('To‘lov topilmadi.');

    const adminEmail = adminUser?.email || 'bahtiermustafoev1974@gmail.com';
    payment.status = 'rejected';
    payment.rejectedAt = new Date().toISOString();
    payment.rejectedBy = adminEmail;
    payment.rejectedReason = String(reason).trim();
    payment.updatedAt = new Date().toISOString();

    this.saveData(data);

    // Notify user in support chat
    try {
      const supportService = require('./support.service');
      supportService.addSystemNotification(
        payment.userId,
        `❌ To‘lov rad etildi: ${reason}\nAgar xatolik yuz bergan deb hisoblasangiz, ushbu chat orqali chekni qayta yuborishingiz mumkin.`
      );
    } catch (e) {
      console.warn('[SUPPORT NOTIFY REJECT WARN]', e.message);
    }

    return { success: true, payment };
  }
}

module.exports = new PaymentService();
