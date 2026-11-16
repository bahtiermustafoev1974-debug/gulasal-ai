
/* ==========================================
   GULASAL AI — PREMIUM CHAT 2026
   Chat • Multi-Image PRO • Speech-to-Text • History
========================================== */

import { openProRequiredModal, openSubscriptionModal } from '../utils/subscriptionModal.js?v=20261114_pro2';

let activeChatId = null;
let chatHistory = [];
let isSending = false;
let renderController = null;

/* ==========================================
   API REQUEST
========================================== */

async function apiRequest(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;

    throw new Error(
      'Serverga ulanib bo‘lmadi. node server.js ishlayotganini tekshiring.'
    );
  }

  const raw = await response.text();

  let data = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `Server JSON qaytarmadi (HTTP ${response.status}).`
    );
  }

  if (!response.ok || data.success === false) {
    if (response.status === 401) {
      throw new Error('Sessiya tugagan. Qayta tizimga kiring.');
    }

    const err = new Error(
      data.message || `Server xatosi: HTTP ${response.status}`
    );
    err.code = data.code;
    err.status = response.status;
    err.requiresPro = data.requiresPro;
    throw err;
  }

  return data;
}

/* ==========================================
   SEND MESSAGE API
========================================== */

export async function sendChatMessage(
  message,
  chatId = null,
  signal,
  imagesPayload = null
) {
  const images = Array.isArray(imagesPayload)
    ? imagesPayload
    : (imagesPayload ? [imagesPayload] : []);

  return apiRequest('/api/chat', {
    method: 'POST',
    signal,
    body: JSON.stringify({
      message,
      ...(chatId ? { chatId } : {}),
      ...(images.length === 1 ? { image: images[0], images } : {}),
      ...(images.length > 1 ? { images } : {})
    })
  });
}

/* ==========================================
   HTML ESCAPE
========================================== */

function escapeHTML(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

/* ==========================================
   MARKDOWN FORMATTER
   Safe basic Markdown support
========================================== */

function formatText(value) {
  let text = escapeHTML(value);
  const codeBlocks = [];

  // Code blocks
  text = text.replace(
    /```([a-zA-Z0-9_-]*)\s*\n?([\s\S]*?)```/g,
    (_, language, code) => {
      const index = codeBlocks.length;

      const lang = escapeHTML(language || 'code');

      codeBlocks.push(`
        <pre class="ga-code-block">
          <div class="ga-code-header">
            <span>${lang}</span>
            <button
              type="button"
              class="ga-copy-code"
              data-code-index="${index}"
            >Nusxalash</button>
          </div>
          <code>${code.trim()}</code>
        </pre>
      `);

      return `@@CODE_BLOCK_${index}@@`;
    }
  );

  // Inline code
  text = text.replace(
    /`([^`\n]+)`/g,
    '<code>$1</code>'
  );

  // Bold
  text = text.replace(
    /\*\*(.+?)\*\*/g,
    '<strong>$1</strong>'
  );

  // Italic
  text = text.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    '<em>$1</em>'
  );

  // Unordered lists
  text = text.replace(
    /(^|\n)((?:[-*]\s+.+(?:\n|$))+)/g,
    (_, prefix, list) => {
      const items = list
        .trim()
        .split('\n')
        .map(line => {
          const content = line.replace(/^[-*]\s+/, '');
          return `<li>${content}</li>`;
        })
        .join('');

      return `${prefix}<ul>${items}</ul>`;
    }
  );

  // Numbered lists
  text = text.replace(
    /(^|\n)((?:\d+\.\s+.+(?:\n|$))+)/g,
    (_, prefix, list) => {
      const items = list
        .trim()
        .split('\n')
        .map(line => {
          const content = line.replace(/^\d+\.\s+/, '');
          return `<li>${content}</li>`;
        })
        .join('');

      return `${prefix}<ol>${items}</ol>`;
    }
  );

  // Line breaks
  text = text.replace(/\n/g, '<br>');

  // Restore code blocks
  text = text.replace(
    /@@CODE_BLOCK_(\d+)@@/g,
    (_, index) => codeBlocks[Number(index)] || ''
  );

  return text;
}

/* ==========================================
   MAIN CHAT RENDER
========================================== */

export function renderChat(
  containerId = 'view-container',
  initialPrompt = ''
) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error('Chat uchun konteyner topilmadi:', containerId);
    return;
  }

  // Oldingi renderning so‘rovlarini bekor qilish.
  if (renderController) {
    renderController.abort();
  }

  renderController = new AbortController();

  const { signal } = renderController;

  activeChatId = null;
  chatHistory = [];
  isSending = false;

  container.innerHTML = `
    <section class="ga-app">

      <!-- SIDEBAR -->

      <aside class="ga-sidebar" id="ga-sidebar">

        <div class="ga-side-top">

          <div class="ga-brand">
            <span class="ga-brand-icon">G</span>
            <span>Gulasal <b>AI</b></span>
          </div>

          <button
            class="ga-icon-btn ga-close-sidebar"
            id="ga-close-sidebar"
            type="button"
            aria-label="Yopish"
          >×</button>

        </div>

        <button
          class="ga-new-chat"
          id="ga-new-chat"
          type="button"
        >
          <span>＋</span>
          Yangi suhbat
        </button>

        <div class="ga-history-label">
          <span>SUHBATLAR TARIXI</span>
          <span id="ga-history-count">0</span>
        </div>

        <div
          class="ga-history-list"
          id="ga-history-list"
        >
          <div class="ga-history-empty">
            Tarix yuklanmoqda...
          </div>
        </div>

        <div class="ga-side-bottom">
          <div class="ga-side-note">
            <span class="ga-status-dot"></span>
            Gulasal AI faol
          </div>
        </div>

      </aside>

      <!-- MAIN -->

      <main class="ga-main">

        <header class="ga-topbar">

          <div class="ga-top-left">

            <button
              class="ga-icon-btn ga-menu-btn"
              id="ga-menu-btn"
              type="button"
              aria-label="Menyu"
            >☰</button>

            <div
              class="ga-current-title"
              id="ga-current-title"
            >
              Yangi suhbat
            </div>

          </div>

          <div class="ga-top-right">
            <span class="ga-model-label">
              <i></i> AI Assistant
            </span>
          </div>

        </header>

        <!-- CONTENT -->

        <div class="ga-content">

          <div class="ga-messages" id="ga-messages">

            <div class="ga-welcome" id="ga-welcome">

              <div class="ga-welcome-symbol">G</div>

              <h1>Salom, xush kelibsiz.</h1>

              <p>
                Bugun qaysi fan yoki mavzuni o‘rganamiz?
              </p>

              <div class="ga-suggestions">

                <button
                  type="button"
                  data-prompt="Menga bugungi kun uchun reja tuzib ber."
                >
                  <span>◷</span>
                  <b>Kunlik reja</b>
                  <small>Vaqtimni samarali boshqarish</small>
                </button>

                <button
                  type="button"
                  data-prompt="Menga yangi bilimlarni o‘rganishda yordam ber."
                >
                  <span>◇</span>
                  <b>Yangi bilim</b>
                  <small>O‘rganish va rivojlanish</small>
                </button>

                <button
                  type="button"
                  data-prompt="Maqsadlarimga erishish uchun yordam ber."
                >
                  <span>↗</span>
                  <b>Maqsadlar</b>
                  <small>Keyingi qadamlarim</small>
                </button>

              </div>

            </div>

          </div>

          <!-- COMPOSER -->

          <div class="ga-composer-wrap">

            <!-- MULTI-IMAGE PREVIEW BAR (PRO CAPABLE) -->
            <div class="ga-image-preview-bar" id="ga-image-preview-bar" style="display: none; padding: 8px 12px; background: #14151a; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(255, 255, 255, 0.08); align-items: center; justify-content: space-between; gap: 8px;">
              <div id="ga-preview-thumbnails" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex: 1;"></div>
              <button type="button" id="ga-preview-cancel" class="ga-preview-cancel" title="Barcha rasmlarni bekor qilish" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); color: #fca5a5; border-radius: 6px; padding: 5px 10px; font-size: 11.5px; font-weight: 600; cursor: pointer; white-space: nowrap;">✕ Tozalash</button>
            </div>

            <div class="ga-composer">

              <input
                type="file"
                id="ga-image-input"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style="display: none;"
                aria-label="Rasm yuklash"
              >

              <button
                id="ga-attach-btn"
                class="ga-attach-btn"
                type="button"
                title="Rasm biriktirish (JPG, PNG, WEBP)"
                aria-label="Rasm biriktirish"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>

              <textarea
                id="ga-input"
                rows="1"
                maxlength="10000"
                placeholder="Gulasal AI ga xabar yozing yoki rasm biriktiring..."
                aria-label="Xabar matni"
              ></textarea>

              <button
                id="ga-send"
                class="ga-send-btn"
                type="button"
                title="Yuborish"
                aria-label="Yuborish"
              >↑</button>

            </div>

            <p class="ga-disclaimer">
              Gulasal AI xato qilishi mumkin.
              Muhim ma’lumotlarni tekshiring.
            </p>

          </div>

        </div>

      </main>

    </section>
  `;

  /* ==========================================
     ELEMENT REFERENCES
  ========================================== */

  const $ = selector => container.querySelector(selector);

  const messages = $('#ga-messages');
  const input = $('#ga-input');
  const send = $('#ga-send');
  const historyList = $('#ga-history-list');
  const sidebar = $('#ga-sidebar');

  const imageInput = $('#ga-image-input');
  const attachBtn = $('#ga-attach-btn');
  const previewBar = $('#ga-image-preview-bar');
  const previewThumbnails = $('#ga-preview-thumbnails');
  const previewCancel = $('#ga-preview-cancel');

  let pendingImages = [];

  function clearPendingImages() {
    pendingImages = [];
    if (imageInput) imageInput.value = '';
    renderThumbnails();
  }

  function renderThumbnails() {
    if (!previewBar || !previewThumbnails) return;
    if (pendingImages.length === 0) {
      previewBar.style.display = 'none';
      previewThumbnails.innerHTML = '';
      return;
    }

    previewBar.style.display = 'flex';
    previewThumbnails.innerHTML = pendingImages.map((img, idx) => `
      <div style="position: relative; display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 4px 8px;">
        <img src="${img.dataUrl}" alt="Rasm" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;">
        <span style="font-size: 11px; color: #fff; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(img.name)}</span>
        <button type="button" data-remove-img="${idx}" style="background: none; border: none; color: #f87171; cursor: pointer; font-size: 14px; padding: 2px 4px;" title="O‘chirish">✕</button>
      </div>
    `).join('');

    previewThumbnails.querySelectorAll('[data-remove-img]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-remove-img'), 10);
        if (!isNaN(index)) {
          pendingImages.splice(index, 1);
          renderThumbnails();
        }
      });
    });
  }

  attachBtn?.addEventListener('click', () => {
    imageInput?.click();
  });

  previewCancel?.addEventListener('click', () => {
    clearPendingImages();
  });

  imageInput?.addEventListener('change', async () => {
    const files = Array.from(imageInput.files || []);
    if (!files.length) return;

    // Check user PRO status
    let isPro = Boolean(window._currentUserSubscription?.isVip);
    if (!isPro) {
      try {
        const checkRes = await fetch('/api/subscription/user-status');
        const checkData = await checkRes.json();
        isPro = Boolean(checkData?.subscription?.isVip);
        window._currentUserSubscription = checkData?.subscription;
      } catch {}
    }

    // FREE restriction: maximum 1 image per message
    if (!isPro && (pendingImages.length + files.length > 1)) {
      imageInput.value = '';
      openProRequiredModal();
      return;
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (const file of files) {
      const fileType = (file?.type || '').toLowerCase();
      if (!allowed.includes(fileType)) {
        alert(`${file?.name || 'Fayl'}: Faqat JPG, PNG yoki WEBP formatdagi rasmlar qabul qilinadi.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}: Rasm hajmi 5 MB dan oshmasligi kerak.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(',')[1] || '';
        pendingImages.push({
          file,
          dataUrl,
          base64,
          mimeType: file.type,
          name: file.name,
          sizeStr: (file.size / 1024).toFixed(0) + ' KB'
        });
        renderThumbnails();
      };
      reader.readAsDataURL(file);
    }
  });

  /* ==========================================
     UI HELPERS
  ========================================== */

  function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function closeMobileSidebar() {
    sidebar?.classList.remove('open');
  }

  function showWelcome() {
    messages.innerHTML = `
      <div class="ga-welcome" id="ga-welcome">

        <div class="ga-welcome-symbol">G</div>

        <h1>Salom, xush kelibsiz.</h1>

        <p>
          Bugun qaysi fan yoki mavzuni o‘rganamiz?
        </p>

        <div class="ga-suggestions">

          <button
            type="button"
            data-prompt="Menga bugungi kun uchun reja tuzib ber."
          >
            <span>◷</span>
            <b>Kunlik reja</b>
            <small>Vaqtimni samarali boshqarish</small>
          </button>

          <button
            type="button"
            data-prompt="Menga yangi bilimlarni o‘rganishda yordam ber."
          >
            <span>◇</span>
            <b>Yangi bilim</b>
            <small>O‘rganish va rivojlanish</small>
          </button>

          <button
            type="button"
            data-prompt="Maqsadlarimga erishish uchun yordam ber."
          >
            <span>↗</span>
            <b>Maqsadlar</b>
            <small>Keyingi qadamlarim</small>
          </button>

        </div>

      </div>
    `;
  }

  /* ==========================================
     MESSAGE RENDER
  ========================================== */

  function appendMessage(role, content, imageUrls = null) {
    $('#ga-welcome')?.remove();

    const item = document.createElement('article');

    item.className = `ga-message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'ga-avatar';
    avatar.textContent = role === 'user' ? 'S' : 'AI';

    const body = document.createElement('div');
    body.className = 'ga-message-body';

    const imagesList = Array.isArray(imageUrls)
      ? imageUrls.filter(Boolean)
      : (imageUrls ? [imageUrls] : []);

    if (imagesList.length > 0) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'ga-msg-image-wrap';
      imgWrap.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;';
      imagesList.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Biriktirilgan rasm';
        img.className = 'ga-msg-image';
        img.style.cssText = 'max-width: 200px; max-height: 160px; border-radius: 10px; object-fit: cover; cursor: pointer; border: 1px solid rgba(255,255,255,0.15);';
        img.loading = 'lazy';
        img.addEventListener('click', () => {
          window.open(url, '_blank');
        });
        imgWrap.appendChild(img);
      });
      body.appendChild(imgWrap);
    }

    if (content) {
      const textWrap = document.createElement('div');
      textWrap.className = 'ga-msg-text';
      textWrap.innerHTML = formatText(content);
      body.appendChild(textWrap);

      // ACTION BAR (COPY) FOR AI BOT RESPONSES
      if (role === 'bot') {
        const actionsBar = document.createElement('div');
        actionsBar.className = 'ga-msg-actions-bar';

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'ga-msg-action-btn';
        copyBtn.title = 'Nusxa olish';
        copyBtn.innerHTML = `<span>📋</span><span>Nusxa olish</span>`;
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(content);
            copyBtn.innerHTML = `<span>✓</span><span>Nusxalandi!</span>`;
            setTimeout(() => {
              copyBtn.innerHTML = `<span>📋</span><span>Nusxa olish</span>`;
            }, 2000);
          } catch {}
        });

        actionsBar.append(copyBtn);
        body.appendChild(actionsBar);
      }
    }

    item.append(avatar, body);
    messages.appendChild(item);

    scrollBottom();
  }

  function appendUpgradeCard(title, messageText) {
    $('#ga-welcome')?.remove();

    const item = document.createElement('article');
    item.className = 'ga-message bot ga-upgrade-message';

    const avatar = document.createElement('div');
    avatar.className = 'ga-avatar';
    avatar.style.background = 'linear-gradient(135deg, #a855f7, #6366f1)';
    avatar.style.color = '#fff';
    avatar.textContent = '⭐';

    const body = document.createElement('div');
    body.className = 'ga-message-body';
    body.style.cssText = 'width: 100%; max-width: 520px;';

    const card = document.createElement('div');
    card.style.cssText = `
      background: #14151a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 16px 18px;
      color: #f4f4f5;
    `;

    card.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;">
        <div style="width: 36px; height: 36px; border-radius: 8px; background: #181920; border: 1px solid rgba(255, 255, 255, 0.1); color: #6366f1; display: grid; place-items: center; font-size: 16px; flex-shrink: 0;">
          ⚡
        </div>
        <div>
          <h4 style="margin: 0 0 4px; font-size: 14.5px; font-weight: 700; color: #f4f4f5;">
            ${escapeHTML(title || 'Kunlik Bepul Limit Tugadi')}
          </h4>
          <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
            ${escapeHTML(messageText || 'Bugungi bepul so‘rovlar limitingiz tugadi (20/20 ta). Cheksiz foydalanish uchun hisobingizni Upgrade qiling!')}
          </p>
        </div>
      </div>

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button type="button" class="chat-btn-upgrade" style="padding: 8px 16px; border-radius: 6px; background: #6366f1; border: none; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25); transition: opacity 0.15s ease;">
          <span>⭐</span>
          <span>Upgrade to PRO</span>
        </button>

        <button type="button" class="chat-btn-contact-admin" style="padding: 8px 14px; border-radius: 6px; background: #181920; border: 1px solid rgba(255, 255, 255, 0.1); color: #f4f4f5; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
          <span>💬</span>
          <span>Administratorga murojaat qilish</span>
        </button>
      </div>
    `;

    card.querySelector('.chat-btn-upgrade')?.addEventListener('click', () => {
      openSubscriptionModal();
    });

    card.querySelector('.chat-btn-contact-admin')?.addEventListener('click', () => {
      if (typeof window.openSupportModal === 'function') {
        window.openSupportModal(null, 'Assalomu alaykum! Men kunlik savol limitim tugagani sababli PRO obuna olish bo‘yicha murojaat qilmoqdaman.');
      } else {
        openSubscriptionModal();
      }
    });

    body.appendChild(card);
    item.append(avatar, body);
    messages.appendChild(item);
    scrollBottom();
  }

  /* ==========================================
     TYPING INDICATOR
  ========================================== */

  function showTyping() {
    removeTyping();

    const item = document.createElement('article');

    item.className = 'ga-message bot';
    item.id = 'ga-typing';

    item.innerHTML = `
      <div class="ga-avatar">AI</div>

      <div class="ga-typing">
        <i></i>
        <i></i>
        <i></i>
      </div>
    `;

    messages.appendChild(item);

    scrollBottom();
  }

  function removeTyping() {
    $('#ga-typing')?.remove();
  }

  /* ==========================================
     COPY CODE
  ========================================== */

  messages.addEventListener('click', async event => {
    const button = event.target.closest('.ga-copy-code');

    if (!button) return;

    const code = button
      .closest('.ga-code-block')
      ?.querySelector('code')
      ?.textContent;

    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);

      button.textContent = 'Nusxalandi!';

      setTimeout(() => {
        button.textContent = 'Nusxalash';
      }, 1800);

    } catch {
      button.textContent = 'Nusxalash ishlamadi';
    }
  }, { signal });

  /* ==========================================
     CHAT MESSAGE NORMALIZER
  ========================================== */

  function getChatMessages(chat) {
    if (Array.isArray(chat.messages)) {
      return chat.messages;
    }

    if (Array.isArray(chat.history)) {
      return chat.history;
    }

    const result = [];

    if (chat.user) {
      result.push({
        role: 'user',
        content: chat.user
      });
    }

    if (chat.reply) {
      result.push({
        role: 'assistant',
        content: chat.reply
      });
    }

    return result;
  }

  /* ==========================================
     HISTORY RENDER
  ========================================== */

  function renderHistory() {
    $('#ga-history-count').textContent = chatHistory.length;

    historyList.replaceChildren();

    if (!chatHistory.length) {
      const empty = document.createElement('div');

      empty.className = 'ga-history-empty';
      empty.textContent = 'Hozircha suhbatlar yo‘q';

      historyList.appendChild(empty);

      return;
    }

    chatHistory.forEach(chat => {
      const row = document.createElement('div');

      row.className =
        'ga-history-row' +
        (
          String(chat.id) === String(activeChatId)
            ? ' active'
            : ''
        );

      const open = document.createElement('button');

      open.type = 'button';
      open.className = 'ga-history-open';

      open.textContent = chat.title || 'Yangi suhbat';
      open.title = chat.title || 'Yangi suhbat';

      open.addEventListener('click', () => {
        openChat(chat.id);
      }, { signal });

      row.appendChild(open);
      historyList.appendChild(row);
    });
  }

  /* ==========================================
     LOAD HISTORY
  ========================================== */

  async function loadHistory() {
    try {
      const data = await apiRequest(
        '/api/chat/history',
        { signal }
      );

      const history =
        data.history ||
        data.data?.history ||
        [];

      chatHistory = Array.isArray(history)
        ? history
        : [];

      renderHistory();

    } catch (error) {
      if (error.name === 'AbortError') return;

      historyList.replaceChildren();

      const message = document.createElement('div');

      message.className = 'ga-history-empty';
      message.textContent = error.message;

      historyList.appendChild(message);

      console.error('[GULASAL HISTORY]', error);
    }
  }

  /* ==========================================
     OPEN EXISTING CHAT
  ========================================== */

  function openChat(id) {
    if (isSending) {
      return;
    }

    const chat = chatHistory.find(
      item => String(item.id) === String(id)
    );

    if (!chat) return;

    activeChatId = id;

    messages.replaceChildren();

    const chatMessages = getChatMessages(chat);

    if (!chatMessages.length) {
      const empty = document.createElement('div');

      empty.className = 'ga-history-empty';
      empty.textContent = 'Bu suhbatda xabarlar mavjud emas.';

      messages.appendChild(empty);
    }

    chatMessages.forEach(item => {
      const role =
        item.role === 'user' || item.user
          ? 'user'
          : 'bot';

      const content =
        item.content ??
        item.text ??
        item.user ??
        item.reply ??
        '';

      const imgUrls = item.images || (item.imageUrl ? [item.imageUrl] : (item.image ? [item.image] : null));

      if (content || imgUrls) {
        appendMessage(role, content, imgUrls);
      }
    });

    $('#ga-current-title').textContent =
      chat.title || 'Suhbat';

    renderHistory();
    closeMobileSidebar();
  }

  /* ==========================================
     NEW CHAT
  ========================================== */

  function newChat() {
    if (isSending) return;

    activeChatId = null;

    showWelcome();

    $('#ga-current-title').textContent = 'Yangi suhbat';

    renderHistory();

    closeMobileSidebar();

    input.value = '';
    input.style.height = 'auto';
    input.focus();
  }

  /* ==========================================
     SEND MESSAGE
  ========================================== */

  async function handleSend(customText) {
    const message = String(
      customText ?? input.value
    ).trim();

    if ((!message && pendingImages.length === 0) || isSending) return;

    if (message.length > 10000) {
      appendMessage('bot', 'Xabar juda uzun. Iltimos, qisqartiring.');
      return;
    }

    const imagesToSend = [...pendingImages];
    clearPendingImages();

    isSending = true;

    input.value = '';
    input.style.height = 'auto';

    send.disabled = true;
    send.textContent = '…';

    const uploadedUrls = [];
    const imagePayloads = [];

    for (const item of imagesToSend) {
      try {
        const uploadRes = await fetch('/api/upload/image', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: item.dataUrl,
            mimeType: item.mimeType
          })
        });

        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.success && uploadData.url) {
          uploadedUrls.push(uploadData.url);
          imagePayloads.push({
            url: uploadData.url,
            base64: item.base64,
            mimeType: item.mimeType
          });
        } else {
          uploadedUrls.push(item.dataUrl);
          imagePayloads.push({
            url: null,
            base64: item.base64,
            mimeType: item.mimeType
          });
        }
      } catch (uploadErr) {
        uploadedUrls.push(item.dataUrl);
        imagePayloads.push({
          url: null,
          base64: item.base64,
          mimeType: item.mimeType
        });
      }
    }

    appendMessage('user', message || 'Ushbu rasm(lar) bo‘yicha tahlil bering.', uploadedUrls);
    showTyping();

    try {
      const data = await sendChatMessage(
        message || 'Ushbu rasmlarni batafsil tahlil qiling va izoh bering.',
        activeChatId,
        signal,
        imagePayloads
      );

      if (signal.aborted) return;

      removeTyping();

      if (!activeChatId && data.chatId) {
        activeChatId = data.chatId;
      }

      const reply =
        data.reply ||
        data.response ||
        'Javob mavjud emas.';

      appendMessage('bot', reply);

      await loadHistory();

      if (signal.aborted) return;

      const current = chatHistory.find(
        chat => String(chat.id) === String(activeChatId)
      );

      if (current) {
        $('#ga-current-title').textContent =
          current.title || 'Suhbat';
      }

      renderHistory();

    } catch (error) {
      if (signal.aborted) return;

      removeTyping();

      if (error.code === 'DAILY_LIMIT_EXCEEDED' || error.message?.includes('bepul so‘rovlar limitingiz tugadi') || error.message?.includes('limit')) {
        appendUpgradeCard(
          'Kunlik Bepul Limit Tugadi (20/20)',
          error.message || 'Bugungi bepul savollar limitingiz tugadi. Cheksiz foydalanish uchun Upgrade qiling yoki administratorga murojaat qiling.'
        );
      } else if (error.code === 'PRO_REQUIRED' || error.requiresPro || error.message?.includes('PRO')) {
        appendUpgradeCard(
          'PRO Obuna Talab Qilinadi',
          error.message || 'Ko‘proq rasm yuklash va barcha premium imkoniyatlardan foydalanish uchun hisobingizni Upgrade qiling!'
        );
      } else {
        appendMessage(
          'bot',
          `Xatolik: ${error.message}`
        );
      }

      console.error('[GULASAL CHAT ERROR]', error);

    } finally {
      if (!signal.aborted) {
        isSending = false;

        send.disabled = false;
        send.textContent = '↑';

        input.focus();
      }
    }
  }

  /* ==========================================
     SEND BUTTON
  ========================================== */

  send.addEventListener('click', () => {
    handleSend();
  }, { signal });

  /* ==========================================
     KEYBOARD
  ========================================== */

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, { signal });

  /* ==========================================
     AUTO RESIZE
  ========================================== */

  input.addEventListener('input', () => {
    input.style.height = 'auto';

    input.style.height =
      `${Math.min(input.scrollHeight, 160)}px`;
  }, { signal });

  /* ==========================================
     SUGGESTIONS
  ========================================== */

  container.addEventListener('click', event => {
    const button = event.target.closest('[data-prompt]');

    if (!button) return;

    handleSend(button.dataset.prompt);
  }, { signal });

  /* ==========================================
     SIDEBAR CONTROLS
  ========================================== */

  $('#ga-new-chat').addEventListener('click', newChat, { signal });

  $('#ga-menu-btn').addEventListener('click', () => {
    sidebar.classList.toggle('open');
  }, { signal });

  $('#ga-close-sidebar').addEventListener(
    'click',
    closeMobileSidebar,
    { signal }
  );

  /* ==========================================
     INITIALIZE
  ========================================== */

  loadHistory();

  if (initialPrompt) {
    handleSend(initialPrompt);
  }
}
