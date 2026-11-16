
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.join(__dirname, '..', 'database');
const COMMUNITY_FILE = path.join(DB_DIR, 'community.json');

function cleanText(value, maxLength = 2000) {
  return typeof value === 'string'
    ? value.trim().slice(0, maxLength)
    : '';
}

function sanitizeNickname(value) {
  if (typeof value !== 'string') return '';
  // Trim and remove any html tags or control characters
  return value.replace(/[<>'"/\\`]/g, '').trim().slice(0, 30);
}

class CommunityService {
  constructor() {
    this.ensureDatabase();
  }

  ensureDatabase() {
    fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(COMMUNITY_FILE)) {
      const initialData = {
        profiles: {},
        messages: []
      };
      fs.writeFileSync(
        COMMUNITY_FILE,
        JSON.stringify(initialData, null, 2),
        'utf8'
      );
    }
  }

  readDatabase() {
    this.ensureDatabase();
    try {
      const raw = fs.readFileSync(COMMUNITY_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') {
        return { profiles: {}, messages: [], directMessages: {} };
      }
      if (!data.profiles || typeof data.profiles !== 'object') data.profiles = {};
      if (!Array.isArray(data.messages)) data.messages = [];
      if (!data.directMessages || typeof data.directMessages !== 'object') data.directMessages = {};
      return data;
    } catch (error) {
      console.error('[COMMUNITY DB READ]', error.message);
      return { profiles: {}, messages: [], directMessages: {} };
    }
  }

  writeDatabase(data) {
    this.ensureDatabase();
    const tempFile = path.join(
      DB_DIR,
      `community-${process.pid}-${crypto.randomUUID()}.tmp`
    );
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, COMMUNITY_FILE);
      return true;
    } catch (error) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}
      console.error('[COMMUNITY DB WRITE]', error.message);
      return false;
    }
  }

  getProfile(userId, fallbackUser = {}) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Foydalanuvchi aniqlanmadi.');
    }

    const db = this.readDatabase();
    let profile = db.profiles[userId];

    if (!profile) {
      const defaultName = sanitizeNickname(fallbackUser.name) || 'Qizlar A’zosi';
      profile = {
        userId,
        nickname: defaultName,
        bio: 'Raqamli avlod qizlari ta’lim hamjamiyatining faol a’zosi.',
        interest: 'IT va Dasturlash',
        avatar: fallbackUser.picture || '',
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.profiles[userId] = profile;
      this.writeDatabase(db);
    }

    // Determine admin privilege: Faqat bahtiermustafoev1974@gmail.com uchun
    const email = String(fallbackUser?.email || (typeof currentUser !== 'undefined' ? currentUser?.email : '') || '').toLowerCase().trim();
    const isAdmin = Boolean(
      email === 'bahtiermustafoev1974@gmail.com' ||
      userId === 'google_115401282415026396030'
    );

    return {
      ...profile,
      isAdmin,
      role: isAdmin ? 'admin' : (profile.role || 'member')
    };
  }

  updateProfile(userId, updates = {}, currentUser = {}) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Foydalanuvchi aniqlanmadi.');
    }

    const db = this.readDatabase();
    const profile = this.getProfile(userId, currentUser);

    if (updates.nickname !== undefined) {
      const cleanedNickname = sanitizeNickname(updates.nickname);
      if (cleanedNickname.length < 2 || cleanedNickname.length > 30) {
        throw new Error('Taxallus (nikneym) 2 dan 30 tagacha belgidan iborat bo‘lishi kerak.');
      }
      profile.nickname = cleanedNickname;

      // Update past messages from this user to reflect their updated nickname
      for (const msg of db.messages) {
        if (msg.userId === userId) {
          msg.nickname = cleanedNickname;
        }
      }
    }

    if (updates.bio !== undefined) {
      profile.bio = cleanText(updates.bio, 300);
    }

    if (updates.interest !== undefined) {
      profile.interest = cleanText(updates.interest, 60);
    }

    if (updates.avatar !== undefined) {
      profile.avatar = cleanText(updates.avatar, 500);
      for (const msg of db.messages) {
        if (msg.userId === userId) {
          msg.avatar = profile.avatar;
        }
      }
    }

    profile.updatedAt = new Date().toISOString();
    db.profiles[userId] = profile;
    this.writeDatabase(db);

    // Determine admin privilege: Faqat bahtiermustafoev1974@gmail.com uchun
    const email = String(fallbackUser?.email || (typeof currentUser !== 'undefined' ? currentUser?.email : '') || '').toLowerCase().trim();
    const isAdmin = Boolean(
      email === 'bahtiermustafoev1974@gmail.com' ||
      userId === 'google_115401282415026396030'
    );

    return {
      ...profile,
      isAdmin,
      role: isAdmin ? 'admin' : (profile.role || 'member')
    };
  }

  getMembers() {
    const db = this.readDatabase();
    const profiles = db.profiles || {};
    const membersMap = new Map();

    // 1. Haqiqiy ro'yxatdan o'tgan foydalanuvchilarni bazadan olamiz (Guest lar kiritilmaydi)
    try {
      const usersFile = path.join(__dirname, '..', 'database', 'users.json');
      if (fs.existsSync(usersFile)) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        for (const u of users) {
          if (!u || !u.id || String(u.id).startsWith('guest_') || u.type === 'guest') continue;
          membersMap.set(u.id, {
            userId: u.id,
            nickname: u.name || 'Guruh A’zosi',
            bio: 'Raqamli avlod qizlari ta’lim hamjamiyatining a’zosi.',
            interest: 'IT & Ta’lim',
            avatar: u.picture || '',
            joinedAt: u.createdAt || new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn('[GET MEMBERS USERS WARN]', e.message);
    }

    // 2. Hamjamiyat profillaridagi haqiqiy foydalanuvchilarni birlashtiramiz
    for (const [uid, p] of Object.entries(profiles)) {
      if (!p || !uid || String(uid).startsWith('guest_') || p.isGuest === true) continue;
      const existing = membersMap.get(uid) || {};
      membersMap.set(uid, {
        userId: uid,
        nickname: p.nickname || existing.nickname || 'A’zo',
        bio: p.bio || existing.bio || '',
        interest: p.interest || existing.interest || '',
        avatar: p.avatar || existing.avatar || '',
        joinedAt: p.joinedAt || existing.joinedAt || p.updatedAt || new Date().toISOString()
      });
    }

    return Array.from(membersMap.values());
  }

  getMemberProfile(targetUserId) {
    if (!targetUserId || typeof targetUserId !== 'string') {
      throw new Error('A’zo ID noto‘g‘ri.');
    }
    const db = this.readDatabase();
    const p = db.profiles[targetUserId];
    if (!p) {
      throw new Error('A’zo profili topilmadi.');
    }
    return {
      userId: p.userId,
      nickname: p.nickname || 'A’zo',
      bio: p.bio || '',
      interest: p.interest || '',
      avatar: p.avatar || '',
      joinedAt: p.joinedAt || p.updatedAt
    };
  }

  getMessages(since = null) {
    const db = this.readDatabase();
    let list = db.messages;

    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        list = list.filter(m => new Date(m.timestamp) > sinceDate);
      }
    }

    return list.slice(-100);
  }

  addMessage(userId, userNickname, userAvatar, text, imageUrl = null) {
    const moderationService = require('./moderation.service');
    const mute = moderationService.isMuted(userId);
    if (mute) {
      throw new Error(`Sizning guruhda xabar yozish huquqingiz administrator tomonidan cheklangan (${mute.reason}).`);
    }

    const cleanMsg = cleanText(text, 2000);
    const cleanImg = cleanText(imageUrl, 500);

    if (!cleanMsg && !cleanImg) {
      throw new Error('Xabar matni yoki rasm kiritilishi kerak.');
    }

    const db = this.readDatabase();
    const newMsg = {
      id: crypto.randomUUID(),
      userId,
      nickname: sanitizeNickname(userNickname) || 'A’zo',
      avatar: cleanText(userAvatar, 500),
      text: cleanMsg,
      imageUrl: cleanImg || null,
      timestamp: new Date().toISOString()
    };

    db.messages.push(newMsg);

    // Keep last 500
    if (db.messages.length > 500) {
      db.messages = db.messages.slice(-500);
    }

    this.writeDatabase(db);
    return newMsg;
  }

  deleteMessage(messageId, userId, isAdmin = false) {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Xabar ID noto‘g‘ri ko‘rsatilgan.');
    }
    if (!userId || typeof userId !== 'string') {
      throw new Error('Foydalanuvchi aniqlanmadi.');
    }

    const db = this.readDatabase();
    const index = db.messages.findIndex(m => m.id === messageId);
    if (index === -1) {
      throw new Error('Xabar topilmadi yoki allaqachon o‘chirilgan.');
    }

    const msg = db.messages[index];
    if (msg.userId !== userId && !isAdmin) {
      throw new Error('Siz faqat o‘zingiz yuborgan xabarlarni o‘chira olasiz.');
    }

    // Permanently remove from database
    db.messages.splice(index, 1);
    this.writeDatabase(db);

    return {
      success: true,
      id: messageId,
      deletedAt: new Date().toISOString()
    };
  }

  clearAllMessages(userId, isAdmin = false) {
    if (!isAdmin) {
      throw new Error('Kechirasiz, guruh chat tarixini tozalash faqat sayt administratori uchun ruxsat etilgan.');
    }

    const db = this.readDatabase();
    const count = db.messages.length;
    db.messages = [];
    this.writeDatabase(db);

    return {
      success: true,
      clearedCount: count,
      clearedAt: new Date().toISOString()
    };
  }

  /* =========================================================
     DIRECT MESSAGING (LICHKA / SHAXSIY CHAT)
     Faqat rasmiy Google hisobi bilan kirganlar uchun
  ========================================================= */

  getConversationId(userId1, userId2) {
    return [String(userId1), String(userId2)].sort().join('__');
  }

  getDirectConversations(userId) {
    if (!userId || String(userId).startsWith('guest_')) {
      throw new Error('Lichkadan foydalanish uchun rasmiy Google hisobi talab qilinadi.');
    }

    const db = this.readDatabase();
    const dms = db.directMessages || {};
    const conversations = [];

    for (const [convId, msgList] of Object.entries(dms)) {
      if (!convId.includes(userId)) continue;
      const parts = convId.split('__');
      if (parts.length !== 2) continue;

      const otherUserId = parts[0] === userId ? parts[1] : parts[0];
      if (!otherUserId || typeof otherUserId !== 'string' || otherUserId.startsWith('guest_')) continue; // Strict Google account check

      const otherProfile = db.profiles[otherUserId] || {
        userId: otherUserId,
        nickname: 'Google Foydalanuvchisi',
        avatar: '',
        interest: ''
      };

      const lastMsg = msgList.length ? msgList[msgList.length - 1] : null;
      const unreadCount = msgList.filter(m => m.recipientId === userId && !m.read).length;

      conversations.push({
        conversationId: convId,
        user: {
          userId: otherUserId,
          nickname: otherProfile.nickname || 'Google Foydalanuvchisi',
          avatar: otherProfile.avatar || '',
          interest: otherProfile.interest || ''
        },
        lastMessage: lastMsg ? {
          text: lastMsg.text,
          imageUrl: lastMsg.imageUrl,
          timestamp: lastMsg.timestamp,
          senderId: lastMsg.senderId
        } : null,
        unreadCount,
        updatedAt: lastMsg ? lastMsg.timestamp : otherProfile.updatedAt || new Date().toISOString()
      });
    }

    // Sort by latest message
    return conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  getDirectMessages(userId1, userId2, since = null) {
    if (!userId1 || !userId2) {
      throw new Error('Foydalanuvchilar aniqlanmadi.');
    }
    if (String(userId1).startsWith('guest_') || String(userId2).startsWith('guest_')) {
      throw new Error('Shaxsiy xabarlar (lichka) faqat Google orqali kirgan a’zolar uchun ruxsat etiladi.');
    }

    const db = this.readDatabase();
    db.directMessages = db.directMessages || {};
    const convId = this.getConversationId(userId1, userId2);
    let list = db.directMessages[convId] || [];

    // Mark unread messages sent to userId1 as read
    let hadUnread = false;
    list.forEach(m => {
      if (m.recipientId === userId1 && !m.read) {
        m.read = true;
        hadUnread = true;
      }
    });

    if (hadUnread) {
      this.writeDatabase(db);
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        list = list.filter(m => new Date(m.timestamp) > sinceDate);
      }
    }

    return list.slice(-150);
  }

  sendDirectMessage(senderUser, recipientId, text, imageUrl = null) {
    if (!senderUser?.id || String(senderUser.id).startsWith('guest_')) {
      throw new Error('Lichkada yozish uchun Google hisobi bilan kirish shart.');
    }
    if (!recipientId || String(recipientId).startsWith('guest_')) {
      throw new Error('Shaxsiy xabarlar faqat Google orqali kirgan a’zoga yuborilishi mumkin.');
    }
    if (senderUser.id === recipientId) {
      throw new Error('O‘zingizga shaxsiy xabar yubora olmaysiz.');
    }

    const cleanMsg = cleanText(text, 2000);
    const cleanImg = cleanText(imageUrl, 500);

    if (!cleanMsg && !cleanImg) {
      throw new Error('Xabar matni yoki rasm kiritilishi kerak.');
    }

    const db = this.readDatabase();
    db.directMessages = db.directMessages || {};

    const convId = this.getConversationId(senderUser.id, recipientId);
    if (!Array.isArray(db.directMessages[convId])) {
      db.directMessages[convId] = [];
    }

    const senderProfile = db.profiles[senderUser.id] || {};
    const senderNickname = sanitizeNickname(senderProfile.nickname || senderUser.name) || 'A’zo';
    const senderAvatar = cleanText(senderProfile.avatar || senderUser.picture, 500);

    const newMsg = {
      id: crypto.randomUUID(),
      conversationId: convId,
      senderId: senderUser.id,
      recipientId: String(recipientId),
      nickname: senderNickname,
      avatar: senderAvatar,
      text: cleanMsg,
      imageUrl: cleanImg || null,
      timestamp: new Date().toISOString(),
      read: false
    };

    db.directMessages[convId].push(newMsg);

    // Keep last 300 messages per conversation
    if (db.directMessages[convId].length > 300) {
      db.directMessages[convId] = db.directMessages[convId].slice(-300);
    }

    this.writeDatabase(db);
    return newMsg;
  }

  deleteDirectMessage(messageId, userId, isAdmin = false) {
    if (!messageId || !userId) {
      throw new Error('Parametrlar noto‘g‘ri.');
    }

    const db = this.readDatabase();
    const dms = db.directMessages || {};

    for (const [convId, list] of Object.entries(dms)) {
      const idx = list.findIndex(m => m.id === messageId);
      if (idx !== -1) {
        const msg = list[idx];
        if (msg.senderId !== userId && !isAdmin) {
          throw new Error('Siz faqat o‘zingiz yuborgan xabarni o‘chira olasiz.');
        }
        list.splice(idx, 1);
        this.writeDatabase(db);
        return { success: true, id: messageId };
      }
    }

    throw new Error('Xabar topilmadi.');
  }
}

module.exports = new CommunityService();
