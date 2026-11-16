
// GULASAL AI — PREMIUM ACCOUNT NAVBAR 2026 (XP REMOVED, PRO & SUPPORT INTEGRATED)
import { openSubscriptionModal } from '../utils/subscriptionModal.js?v=20261114_pro2';
import { openSupportModal } from '../utils/supportModal.js?v=20261114_pro2';
import { ThemeManager } from '../utils/themeManager.js';

let navbarController = null;
let searchTimer = null;

export function renderNavbar(containerId, onSearch, currentUser = null, onNavigate = null) {
  const container = document.getElementById(containerId);

  if (!container) return;

  // Oldingi event listenerlarni tozalash
  navbarController?.abort();
  navbarController = new AbortController();

  const { signal } = navbarController;

  clearTimeout(searchTimer);

  const name = currentUser?.name || 'Gulasal AI';
  const role = currentUser?.isAdmin
    ? '👑 Administrator'
    : (currentUser?.type === 'guest' ? 'Mehmon' : 'Talaba');
  const avatarHtml = currentUser?.picture
    ? `<img src="${currentUser.picture}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`
    : `<span class="user-avatar">${(name || 'G').charAt(0).toUpperCase()}</span>`;

  container.innerHTML = `
    <div class="navbar-left-group">
      <!-- HAMBURGER MENU TOGGLE -->
      <button class="navbar-menu-toggle" id="navbar-menu-toggle" type="button" aria-label="Menyu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <span class="menu-toggle-text">Menyu</span>
      </button>

      ${currentUser?.isAdmin ? `
      <!-- DIRECT ADMIN BUTTON (ONLY FOR bahtiermustafoev1974@gmail.com) -->
      <button class="navbar-admin-btn" id="navbar-admin-direct-btn" type="button" title="Admin Paneli">
        <span>👑</span>
        <span class="admin-btn-text">Admin Paneli</span>
      </button>` : ''}

      <div class="search-box">
        <span aria-hidden="true">⌕</span>

        <input
          type="search"
          id="global-search-input"
          placeholder="Gulasal AI dan qidiring..."
          autocomplete="off"
          aria-label="Saytdan qidirish"
        >
      </div>
    </div>

    <div class="navbar-user">

      <div class="user-status">
        <span class="status-dot"></span>
        <span>${currentUser?.isAdmin ? '👑 Admin faol' : 'Gulasal AI faol'}</span>
      </div>

      <div class="user-account-wrap">

        <button
          class="user-profile"
          id="user-profile-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="user-account-menu"
        >
          ${avatarHtml}

          <span class="user-info">
            <span class="user-name">
              <span class="user-name-text">${name}</span>
              ${!currentUser?.isAdmin ? `
              <span class="navbar-user-pro-badge" id="navbar-user-pro-badge" title="PRO Obunasi (Batafsil ko‘rish)">
                <span class="pro-badge-star">⭐</span>
                <span class="pro-badge-text" id="navbar-pro-badge-text">PRO</span>
              </span>` : ''}
            </span>
            <span class="user-role">${role}</span>
          </span>

          <span class="user-chevron">⌄</span>
        </button>

        <div
          class="user-account-menu"
          id="user-account-menu"
          hidden
        >
          ${currentUser?.isAdmin ? `
          <button
            type="button"
            id="nav-go-admin-btn"
            style="color: #fde047; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.08);"
          >
            👑 Admin Paneli
          </button>` : `
          <button
            type="button"
            id="menu-support-btn"
          >
            💬 Qo‘llab-quvvatlash chati
          </button>

          <button
            type="button"
            id="menu-pro-info-btn"
          >
            ⭐ PRO Obuna haqida
          </button>`}

          <button
            type="button"
            id="nav-go-settings-btn"
            style="color: #cbd5e1; font-weight: 600;"
          >
            ⚙️ Dastur Sozlamalari
          </button>

          <button
            type="button"
            id="switch-google-account"
          >
            ↗ Boshqa Google hisobiga o‘tish
          </button>

          <button
            type="button"
            id="logout-account"
            class="danger"
          >
            ⇥ Hisobdan chiqish
          </button>
        </div>

      </div>
    </div>
  `;

  const $ = selector => container.querySelector(selector);

  const searchInput = $('#global-search-input');
  const toggle = $('#user-profile-toggle');
  const menu = $('#user-account-menu');

  const logoutButton = $('#logout-account');
  const switchButton = $('#switch-google-account');

  /* ==========================================
     SEARCH
  ========================================== */

  searchInput?.addEventListener('input', event => {
    clearTimeout(searchTimer);

    const value = event.target.value.trim();

    searchTimer = setTimeout(() => {
      if (typeof onSearch === 'function') {
        onSearch(value);
      }
    }, 300);
  }, { signal });

  /* ==========================================
     MENU HELPERS
  ========================================== */

  function closeMenu() {
    if (!menu || !toggle) return;

    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (!menu || !toggle) return;

    const isOpen = menu.hidden;

    menu.hidden = !isOpen;

    toggle.setAttribute(
      'aria-expanded',
      String(isOpen)
    );
  }

  /* ==========================================
     PROFILE MENU
  ========================================== */

  toggle?.addEventListener('click', event => {
    event.stopPropagation();
    toggleMenu();
  }, { signal });

  menu?.addEventListener('click', event => {
    event.stopPropagation();
  }, { signal });

  document.addEventListener('click', event => {
    if (!container.contains(event.target)) {
      closeMenu();
    }
  }, { signal });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  }, { signal });

  /* ==========================================
     LOGOUT / SWITCH ACCOUNT
  ========================================== */

  async function leaveAccount(switchGoogle = false) {
    const buttons = menu.querySelectorAll('button');

    buttons.forEach(button => {
      button.disabled = true;
    });

    try {
      if (switchGoogle && window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        // Bo‘sh javob ham tekshiriladi.
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
          `Chiqishda xatolik: HTTP ${response.status}`
        );
      }

      window.location.reload();

    } catch (error) {
      buttons.forEach(button => {
        button.disabled = false;
      });

      console.error('[GULASAL LOGOUT]', error);

      alert(
        error.message ||
        'Hisobdan chiqib bo‘lmadi. Serverni tekshiring.'
      );
    }
  }

  logoutButton?.addEventListener('click', () => {
    leaveAccount(false);
  }, { signal });

  switchButton?.addEventListener('click', () => {
    leaveAccount(true);
  }, { signal });

  const goAdminBtn = $('#nav-go-admin-btn');
  goAdminBtn?.addEventListener('click', () => {
    closeMenu();
    if (typeof onNavigate === 'function') {
      onNavigate('admin');
    }
  }, { signal });

  const goSettingsBtn = $('#nav-go-settings-btn');
  goSettingsBtn?.addEventListener('click', () => {
    closeMenu();
    if (typeof onNavigate === 'function') {
      onNavigate('settings');
    }
  }, { signal });

  const adminDirectBtn = $('#navbar-admin-direct-btn');
  const sidebar = document.getElementById('sidebar-container');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  function setSidebarOpen(open) {
    if (!sidebar) return;
    const isOpen = open !== undefined ? open : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', isOpen);
    sidebarBackdrop?.classList.toggle('active', isOpen);
    if (window.innerWidth <= 1000) {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
  }

  adminDirectBtn?.addEventListener('click', () => {
    if (typeof onNavigate === 'function') {
      onNavigate('admin');
    }
    setSidebarOpen(false);
  }, { signal });

  const menuToggle = $('#navbar-menu-toggle');
  menuToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    setSidebarOpen();
  }, { signal });

  sidebarBackdrop?.addEventListener('click', () => {
    setSidebarOpen(false);
  }, { signal });

  document.addEventListener('click', (e) => {
    if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
      setSidebarOpen(false);
    }
  }, { signal });

  const proBadge = $('#navbar-user-pro-badge');
  const proBadgeText = $('#navbar-pro-badge-text');
  const menuSupportBtn = $('#menu-support-btn');
  const menuProInfoBtn = $('#menu-pro-info-btn');

  function openProModal() {
    closeMenu();
    openSubscriptionModal(currentUser?.id);
  }

  function openSupport() {
    closeMenu();
    openSupportModal(currentUser);
  }

  proBadge?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openProModal();
  }, { signal });

  menuProInfoBtn?.addEventListener('click', openProModal, { signal });
  menuSupportBtn?.addEventListener('click', openSupport, { signal });

  // Initialize Saved Theme & Display Preferences
  ThemeManager.init();

  // Load PRO status
  async function syncProStatus() {
    if (currentUser?.isAdmin) return; // Admin akkauntga PRO obunasi yoki badgesi kerak emas
    try {
      const res = await fetch('/api/subscription/user-status', {
        headers: currentUser?.id ? { 'x-user-id': currentUser.id } : {}
      });
      const data = await res.json();
      const isPro = Boolean(data?.subscription?.isVip);
      window._currentUserSubscription = data?.subscription || { isVip: isPro };

      const badge = $('#navbar-user-pro-badge');
      const text = $('#navbar-pro-badge-text');

      if (isPro) {
        if (badge) {
          badge.classList.add('is-pro-active');
          badge.title = 'PRO Obuna faol! (Batafsil ko‘rish)';
        }
        if (text) text.textContent = 'PRO';
      } else {
        if (badge) {
          badge.classList.remove('is-pro-active');
          badge.title = 'PRO Obunaga o‘tish';
        }
        if (text) text.textContent = 'PRO';
      }
    } catch (e) {
      console.warn('[PRO STATUS SYNC WARN]', e);
    }
  }

  syncProStatus();

  window.addEventListener('subscription-updated', syncProStatus, { signal });

  // Global Broadcast Announcement Banner
  async function initBroadcastBanner() {
    try {
      const res = await fetch('/api/announcement');
      const data = await res.json();
      const ann = data?.announcement;
      if (!ann || !ann.active || !ann.text) {
        document.getElementById('global-broadcast-banner-root')?.remove();
        return;
      }

      const dismissedKey = 'gulasal_dismissed_ann_' + (ann.updatedAt || 'v1');
      if (sessionStorage.getItem(dismissedKey)) {
        return;
      }

      document.getElementById('global-broadcast-banner-root')?.remove();

      const banner = document.createElement('div');
      banner.id = 'global-broadcast-banner-root';
      banner.className = `global-broadcast-banner type-${ann.type || 'info'}`;

      const icon = ann.type === 'warning' ? '⚠️' : (ann.type === 'success' ? '🎉' : '📢');

      banner.innerHTML = `
        <div class="broadcast-banner-inner">
          <span class="broadcast-banner-icon">${icon}</span>
          <span class="broadcast-banner-text">${ann.text}</span>
          <button type="button" class="broadcast-banner-close" title="Yopish">✕</button>
        </div>
      `;

      container.parentNode.insertBefore(banner, container);

      banner.querySelector('.broadcast-banner-close')?.addEventListener('click', () => {
        sessionStorage.setItem(dismissedKey, 'true');
        banner.remove();
      });
    } catch (e) {
      // silent
    }
  }

  initBroadcastBanner();
  window.addEventListener('announcement-updated', initBroadcastBanner, { signal });

  // 1. Check Maintenance Mode
  async function initMaintenanceCheck() {
    if (currentUser?.isAdmin) return; // Admin can always bypass maintenance
    try {
      const res = await fetch('/api/system/maintenance');
      const data = await res.json();
      const m = data?.maintenance;
      if (m && m.enabled) {
        let overlay = document.getElementById('maintenance-overlay-root');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'maintenance-overlay-root';
          overlay.style.cssText = 'position:fixed;inset:0;z-index:9999999;background:rgba(6,5,14,0.98);backdrop-filter:blur(20px);display:grid;place-items:center;padding:24px;text-align:center;';
          overlay.innerHTML = `
            <div style="max-width:500px;width:100%;background:rgba(22,17,44,0.98);border:1px solid rgba(168,85,247,0.4);border-radius:28px;padding:40px 32px;box-shadow:0 30px 80px rgba(0,0,0,0.9);">
              <div style="font-size:56px;margin-bottom:16px;">⚙️</div>
              <h2 style="margin:0 0 12px;font-size:24px;color:#fff;font-weight:900;">Texnik Profilaktika Rejimi</h2>
              <p style="margin:0 0 20px;font-size:14px;color:#cbd5e1;line-height:1.6;">${m.message || 'Saytda rejaviy texnik profilaktika ishlari olib borilmoqda. Tez orada qaytamiz!'}</p>
              <div style="display:inline-block;padding:8px 18px;border-radius:999px;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.3);color:#e9d5ff;font-size:12.5px;font-weight:750;margin-bottom:24px;">
                ⏱️ Kutilayotgan yakun: ${m.estimatedEnd || 'Tez orada'}
              </div>
              <div>
                <button type="button" onclick="window.location.reload()" style="padding:12px 24px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#6366f1);border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">
                  🔄 Qayta tekshirish
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(overlay);
        }
      } else {
        document.getElementById('maintenance-overlay-root')?.remove();
      }
    } catch {}
  }
  initMaintenanceCheck();

  // 2. Check Direct Personal Admin Notices
  async function initUserNotifications() {
    try {
      const res = await fetch('/api/notifications/my');
      const data = await res.json();
      const unreadList = (data?.notifications || []).filter(n => !n.read);
      if (unreadList.length === 0) return;

      const notif = unreadList[0];
      const icon = notif.type === 'celebration' ? '🎉' : (notif.type === 'warning' ? '⚠️' : 'ℹ️');

      const modal = document.createElement('div');
      modal.className = 'comm-modal-overlay is-visible';
      modal.style.cssText = 'position:fixed;inset:0;z-index:999999;display:grid;place-items:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(14px);padding:20px;';
      modal.innerHTML = `
        <div style="background:rgba(22,17,44,0.98);border:1px solid rgba(168,85,247,0.5);border-radius:24px;padding:32px 28px;max-width:480px;width:100%;text-align:center;box-shadow:0 25px 70px rgba(0,0,0,0.85);">
          <div style="font-size:48px;margin-bottom:12px;">${icon}</div>
          <span style="font-size:11.5px;color:#c084fc;font-weight:800;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">👑 Administrator Xabari</span>
          <h3 style="margin:0 0 12px;font-size:20px;color:#fff;font-weight:800;">${notif.title}</h3>
          <p style="margin:0 0 24px;font-size:14px;color:#cbd5e1;line-height:1.6;white-space:pre-wrap;">${notif.message}</p>
          <button type="button" id="btn-read-admin-notif" style="padding:12px 28px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#6366f1);border:none;color:#fff;font-size:14px;font-weight:800;cursor:pointer;width:100%;">
            ✓ Tushundim / O‘qidim
          </button>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#btn-read-admin-notif')?.addEventListener('click', async () => {
        try {
          await fetch(`/api/notifications/read/${encodeURIComponent(notif.id)}`, { method: 'POST' });
        } catch {}
        modal.remove();
      });
    } catch {}
  }
  initUserNotifications();
}
