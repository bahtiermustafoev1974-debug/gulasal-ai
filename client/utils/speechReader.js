/**
 * GULASAL AI — Text-to-Speech (Audio Reader) Utility
 * Clean speech synthesis with pause/play & visual feedback
 */

let activeUtterance = null;
let currentActiveButton = null;

export const SpeechReader = {
  isSpeaking() {
    return window.speechSynthesis ? window.speechSynthesis.speaking : false;
  },

  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentActiveButton) {
      currentActiveButton.classList.remove('is-speaking');
      const label = currentActiveButton.querySelector('.audio-btn-label');
      if (label) label.textContent = 'Ovozda eshitish';
      currentActiveButton = null;
    }
    activeUtterance = null;
  },

  speak(text, lang = 'uz-UZ', buttonEl = null) {
    if (!('speechSynthesis' in window)) {
      alert('Kechirasiz, brauzeringiz ovozli o‘qish tizimini qo‘llab-quvvatlamaydi.');
      return;
    }

    // Toggle if clicking same button while speaking
    if (this.isSpeaking() && currentActiveButton === buttonEl && buttonEl) {
      this.stop();
      return;
    }

    this.stop();

    if (!text || !text.trim()) return;

    // Clean markdown/html formatting from text
    const cleanText = text
      .replace(/<[^>]+>/g, ' ')
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pick best available voice
    const voices = window.speechSynthesis.getVoices() || [];
    const isLangString = typeof lang === 'string';
    const isVoiceLang = (v, prefix) => Boolean(v?.lang && typeof v.lang === 'string' && v.lang.startsWith(prefix));

    let selectedVoice = voices.find(v => isVoiceLang(v, 'uz') || isVoiceLang(v, 'tr'));
    if (!selectedVoice && ((isLangString && lang.startsWith('en')) || /^[a-zA-Z0-9\s.,!?'"-]+$/.test(cleanText.slice(0, 50)))) {
      selectedVoice = voices.find(v => isVoiceLang(v, 'en'));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => isVoiceLang(v, 'ru')) || voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (buttonEl) {
      currentActiveButton = buttonEl;
      buttonEl.classList.add('is-speaking');
      const label = buttonEl.querySelector('.audio-btn-label');
      if (label) label.textContent = 'To‘xtatish ⏹';
    }

    utterance.onend = () => {
      this.stop();
    };

    utterance.onerror = () => {
      this.stop();
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }
};
