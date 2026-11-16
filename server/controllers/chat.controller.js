
const crypto = require('crypto');
const aiEngine = require('../ai-engine/tutor');
const storageService = require('../services/storage.service');
const subscriptionService = require('../services/subscription.service');
const systemSettingsService = require('../services/systemSettings.service');
const authController = require('./auth.controller');

class ChatController {
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

  getUser(req) {
    return authController.getAuthenticatedUser(req);
  }

  getChats(userId) {
    const history = storageService.getUserChatHistory(userId);
    return Array.isArray(history) ? history : [];
  }

  async handleChat(req, res, body = {}) {
    try {
      const user = this.getUser(req);

      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false,
          message: 'Qayta hisobingizga kiring.'
        });
      }

      const message = body?.message;
      const rawImages = Array.isArray(body?.images)
        ? body.images
        : (body?.image ? [body.image] : []);
      const images = rawImages.filter(Boolean);

      if ((typeof message !== 'string' || !message.trim()) && images.length === 0) {
        return this.sendJSON(res, 400, {
          success: false,
          message: 'Xabar yoki kamida bitta rasm yuboring.'
        });
      }

      // Check PRO permission and Rate Limiting
      const sub = subscriptionService.getUserSubscription(user.id);
      const isPro = Boolean(sub?.isVip || user.isAdmin);

      if (images.length > 1 && !isPro) {
        return this.sendJSON(res, 403, {
          success: false,
          code: 'PRO_REQUIRED',
          requiresPro: true,
          message: 'Ko‘proq rasm yuklash uchun PRO obunasini faollashtiring!'
        });
      }

      // Check daily free questions limit
      const limitCheck = systemSettingsService.checkAndIncrementUsage(user.id, isPro, 500);
      if (!limitCheck.allowed) {
        return this.sendJSON(res, 429, {
          success: false,
          code: 'DAILY_LIMIT_EXCEEDED',
          requiresPro: true,
          message: `Bugungi bepul so‘rovlar limitingiz tugadi (${limitCheck.limit}/${limitCheck.limit} ta). Cheksiz foydalanish uchun PRO obunani faollashtiring yoki ertaga qaytib keling!`
        });
      }

      const cleanMessage = typeof message === 'string' && message.trim()
        ? message.trim()
        : 'Ushbu rasm(lar)ni tahlil qiling va izoh bering.';

      if (cleanMessage.length > 10000) {
        return this.sendJSON(res, 413, {
          success: false,
          message: 'Xabar 10 000 belgidan oshmasligi kerak.'
        });
      }

      const chats = this.getChats(user.id);

      const chatId = typeof body.chatId === 'string'
        ? body.chatId.trim()
        : null;

      let chat = null;

      if (chatId) {
        chat = chats.find(item => item.id === chatId);

        if (!chat) {
          return this.sendJSON(res, 404, {
            success: false,
            message: 'Suhbat topilmadi.'
          });
        }

        if (!Array.isArray(chat.messages)) {
          chat.messages = [];
        }
      } else {
        const timestamp = new Date().toISOString();

        chat = {
          id: crypto.randomUUID(),
          title: cleanMessage.slice(0, 50),
          messages: [],
          createdAt: timestamp,
          updatedAt: timestamp
        };

        chats.unshift(chat);
      }

      // Oxirgi suhbat xabarlarini AI ga yuborish
      const contextHistory = chat.messages
        .slice(-12)
        .filter(item =>
          item &&
          ['user', 'assistant'].includes(item.role) &&
          typeof item.content === 'string'
        )
        .map(item => ({
          role: item.role,
          content: item.content
        }));

      // AI javobini olish
      const reply = await aiEngine.processQuery(cleanMessage, {
        history: contextHistory,
        image: images[0] || null,
        images
      });

      if (typeof reply !== 'string' || !reply.trim()) {
        throw new Error('AI bo‘sh javob qaytardi.');
      }

      const timestamp = new Date().toISOString();

      // Normalize image URLs for history
      const savedImageUrls = images.map(img => {
        if (typeof img === 'string') {
          return img.startsWith('data:') ? null : img;
        }
        return img?.url || null;
      }).filter(Boolean);

      chat.messages.push(
        {
          role: 'user',
          content: cleanMessage,
          imageUrl: savedImageUrls[0] || null,
          images: savedImageUrls,
          timestamp
        },
        {
          role: 'assistant',
          content: reply.trim(),
          timestamp
        }
      );

      chat.updatedAt = timestamp;

      // Suhbatlar ro'yxatini yangilash
      chats.sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      if (!storageService.saveUserChatHistory(user.id, chats)) {
        throw new Error('Suhbatni saqlab bo‘lmadi.');
      }

      return this.sendJSON(res, 200, {
        success: true,
        chatId: chat.id,
        reply: reply.trim(),
        imageUrl: savedImageUrls[0] || null,
        images: savedImageUrls,
        timestamp
      });

    } catch (error) {
      console.error('[GULASAL CHAT ERROR]', error.message);

      return this.sendJSON(res, 500, {
        success: false,
        message: 'Gulasal AI javob bera olmadi. Qayta urinib ko‘ring.'
      });
    }
  }

  getHistory(req, res) {
    try {
      const user = this.getUser(req);

      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false,
          history: []
        });
      }

      const history = this.getChats(user.id).map(chat => ({
        id: chat.id,
        title: chat.title || 'Yangi suhbat',
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: Array.isArray(chat.messages)
          ? chat.messages
          : []
      }));

      return this.sendJSON(res, 200, {
        success: true,
        history
      });

    } catch (error) {
      console.error('[GULASAL HISTORY ERROR]', error.message);

      return this.sendJSON(res, 500, {
        success: false,
        history: [],
        message: 'Chat tarixini yuklashda xatolik yuz berdi.'
      });
    }
  }

  getOneChat(req, res, chatId) {
    try {
      const user = this.getUser(req);

      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false
        });
      }

      const chat = this.getChats(user.id)
        .find(item => item.id === chatId);

      if (!chat) {
        return this.sendJSON(res, 404, {
          success: false,
          message: 'Suhbat topilmadi.'
        });
      }

      return this.sendJSON(res, 200, {
        success: true,
        chat
      });

    } catch (error) {
      console.error('[GET CHAT ERROR]', error.message);

      return this.sendJSON(res, 500, {
        success: false,
        message: 'Suhbatni yuklashda xatolik yuz berdi.'
      });
    }
  }

  deleteChat(req, res, chatId) {
    try {
      const user = this.getUser(req);

      if (!user?.id) {
        return this.sendJSON(res, 401, {
          success: false
        });
      }

      const chats = this.getChats(user.id);
      const updated = chats.filter(item => item.id !== chatId);

      if (updated.length === chats.length) {
        return this.sendJSON(res, 404, {
          success: false,
          message: 'Suhbat topilmadi.'
        });
      }

      if (!storageService.saveUserChatHistory(user.id, updated)) {
        throw new Error('Suhbatni o‘chirish amalga oshmadi.');
      }

      return this.sendJSON(res, 200, {
        success: true,
        message: 'Suhbat o‘chirildi.'
      });

    } catch (error) {
      console.error('[DELETE CHAT ERROR]', error.message);

      return this.sendJSON(res, 500, {
        success: false,
        message: 'Suhbatni o‘chirishda xatolik yuz berdi.'
      });
    }
  }
}

module.exports = new ChatController();
