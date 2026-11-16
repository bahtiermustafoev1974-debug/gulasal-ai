// ========================================================
// GULASAL AI — PWA INSTALLER & A2HS HELPER 2026
// Progressive Web App Installation Manager (Android, iOS, Desktop)
// ========================================================

let deferredPrompt = null;
let pwaBannerEl = null;
let iosModalEl = null;

const DISMISS_KEY = 'gulasal_pwa_dismiss_v1';

export function isAppInstalled() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
}

export function isSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS/i.test(ua);
}

/**
 * Trigger the PWA installation dialog
 */
export async function promptInstall() {
  if (isAppInstalled()) {
    showToast('Ilova allaqachon telefoningiz yoki kompyuteringizga o‘rnatilgan!');
    return;
  }

  // 1. Android / Chrome / Edge with beforeinstallprompt
  const activePrompt = deferredPrompt || window._deferredInstallPrompt;
  if (activePrompt) {
    try {
      activePrompt.prompt();
      const choice = await activePrompt.userChoice;
      if (choice.outcome === 'accepted') {
        console.log('[PWA] Foydalanuvchi ilovani o‘rnatishni qabul qildi');
        dismissBanner();
      }
      deferredPrompt = null;
      window._deferredInstallPrompt = null;
    } catch (err) {
      console.warn('[PWA PROMPT ERROR]', err);
    }
    return;
  }

  // 2. iOS Safari
  if (isIosDevice()) {
    openIosInstallGuide();
    return;
  }

  // 3. Fallback for desktop or non-supported browsers
  showToast('Ilovani o‘rnatish uchun brauzeringiz menyusidan (⋮) «Ilovani o‘rnatish» yoki «Bosh ekranga qo‘shish» bandini tanlang.');
}

/**
 * Open guide modal for iOS users
 */
function openIosInstallGuide() {
  if (iosModalEl) iosModalEl.remove();

  iosModalEl = document.createElement('div');
  iosModalEl.className = 'premium-modal-backdrop active';
  iosModalEl.style.zIndex = '99999';

  iosModalEl.innerHTML = `
    <div class="premium-modal-dialog" style="max-width: 440px; background: rgba(18, 14, 38, 0.98); border: 1px solid rgba(168, 85, 247, 0.45); border-radius: 26px; padding: 28px 22px; text-align: center; box-shadow: 0 25px 70px rgba(0,0,0,0.85);">
      
      <button type="button" id="ios-guide-close-btn" style="position: absolute; top: 16px; right: 18px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; cursor: pointer;">
        ✕
      </button>

      <div style="width: 58px; height: 58px; margin: 0 auto 12px; border-radius: 16px; background: linear-gradient(135deg, #a855f7, #6366f1); display: grid; place-items: center; font-size: 28px; box-shadow: 0 0 25px rgba(168, 85, 247, 0.4);">
        📲
      </div>

      <h3 style="margin: 0 0 8px; font-size: 19px; font-weight: 800; color: #fff;">
        iPhone-ga o‘rnatish
      </h3>

      <p style="margin: 0 0 20px; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
        Gulasal AI ilovasini iPhone yoki iPad bosh ekraniga qo‘shish uchun 2 ta oddiy qadam:
      </p>

      <div style="text-align: left; display: flex; flex-direction: column; gap: 12px; margin-bottom: 22px;">
        <div style="display: flex; gap: 12px; align-items: center; padding: 10px 14px; border-radius: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);">
          <span style="font-size: 24px;">1️⃣</span>
          <span style="font-size: 13px; color: #f8fafc;">Safari brauzerining pastidagi <strong>«Ulashish» (Share 📤)</strong> belgisini bosing.</span>
        </div>

        <div style="display: flex; gap: 12px; align-items: center; padding: 10px 14px; border-radius: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);">
          <span style="font-size: 24px;">2️⃣</span>
          <span style="font-size: 13px; color: #f8fafc;">Ochilgan menyudan pastga tushib, <strong>«Bosh ekranga qo‘shish» (Add to Home Screen ➕)</strong> ni tanlang.</span>
        </div>
      </div>

      <button type="button" id="ios-guide-ok-btn" style="width: 100%; padding: 12px; border-radius: 14px; font-size: 14px; font-weight: 800; color: #fff; background: linear-gradient(135deg, #a855f7, #6366f1); border: none; cursor: pointer;">
        Tushunarli
      </button>

    </div>
  `;

  document.body.appendChild(iosModalEl);

  const close = () => {
    if (iosModalEl) {
      iosModalEl.remove();
      iosModalEl = null;
    }
  };

  iosModalEl.querySelector('#ios-guide-close-btn')?.addEventListener('click', close);
  iosModalEl.querySelector('#ios-guide-ok-btn')?.addEventListener('click', close);
  iosModalEl.addEventListener('click', (e) => {
    if (e.target === iosModalEl) close();
  });
}

/**
 * Show floating mobile install banner
 */
function showInstallBanner() {
  return; // Disabled as per user request (no install popups)
}

function dismissBanner() {
  if (pwaBannerEl) {
    pwaBannerEl.classList.add('hide');
    setTimeout(() => {
      pwaBannerEl?.remove();
      pwaBannerEl = null;
    }, 300);
  }
  // Remember dismissal for 7 days
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'pwa-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/**
 * Initialize PWA installer
 */
export function initPwaInstaller() {
  // Disabled as per user request (no install popups or banners)
  return;
}

export default {
  initPwaInstaller,
  promptInstall,
  isAppInstalled
};
