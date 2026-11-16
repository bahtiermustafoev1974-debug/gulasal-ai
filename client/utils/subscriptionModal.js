// ========================================================
// GULASAL AI — DIRECT ADMIN CONTACT & PRO MODAL 2026
// Official Card: 9860 1606 3566 3802 (Baxtiyor M.)
// Direct Admin Chat Consultation & 1-Click Support Access
// ========================================================

import { openSupportModal } from './supportModal.js';

let subModalEl = null;
let proPromptModalEl = null;
let selectedPlanId = '3_months';
let selectedPlanTitle = '3 oylik PRO (69 000 so‘m)';

const OFFICIAL_CARD_NUMBER = '9860 1606 3566 3802';
const OFFICIAL_CARD_HOLDER = 'BAXTIYOR M.';

/**
 * Full PRO presentation modal with Direct Admin Contact
 */
export async function openSubscriptionModal(userId = null) {
  if (!subModalEl) {
    createSubscriptionModal();
  }

  subModalEl.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Load user status
  try {
    const res = await fetch('/api/subscription/user-status', {
      headers: userId ? { 'x-user-id': userId } : {}
    });
    const data = await res.json();
    renderProStatus(data?.subscription);
  } catch (err) {
    console.warn('[LOAD PRO STATUS ERROR]', err);
  }
}

export function closeSubscriptionModal() {
  if (subModalEl) {
    subModalEl.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function createSubscriptionModal() {
  subModalEl = document.createElement('div');
  subModalEl.id = 'subscription-checkout-modal';
  subModalEl.className = 'premium-modal-backdrop';

  subModalEl.innerHTML = `
    <div class="premium-modal-dialog" style="max-width: 560px; max-height: 90vh; overflow-y: auto; background: #111216; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 26px 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.75); text-align: center;">
      
      <!-- CLOSE BUTTON -->
      <button type="button" id="pro-modal-close-btn" style="position: absolute; top: 16px; right: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; cursor: pointer; font-size: 15px;">
        ✕
      </button>

      <!-- ICON -->
      <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 12px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); display: grid; place-items: center; font-size: 24px;">
        ⭐
      </div>

      <h2 style="margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #f4f4f5;">
        Gulasal AI &bull; PRO Obunasi
      </h2>

      <p id="pro-status-headline" style="margin: 0 0 16px; font-size: 13px; color: #94a3b8; line-height: 1.5;">
        Cheksiz AI so‘rovlari, ko‘p rasm yuklash va barcha premium imkoniyatlar
      </p>

      <!-- CURRENT STATUS BADGE -->
      <div id="pro-current-badge-box" style="margin-bottom: 18px; padding: 8px 14px; border-radius: 10px; background: #14151b; border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 12.5px; color: #94a3b8;">Sizning tarifingiz:</span>
        <span id="pro-current-badge-text" style="font-size: 12px; font-weight: 700; color: #cbd5e1; background: rgba(255,255,255,0.06); padding: 3px 10px; border-radius: 999px;">
          Standart (FREE)
        </span>
      </div>

      <!-- OFFICIAL UZBEKISTAN BANK CARD WIDGET -->
      <div class="pro-card-widget" style="background: #14151b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 20px; margin-bottom: 18px; text-align: left; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">💳</span>
            <span style="font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px; color: #d4d4d8; text-transform: uppercase;">Rasmiy To‘lov Kartasi</span>
          </div>
          <span style="font-size: 11px; font-weight: 600; color: #818cf8; background: rgba(99, 102, 241, 0.1); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.25);">
            HUMO / UZCARD
          </span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <span id="pro-card-number-display" style="font-family: 'Courier New', Courier, monospace; font-size: 19px; font-weight: 800; letter-spacing: 1.5px; color: #fff;">
            ${OFFICIAL_CARD_NUMBER}
          </span>
          <button type="button" id="btn-copy-card" style="padding: 5px 12px; border-radius: 6px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #f4f4f5; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;" title="Karta raqamidan nusxa olish">
            📋 Nusxa olish
          </button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #94a3b8;">
          <div>
            <div style="font-size: 10px; color: #71717a; text-transform: uppercase;">Karta Egasi</div>
            <div style="font-weight: 700; color: #f4f4f5; letter-spacing: 0.5px;">${OFFICIAL_CARD_HOLDER}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; color: #71717a;">Xavfsiz To‘lov</div>
            <div style="font-weight: 600; color: #10b981;">✓ Administrator Nazorati</div>
          </div>
        </div>
      </div>

      <!-- TARIFF PLANS SELECTION GRID -->
      <div style="text-align: left; margin-bottom: 18px;">
        <span style="font-size: 12.5px; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 8px;">
          Tarif rejasini tanlang:
        </span>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;" id="pro-plans-grid">
          
          <label class="pro-plan-choice" data-plan="1_month" data-title="1 oylik PRO (29 000 so‘m)" style="display: flex; flex-direction: column; justify-content: space-between; padding: 12px 10px; border-radius: 10px; background: #14151b; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; text-align: center; transition: all 0.2s;">
            <input type="radio" name="pro_plan" value="1_month" style="display: none;">
            <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">1 OYLIK</span>
            <span style="font-size: 14.5px; font-weight: 700; color: #fff; margin: 4px 0;">29 000 so‘m</span>
            <span style="font-size: 10.5px; color: #71717a;">30 kun</span>
          </label>

          <label class="pro-plan-choice is-selected" data-plan="3_months" data-title="3 oylik PRO (69 000 so‘m)" style="display: flex; flex-direction: column; justify-content: space-between; padding: 12px 10px; border-radius: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid #6366f1; cursor: pointer; text-align: center; transition: all 0.2s; position: relative;">
            <span style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: #6366f1; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 7px; border-radius: 999px;">
              MASHHUR
            </span>
            <input type="radio" name="pro_plan" value="3_months" checked style="display: none;">
            <span style="font-size: 11px; color: #818cf8; font-weight: 600;">3 OYLIK</span>
            <span style="font-size: 14.5px; font-weight: 700; color: #fff; margin: 4px 0;">69 000 so‘m</span>
            <span style="font-size: 10.5px; color: #10b981; font-weight: 600;">Tejamkor ✓</span>
          </label>

          <label class="pro-plan-choice" data-plan="lifetime" data-title="Cheksiz PRO (149 000 so‘m)" style="display: flex; flex-direction: column; justify-content: space-between; padding: 12px 10px; border-radius: 10px; background: #14151b; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; text-align: center; transition: all 0.2s;">
            <input type="radio" name="pro_plan" value="lifetime" style="display: none;">
            <span style="font-size: 11px; color: #fbbf24; font-weight: 600;">CHEKSIZ</span>
            <span style="font-size: 14.5px; font-weight: 700; color: #fff; margin: 4px 0;">149 000 so‘m</span>
            <span style="font-size: 10.5px; color: #fbbf24;">Muddatsiz</span>
          </label>

        </div>
      </div>

      <!-- MAIN PRIMARY ACTION: CONTACT ADMIN DIRECTLY -->
      <div style="margin-bottom: 18px;">
        <button type="button" id="pro-contact-admin-btn" style="width: 100%; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #fff; background: #6366f1; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s ease;">
          <span style="font-size: 16px;">💬</span>
          <span id="btn-admin-contact-text">Administratorga murojaat qilish</span>
          <span style="font-size: 14px;">→</span>
        </button>
        <span style="font-size: 12px; color: #71717a; display: block; margin-top: 6px;">
          Administrator bilan chat ochiladi va PRO obuna zudlik bilan yoqiladi
        </span>
      </div>

      <!-- PROMO CODE REDEEM BOX -->
      <div style="background: #14151b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; text-align: left;">
        <span style="font-size: 12px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 8px;">
          🎁 Promokodingiz bormi?
        </span>
        <div style="display: flex; gap: 8px;">
          <input
            type="text"
            id="sub-promo-input"
            placeholder="Masalan: GULASAL2026"
            style="flex: 1; padding: 7px 12px; border-radius: 6px; background: #090a0f; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 13px; text-transform: uppercase; outline: none;"
          >
          <button
            type="button"
            id="sub-promo-apply-btn"
            style="padding: 7px 14px; border-radius: 6px; background: #6366f1; border: none; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;"
          >
            Faollashtirish
          </button>
        </div>
        <div id="sub-promo-feedback" style="font-size: 11.5px; margin-top: 6px; display: none;"></div>
      </div>

      <!-- DISMISS BUTTON -->
      <div>
        <button type="button" id="pro-dismiss-btn" style="padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; color: #71717a; background: transparent; border: none; cursor: pointer;">
          Yopish
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(subModalEl);

  const close = () => closeSubscriptionModal();
  subModalEl.querySelector('#pro-modal-close-btn')?.addEventListener('click', close);
  subModalEl.querySelector('#pro-dismiss-btn')?.addEventListener('click', close);
  subModalEl.addEventListener('click', (e) => {
    if (e.target === subModalEl) close();
  });

  // 1-Click Copy Card Number
  const copyBtn = subModalEl.querySelector('#btn-copy-card');
  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(OFFICIAL_CARD_NUMBER.replace(/\s+/g, '')).then(() => {
      copyBtn.textContent = '✓ Nusxa olindi!';
      copyBtn.style.background = 'rgba(16, 185, 129, 0.2)';
      copyBtn.style.borderColor = '#10b981';
      setTimeout(() => {
        copyBtn.textContent = '📋 Nusxa olish';
        copyBtn.style.background = 'rgba(255, 255, 255, 0.06)';
        copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }, 2500);
    });
  });

  // Plan Selection
  const planLabels = subModalEl.querySelectorAll('.pro-plan-choice');
  planLabels.forEach(label => {
    label.addEventListener('click', () => {
      planLabels.forEach(l => {
        l.classList.remove('is-selected');
        l.style.background = '#14151b';
        l.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      });
      label.classList.add('is-selected');
      label.style.background = 'rgba(99, 102, 241, 0.1)';
      label.style.borderColor = '#6366f1';
      const radio = label.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        selectedPlanId = radio.value;
        selectedPlanTitle = label.getAttribute('data-title') || 'PRO Obuna';
      }
    });
  });

  // Main Action: Contact Admin directly with prefilled plan message!
  subModalEl.querySelector('#pro-contact-admin-btn')?.addEventListener('click', () => {
    close();
    const message = `Assalomu alaykum! Men ${selectedPlanTitle} obunasini faollashtirishni so‘rayman (Karta: ${OFFICIAL_CARD_NUMBER} ga to‘lov qilish bo‘yicha).`;
    openSupportModal(null, message);
  });

  // Promo Code Handler
  const promoInput = subModalEl.querySelector('#sub-promo-input');
  const promoBtn = subModalEl.querySelector('#sub-promo-apply-btn');
  const promoFeedback = subModalEl.querySelector('#sub-promo-feedback');

  promoBtn?.addEventListener('click', async () => {
    const code = promoInput?.value.trim().toUpperCase();
    if (!code) {
      if (promoFeedback) {
        promoFeedback.style.display = 'block';
        promoFeedback.style.color = '#f87171';
        promoFeedback.textContent = 'Iltimos, promokodni kiriting.';
      }
      return;
    }

    promoBtn.disabled = true;
    promoBtn.textContent = '...';

    try {
      const res = await fetch('/api/subscription/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Promokod noto‘g‘ri.');
      }

      if (promoFeedback) {
        promoFeedback.style.display = 'block';
        promoFeedback.style.color = '#86efac';
        promoFeedback.textContent = '✓ ' + data.message;
      }
      if (promoInput) promoInput.value = '';

      renderProStatus(data.subscription);
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (err) {
      if (promoFeedback) {
        promoFeedback.style.display = 'block';
        promoFeedback.style.color = '#f87171';
        promoFeedback.textContent = err.message || 'Xatolik yuz berdi.';
      }
    } finally {
      promoBtn.disabled = false;
      promoBtn.textContent = 'Faollashtirish';
    }
  });
}

function renderProStatus(sub) {
  if (!subModalEl) return;
  const badgeText = subModalEl.querySelector('#pro-current-badge-text');
  const headline = subModalEl.querySelector('#pro-status-headline');

  if (sub?.isVip) {
    if (badgeText) {
      badgeText.textContent = '⭐ PRO (FAOL)';
      badgeText.style.background = '#6366f1';
      badgeText.style.color = '#fff';
    }
    if (headline) {
      const durText = sub.duration === 'unlimited' || !sub.duration
        ? 'Cheksiz muddat'
        : `${sub.daysRemaining !== null ? sub.daysRemaining + ' kun qoldi' : sub.duration + ' kun'}`;
      headline.innerHTML = `Sizda <strong style="color: #818cf8;">PRO obunasi faol</strong> (${durText}). Barcha premium imtiyozlardan foydalanishingiz mumkin!`;
    }
  } else {
    if (badgeText) {
      badgeText.textContent = 'Standart (FREE)';
      badgeText.style.background = 'rgba(255,255,255,0.08)';
      badgeText.style.color = '#94a3b8';
    }
    if (headline) {
      headline.textContent = 'Cheksiz AI so‘rovlari, ko‘p rasm yuklash va barcha premium imkoniyatlar';
    }
  }
}

export function openProRequiredModal() {
  if (proPromptModalEl) {
    proPromptModalEl.remove();
  }

  proPromptModalEl = document.createElement('div');
  proPromptModalEl.className = 'comm-modal-overlay';
  proPromptModalEl.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    display: grid; place-items: center;
    background: rgba(8, 9, 12, 0.88); backdrop-filter: blur(14px);
    padding: 20px;
  `;

  proPromptModalEl.innerHTML = `
    <div style="background: #111216; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 28px 24px; max-width: 460px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.75);">
      
      <!-- ICON -->
      <div style="width: 48px; height: 48px; margin: 0 auto 14px; border-radius: 12px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); display: grid; place-items: center; font-size: 24px;">
        📸
      </div>

      <h3 style="margin: 0 0 8px; font-size: 18px; color: #f4f4f5; font-weight: 700;">
        PRO Obunani Faollashtiring
      </h3>

      <p style="margin: 0 0 20px; font-size: 13.5px; color: #94a3b8; line-height: 1.5;">
        Bir nechta rasm yuklash va kunlik cheksiz AI so‘rovlaridan foydalanish uchun administrator bilan bog‘laning yoki promokoddan foydalaning.
      </p>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button type="button" id="btn-pro-about" style="padding: 11px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 600; color: #fff; background: #6366f1; border: none; cursor: pointer;">
          Tariflar & To‘lov Kartasi →
        </button>

        <button type="button" id="btn-pro-contact-admin" style="padding: 11px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 600; color: #cbd5e1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); cursor: pointer;">
          Administratorga murojaat qilish
        </button>

        <button type="button" id="btn-pro-cancel" style="padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #71717a; background: transparent; border: none; cursor: pointer;">
          Bekor qilish
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(proPromptModalEl);

  const close = () => {
    if (proPromptModalEl) {
      proPromptModalEl.remove();
      proPromptModalEl = null;
    }
  };

  proPromptModalEl.querySelector('#btn-pro-cancel')?.addEventListener('click', close);
  proPromptModalEl.addEventListener('click', (e) => {
    if (e.target === proPromptModalEl) close();
  });

  proPromptModalEl.querySelector('#btn-pro-about')?.addEventListener('click', () => {
    close();
    openSubscriptionModal();
  });

  proPromptModalEl.querySelector('#btn-pro-contact-admin')?.addEventListener('click', () => {
    close();
    openSupportModal(null, 'Assalomu alaykum! Men ko‘proq rasm yuklash va cheksiz AI so‘rovlari uchun PRO obuna olish bo‘yicha murojaat qilmoqdaman.');
  });
}

if (typeof window !== 'undefined') {
  window.openProRequiredModal = openProRequiredModal;
  window.openSubscriptionModal = openSubscriptionModal;
  window.closeSubscriptionModal = closeSubscriptionModal;
}

export default {
  openSubscriptionModal,
  closeSubscriptionModal,
  openProRequiredModal
};
