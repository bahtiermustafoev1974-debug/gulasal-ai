// ========================================================
// GULASAL AI — SUPPORT CHAT SERVICE 2026
// User-to-Admin Messaging • Image Attachments • Telegram UI
// ========================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'database', 'support.json');

class SupportService {
  constructor() {
    this.ensureDataFiles();
  }

  ensureDataFiles() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const initial = { conversations: {} };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[SUPPORT DB INIT WARN]', e);
    }
  }

  loadData() {
    try {
      this.ensureDataFiles();
      const content = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(content);
    } catch {
      return { conversations: {} };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[SUPPORT DB SAVE WARN]', e);
    }
  }

  getConversation(userId, user = null, markRead = false) {
    if (!userId) return null;
    const data = this.loadData();
    const id = String(userId).trim();

    if (!data.conversations[id]) {
      data.conversations[id] = {
        userId: id,
        userName: user?.name || 'Foydalanuvchi',
        userEmail: user?.email || '',
        userAvatar: user?.picture || '',
        unreadByAdmin: 0,
        unreadByUser: 0,
        lastMessage: 'Suhbat ochildi',
        lastMessageAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_welcome_' + Date.now(),
            sender: 'admin',
            senderName: 'Gulasal AI Ma’muriyati',
            text: 'Assalomu alaykum! Administrator bilan bevosita bog‘lanish chatiga xush kelibsiz. Savollaringiz, takliflaringiz yoki PRO obunasi bo‘yicha murojaatingizni yozib qoldirishingiz mumkin. Rasm yoki screenshot ham biriktirishingiz mumkin.',
            images: [],
            createdAt: new Date().toISOString()
          }
        ]
      };
      this.saveData(data);
    } else if (user) {
      // Refresh metadata if provided
      if (user.name) data.conversations[id].userName = user.name;
      if (user.email) data.conversations[id].userEmail = user.email;
      if (user.picture) data.conversations[id].userAvatar = user.picture;
    }

    if (markRead) {
      data.conversations[id].unreadByUser = 0;
      this.saveData(data);
    }

    return data.conversations[id];
  }

  sendMessage(userId, user, text, images = []) {
    if (!userId) throw new Error('Foydalanuvchi ID talab qilinadi.');
    const id = String(userId).trim();
    const cleanText = String(text || '').trim();
    const cleanImages = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);

    if (!cleanText && cleanImages.length === 0) {
      throw new Error('Xabar matni yoki rasm kiriting.');
    }

    const data = this.loadData();
    if (!data.conversations[id]) {
      data.conversations[id] = {
        userId: id,
        userName: user?.name || 'Foydalanuvchi',
        userEmail: user?.email || '',
        userAvatar: user?.picture || '',
        unreadByAdmin: 0,
        unreadByUser: 0,
        messages: [],
        createdAt: new Date().toISOString()
      };
    }
    const conv = data.conversations[id];

    if (user?.name) conv.userName = user.name;
    if (user?.email) conv.userEmail = user.email;
    if (user?.picture) conv.userAvatar = user.picture;

    const msg = {
      id: 'msg_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      sender: 'user',
      senderName: conv.userName || 'Foydalanuvchi',
      text: cleanText,
      images: cleanImages,
      createdAt: new Date().toISOString()
    };

    conv.messages.push(msg);
    conv.unreadByAdmin = (conv.unreadByAdmin || 0) + 1;
    conv.lastMessage = cleanText || (cleanImages.length > 0 ? `📷 [${cleanImages.length} ta rasm]` : '');
    conv.lastMessageAt = msg.createdAt;

    this.saveData(data);
    return { success: true, message: msg, conversation: conv };
  }

  sendAdminReply(userId, adminUser, text, images = []) {
    if (!userId) throw new Error('Foydalanuvchi ID talab qilinadi.');
    const id = String(userId).trim();
    const cleanText = String(text || '').trim();
    const cleanImages = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);

    if (!cleanText && cleanImages.length === 0) {
      throw new Error('Javob matni yoki rasm kiriting.');
    }

    const data = this.loadData();
    if (!data.conversations[id]) {
      this.getConversation(id);
    }
    const conv = data.conversations[id];

    const msg = {
      id: 'msg_adm_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      sender: 'admin',
      senderName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || 'bahtiermustafoev1974@gmail.com',
      text: cleanText,
      images: cleanImages,
      createdAt: new Date().toISOString()
    };

    conv.messages.push(msg);
    conv.unreadByUser = (conv.unreadByUser || 0) + 1;
    conv.unreadByAdmin = 0; // Admin replied, clear unread
    conv.lastMessage = `Admin: ${cleanText || '📷 [Rasm]'}`;
    conv.lastMessageAt = msg.createdAt;

    this.saveData(data);
    return { success: true, message: msg, conversation: conv };
  }

  addSystemNotification(userId, text) {
    if (!userId || !text) return;
    const id = String(userId).trim();
    const data = this.loadData();
    if (!data.conversations[id]) {
      data.conversations[id] = {
        userId: id,
        userName: 'Foydalanuvchi',
        userEmail: '',
        userAvatar: '',
        unreadByAdmin: 0,
        unreadByUser: 0,
        messages: [],
        createdAt: new Date().toISOString()
      };
    }
    const conv = data.conversations[id];

    const msg = {
      id: 'msg_sys_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex'),
      sender: 'system',
      senderName: 'Gulasal AI Tizimi',
      text: String(text).trim(),
      images: [],
      createdAt: new Date().toISOString()
    };

    conv.messages.push(msg);
    conv.unreadByUser = (conv.unreadByUser || 0) + 1;
    conv.lastMessage = text.slice(0, 80);
    conv.lastMessageAt = msg.createdAt;

    this.saveData(data);
    return msg;
  }

  getInbox() {
    const data = this.loadData();
    const subscriptionService = require('./subscription.service');

    const list = Object.values(data.conversations || {}).map(conv => {
      const sub = subscriptionService.getUserSubscription(conv.userId);
      return {
        userId: conv.userId,
        userName: conv.userName,
        userEmail: conv.userEmail,
        userAvatar: conv.userAvatar,
        unreadByAdmin: conv.unreadByAdmin || 0,
        unreadByUser: conv.unreadByUser || 0,
        lastMessage: conv.lastMessage || '',
        lastMessageAt: conv.lastMessageAt || null,
        messageCount: Array.isArray(conv.messages) ? conv.messages.length : 0,
        isPro: Boolean(sub?.isVip),
        proPlanName: sub?.planName || 'Standart',
        proStatus: sub?.status || 'free',
        daysRemaining: sub?.daysRemaining
      };
    });

    // Sort by lastMessageAt descending
    list.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
    return list;
  }

  markAdminRead(userId) {
    if (!userId) return;
    const id = String(userId).trim();
    const data = this.loadData();
    if (data.conversations[id]) {
      data.conversations[id].unreadByAdmin = 0;
      this.saveData(data);
    }
  }
}

module.exports = new SupportService();
