/**
 * GULASAL AI — Settings & Preferences Module (Sozlamalar)
 * Phone-style Themes, Font Sizes, Voice Rates, and Education Hub
 */

import { ThemeManager } from '../utils/themeManager.js';

export function renderSettings(containerId = 'view-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentTheme = ThemeManager.getCurrentTheme();
  const currentFont = ThemeManager.getFontSize();
  const currentRate = ThemeManager.getSpeechRate();
  const themes = ThemeManager.getThemes();

  container.innerHTML = `
    <section class="settings-page">
      <div class="section-header">
        <div>
          <span class="mentor-eyebrow">GULASAL AI • SHAXSIY MOSLASHUV</span>
          <h2>⚙️ Dastur Sozlamalari</h2>
          <p>Mavzular, ko‘rinish dizayni va ovozli yordamchi parametrlarini o‘zingizga moslang.</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- 1. PHONE-STYLE THEMES -->
        <div class="settings-card">
          <div class="sc-header">
            <span class="sc-icon">🎨</span>
            <div>
              <h3>Tizim Mavzulari (Theme)</h3>
              <p>Telefonlardagi kabi o‘zingizga yoqqan ranglar sxemasini tanlang</p>
            </div>
          </div>

          <div class="theme-options-grid">
            ${themes.map(t => {
              const isSelected = t.id === currentTheme;
              return `
                <button
                  type="button"
                  class="theme-card-btn ${isSelected ? 'is-selected' : ''}"
                  data-theme-id="${t.id}"
                >
                  <div class="theme-color-preview" style="background: ${t.preview}; border: 1px solid rgba(255,255,255,0.2);">
                    <span class="theme-active-check">${isSelected ? '✓' : ''}</span>
                  </div>
                  <div class="theme-card-info">
                    <strong>${t.name}</strong>
                    <small>${t.desc}</small>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 2. FONT SIZE & READABILITY -->
        <div class="settings-card">
          <div class="sc-header">
            <span class="sc-icon">🔤</span>
            <div>
              <h3>Matn va Shrift Kattaligi</h3>
              <p>Darslarni bemalol o‘qish uchun qulay shrift o‘lchamini belgilang</p>
            </div>
          </div>

          <div class="font-size-row">
            <button type="button" class="font-size-btn ${currentFont === 'normal' ? 'active' : ''}" data-size="normal">
              Standart (100%)
            </button>
            <button type="button" class="font-size-btn ${currentFont === 'large' ? 'active' : ''}" data-size="large">
              Katta (110%)
            </button>
            <button type="button" class="font-size-btn ${currentFont === 'xlarge' ? 'active' : ''}" data-size="xlarge">
              Qulay (120%)
            </button>
          </div>
        </div>

        <!-- 3. VOICE & AUDIO PREFERENCES -->
        <div class="settings-card">
          <div class="sc-header">
            <span class="sc-icon">🔊</span>
            <div>
              <h3>Ovozli AI Sozlamalari (TTS)</h3>
              <p>Darslarni ovozda o‘qib berish tezligini tanlang</p>
            </div>
          </div>

          <div class="speech-rate-row">
            <button type="button" class="rate-btn ${currentRate === 0.8 ? 'active' : ''}" data-rate="0.8">
              Sekin (0.8x)
            </button>
            <button type="button" class="rate-btn ${currentRate === 1.0 ? 'active' : ''}" data-rate="1.0">
              Oddiy (1.0x)
            </button>
            <button type="button" class="rate-btn ${currentRate === 1.2 ? 'active' : ''}" data-rate="1.2">
              Tezkor (1.2x)
            </button>
          </div>
        </div>

        <!-- 4. APP STORAGE & INFO -->
        <div class="settings-card">
          <div class="sc-header">
            <span class="sc-icon">📱</span>
            <div>
              <h3>Ilova va Xotira</h3>
              <p>Lokal keshni yangilash va tizim ma’lumotlari</p>
            </div>
          </div>

          <div class="app-info-row">
            <div>
              <strong>Gulasal AI & Ustoz-AI</strong>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">Versiya: 5.2 Special Edition (2026)</div>
            </div>
            <button type="button" class="btn-clear-cache" id="set-clear-cache-btn">
              🧹 Keshni tozalash
            </button>
          </div>
        </div>
      </div>
    </section>
  `;

  // Bind Theme Selection
  container.querySelectorAll('.theme-card-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.themeId;
      ThemeManager.setTheme(themeId);

      container.querySelectorAll('.theme-card-btn').forEach(b => {
        const isCurrent = b.dataset.themeId === themeId;
        b.classList.toggle('is-selected', isCurrent);
        const check = b.querySelector('.theme-active-check');
        if (check) check.textContent = isCurrent ? '✓' : '';
      });
    });
  });

  // Bind Font Sizes
  container.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      ThemeManager.setFontSize(size);
      container.querySelectorAll('.font-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Bind Speech Rates
  container.querySelectorAll('.rate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rate = parseFloat(btn.dataset.rate);
      ThemeManager.setSpeechRate(rate);
      container.querySelectorAll('.rate-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  container.querySelector('#set-clear-cache-btn')?.addEventListener('click', () => {
    if (confirm('Lokal keshni tozalab, ilovani qayta yuklaysizmi?')) {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      localStorage.removeItem('gulasal_cache_ts');
      window.location.reload();
    }
  });
}

export function openSettingsModal() {
  document.getElementById('settings-modal-root')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'settings-modal-root';
  overlay.className = 'premium-modal-backdrop settings-backdrop is-visible';

  overlay.innerHTML = `
    <div class="settings-modal" role="dialog" aria-modal="true">
      <div class="settings-modal-header">
        <div class="sc-header" style="margin: 0;">
          <span class="sc-icon" style="font-size: 24px;">⚙️</span>
          <div>
            <h3 style="margin: 0; color: #fff; font-size: 1.15rem;">Sozlamalar</h3>
            <p style="margin: 2px 0 0; color: #94a3b8; font-size: 0.78rem;">Mavzular, ko‘rinish va qulayliklar</p>
          </div>
        </div>
        <button type="button" class="player-close-btn" id="settings-close-btn" title="Yopish">✕</button>
      </div>

      <div class="settings-modal-body" id="settings-modal-content-slot"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  function close() {
    overlay.remove();
    document.body.style.overflow = '';
  }

  overlay.querySelector('#settings-close-btn')?.addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  renderSettings('settings-modal-content-slot');
}
