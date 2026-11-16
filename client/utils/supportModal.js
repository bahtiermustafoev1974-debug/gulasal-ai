// ========================================================
// GULASAL AI — TELEGRAM STYLE SUPPORT MODAL 2026
// User & Admin Real-Time Chat • Image Attachments
// ========================================================

let supportModalEl = null;
let pollTimer = null;
let pendingSupportImage = null;

export function openSupportModal(currentUser = null, prefilledText = '') {
  if (!supportModalEl) {
    createSupportModal();
  }

  supportModalEl.classList.add('active');
  document.body.style.overflow = 'hidden';

  const input = supportModalEl.querySelector('#support-input');
  if (input && prefilledText) {
    input.value = prefilledText;
  }

  loadSupportConversation(true);
  clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (supportModalEl && supportModalEl.classList.contains('active')) {
      loadSupportConversation(false);
    } else {
      clearInterval(pollTimer);
    }
  }, 3500);
}

export function closeSupportModal() {
  if (supportModalEl) {
    supportModalEl.classList.remove('active');
    document.body.style.overflow = '';
  }
  clearInterval(pollTimer);
}

function createSupportModal() {
  supportModalEl = document.createElement('div');
  supportModalEl.id = 'support-chat-modal';
  supportModalEl.className = 'premium-modal-backdrop';

  supportModalEl.innerHTML = `
    <div class="premium-modal-dialog" style="max-width: 620px; height: 85vh; max-height: 720px; display: flex; flex-direction: column; padding: 0; overflow: hidden; background: rgba(18, 14, 38, 0.98); border: 1px solid rgba(167, 139, 250, 0.35); box-shadow: 0 25px 60px rgba(0,0,0,0.85); border-radius: 24px;">
      
      <!-- HEADER (TELEGRAM STYLE) -->
      <div style="padding: 16px 20px; background: linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 12, 35, 0.95)); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #6366f1); display: grid; place-items: center; font-size: 22px; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);">
            👑
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="margin: 0; font-size: 16px; color: #fff; font-weight: 800;">Administrator bilan chat</h3>
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
            </div>
            <span style="font-size: 12px; color: #a5a4b8;">Gulasal AI Rasmiy Qo‘llab-quvvatlash Markazi</span>
          </div>
        </div>

        <button type="button" id="support-close-btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; font-size: 16px;">
          ✕
        </button>
      </div>

      <!-- QUICK ACTION CHIP -->
      <div style="padding: 8px 16px; background: rgba(99, 102, 241, 0.1); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 8px; overflow-x: auto;">
        <span style="font-size: 11px; color: #cbd5e1; white-space: nowrap;">Tezkor murojaat:</span>
        <button type="button" id="quick-pro-btn" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(99, 102, 241, 0.3)); border: 1px solid rgba(168, 85, 247, 0.5); color: #f3e8ff; border-radius: 999px; padding: 4px 12px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap;">
          ⭐ PRO Obunasini so‘rash
        </button>
        <button type="button" id="quick-help-btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 999px; padding: 4px 12px; font-size: 11px; cursor: pointer; white-space: nowrap;">
          ❓ Savol yoki taklif yuborish
        </button>
      </div>

      <!-- MESSAGES THREAD (SCROLLABLE) -->
      <div id="support-messages-container" style="flex: 1; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; scroll-behavior: smooth;">
        <div style="text-align: center; color: #a5a4b8; padding: 30px; font-size: 13px;">
          Xabarlar yuklanmoqda...
        </div>
      </div>

      <!-- IMAGE ATTACHMENT PREVIEW -->
      <div id="support-image-preview-bar" style="display: none; padding: 8px 16px; background: rgba(0,0,0,0.4); border-top: 1px solid rgba(255,255,255,0.08); align-items: center; gap: 12px;">
        <img id="support-preview-img" src="" alt="Biriktirilgan rasm" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #a855f7;">
        <div style="flex: 1; min-width: 0;">
          <span id="support-preview-name" style="display: block; font-size: 12px; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"></span>
          <span style="font-size: 11px; color: #a5a4b8;">Rasm xabarga biriktirildi</span>
        </div>
        <button type="button" id="support-preview-cancel" style="background: none; border: none; color: #f87171; cursor: pointer; font-size: 16px; padding: 4px;">✕</button>
      </div>

      <!-- COMPOSER BAR -->
      <div style="padding: 12px 16px; background: rgba(14, 11, 30, 0.98); border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 10px;">
        <input type="file" id="support-file-input" accept="image/png,image/jpeg,image/webp" style="display: none;">
        
        <button type="button" id="support-attach-btn" title="Rasm biriktirish (screenshot, chek, xatolik)" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; cursor: pointer; transition: all 0.2s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>

        <textarea id="support-input" rows="1" placeholder="Administratorga xabar yozing..." style="flex: 1; resize: none; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 11px 16px; color: #fff; font-family: inherit; font-size: 14px; outline: none; max-height: 100px;"></textarea>

        <button type="button" id="support-send-btn" title="Yuborish" style="background: linear-gradient(135deg, #a855f7, #6366f1); border: none; color: #fff; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; cursor: pointer; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); font-size: 17px; font-weight: 800;">
          ➤
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(supportModalEl);

  const closeBtn = supportModalEl.querySelector('#support-close-btn');
  closeBtn?.addEventListener('click', closeSupportModal);
  supportModalEl.addEventListener('click', (e) => {
    if (e.target === supportModalEl) closeSupportModal();
  });

  const attachBtn = supportModalEl.querySelector('#support-attach-btn');
  const fileInput = supportModalEl.querySelector('#support-file-input');
  const previewBar = supportModalEl.querySelector('#support-image-preview-bar');
  const previewImg = supportModalEl.querySelector('#support-preview-img');
  const previewName = supportModalEl.querySelector('#support-preview-name');
  const previewCancel = supportModalEl.querySelector('#support-preview-cancel');

  attachBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Rasm hajmi 5 MB dan oshmasligi kerak.');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingSupportImage = {
        data: reader.result,
        name: file.name,
        mimeType: file.type
      };
      if (previewImg) previewImg.src = reader.result;
      if (previewName) previewName.textContent = file.name;
      if (previewBar) previewBar.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  });

  previewCancel?.addEventListener('click', () => {
    pendingSupportImage = null;
    if (fileInput) fileInput.value = '';
    if (previewBar) previewBar.style.display = 'none';
  });

  const sendBtn = supportModalEl.querySelector('#support-send-btn');
  const input = supportModalEl.querySelector('#support-input');

  async function handleSend() {
    const text = input.value.trim();
    if (!text && !pendingSupportImage) return;

    sendBtn.disabled = true;
    try {
      let uploadedUrl = null;
      if (pendingSupportImage) {
        // Upload image first
        const upRes = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: pendingSupportImage.data, mimeType: pendingSupportImage.mimeType })
        });
        const upData = await upRes.json();
        if (upRes.ok && upData.success) {
          uploadedUrl = upData.url;
        } else {
          uploadedUrl = pendingSupportImage.data;
        }
      }

      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          images: uploadedUrl ? [uploadedUrl] : []
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Xabar yuborib bo‘lmadi.');
      }

      input.value = '';
      pendingSupportImage = null;
      if (fileInput) fileInput.value = '';
      if (previewBar) previewBar.style.display = 'none';

      await loadSupportConversation(true);
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn?.addEventListener('click', handleSend);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Quick buttons
  supportModalEl.querySelector('#quick-pro-btn')?.addEventListener('click', () => {
    input.value = 'Assalomu alaykum! Men hisobim uchun PRO obunasini olishni xohlayman.';
    input.focus();
  });

  supportModalEl.querySelector('#quick-help-btn')?.addEventListener('click', () => {
    input.value = 'Assalomu alaykum, administrator! Menda quyidagi savol bor edi: ';
    input.focus();
  });
}

async function loadSupportConversation(shouldScroll = false) {
  if (!supportModalEl) return;
  const container = supportModalEl.querySelector('#support-messages-container');
  if (!container) return;

  try {
    const res = await fetch('/api/support/conversation');
    const data = await res.json();
    if (!res.ok || !data.success) return;

    const conv = data.conversation;
    const messages = conv?.messages || [];

    if (messages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #a5a4b8; padding: 40px; font-size: 14px;">
          Suhbat hali bo‘sh. Xabar yozing va administrator sizga tez orada javob beradi.
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map(m => {
      const isUser = m.sender === 'user';
      const isSystem = m.sender === 'system';
      const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      if (isSystem) {
        return `
          <div style="align-self: center; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 999px; padding: 6px 16px; font-size: 12px; color: #f3e8ff; text-align: center; max-width: 90%;">
            ${escapeHTML(m.text)}
          </div>
        `;
      }

      const imagesHtml = Array.isArray(m.images) && m.images.length > 0
        ? `<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
            ${m.images.map(img => `
              <a href="${img}" target="_blank" rel="noopener noreferrer" style="display: block;">
                <img src="${img}" alt="Rasm" style="max-width: 220px; max-height: 180px; border-radius: 10px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);">
              </a>
            `).join('')}
           </div>`
        : '';

      if (isUser) {
        return `
          <div style="align-self: flex-end; max-width: 78%; display: flex; flex-direction: column; align-items: flex-end;">
            <div style="background: linear-gradient(135deg, #7c3aed, #6366f1); color: #fff; padding: 10px 15px; border-radius: 18px 18px 4px 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 14px; line-height: 1.45; word-break: break-word;">
              ${escapeHTML(m.text)}
              ${imagesHtml}
            </div>
            <span style="font-size: 10px; color: #a5a4b8; margin-top: 3px; padding-right: 4px;">${time} ✓✓</span>
          </div>
        `;
      } else {
        return `
          <div style="align-self: flex-start; max-width: 78%; display: flex; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #6366f1); display: grid; place-items: center; font-size: 15px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
              👑
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 11px; font-weight: 700; color: #fde047; margin-bottom: 2px;">Administrator</span>
              <div style="background: rgba(30, 27, 75, 0.85); border: 1px solid rgba(167, 139, 250, 0.3); color: #f1f5f9; padding: 10px 15px; border-radius: 4px 18px 18px 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 14px; line-height: 1.45; word-break: break-word;">
                ${escapeHTML(m.text)}
                ${imagesHtml}
              </div>
              <span style="font-size: 10px; color: #a5a4b8; margin-top: 3px; padding-left: 4px;">${time}</span>
            </div>
          </div>
        `;
      }
    }).join('');

    if (shouldScroll) {
      container.scrollTop = container.scrollHeight;
    }
  } catch (err) {
    console.warn('[SUPPORT LOAD ERROR]', err);
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
