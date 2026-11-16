// =====================================================
// GULASAL AI — PROFESSIONAL PREMIUM SIDEBAR 2026
// Clean Navigation • Compact Sleek Support (No Bulky Box)
// =====================================================

import { openSupportModal } from '../utils/supportModal.js?v=20261114_pro2';

export const menuItems = [
  { id: 'chat', label: 'Gulasal AI Chat', icon: 'chat' },
  { id: 'subjects', label: 'Fanlar va Darslar', icon: 'book' },
  { id: 'tools', label: 'AI Ta’lim Asboblari', icon: 'tools' },
  { id: 'community', label: 'Qizlar guruhi (Chat)', icon: 'community' },
  { id: 'mentor', label: 'AI Mentor (Yutuqlar)', icon: 'mentor' },
  { id: 'eilist', label: 'IELTS Akademiya (Tillar)', icon: 'eilist' },
  { id: 'admin', label: '👑 Admin Paneli', icon: 'admin' }
];

const icons = {
  settings: `
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  `,
  chat: `
    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>
  `,

  mentor: `
    <path d="M12 3 14.5 8.5 20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z"/>
    <path d="m19 15 1.2 2.8L23 19l-2.8 1.2L19 23l-1.2-2.8L15 19l2.8-1.2L19 15Z"/>
    <path d="m5 2 .9 2.1L8 5l-2.1.9L5 8l-.9-2.1L2 5l2.1-.9L5 2Z"/>
  `,

  eilist: `
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    <circle cx="12" cy="12" r="2.5"/>
  `,

  book: `
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  `,

  tools: `
    <path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4L14 13l-3-3z"/>
    <path d="m16 5 3-3 3 3-3 3"/>
  `,

  community: `
    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="10" cy="7" r="4"/>
    <path d="M20 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  `,

  admin: `
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  `
};

let sidebarController = null;

function getIcon(name) {
  return `
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      ${icons[name] || ''}
    </svg>
  `;
}

export function renderSidebar(
  containerId,
  activeId = 'chat',
  onNavigate,
  currentUser = null
) {
  const container = document.getElementById(containerId);

  if (!container) return;

  sidebarController?.abort();
  sidebarController = new AbortController();

  const { signal } = sidebarController;

  const isAdmin = Boolean(currentUser && currentUser.isAdmin);
  const visibleMenuItems = menuItems.filter(
    item => item.id !== 'admin' || isAdmin
  );

  const selectedId = visibleMenuItems.some(
    item => item.id === activeId
  )
    ? activeId
    : 'chat';

  container.innerHTML = `
    <!-- 1. GULASAL AI LOGOTIPI VA HEADER -->
    <div class="sidebar-header">
      <div class="brand-icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          focusable="false"
        >
          <path d="M12 2.5 14.8 9l6.7 3-6.7 2.8-2.8 6.7-2.8-6.7L2.5 12l6.7-3z"/>
          <circle cx="18.5" cy="5.5" r="1"/>
        </svg>
      </div>

      <div class="brand-info">
        <h1>Gulasal AI</h1>
        <span class="brand-badge">INTELLIGENT AI</span>
      </div>

      <button id="sidebar-close-btn" class="sidebar-close-btn" type="button" aria-label="Menyuni yopish">
        ✕
      </button>
    </div>

    <!-- 2. ASOSIY MENYULAR SARLAVHASI -->
    <div class="sidebar-section-label">
      ASOSIY BO‘LIMLAR
    </div>

    <!-- 3. CHAT VA BOSHQA BO‘LIMLAR (O‘RTA SCROLL BO‘LADIGAN NAVIGATSIYA) -->
    <nav class="sidebar-nav" aria-label="Asosiy navigatsiya">
      ${visibleMenuItems.map(item => `
        <a
          href="#${item.id}"
          class="nav-link ${item.id === selectedId ? 'active' : ''}"
          data-nav="${item.id}"
          ${item.id === selectedId ? 'aria-current="page"' : ''}
        >
          <span class="nav-icon">
            ${getIcon(item.icon)}
          </span>

          <span class="nav-label">
            ${item.label}
          </span>

          ${item.id === 'chat'
            ? '<span class="nav-indicator"></span>'
            : ''
          }
        </a>
      `).join('')}
    </nav>

    <!-- 4. PASTKI BO‘LIM: QO‘LLAB-QUVVATLASH -->
    <div class="sidebar-bottom-section">
      ${!isAdmin ? `
      <button type="button" class="sidebar-support-btn" id="sidebar-support-btn" aria-label="Qo‘llab-quvvatlash">
        <span class="support-btn-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </span>
        <span class="support-btn-content">
          <span class="support-btn-title">Qo‘llab-quvvatlash</span>
          <span class="support-btn-sub">Admin bilan jonli chat</span>
        </span>
        <span class="support-btn-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
      </button>` : ''}
    </div>
  `;

  // Navigatsiya havolalari
  const links = container.querySelectorAll('.nav-link');

  function setActive(targetId) {
    links.forEach(link => {
      const isActive = link.dataset.nav === targetId;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  const backdrop = document.getElementById('sidebar-backdrop');
  function closeMobileSidebar() {
    container.classList.remove('open');
    backdrop?.classList.remove('active');
    document.body.style.overflow = '';
  }

  links.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();

      const targetId = link.dataset.nav;

      if (!visibleMenuItems.some(item => item.id === targetId)) {
        return;
      }

      if (targetId === 'community' && currentUser?.type === 'guest') {
        const proceed = confirm("Qizlar guruhiga kirish uchun faqat rasmiy Google hisobi talab qilinadi. Google orqali kirishni xohlaysizmi?");
        if (proceed) {
          if (typeof window.triggerGoogleLogin === 'function') {
            window.triggerGoogleLogin();
          } else if (window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
          } else {
            window.location.reload();
          }
        }
        return;
      }

      setActive(targetId);
      closeMobileSidebar();

      if (typeof onNavigate === 'function') {
        onNavigate(targetId);
      }
    }, { signal });
  });

  // Qo‘llab-quvvatlash tugmasi (Support Modal ochiladi)
  const supportBtn = container.querySelector('#sidebar-support-btn');
  supportBtn?.addEventListener('click', event => {
    event.preventDefault();
    closeMobileSidebar();
    if (typeof openSupportModal === 'function') {
      openSupportModal(currentUser);
    } else if (typeof window.openSupportModal === 'function') {
      window.openSupportModal(currentUser);
    }
  }, { signal });

  // Mobil menyuni yopish tugmasi
  const closeBtn = container.querySelector('#sidebar-close-btn');
  closeBtn?.addEventListener('click', () => {
    closeMobileSidebar();
  }, { signal });

  // ESC klavishi bilan yopish
  container.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMobileSidebar();
    }
  }, { signal });
}
