
/* =========================================================
   GULASAL AI — RAQAMLI AVLOD QIZLARI (GIRLS COMMUNITY) 4.0
   Group Chat • Real-time Sync • Nicknames • Member Profiles
   Image Attachments • Responsive Desktop & Mobile
========================================================= */

function escapeHTML(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

function formatFullDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

let communityController = null;
let pollTimer = null;
let currentProfile = null;
let currentMembers = [];
let pendingImage = null; // { file, dataUrl, base64, mimeType, name, sizeStr }

/* =========================================================
   API REQUESTS
========================================================= */

async function api(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const err = new Error(json.message || `Xatolik: HTTP ${res.status}`);
    err.requireGoogle = Boolean(json.requireGoogle || res.status === 401);
    throw err;
  }
  return json;
}

export function renderCommunity(containerId = 'view-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Abort previous instances
  if (communityController) communityController.abort();
  communityController = new AbortController();
  const { signal } = communityController;

  clearInterval(pollTimer);
  pendingImage = null;

  container.innerHTML = `
    <section class="community-container">

      <!-- TOP COMMUNITY BAR -->
      <header class="comm-topbar">
        <div class="comm-title-area">
          <div class="comm-brand-badge">🌸</div>
          <div>
            <h2>Raqamli avlod qizlari <span>HAMJAMIYAT</span></h2>
            <p>IT, dasturlash va zamonaviy ilm egallayotgan iqtidorli qizlar klubi</p>
          </div>
        </div>

        <div class="comm-top-actions">
          <span id="comm-top-admin-badge"></span>
          <button type="button" class="comm-btn comm-members-toggle-btn" id="comm-toggle-members-btn">
            👥 A’zolar (<span id="comm-mobile-members-count">0</span>)
          </button>
          <button type="button" class="comm-btn comm-btn-primary" id="comm-my-profile-btn">
            👤 Mening profilim
          </button>
        </div>
      </header>

      <!-- MAIN SPLIT LAYOUT -->
      <div class="comm-layout">

        <!-- CHAT FEED -->
        <main class="comm-chat-col">
          <div class="comm-chat-header" id="comm-chat-header">
            <span class="comm-online-badge">
              <span class="comm-online-dot"></span>
              Guruh suhbati faol
            </span>
            <small style="color: #a1a1b5; font-size: 11.5px;">Jonli xabarlar almashinuvi</small>
          </div>

          <!-- ADMIN MANAGEMENT BAR (Only visible for site administrator) -->
          <div id="comm-admin-mount"></div>

          <div class="comm-messages-wrap" id="comm-messages-wrap">
            <div class="comm-empty-messages">
              <div class="comm-empty-icon">💬</div>
              <h4>Xabarlar yuklanmoqda...</h4>
            </div>
          </div>

          <!-- COMPOSER -->
          <div class="comm-composer-wrap">
            <!-- IMAGE PREVIEW BAR -->
            <div class="comm-preview-bar" id="comm-preview-bar" style="display: none;">
              <img id="comm-preview-thumb" class="comm-preview-thumb" src="" alt="Rasm">
              <div class="comm-preview-meta">
                <span id="comm-preview-name" class="comm-preview-name"></span>
                <span id="comm-preview-size" class="comm-preview-size"></span>
              </div>
              <button type="button" id="comm-preview-cancel" class="comm-preview-cancel" title="Bekor qilish">✕</button>
            </div>

            <form id="comm-message-form" class="comm-composer-row">
              <input
                type="file"
                id="comm-file-input"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,.pdf,.docx,.doc,.txt"
                style="display: none;"
                aria-label="Fayl yoki rasm biriktirish"
              >

              <button
                type="button"
                id="comm-attach-btn"
                class="comm-icon-btn"
                title="Rasm biriktirish (JPG, PNG, WEBP)"
                aria-label="Rasm biriktirish"
              >
                📷
              </button>

              <input
                type="text"
                id="comm-text-input"
                class="comm-input"
                maxlength="2000"
                placeholder="Guruhga xabar yozing..."
                autocomplete="off"
                aria-label="Xabar matni"
              >

              <button
                type="submit"
                id="comm-send-btn"
                class="comm-send-btn"
                title="Yuborish"
                aria-label="Yuborish"
              >
                ➤
              </button>
            </form>
          </div>
        </main>

        <!-- MEMBERS LIST SIDEBAR -->
        <aside class="comm-members-col" id="comm-members-col">
          <div class="comm-members-header">
            <h3>👥 Guruh A’zolari</h3>
            <span class="comm-members-count" id="comm-members-count">0</span>
          </div>

          <div class="comm-members-list" id="comm-members-list">
            <div class="mentor-empty" style="padding: 20px;">A’zolar yuklanmoqda...</div>
          </div>
        </aside>

      </div>

      <!-- PROFILE MODAL CONTAINER -->
      <div id="comm-modal-mount"></div>

    </section>
  `;

  const $ = selector => container.querySelector(selector);
  const messagesWrap = $('#comm-messages-wrap');
  const membersList = $('#comm-members-list');
  const membersCol = $('#comm-members-col');
  const membersCount = $('#comm-members-count');
  const mobileMembersCount = $('#comm-mobile-members-count');
  const toggleMembersBtn = $('#comm-toggle-members-btn');
  const myProfileBtn = $('#comm-my-profile-btn');
  const modalMount = $('#comm-modal-mount');

  const chatHeader = $('#comm-chat-header');

  const fileInput = $('#comm-file-input');
  const attachBtn = $('#comm-attach-btn');
  const previewBar = $('#comm-preview-bar');
  const previewThumb = $('#comm-preview-thumb');
  const previewName = $('#comm-preview-name');
  const previewSize = $('#comm-preview-size');
  const previewCancel = $('#comm-preview-cancel');

  const messageForm = $('#comm-message-form');
  const textInput = $('#comm-text-input');
  const sendBtn = $('#comm-send-btn');

  // Toggle mobile members sidebar
  toggleMembersBtn?.addEventListener('click', () => {
    membersCol?.classList.toggle('is-open');
  }, { signal });

  // Close members sidebar when clicking inside chat on mobile
  messagesWrap?.addEventListener('click', () => {
    membersCol?.classList.remove('is-open');
  }, { signal });

  /* =========================================================
     IMAGE ATTACHMENT HANDLING
  ========================================================= */

  function clearImage() {
    pendingImage = null;
    if (fileInput) fileInput.value = '';
    if (previewBar) previewBar.style.display = 'none';
    if (previewThumb) previewThumb.src = '';
  }

  attachBtn?.addEventListener('click', () => {
    fileInput?.click();
  }, { signal });

  previewCancel?.addEventListener('click', () => {
    clearImage();
  }, { signal });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const allowed = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    const fileType = (file?.type || '').toLowerCase();
    const fileName = (file?.name || '').toLowerCase();
    const isDoc = fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileName.endsWith('.txt');
    if (!allowed.includes(fileType) && !isDoc) {
      alert('Faqat JPG, PNG, WEBP, PDF yoki Word (DOCX) formatidagi fayllar ruxsat etilgan.');
      clearImage();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Fayl hajmi 10 MB dan oshmasligi kerak.');
      clearImage();
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(',')[1] || '';
      pendingImage = {
        file,
        dataUrl,
        base64,
        mimeType: file.type,
        name: file.name,
        sizeStr: (file.size / 1024).toFixed(0) + ' KB'
      };

      if (previewThumb) {
        if (file && typeof file.type === 'string' && file.type.startsWith('image/')) {
          previewThumb.src = dataUrl;
        } else {
          previewThumb.src = '/public/icon-192.svg';
        }
      }
      if (previewName) previewName.textContent = file.name;
      if (previewSize) previewSize.textContent = pendingImage.sizeStr;
      if (previewBar) previewBar.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }, { signal });


  /* =========================================================
     MESSAGES RENDERING & DELETE ACTION
  ========================================================= */

  let lastMessagesJson = '';

  function renderMessages(list) {
    if (!list || list.length === 0) {
      lastMessagesJson = '[]';
      messagesWrap.innerHTML = `
        <div class="comm-empty-messages">
          <div class="comm-empty-icon">🌸</div>
          <h4>Hali xabarlar yo‘q</h4>
          <p>Birinchi bo‘lib suhbatni boshlang, savol bering yoki fikr almashing!</p>
        </div>
      `;
      return;
    }

    const currentJson = JSON.stringify(list);
    if (currentJson === lastMessagesJson) {
      return; // Skip re-render if data has not changed
    }

    lastMessagesJson = currentJson;

    const isNearBottom = messagesWrap.scrollHeight - messagesWrap.scrollTop - messagesWrap.clientHeight < 120;

    messagesWrap.innerHTML = list.map(msg => {
      const isMe = currentProfile && msg.userId === currentProfile.userId;
      const isAdmin = Boolean(currentProfile && currentProfile.isAdmin);
      const canManage = isMe || isAdmin;

      const avatarContent = msg.avatar
        ? `<img src="${escapeHTML(msg.avatar)}" alt="${escapeHTML(msg.nickname)}">`
        : escapeHTML((msg.nickname || 'Q')[0].toUpperCase());

      const snippetText = msg.text || (msg.imageUrl ? 'Rasm' : 'Xabar');

      return `
        <article class="comm-message-item ${isMe ? 'is-me' : ''}" data-msg-id="${escapeHTML(msg.id)}">
          <div class="comm-msg-avatar" data-user-id="${escapeHTML(msg.userId)}" title="${escapeHTML(msg.nickname)} profilini ko'rish">
            ${avatarContent}
          </div>
          <div class="comm-msg-body">
            <div class="comm-msg-meta">
              <span class="comm-msg-nickname" data-user-id="${escapeHTML(msg.userId)}">${escapeHTML(msg.nickname)}</span>
              <span>${formatDate(msg.timestamp)}</span>
            </div>

            <div class="comm-msg-bubble-wrap">
              <div class="comm-msg-bubble">
                ${msg.text ? `<div>${escapeHTML(msg.text)}</div>` : ''}
                ${
                  msg.imageUrl
                    ? `
                      <div class="comm-msg-img-wrap">
                        <img src="${escapeHTML(msg.imageUrl)}" alt="Rasm" loading="lazy" onclick="window.open('${escapeHTML(msg.imageUrl)}', '_blank')">
                      </div>
                    `
                    : ''
                }
              </div>

              ${
                canManage
                  ? `
                    <div class="comm-msg-actions">
                      <button
                        type="button"
                        class="comm-msg-more-btn"
                        data-msg-action="toggle-menu"
                        data-msg-id="${escapeHTML(msg.id)}"
                        title="Xabar parametrlari"
                        aria-label="Xabar parametrlari"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2.2"/>
                          <circle cx="12" cy="12" r="2.2"/>
                          <circle cx="12" cy="19" r="2.2"/>
                        </svg>
                      </button>

                      <div class="comm-msg-dropdown-menu" id="dropdown-${escapeHTML(msg.id)}">
                        <button
                          type="button"
                          class="comm-dropdown-item comm-dropdown-delete"
                          data-msg-action="delete"
                          data-msg-id="${escapeHTML(msg.id)}"
                          data-msg-text="${escapeHTML(snippetText)}"
                        >
                          <svg class="comm-delete-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                          <span>${isMe ? 'Xabarni o‘chirish' : 'Admin: Xabarni o‘chirish'}</span>
                        </button>
                      </div>
                    </div>
                  `
                  : ''
              }
            </div>
          </div>
        </article>
      `;
    }).join('');

    if (isNearBottom) {
      messagesWrap.scrollTop = messagesWrap.scrollHeight;
    }

    // Attach click listeners to avatars/nicknames to view public profile
    messagesWrap.querySelectorAll('[data-user-id]').forEach(el => {
      el.addEventListener('click', () => {
        const uid = el.getAttribute('data-user-id');
        openMemberProfileModal(uid);
      });
    });

    // Attach toggle listeners for three-dots menu
    messagesWrap.querySelectorAll('[data-msg-action="toggle-menu"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        const dropdown = messagesWrap.querySelector(`#dropdown-${msgId}`);
        const wasOpen = dropdown?.classList.contains('is-open');

        // Close all dropdowns
        messagesWrap.querySelectorAll('.comm-msg-dropdown-menu').forEach(m => m.classList.remove('is-open'));
        messagesWrap.querySelectorAll('.comm-msg-more-btn').forEach(b => b.classList.remove('is-active'));

        if (!wasOpen && dropdown) {
          dropdown.classList.add('is-open');
          btn.classList.add('is-active');
        }
      });
    });

    // Attach delete listeners
    messagesWrap.querySelectorAll('[data-msg-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        const snippet = btn.getAttribute('data-msg-text') || 'Xabar';

        // Close all dropdowns
        messagesWrap.querySelectorAll('.comm-msg-dropdown-menu').forEach(m => m.classList.remove('is-open'));
        messagesWrap.querySelectorAll('.comm-msg-more-btn').forEach(b => b.classList.remove('is-active'));

        openDeleteConfirmModal(msgId, snippet);
      });
    });
  }

  // Close dropdowns when clicking outside or in messagesWrap
  window.addEventListener('click', () => {
    messagesWrap.querySelectorAll('.comm-msg-dropdown-menu').forEach(m => m.classList.remove('is-open'));
    messagesWrap.querySelectorAll('.comm-msg-more-btn').forEach(b => b.classList.remove('is-active'));
  }, { signal });

  // Escape key closes open dropdowns and modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      messagesWrap.querySelectorAll('.comm-msg-dropdown-menu').forEach(m => m.classList.remove('is-open'));
      messagesWrap.querySelectorAll('.comm-msg-more-btn').forEach(b => b.classList.remove('is-active'));
      const delBg = $('#comm-delete-modal-bg');
      if (delBg) modalMount.innerHTML = '';
    }
  }, { signal });

  /* =========================================================
     CONFIRMATION MODAL: DELETE MESSAGE
  ========================================================= */

  function openDeleteConfirmModal(msgId, snippet) {
    if (!msgId) return;

    modalMount.innerHTML = `
      <div class="comm-modal-backdrop" id="comm-delete-modal-bg">
        <div class="comm-modal-card comm-delete-modal-card">
          <div class="comm-delete-modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </div>

          <h3 class="comm-delete-modal-title">Xabarni o‘chirasizmi?</h3>
          <p class="comm-delete-modal-desc">
            Ushbu xabar guruh suhbatidan butunlay o‘chiriladi va boshqa hech bir a’zoga ko‘rinmaydi.
          </p>

          <div class="comm-delete-preview-snippet">
            “${escapeHTML(snippet.length > 80 ? snippet.slice(0, 80) + '...' : snippet)}”
          </div>

          <div class="comm-delete-modal-actions">
            <button type="button" class="comm-btn" id="comm-cancel-delete-btn">Bekor qilish</button>
            <button type="button" class="comm-btn comm-btn-danger" id="comm-confirm-delete-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Ha, o‘chirilsin</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const bg = $('#comm-delete-modal-bg');
    const cancelBtn = $('#comm-cancel-delete-btn');
    const confirmBtn = $('#comm-confirm-delete-btn');

    function closeModal() {
      modalMount.innerHTML = '';
    }

    cancelBtn?.addEventListener('click', closeModal);
    bg?.addEventListener('click', (e) => {
      if (e.target === bg) closeModal();
    });

    confirmBtn?.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<span>O‘chirilmoqda...</span>`;

      try {
        await api(`/api/community/messages/${encodeURIComponent(msgId)}`, {
          method: 'DELETE'
        });

        // Optimistically animate message removal in DOM
        const msgEl = messagesWrap.querySelector(`article[data-msg-id="${msgId}"]`);
        if (msgEl) {
          msgEl.classList.add('is-deleting');
          setTimeout(() => msgEl.remove(), 260);
        }

        closeModal();

        // Sync with backend to ensure clean state across clients
        lastMessagesJson = '';
        await syncMessagesAndMembers();
      } catch (err) {
        alert(err.message || 'Xabarni o‘chirishda xatolik yuz berdi');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<span>Ha, o‘chirilsin</span>`;
      }
    });
  }

  /* =========================================================
     CONFIRMATION MODAL: CLEAR ENTIRE CHAT (ADMIN ONLY)
  ========================================================= */

  function openClearAllConfirmModal() {
    modalMount.innerHTML = `
      <div class="comm-modal-backdrop" id="comm-clear-all-modal-bg">
        <div class="comm-modal-card comm-clear-all-modal-card">
          <div class="comm-clear-all-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </div>

          <h3 class="comm-delete-modal-title">Chat tarixini tozalash</h3>
          <p class="comm-delete-modal-desc" style="font-size: 15px; color: #fca5a5; font-weight: 700; line-height: 1.6; margin-bottom: 8px;">
            Haqiqatan ham guruh chatidagi barcha xabarlar tarixini tozalamoqchimisiz?
          </p>
          <p style="font-size: 12.5px; color: #a5a4b8; margin: 0 0 24px; line-height: 1.5;">
            Ushbu amal barcha foydalanuvchilar uchun xabarlar tarixini butunlay o‘chiradi va uni qayta tiklab bo‘lmaydi.
          </p>

          <div class="comm-delete-modal-actions">
            <button type="button" class="comm-btn" id="comm-cancel-clear-btn">Bekor qilish</button>
            <button type="button" class="comm-btn comm-btn-danger" id="comm-confirm-clear-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Ha, tarixni tozalash</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const bg = $('#comm-clear-all-modal-bg');
    const cancelBtn = $('#comm-cancel-clear-btn');
    const confirmBtn = $('#comm-confirm-clear-btn');

    function closeModal() {
      modalMount.innerHTML = '';
    }

    cancelBtn?.addEventListener('click', closeModal);
    bg?.addEventListener('click', (e) => {
      if (e.target === bg) closeModal();
    });

    confirmBtn?.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<span>Tarix tozalanmoqda...</span>`;

      try {
        await api('/api/community/chat/clear', {
          method: 'POST'
        });

        closeModal();

        // Immediately clear DOM and refresh state
        messagesWrap.innerHTML = `
          <div class="comm-empty-messages">
            <div class="comm-empty-icon">🌸</div>
            <h4>Hali xabarlar yo‘q</h4>
            <p>Chat tarixi administrator tomonidan tozalandi. Birinchi bo‘lib yangi suhbatni boshlang!</p>
          </div>
        `;
        lastMessagesJson = '[]';
        await syncMessagesAndMembers();
      } catch (err) {
        alert(err.message || 'Chat tarixini tozalashda xatolik yuz berdi');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<span>Ha, tarixni tozalash</span>`;
      }
    });
  }

  /* =========================================================
     ADMIN BAR RENDERING (ONLY FOR SITE ADMINISTRATOR)
  ========================================================= */

  function renderAdminBar() {
    const adminMount = $('#comm-admin-mount');
    const topAdminBadge = $('#comm-top-admin-badge');
    const isAdmin = Boolean(currentProfile && currentProfile.isAdmin);

    if (topAdminBadge) {
      topAdminBadge.innerHTML = isAdmin
        ? `<span class="comm-top-admin-pill">👑 Sayt Administratori</span>`
        : '';
    }

    if (!adminMount) return;

    if (isAdmin) {
      adminMount.innerHTML = `
        <div class="comm-admin-bar">
          <div class="comm-admin-badge">
            <span class="comm-admin-shield">🛡️</span>
            <span>ADMIN BOSHQARUV PANELI</span>
          </div>
          <button type="button" class="comm-btn-clear-chat" id="comm-clear-chat-btn" title="Guruh chatidagi barcha xabarlarni tozalash">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>Chat tarixini tozalash</span>
          </button>
        </div>
      `;

      adminMount.querySelector('#comm-clear-chat-btn')?.addEventListener('click', () => {
        openClearAllConfirmModal();
      }, { signal });
    } else {
      adminMount.innerHTML = '';
    }
  }

  /* =========================================================
     MEMBERS RENDERING
  ========================================================= */

  function renderMembers(members) {
    currentMembers = members || [];
    const count = currentMembers.length;
    if (membersCount) membersCount.textContent = count;
    if (mobileMembersCount) mobileMembersCount.textContent = count;

    if (!members || members.length === 0) {
      membersList.innerHTML = `<div class="mentor-empty">A’zolar topilmadi</div>`;
      return;
    }

    membersList.innerHTML = members.map(m => {
      const isMe = currentProfile && m.userId === currentProfile.userId;
      const avatarContent = m.avatar
        ? `<img src="${escapeHTML(m.avatar)}" alt="${escapeHTML(m.nickname)}">`
        : escapeHTML((m.nickname || 'Q')[0].toUpperCase());

      return `
        <div class="comm-member-card" data-member-id="${escapeHTML(m.userId)}" style="cursor: pointer; display: flex; align-items: center; width: 100%;">
          <div class="comm-member-avatar">
            ${avatarContent}
          </div>
          <div class="comm-member-info" style="flex: 1; min-width: 0;">
            <span class="comm-member-name">${escapeHTML(m.nickname)} ${isMe ? ' <small style="color:#ec8df5;">(Siz)</small>' : ''}</span>
            <span class="comm-member-interest">${escapeHTML(m.interest || 'IT & Ta’lim')}</span>
          </div>
        </div>
      `;
    }).join('');

    membersList.querySelectorAll('[data-member-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-member-id');
        openMemberProfileModal(uid);
      });
    });

    
  }

  /* =========================================================
     LOAD DATA & REAL-TIME POLL
  ========================================================= */

  function renderGoogleLockedScreen() {
    clearInterval(pollTimer);
    container.innerHTML = `
      <div style="min-height: 70vh; display: grid; place-items: center; padding: 20px;">
        <div style="background: rgba(22, 17, 44, 0.98); border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 28px; padding: 40px 32px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.8);">
          
          <div style="width: 72px; height: 72px; margin: 0 auto 20px; border-radius: 50%; background: #ffffff; display: grid; place-items: center; box-shadow: 0 8px 30px rgba(66, 133, 244, 0.35);">
            <svg width="36" height="36" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>

          <h2 style="margin: 0 0 12px; font-size: 22px; color: #fff; font-weight: 900;">
            Qizlar guruhiga kirish uchun Google hisobi kerak
          </h2>

          <p style="margin: 0 0 28px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Ushbu xavfsiz guruhda faqat rasmiy Google hisobi bilan tasdiqlangan o‘quvchilar muloqot qilishi, xabar yozishi va fikr almashishi mumkin.
          </p>

          <button type="button" id="comm-google-login-btn" style="width: 100%; padding: 14px 24px; border-radius: 14px; font-size: 15px; font-weight: 800; color: #0f172a; background: #fff; border: 1px solid rgba(255,255,255,0.8); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 6px 20px rgba(255,255,255,0.2); transition: transform 0.2s;">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google orqali kirish</span>
          </button>
        </div>
      </div>
    `;

    container.querySelector('#comm-google-login-btn')?.addEventListener('click', () => {
      if (typeof window.triggerGoogleLogin === 'function') {
        window.triggerGoogleLogin();
      } else if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt();
      } else {
        window.location.reload();
      }
    });
  }

  async function loadInitialData() {
    try {
      // 1. Get current profile
      const profRes = await api('/api/community/profile');
      currentProfile = profRes.data;
      renderAdminBar();

      // 2. Get members
      const memRes = await api('/api/community/members');
      renderMembers(memRes.data);

      // 4. Get messages
      const msgRes = await api('/api/community/messages');
      renderMessages(msgRes.data);
      messagesWrap.scrollTop = messagesWrap.scrollHeight;
    } catch (err) {
      console.error('[COMMUNITY LOAD ERROR]', err);
      if (err.requireGoogle || err.message?.includes('Google') || err.message?.includes('401')) {
        renderGoogleLockedScreen();
      }
    }
  }

  async function syncMessagesAndMembers() {
    try {
      const [msgRes, memRes] = await Promise.all([
        api('/api/community/messages'),
        api('/api/community/members')
      ]);
      if (signal.aborted) return;
      renderAdminBar();
      renderMessages(msgRes.data);
      renderMembers(memRes.data);
    } catch (err) {
      // Silent error during polling
    }
  }

  async function pollTick() {
    if (signal.aborted) return;
    await syncMessagesAndMembers();
  }

  // Start polling every 2.5s
  loadInitialData().then(() => {
    pollTimer = setInterval(pollTick, 2500);
  });

  /* =========================================================
     SEND MESSAGE (GROUP CHAT)
  ========================================================= */

  messageForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const text = textInput.value.trim();
    const hasImage = Boolean(pendingImage);

    if (!text && !hasImage) return;

    sendBtn.disabled = true;
    const imageToSend = pendingImage;
    clearImage();

    try {
      let imageUrl = null;

      // Upload image first if present
      if (imageToSend) {
        const uploadRes = await api('/api/upload/image', {
          method: 'POST',
          body: JSON.stringify({
            data: imageToSend.dataUrl,
            mimeType: imageToSend.mimeType
          })
        });
        imageUrl = uploadRes.url;
      }

      // Send group message
      await api('/api/community/messages', {
        method: 'POST',
        body: JSON.stringify({
          text,
          imageUrl
        })
      });

      textInput.value = '';
      lastMessagesJson = '';
      await syncMessagesAndMembers();
      messagesWrap.scrollTop = messagesWrap.scrollHeight;
    } catch (err) {
      alert(err.message || 'Xabar yuborishda xatolik');
    } finally {
      sendBtn.disabled = false;
      textInput.focus();
    }
  }, { signal });

  /* =========================================================
     MODAL: MY PROFILE (EDITABLE)
  ========================================================= */

  myProfileBtn?.addEventListener('click', () => {
    openMyProfileModal();
  }, { signal });

  function openMyProfileModal() {
    if (!currentProfile) return;

    modalMount.innerHTML = `
      <div class="comm-modal-backdrop" id="comm-modal-bg">
        <div class="comm-modal-card">
          <div class="comm-modal-header">
            <h3>👤 Mening Shaxsiy Profilim</h3>
            <button type="button" class="comm-modal-close" id="comm-modal-close">✕</button>
          </div>

          <form id="comm-profile-form" class="comm-modal-body">
            <div class="comm-profile-hero">
              <div class="comm-profile-big-avatar" id="modal-avatar-preview">
                ${
                  currentProfile.avatar
                    ? `<img src="${escapeHTML(currentProfile.avatar)}" alt="Avatar">`
                    : escapeHTML((currentProfile.nickname || 'Q')[0].toUpperCase())
                }
              </div>
              <div>
                <input type="file" id="modal-avatar-file" accept="image/png,image/jpeg,image/webp" style="display:none;">
                <button type="button" class="comm-avatar-upload-btn" id="modal-avatar-btn">
                  📷 Rasm yuklash
                </button>
                <div style="font-size: 11px; color: #827a99; margin-top: 6px;">
                  Tavsiya: Kvadrat formatdagi rasm (maks 5MB)
                </div>
              </div>
            </div>

            <div class="comm-form-group">
              <label for="prof-nickname">Nikneym (Guruhdagi ismingiz)</label>
              <input
                type="text"
                id="prof-nickname"
                name="nickname"
                class="comm-form-input"
                minlength="2"
                maxlength="30"
                value="${escapeHTML(currentProfile.nickname || '')}"
                required
                placeholder="Taxallusingizni kiriting..."
              >
              <small style="color:#827a99; font-size:11px;">Guruhda boshqa a’zolarga aynan shu taxallus ko‘rinadi</small>
            </div>

            <div class="comm-form-group">
              <label for="prof-interest">Qiziqish sohasi / Yo‘nalish</label>
              <input
                type="text"
                id="prof-interest"
                name="interest"
                class="comm-form-input"
                maxlength="60"
                value="${escapeHTML(currentProfile.interest || '')}"
                placeholder="Masalan: Web Frontend, Sun'iy Intellekt, Dizayn"
              >
            </div>

            <div class="comm-form-group">
              <label for="prof-bio">O‘zingiz haqingizda (Bio)</label>
              <textarea
                id="prof-bio"
                name="bio"
                class="comm-form-textarea"
                maxlength="300"
                placeholder="Maqsadlaringiz, loyihalaringiz yoki qiziqishlaringiz haqida..."
              >${escapeHTML(currentProfile.bio || '')}</textarea>
            </div>

            <div style="margin: 12px 0 6px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
              ${
                currentProfile.isAdmin
                  ? `<span style="font-size: 12px; color: #86efac; font-weight: 700;">🛡️ Siz sayt bosh administratorisiz</span>`
                  : `<button type="button" id="btn-admin-verify-modal" style="background: transparent; border: none; color: #827a99; font-size: 11.5px; cursor: pointer; text-decoration: underline;">
                       🛡️ Administrator kalitini kiritish
                     </button>`
              }
            </div>

            <div class="comm-modal-footer">
              <button type="button" class="comm-btn" id="modal-cancel-btn">Bekor qilish</button>
              <button type="submit" class="comm-btn comm-btn-primary" id="modal-save-btn">Saqlash</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const bg = $('#comm-modal-bg');
    const closeBtn = $('#comm-modal-close');
    const cancelBtn = $('#modal-cancel-btn');
    const form = $('#comm-profile-form');
    const avatarFile = $('#modal-avatar-file');
    const avatarBtn = $('#modal-avatar-btn');
    const avatarPreview = $('#modal-avatar-preview');
    let newAvatarUrl = currentProfile.avatar;

    function closeModal() {
      modalMount.innerHTML = '';
    }

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    bg?.addEventListener('click', e => {
      if (e.target === bg) closeModal();
    });

    $('#btn-admin-verify-modal')?.addEventListener('click', async () => {
      const key = prompt('Sayt administratori maxfiy kalitini kiriting (Standart: gulasal_admin_2026):');
      if (!key) return;
      try {
        const res = await api('/api/community/admin/verify', {
          method: 'POST',
          body: JSON.stringify({ key })
        });
        alert(res.message || 'Administrator huquqlari muvaffaqiyatli tasdiqlandi!');
        currentProfile.isAdmin = true;
        renderAdminBar();
        lastMessagesJson = '';
        closeModal();
        await syncMessagesAndMembers();
      } catch (err) {
        alert(err.message || 'Admin kaliti noto‘g‘ri.');
      }
    });

    avatarBtn?.addEventListener('click', () => avatarFile?.click());

    avatarFile?.addEventListener('change', async () => {
      const file = avatarFile.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Rasm hajmi 5 MB dan oshmasligi kerak.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async e => {
        const dataUrl = e.target.result;
        avatarPreview.innerHTML = `<img src="${dataUrl}" alt="Avatar">`;

        // Upload to server
        try {
          avatarBtn.textContent = 'Yuklanmoqda...';
          avatarBtn.disabled = true;
          const uploadRes = await api('/api/upload/image', {
            method: 'POST',
            body: JSON.stringify({
              data: dataUrl,
              mimeType: file.type
            })
          });
          newAvatarUrl = uploadRes.url;
        } catch (err) {
          alert('Rasm yuklashda xatolik: ' + err.message);
        } finally {
          avatarBtn.textContent = '📷 Rasm yuklash';
          avatarBtn.disabled = false;
        }
      };
      reader.readAsDataURL(file);
    });

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const nickname = form.nickname.value.trim();
      const interest = form.interest.value.trim();
      const bio = form.bio.value.trim();

      if (nickname.length < 2 || nickname.length > 30) {
        alert('Nikneym 2 dan 30 tagacha belgidan iborat bo‘lishi kerak.');
        return;
      }

      const saveBtn = $('#modal-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saqlanmoqda...';

      try {
        const updateRes = await api('/api/community/profile', {
          method: 'PUT',
          body: JSON.stringify({
            nickname,
            interest,
            bio,
            avatar: newAvatarUrl
          })
        });

        currentProfile = updateRes.data;
        closeModal();
        lastMessagesJson = '';
        await syncMessagesAndMembers();
      } catch (err) {
        alert(err.message || 'Profilni saqlashda xatolik yuz berdi');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Saqlash';
      }
    });
  }

  /* =========================================================
     MODAL: VIEW MEMBER PROFILE (READ-ONLY)
  ========================================================= */

  async function openMemberProfileModal(memberId) {
    if (!memberId) return;

    if (currentProfile && memberId === currentProfile.userId) {
      openMyProfileModal();
      return;
    }

    modalMount.innerHTML = `
      <div class="comm-modal-backdrop" id="comm-modal-bg">
        <div class="comm-modal-card">
          <div class="comm-modal-header">
            <h3>🌸 A’zo Profili</h3>
            <button type="button" class="comm-modal-close" id="comm-modal-close">✕</button>
          </div>
          <div class="comm-modal-body" id="comm-view-profile-body">
            <div class="mentor-empty">Profil yuklanmoqda...</div>
          </div>
        </div>
      </div>
    `;

    const bg = $('#comm-modal-bg');
    const closeBtn = $('#comm-modal-close');
    const bodyMount = $('#comm-view-profile-body');

    function closeModal() {
      modalMount.innerHTML = '';
    }

    closeBtn?.addEventListener('click', closeModal);
    bg?.addEventListener('click', e => {
      if (e.target === bg) closeModal();
    });

    try {
      const res = await api(`/api/community/member/${encodeURIComponent(memberId)}`);
      const member = res.data;

      bodyMount.innerHTML = `
        <div class="comm-profile-hero">
          <div class="comm-profile-big-avatar">
            ${
              member.avatar
                ? `<img src="${escapeHTML(member.avatar)}" alt="${escapeHTML(member.nickname)}">`
                : escapeHTML((member.nickname || 'Q')[0].toUpperCase())
            }
          </div>
          <div>
            <h4 style="margin: 0; font-size: 18px; font-weight: 800; color: #faf7ff;">
              ${escapeHTML(member.nickname)}
            </h4>
            <span style="font-size: 12px; color: #ec8df5; font-weight: 600;">
              ✨ ${escapeHTML(member.interest || 'IT & Ta’lim')}
            </span>
          </div>
        </div>

        <div class="comm-view-info-item">
          <small>O‘zi haqida (Bio)</small>
          <span>${escapeHTML(member.bio || 'Ma’lumot kiritilmagan.')}</span>
        </div>

        <div class="comm-view-info-item">
          <small>Bugungi darslar progressi</small>
          <span>${member.completedToday || 0} / ${member.totalToday || 5} dars (${member.percentageToday || 0}%)</span>
        </div>

        <div class="comm-view-info-item">
          <small>Guruhga qo‘shilgan sana</small>
          <span>${formatFullDate(member.joinedAt)}</span>
        </div>

        <div class="comm-modal-footer" style="padding: 12px 0 0; display: flex; flex-direction: column; gap: 8px;">
          <button type="button" class="comm-btn" id="comm-view-close-btn" style="width: 100%; justify-content: center;">
            Yopish
          </button>
        </div>
      `;

      $('#comm-view-close-btn')?.addEventListener('click', closeModal);
      
    } catch (err) {
      bodyMount.innerHTML = `
        <div class="mentor-empty" style="color: #ff8585;">
          ${escapeHTML(err.message || 'Profilni yuklab bo‘lmadi.')}
        </div>
      `;
    }
  }
}
