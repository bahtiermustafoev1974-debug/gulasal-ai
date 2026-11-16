/**
 * GULASAL AI — Phone-Style Theme & Preference Manager
 * Supports: Midnight, Elegant Light, AMOLED True Black, Cyberpunk Neon, Emerald Oasis
 */

const THEMES = [
  { id: 'midnight', name: '🌑 Midnight Neon', desc: 'Asl to‘q binafsharang neon uslubi', preview: '#090716' },
  { id: 'light', name: '☀️ Elegant Light', desc: 'Toza oq va yorug‘ zamonaviy rejim', preview: '#f8fafc' },
  { id: 'amoled', name: '🌌 AMOLED True Black', desc: 'Batareyani tejovchi mutlaq qora (#000000)', preview: '#000000' },
  { id: 'cyberpunk', name: '🔮 Cyberpunk Violet', desc: 'Futuristik neon va pushti porlash', preview: '#0b071a' },
  { id: 'emerald', name: '🍵 Emerald Oasis', desc: 'Ko‘z uchun qulay sokinlashtiruvchi yashil', preview: '#04130d' }
];

export const ThemeManager = {
  getThemes() {
    return THEMES;
  },

  getCurrentTheme() {
    return localStorage.getItem('gulasal_theme') || 'midnight';
  },

  setTheme(themeId) {
    const validIds = THEMES.map(t => t.id);
    const target = validIds.includes(themeId) ? themeId : 'midnight';

    // Remove old theme classes
    validIds.forEach(id => {
      document.body.classList.remove(`theme-${id}`);
    });

    document.body.classList.add(`theme-${target}`);
    localStorage.setItem('gulasal_theme', target);

    // Meta theme-color update
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const match = THEMES.find(t => t.id === target);
      if (match) metaThemeColor.setAttribute('content', match.preview);
    }

    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: target } }));
    return target;
  },

  getFontSize() {
    return localStorage.getItem('gulasal_font_size') || 'normal';
  },

  setFontSize(size = 'normal') {
    document.body.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge');
    document.body.classList.add(`font-${size}`);
    localStorage.setItem('gulasal_font_size', size);
  },

  getSpeechRate() {
    return parseFloat(localStorage.getItem('gulasal_speech_rate') || '1.0');
  },

  setSpeechRate(rate) {
    localStorage.setItem('gulasal_speech_rate', String(rate));
  },

  init() {
    const savedTheme = this.getCurrentTheme();
    this.setTheme(savedTheme);

    const savedFontSize = this.getFontSize();
    this.setFontSize(savedFontSize);
  }
};
