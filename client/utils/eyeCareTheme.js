/**
 * GULASAL AI — Eye-Care Reading Mode
 * Reduces eye strain by shifting UI to soft warm tones (amber / reading mode)
 */

const STORAGE_KEY = 'gulasal_eye_care_enabled';

export const EyeCareTheme = {
  isEnabled() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  },

  init() {
    if (this.isEnabled()) {
      document.body.classList.add('eye-care-mode');
    }
  },

  toggle(btn = null) {
    const isNow = !this.isEnabled();
    localStorage.setItem(STORAGE_KEY, String(isNow));
    document.body.classList.toggle('eye-care-mode', isNow);

    if (btn) {
      btn.classList.toggle('active', isNow);
      btn.title = isNow ? "Ko'zni asrash rejimi yoqilgan (O'chirish)" : "Ko'zni asrash (Eye-Care) rejimini yoqish";
    }

    return isNow;
  }
};
