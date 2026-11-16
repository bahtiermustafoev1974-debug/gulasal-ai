
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

const COOKIE_NAME = 'gulasal_session';

const DATABASE_DIR = path.join(__dirname, '..', 'database');
const USERS_FILE = path.join(DATABASE_DIR, 'users.json');

class AuthController {
  constructor() {
    this.writeQueue = Promise.resolve();
  }

  get sessionSecret() {
    return process.env.SESSION_SECRET || '';
  }

  get googleClientId() {
    return process.env.GOOGLE_CLIENT_ID || '';
  }

  sendJSON(res, status, data) {
    if (res.headersSent || res.destroyed || res.writableEnded) {
      return;
    }

    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });

    return res.end(JSON.stringify(data));
  }

  // OAUTH CONFIG
  getAuthConfig(req, res) {
    return this.sendJSON(res, 200, {
      success: true,
      googleClientId: this.googleClientId
    });
  }

  // DATABASE
  async readUsers() {
    await fs.mkdir(DATABASE_DIR, { recursive: true });

    try {
      const content = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(content);

      if (!Array.isArray(users)) {
        throw new Error('users.json formati noto‘g‘ri.');
      }

      return users;
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(USERS_FILE, '[]', 'utf8');
        return [];
      }

      throw error;
    }
  }

  async writeUsers(users) {
    await fs.mkdir(DATABASE_DIR, { recursive: true });

    const tempFile =
      `${USERS_FILE}.${crypto.randomUUID()}.tmp`;

    try {
      await fs.writeFile(
        tempFile,
        JSON.stringify(users, null, 2),
        'utf8'
      );

      await fs.rename(tempFile, USERS_FILE);
    } catch (error) {
      await fs.rm(tempFile, { force: true }).catch(() => {});
      throw error;
    }
  }

  // PASSWORD HASH
  async hashPassword(
    password,
    salt = crypto.randomBytes(16).toString('hex')
  ) {
    const hash = await scryptAsync(password, salt, 64);

    return {
      salt,
      hash: hash.toString('hex')
    };
  }

  async verifyPassword(password, salt, savedHash) {
    if (
      typeof salt !== 'string' ||
      typeof savedHash !== 'string'
    ) {
      return false;
    }

    const saved = Buffer.from(savedHash, 'hex');

    if (saved.length !== 64) {
      return false;
    }

    const hash = await scryptAsync(password, salt, 64);

    return crypto.timingSafeEqual(saved, hash);
  }

  isUserAdmin(user) {
    if (!user) return false;
    const email = String(user.email || '').trim().toLowerCase();
    // Qat'iy qoida: Faqat bahtiermustafoev1974@gmail.com uchun adminlik beriladi
    if (email === 'bahtiermustafoev1974@gmail.com') return true;

    const sub = String(user.id || user.sub || '');
    if (sub === 'google_115401282415026396030') {
      return true;
    }

    return false;
  }

  // COOKIE
  getCookie(req, name) {
    const cookies = req.headers.cookie || '';

    for (const item of cookies.split(';')) {
      const index = item.indexOf('=');

      if (index < 0) continue;

      const key = item.slice(0, index).trim();
      const value = item.slice(index + 1).trim();

      if (key === name) {
        try {
          return decodeURIComponent(value);
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  // SESSION TOKEN
  createToken(user) {
    if (!this.sessionSecret) {
      throw new Error('SESSION_SECRET sozlanmagan.');
    }

    const isAdmin = this.isUserAdmin(user);

    const payload = Buffer.from(JSON.stringify({
      sub: user.id,
      type: user.type,
      name: user.name || '',
      email: user.email || '',
      picture: user.picture || '',
      role: isAdmin ? 'admin' : (user.role || 'user'),
      isAdmin,
      exp: Math.floor(Date.now() / 1000) + 604800
    })).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.sessionSecret)
      .update(payload)
      .digest('base64url');

    return `${payload}.${signature}`;
  }

  // VERIFY TOKEN
  verifyToken(token) {
    try {
      if (!token || !this.sessionSecret) return null;

      const parts = token.split('.');

      if (parts.length !== 2) return null;

      const [payload, signature] = parts;

      const expected = crypto
        .createHmac('sha256', this.sessionSecret)
        .update(payload)
        .digest();

      const actual = Buffer.from(signature, 'base64url');

      if (
        actual.length !== expected.length ||
        !crypto.timingSafeEqual(actual, expected)
      ) {
        return null;
      }

      const user = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8')
      );

      if (
        !user.sub ||
        !user.exp ||
        user.exp <= Math.floor(Date.now() / 1000)
      ) {
        return null;
      }

      const isAdmin = this.isUserAdmin(user);

      return {
        id: user.sub,
        type: user.type,
        name: user.name || '',
        email: user.email || '',
        picture: user.picture || '',
        role: isAdmin ? 'admin' : (user.role || 'user'),
        isAdmin
      };
    } catch {
      return null;
    }
  }

  getAuthenticatedUser(req) {
    const token = this.getCookie(req, COOKIE_NAME);
    return this.verifyToken(token);
  }

  // SET COOKIE
  setSessionCookie(res, user) {
    const token = this.createToken(user);

    const secure = process.env.NODE_ENV === 'production'
      ? '; Secure'
      : '';

    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`
    );
  }

  // CLEAR COOKIE
  clearSessionCookie(res) {
    const secure = process.env.NODE_ENV === 'production'
      ? '; Secure'
      : '';

    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`
    );
  }

  // REGISTER
  async register(req, res, body = {}) {
    try {
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (name.length < 2 || name.length > 60) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Ism 2 dan 60 tagacha belgidan iborat bo‘lishi kerak.'
        });
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254
      ) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Email manzilini to‘g‘ri kiriting.'
        });
      }

      if (password.length < 8 || password.length > 128) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Parol 8 dan 128 tagacha belgidan iborat bo‘lishi kerak.'
        });
      }

      // Bir vaqtda hisob yaratishdagi yozish to‘qnashuvlarini kamaytirish
      const operation = this.writeQueue.then(async () => {
        const users = await this.readUsers();

        const existingUser = users.find(
          user => user.email === email
        );

        if (existingUser) {
          return { duplicate: true };
        }

        const passwordData = await this.hashPassword(password);

        const user = {
          id: `user_${crypto.randomUUID()}`,
          type: 'account',
          name,
          email,
          passwordHash: passwordData.hash,
          passwordSalt: passwordData.salt,
          picture: '',
          createdAt: new Date().toISOString()
        };

        users.push(user);
        await this.writeUsers(users);

        return { user };
      });

      this.writeQueue = operation.then(
        () => undefined,
        () => undefined
      );

      const result = await operation;

      if (result.duplicate) {
        return this.sendJSON(res, 409, {
          success: false,
          message: 'Bu email bilan hisob allaqachon mavjud.'
        });
      }

      const user = result.user;

      const sessionUser = {
        id: user.id,
        type: user.type,
        name: user.name,
        email: user.email,
        picture: user.picture
      };

      this.setSessionCookie(res, sessionUser);

      return this.sendJSON(res, 201, {
        success: true,
        message: 'Hisob muvaffaqiyatli yaratildi!',
        user: sessionUser
      });

    } catch (error) {
      console.error('[REGISTER ERROR]', error.message);

      return this.sendJSON(res, 500, {
        success: false,
        message: 'Hisob yaratishda xatolik yuz berdi.'
      });
    }
  }

  // EMAIL LOGIN
  async login(req, res, body = {}) {
    try {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!email || !password) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Email va parolni kiriting.'
        });
      }

      const users = await this.readUsers();

      const user = users.find(item => item.email === email);

      if (!user || !user.passwordHash || !user.passwordSalt) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Email yoki parol noto‘g‘ri.'
        });
      }

      const validPassword = await this.verifyPassword(
        password,
        user.passwordSalt,
        user.passwordHash
      );

      if (!validPassword) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Email yoki parol noto‘g‘ri.'
        });
      }

      const sessionUser = {
        id: user.id,
        type: user.type,
        name: user.name,
        email: user.email,
        picture: user.picture || ''
      };

      this.setSessionCookie(res, sessionUser);

      return this.sendJSON(res, 200, {
        success: true,
        message: 'Hisobga muvaffaqiyatli kirildi!',
        user: sessionUser
      });

    } catch (error) {
      console.error('[LOGIN ERROR]', error.message);

      return this.sendJSON(res, 500, {
        success: false,
        message: 'Hisobga kirishda xatolik yuz berdi.'
      });
    }
  }

  // GUEST LOGIN
  async createGuest(req, res) {
    try {
      const user = {
        id: `guest_${crypto.randomUUID()}`,
        type: 'guest',
        name: 'Mehmon',
        email: '',
        picture: '',
        role: 'guest',
        isAdmin: false
      };

      this.setSessionCookie(res, user);

      return this.sendJSON(res, 200, {
        success: true,
        user
      });

    } catch (error) {
      console.error('[GUEST AUTH ERROR]', error.message);

      return this.sendJSON(res, 500, {
        success: false,
        message: 'Mehmon rejimini yoqishda xatolik yuz berdi.'
      });
    }
  }

  // GOOGLE LOGIN
  async google(req, res, body = {}) {
    try {
      const token = body.credential || body.token || body.access_token;

      if (
        typeof token !== 'string' ||
        !token ||
        !this.googleClientId
      ) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Google autentifikatsiyasi sozlanmagan.'
        });
      }

      let profile = null;

      // Check if it's a JWT ID token (3 dot-separated parts) or an access token
      const isIdToken = token.split('.').length === 3;

      if (isIdToken) {
        const response = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.warn('[GOOGLE ID_TOKEN FAIL]', response.status, errText);
          return this.sendJSON(res, 401, {
            success: false,
            message: 'Google token tekshiruvidan o‘tmadi.'
          });
        }

        const data = await response.json();

        const matchedAud = data.aud === this.googleClientId || data.azp === this.googleClientId;

        if (
          !matchedAud ||
          ![
            'accounts.google.com',
            'https://accounts.google.com'
          ].includes(data.iss) ||
          Number(data.exp) <= Math.floor(Date.now() / 1000) ||
          String(data.email_verified) !== 'true' ||
          !data.sub
        ) {
          return this.sendJSON(res, 401, {
            success: false,
            message: 'Google hisobini tasdiqlab bo‘lmadi.'
          });
        }

        profile = {
          sub: data.sub,
          name: data.name || '',
          email: (data.email || '').toLowerCase(),
          picture: data.picture || ''
        };
      } else {
        // Access token flow (from google.accounts.oauth2.initTokenClient)
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`
        );

        if (!verifyRes.ok) {
          const errText = await verifyRes.text().catch(() => '');
          console.warn('[GOOGLE ACCESS_TOKEN FAIL]', verifyRes.status, errText);
          return this.sendJSON(res, 401, {
            success: false,
            message: 'Google access token tekshiruvidan o‘tmadi.'
          });
        }

        const tokenInfo = await verifyRes.json();
        const matchedAud = tokenInfo.aud === this.googleClientId || tokenInfo.azp === this.googleClientId;

        if (!matchedAud) {
          console.warn('[GOOGLE CLIENT_ID MISMATCH]', {
            tokenAud: tokenInfo.aud,
            tokenAzp: tokenInfo.azp,
            expected: this.googleClientId
          });
          return this.sendJSON(res, 401, {
            success: false,
            message: 'Google Client ID mos kelmadi.'
          });
        }

        // Fetch user profile from Google UserInfo endpoint
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!userinfoRes.ok) {
          return this.sendJSON(res, 401, {
            success: false,
            message: 'Google foydalanuvchi ma’lumotlarini olib bo‘lmadi.'
          });
        }

        const userInfo = await userinfoRes.json();

        profile = {
          sub: userInfo.sub || tokenInfo.sub,
          name: userInfo.name || '',
          email: (userInfo.email || tokenInfo.email || '').toLowerCase(),
          picture: userInfo.picture || ''
        };
      }

      if (!profile || !profile.sub) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Google hisob ma’lumotlari topilmadi.'
        });
      }

      const tempUser = {
        id: `google_${profile.sub}`,
        email: profile.email
      };
      const isAdmin = this.isUserAdmin(tempUser);

      const user = {
        id: `google_${profile.sub}`,
        type: 'google',
        name: profile.name || '',
        email: profile.email,
        picture: profile.picture,
        role: isAdmin ? 'admin' : 'user',
        isAdmin
      };

      this.setSessionCookie(res, user);

      // Save or update Google user in users.json
      try {
        const users = await this.readUsers();
        const existingIdx = users.findIndex(u => u.id === user.id || (u.email && u.email.toLowerCase() === user.email.toLowerCase()));
        const now = new Date().toISOString();
        if (existingIdx >= 0) {
          users[existingIdx].id = user.id;
          users[existingIdx].name = user.name || users[existingIdx].name;
          users[existingIdx].picture = user.picture || users[existingIdx].picture;
          users[existingIdx].lastActiveAt = now;
          users[existingIdx].type = 'google';
          if (isAdmin) users[existingIdx].isAdmin = true;
        } else {
          users.push({
            id: user.id,
            type: 'google',
            name: user.name,
            email: user.email,
            picture: user.picture,
            isAdmin,
            createdAt: now,
            lastActiveAt: now
          });
        }
        await this.writeUsers(users);
      } catch (saveErr) {
        console.warn('[SAVE GOOGLE USER WARN]', saveErr.message);
      }

      console.log(`[GOOGLE AUTH SUCCESS] User: ${user.name} (${user.email}) ID: ${user.id} Admin: ${isAdmin}`);

      return this.sendJSON(res, 200, {
        success: true,
        user
      });

    } catch (error) {
      console.error('[GOOGLE AUTH ERROR]', error.message);

      return this.sendJSON(res, 500, {
        success: false,
        message: 'Google orqali kirishda xatolik yuz berdi: ' + error.message
      });
    }
  }

  // SESSION CHECK
  getSession(req, res) {
    const user = this.getAuthenticatedUser(req);
    if (user) {
      const moderationService = require('../services/moderation.service');
      const ban = moderationService.isBanned(user.id);
      if (ban) {
        return this.sendJSON(res, 403, {
          success: false,
          banned: true,
          message: `Hisobingiz administrator tomonidan bloklangan: ${ban.reason}`
        });
      }
    }

    return this.sendJSON(res, 200, {
      success: true,
      authenticated: Boolean(user),
      user: user || null
    });
  }

  // LOGOUT
  logout(req, res) {
    this.clearSessionCookie(res);

    return this.sendJSON(res, 200, {
      success: true,
      message: 'Hisobdan chiqildi.'
    });
  }
}

module.exports = new AuthController();
