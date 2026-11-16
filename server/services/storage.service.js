
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORAGE_DIR = path.join(__dirname, '..', '..', 'storage');
const USERS_DIR = path.join(STORAGE_DIR, 'users');
const LEGACY_CHATS_FILE = path.join(STORAGE_DIR, 'chats_history.json');

function createDefaultData() {
  return {
    profile: null,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function cleanString(value, maxLength = 500) {
  return typeof value === 'string'
    ? value.trim().slice(0, maxLength)
    : '';
}

class StorageService {
  constructor() {
    this.ensureStorage();
  }

  ensureStorage() {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }

  isValidId(id) {
    return typeof id === 'string' &&
      /^[a-zA-Z0-9_-]{1,128}$/.test(id);
  }

  getUserFile(userId) {
    if (!this.isValidId(userId)) {
      const error = new Error('Foydalanuvchi ID noto‘g‘ri.');
      error.statusCode = 400;
      throw error;
    }

    return path.join(USERS_DIR, `${userId}.json`);
  }

  normalizeUserData(data) {
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data)
    ) {
      throw new Error('Foydalanuvchi ma’lumotlari formati noto‘g‘ri.');
    }

    return {
      profile:
        data.profile &&
        typeof data.profile === 'object' &&
        !Array.isArray(data.profile)
          ? data.profile
          : null,

      history: Array.isArray(data.history)
        ? data.history.slice(-50)
        : [],

      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  getUserData(userId) {
    const file = this.getUserFile(userId);

    if (!fs.existsSync(file)) {
      return createDefaultData();
    }

    try {
      const raw = fs.readFileSync(file, 'utf8');
      const parsed = JSON.parse(raw);

      return this.normalizeUserData(parsed);
    } catch (error) {
      console.error('[STORAGE READ ERROR]', error.message);

      const storageError = new Error(
        'Foydalanuvchi ma’lumotlarini o‘qib bo‘lmadi.'
      );

      storageError.statusCode = 500;
      throw storageError;
    }
  }

  saveUserData(userId, inputData) {
    let tempFile = null;

    try {
      this.ensureStorage();

      const file = this.getUserFile(userId);
      const data = this.normalizeUserData(inputData);

      data.updatedAt = new Date().toISOString();

      tempFile = path.join(
        USERS_DIR,
        `${userId}-${process.pid}-${crypto.randomUUID()}.tmp`
      );

      fs.writeFileSync(
        tempFile,
        JSON.stringify(data, null, 2),
        { encoding: 'utf8', flag: 'wx' }
      );

      fs.renameSync(tempFile, file);

      return true;
    } catch (error) {
      console.error('[STORAGE SAVE ERROR]', error.message);

      if (tempFile) {
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch {}
      }

      return false;
    }
  }

  saveProfile(userId, profile = {}) {
    if (!profile || typeof profile !== 'object') {
      return false;
    }

    try {
      const data = this.getUserData(userId);

      data.profile = {
        id: userId,
        name: cleanString(profile.name, 100),
        email: cleanString(profile.email, 254),
        picture: cleanString(profile.picture, 2000),
        provider: ['guest', 'google'].includes(profile.provider)
          ? profile.provider
          : 'guest',
        updatedAt: new Date().toISOString()
      };

      return this.saveUserData(userId, data);
    } catch (error) {
      console.error('[PROFILE SAVE ERROR]', error.message);
      return false;
    }
  }

  getProfile(userId) {
    return this.getUserData(userId).profile;
  }

  saveUserChatHistory(userId, history) {
    if (!Array.isArray(history)) {
      return false;
    }

    try {
      const data = this.getUserData(userId);

      data.history = history.slice(-50);

      return this.saveUserData(userId, data);
    } catch (error) {
      console.error('[CHAT HISTORY SAVE ERROR]', error.message);
      return false;
    }
  }

  getUserChatHistory(userId) {
    return this.getUserData(userId).history;
  }

  // ESKI CONTROLLERLAR BILAN MOSLIK
  saveChatHistory(history) {
    let tempFile = null;

    try {
      if (!Array.isArray(history)) {
        return false;
      }

      this.ensureStorage();

      tempFile = path.join(
        STORAGE_DIR,
        `chats-${process.pid}-${crypto.randomUUID()}.tmp`
      );

      fs.writeFileSync(
        tempFile,
        JSON.stringify(history.slice(-50), null, 2),
        { encoding: 'utf8', flag: 'wx' }
      );

      fs.renameSync(tempFile, LEGACY_CHATS_FILE);

      return true;
    } catch (error) {
      console.error('[LEGACY STORAGE SAVE ERROR]', error.message);

      if (tempFile) {
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch {}
      }

      return false;
    }
  }

  getChatHistory() {
    try {
      if (!fs.existsSync(LEGACY_CHATS_FILE)) {
        return [];
      }

      const data = JSON.parse(
        fs.readFileSync(LEGACY_CHATS_FILE, 'utf8')
      );

      return Array.isArray(data) ? data.slice(-50) : [];
    } catch (error) {
      console.error('[LEGACY STORAGE READ ERROR]', error.message);
      return [];
    }
  }
}

module.exports = new StorageService();
