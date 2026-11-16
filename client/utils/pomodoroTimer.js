/**
 * GULASAL AI — Interactive Pomodoro Focus Timer
 * 25-minute study focus with Web Audio API chime
 */

let timerInterval = null;
let secondsRemaining = 25 * 60;
let isRunning = false;
let isBreak = false;
let domElements = { pill: null, timeDisplay: null };

function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
  } catch (e) {}
}

export const PomodoroTimer = {
  renderPill(container) {
    if (!container) return;

    const wrap = document.createElement('div');
    wrap.className = 'pomodoro-pill';
    wrap.id = 'pomodoro-timer-pill';
    wrap.innerHTML = `
      <span class="pomodoro-icon">⏳</span>
      <span class="pomodoro-time" id="pomodoro-time-text">25:00</span>
      <button type="button" class="pomodoro-toggle-btn" id="pomodoro-toggle-btn" title="Vaqtni boshlash / to'xtatish">▶</button>
      <button type="button" class="pomodoro-reset-btn" id="pomodoro-reset-btn" title="Qayta o'rnatish">↺</button>
    `;

    container.appendChild(wrap);

    domElements.pill = wrap;
    domElements.timeDisplay = wrap.querySelector('#pomodoro-time-text');

    const toggleBtn = wrap.querySelector('#pomodoro-toggle-btn');
    const resetBtn = wrap.querySelector('#pomodoro-reset-btn');

    toggleBtn.addEventListener('click', () => {
      this.toggle(toggleBtn);
    });

    resetBtn.addEventListener('click', () => {
      this.reset(toggleBtn);
    });
  },

  toggle(btn = null) {
    if (isRunning) {
      this.pause(btn);
    } else {
      this.start(btn);
    }
  },

  start(btn = null) {
    if (isRunning) return;
    isRunning = true;
    if (btn) btn.textContent = '⏸';
    if (domElements.pill) domElements.pill.classList.add('is-running');

    timerInterval = setInterval(() => {
      if (secondsRemaining > 0) {
        secondsRemaining--;
        this.updateDisplay();
      } else {
        this.handleComplete(btn);
      }
    }, 1000);
  },

  pause(btn = null) {
    isRunning = false;
    clearInterval(timerInterval);
    if (btn) btn.textContent = '▶';
    if (domElements.pill) domElements.pill.classList.remove('is-running');
  },

  reset(btn = null) {
    this.pause(btn);
    isBreak = false;
    secondsRemaining = 25 * 60;
    this.updateDisplay();
  },

  handleComplete(btn = null) {
    this.pause(btn);
    playChime();

    if (!isBreak) {
      alert('🎉 Tabriklaymiz! 25 daqiqalik dars muvaffaqiyatli yakunlandi. Endi 5 daqiqa dam oling.');
      isBreak = true;
      secondsRemaining = 5 * 60;
    } else {
      alert('⚡ 5 daqiqalik tanaffus tugadi. Yangi marralar sari davom etamizmi?');
      isBreak = false;
      secondsRemaining = 25 * 60;
    }
    this.updateDisplay();
  },

  updateDisplay() {
    if (!domElements.timeDisplay) return;
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    domElements.timeDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
};
