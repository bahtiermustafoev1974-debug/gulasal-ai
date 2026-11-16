// ========================================================
// GULASAL AI — BULLETPROOF AMBIENT VOICE ASSISTANT 2026
// Real-time Mic Analyser • Live VU Meter • Web Speech AI
// ========================================================

let overlayEl = null;
let recognition = null;
let audioContext = null;
let analyser = null;
let micStream = null;
let animFrameId = null;

let isListening = false;
let isSpeaking = false;
let isThinking = false;
let currentLang = 'uz-UZ';
let silenceTimer = null;
let accumulatedTranscript = '';

const SYSTEM_VOICE_PROMPT = `[VOICE_MODE]: Foydalanuvchi siz bilan jonli ovoz orqali gaplashmoqda.
Javobingizni o'qib berishga qulay, samimiy, do'stona va ravon o'zbek tilida, qisqa va aniq qilib bering.
Matnda markdown jadval, kod bloklari kabi o'qish qiyin bo'lgan belgilarni ishlatmang.`;

export function initAmbientVoiceFloatingButton() {
  // Microphone is strictly placed only inside AI Chat composer (Requirement 7)
  const existing = document.getElementById('floating-ambient-voice-btn');
  if (existing) existing.remove();
}

export async function openAmbientVoice() {
  if (!overlayEl) {
    createOverlay();
  }

  overlayEl.classList.add('active');
  document.body.style.overflow = 'hidden';

  // 1. Explicitly request microphone access
  await setupMicrophoneHardware();

  // 2. Start Speech Recognition
  startListening();
}

export function closeAmbientVoice() {
  if (!overlayEl) return;

  stopListening();
  stopMicrophoneHardware();
  window.speechSynthesis?.cancel();

  overlayEl.classList.remove('active');
  document.body.style.overflow = '';
}

/* ========================================================
   HARDWARE MICROPHONE & REAL-TIME AUDIO VISUALIZER
   ======================================================== */
async function setupMicrophoneHardware() {
  const statusEl = document.getElementById('ambient-status-text');
  const vuBar = document.getElementById('ambient-mic-level-bar');

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        const source = audioContext.createMediaStreamSource(micStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        monitorAudioLevels();
      }
    }
  } catch (err) {
    console.warn('[MIC HARDWARE ACCESS ERROR]', err);
    if (statusEl) {
      statusEl.innerHTML = '⚠️ Mikrofonga ruxsat berilmadi. Brauzeringizda mikrofonga ruxsat bering.';
    }
  }
}

function monitorAudioLevels() {
  if (!analyser) return;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  const orb = document.getElementById('ambient-orb-core');
  const vuBar = document.getElementById('ambient-mic-level-bar');
  const vuText = document.getElementById('ambient-mic-status-hint');

  function updateMeter() {
    if (!overlayEl?.classList.contains('active')) return;

    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length; // 0 to 255
    const volumePercent = Math.min(100, Math.round((avg / 120) * 100));

    // Update level bar
    if (vuBar) {
      vuBar.style.width = `${volumePercent}%`;
    }

    // Dynamic orb pulse from real microphone input
    if (isListening && !isSpeaking && !isThinking && orb) {
      const scale = 1 + (avg / 255) * 0.35;
      orb.style.transform = `scale(${scale.toFixed(2)})`;

      if (avg > 15) {
        orb.classList.add('hearing-sound');
        if (vuText) vuText.innerHTML = '🟢 Ovoz eshitilmoqda...';
      } else {
        orb.classList.remove('hearing-sound');
        if (vuText && isListening) vuText.innerHTML = '🎤 Gapiring, mikrofon tayyor';
      }
    }

    animFrameId = requestAnimationFrame(updateMeter);
  }

  updateMeter();
}

function stopMicrophoneHardware() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  analyser = null;
}

/* ========================================================
   OVERLAY DOM CREATION
   ======================================================== */
function createOverlay() {
  overlayEl = document.createElement('div');
  overlayEl.id = 'ambient-voice-overlay';
  overlayEl.className = 'ambient-voice-modal';

  overlayEl.innerHTML = `
    <div class="ambient-backdrop-stars"></div>

    <!-- TOP BAR -->
    <div class="ambient-top-bar">
      <div class="ambient-brand">
        <span style="font-size: 1.4rem;">✨</span>
        <span style="font-weight: 800; letter-spacing: 0.5px;">Gulasal AI &bull; Ovozli Muloqot</span>
      </div>

      <div style="display:flex;align-items:center;gap:10px;">
        <select class="ambient-lang-select" id="ambient-lang-select" title="Tilni tanlash">
          <option value="uz-UZ" selected>🇺🇿 O‘zbekcha (uz-UZ)</option>
          <option value="ru-RU">🇷🇺 Ruscha (ru-RU)</option>
          <option value="en-US">🇬🇧 English (en-US)</option>
        </select>
        <button type="button" class="ambient-close-btn" id="ambient-btn-close" title="Chiqish (Esc)">✕</button>
      </div>
    </div>

    <!-- CENTER 3D ANIMATED ORB -->
    <div class="ambient-orb-wrapper">
      <div class="ambient-orb-ring ring-3"></div>
      <div class="ambient-orb-ring ring-2"></div>
      <div class="ambient-orb-ring ring-1"></div>
      <div class="ambient-orb-core" id="ambient-orb-core">
        <div class="orb-internal-glow"></div>
      </div>
    </div>

    <!-- REAL-TIME MIC VU METER INDICATOR -->
    <div class="ambient-mic-vu-wrap">
      <div class="ambient-mic-vu-track">
        <div class="ambient-mic-vu-fill" id="ambient-mic-level-bar" style="width: 0%;"></div>
      </div>
      <div class="ambient-mic-status-hint" id="ambient-mic-status-hint">
        🎤 Mikrofon sozlanmoqda...
      </div>
    </div>

    <!-- STATUS & CAPTIONS -->
    <div class="ambient-captions-box">
      <div class="ambient-status-pill" id="ambient-status-text">
        Tinglayapman... Bemalol gapiring
      </div>

      <div class="ambient-transcript-text" id="ambient-user-speech">
        «Ovozli savolingiz bu yerda ko‘rinadi...»
      </div>

      <div class="ambient-ai-reply-text" id="ambient-ai-speech" style="display:none;"></div>

      <!-- QUICK CONVERSATION STARTERS -->
      <div class="ambient-quick-prompts-row" id="ambient-prompts-bar">
        <button type="button" class="ambient-prompt-chip" data-text="Salom Gulasal, qandaysan?">👋 Salom Gulasal</button>
        <button type="button" class="ambient-prompt-chip" data-text="Kvadrat tenglamada diskriminant nima?">📐 Kvadrat tenglama nima?</button>
        <button type="button" class="ambient-prompt-chip" data-text="Bugun menga qanday darslarni tavsiya qilasan?">📖 Dars tavsiya qil</button>
        <button type="button" class="ambient-prompt-chip" data-text="IELTS Speaking mashq qilamiz">🎙️ IELTS Speaking</button>
      </div>
    </div>

    <!-- BOTTOM INPUT & CONTROLS -->
    <div class="ambient-controls-bar">
      <!-- Direct manual send input for guaranteed backup -->
      <div class="ambient-text-input-wrap">
        <input type="text" id="ambient-text-fallback" placeholder="Yoki matn bilan savol bering..." autocomplete="off">
        <button type="button" id="ambient-btn-text-send" title="Yuborish">➤</button>
      </div>

      <div style="display:flex;align-items:center;gap:12px;">
        <button type="button" class="ambient-action-btn" id="ambient-btn-toggle-mic" title="Mikrofonni qayta ishga tushirish">
          🎙️
        </button>
        <button type="button" class="ambient-action-btn" id="ambient-btn-force-send" title="Gapirib bo‘ldim (AI javob bersin)" style="display:none;background:#10b981;">
          ✓ Yuborish
        </button>
        <button type="button" class="ambient-end-call-btn" id="ambient-btn-end" title="Suhbatni tugatish">
          Suhbatni yakunlash
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlayEl);

  // Close handlers
  overlayEl.querySelector('#ambient-btn-close').addEventListener('click', closeAmbientVoice);
  overlayEl.querySelector('#ambient-btn-end').addEventListener('click', closeAmbientVoice);

  // Lang selector
  const langSelect = overlayEl.querySelector('#ambient-lang-select');
  langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    stopListening();
    startListening();
  });

  // Toggle Mic
  const toggleMicBtn = overlayEl.querySelector('#ambient-btn-toggle-mic');
  toggleMicBtn.addEventListener('click', () => {
    if (isListening) {
      stopListening();
      toggleMicBtn.innerHTML = '🔇';
      toggleMicBtn.style.background = 'rgba(239, 68, 68, 0.3)';
      setOrbState('idle', 'Mikrofon o‘chirildi');
    } else {
      startListening();
      toggleMicBtn.innerHTML = '🎙️';
      toggleMicBtn.style.background = 'rgba(255, 255, 255, 0.08)';
    }
  });

  // Force Send Button (when user wants to trigger answer immediately)
  const forceSendBtn = overlayEl.querySelector('#ambient-btn-force-send');
  forceSendBtn.addEventListener('click', () => {
    if (accumulatedTranscript.trim()) {
      processUserVoiceInput(accumulatedTranscript.trim());
    }
  });

  // Quick Prompt Chips
  overlayEl.querySelectorAll('.ambient-prompt-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      const userSpeechEl = document.getElementById('ambient-user-speech');
      if (userSpeechEl) userSpeechEl.textContent = `«${text}»`;
      processUserVoiceInput(text);
    });
  });

  // Text Fallback Input
  const textInput = overlayEl.querySelector('#ambient-text-fallback');
  const textSendBtn = overlayEl.querySelector('#ambient-btn-text-send');

  const handleTextSend = () => {
    const val = textInput.value.trim();
    if (!val) return;
    textInput.value = '';
    const userSpeechEl = document.getElementById('ambient-user-speech');
    if (userSpeechEl) userSpeechEl.textContent = `«${val}»`;
    processUserVoiceInput(val);
  };

  textSendBtn.addEventListener('click', handleTextSend);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleTextSend();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayEl.classList.contains('active')) {
      closeAmbientVoice();
    }
  });
}

function setOrbState(state, statusText = '') {
  const orb = document.getElementById('ambient-orb-core');
  const statusEl = document.getElementById('ambient-status-text');

  if (orb) {
    orb.className = 'ambient-orb-core ' + state;
  }
  if (statusEl && statusText) {
    statusEl.textContent = statusText;
  }
}

/* ========================================================
   SPEECH RECOGNITION (LISTENING PIPELINE)
   ======================================================== */
function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const statusEl = document.getElementById('ambient-status-text');
  const userSpeechEl = document.getElementById('ambient-user-speech');
  const forceSendBtn = document.getElementById('ambient-btn-force-send');

  if (!SpeechRecognition) {
    setOrbState('idle', 'Brauzeringiz ovozli yozishni qo‘llab-quvvatlamaydi. Iltimos, Chrome yoki Edge ishlating.');
    return;
  }

  if (recognition) {
    try { recognition.abort(); } catch {}
    recognition = null;
  }

  recognition = new SpeechRecognition();
  recognition.lang = currentLang;
  recognition.continuous = true; // KEEP LISTENING CONTINUOUSLY!
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  accumulatedTranscript = '';

  recognition.onstart = () => {
    isListening = true;
    setOrbState('listening', currentLang === 'uz-UZ' ? 'Sizni tinglayapman... Bemalol gapiring' : 'Listening... Speak naturally');
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    if (final) accumulatedTranscript += final;
    const displayText = (accumulatedTranscript + ' ' + interim).trim();

    if (userSpeechEl && displayText) {
      userSpeechEl.textContent = `«${displayText}»`;
    }

    // Show the "✓ Yuborish" button so user can click to send instantly
    if (forceSendBtn && displayText.length > 1) {
      forceSendBtn.style.display = 'inline-flex';
    }

    // AUTO-SUBMIT SILENCE DETECTOR: If user stops speaking for 1.8 seconds, auto-send!
    clearTimeout(silenceTimer);
    if (displayText.length > 2) {
      silenceTimer = setTimeout(() => {
        if (isListening && !isThinking && !isSpeaking && displayText.trim()) {
          console.log('[AMBIENT SILENCE TIMEOUT] Auto-sending speech:', displayText);
          processUserVoiceInput(displayText.trim());
        }
      }, 1800);
    }
  };

  recognition.onerror = (e) => {
    console.warn('[AMBIENT SPEECH ERROR]:', e.error);

    if (e.error === 'language-not-supported' && currentLang === 'uz-UZ') {
      console.log('uz-UZ language not supported by browser cloud, trying ru-RU...');
      currentLang = 'ru-RU';
      const select = document.getElementById('ambient-lang-select');
      if (select) select.value = 'ru-RU';
      startListening();
      return;
    }

    if (e.error === 'not-allowed') {
      setOrbState('idle', '⚠️ Mikrofonga ruxsat berilmagan. Brauzer manzilidagi 🔒 yoki 🎙️ belgisidan ruxsat bering.');
      isListening = false;
      return;
    }

    if (e.error === 'no-speech') {
      // Don't kill listening on silence; keep going!
      return;
    }

    if (e.error !== 'aborted') {
      setOrbState('idle', `Xatolik: ${e.error}`);
    }
  };

  recognition.onend = () => {
    isListening = false;
    // Auto-restart if we are still active and not thinking or speaking
    if (overlayEl?.classList.contains('active') && !isThinking && !isSpeaking) {
      setTimeout(() => {
        if (overlayEl?.classList.contains('active') && !isThinking && !isSpeaking) {
          try { startListening(); } catch {}
        }
      }, 350);
    }
  };

  try {
    recognition.start();
  } catch (err) {
    console.warn('[RECOGNITION START ERROR]', err);
  }
}

function stopListening() {
  isListening = false;
  clearTimeout(silenceTimer);
  if (recognition) {
    try { recognition.abort(); } catch {}
    recognition = null;
  }
}

/* ========================================================
   AI PROCESS QUERY & VOICE SYNTHESIS
   ======================================================== */
async function processUserVoiceInput(query) {
  stopListening();
  clearTimeout(silenceTimer);
  isThinking = true;
  setOrbState('thinking', 'O‘ylanmoqda...');

  const forceSendBtn = document.getElementById('ambient-btn-force-send');
  if (forceSendBtn) forceSendBtn.style.display = 'none';

  const aiSpeechEl = document.getElementById('ambient-ai-speech');
  if (aiSpeechEl) {
    aiSpeechEl.style.display = 'none';
    aiSpeechEl.textContent = '';
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${SYSTEM_VOICE_PROMPT}\n\nFoydalanuvchi: ${query}`
      })
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'AI dan javob olib bo‘lmadi');
    }

    const reply = data.reply || data.message || 'Kechirasiz, savolingizni tushuna olmadim.';
    speakResponse(reply);

  } catch (err) {
    console.error('[PROCESS VOICE ERROR]', err);
    setOrbState('idle', 'Aloqada xatolik');
    speakResponse('Kechirasiz, aloqada muammo bo‘ldi. Qaytadan urinib ko‘ring.');
  } finally {
    isThinking = false;
  }
}

function speakResponse(text) {
  isSpeaking = true;
  setOrbState('speaking', 'Javob bermoqda...');

  const aiSpeechEl = document.getElementById('ambient-ai-speech');
  if (aiSpeechEl) {
    aiSpeechEl.textContent = text;
    aiSpeechEl.style.display = 'block';
  }

  if (!('speechSynthesis' in window)) {
    isSpeaking = false;
    startListening();
    return;
  }

  // Resume synthesis in case browser paused it
  try {
    window.speechSynthesis.resume();
  } catch {}
  window.speechSynthesis.cancel();

  // Strip markdown formatting for natural voice
  const cleanSpeech = text
    .replace(/[#*_~`\[\]()]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\n\r]+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanSpeech);
  utterance.lang = currentLang;
  utterance.rate = 1.0;
  utterance.pitch = 1.05;

  // Find best available voice
  const voices = window.speechSynthesis.getVoices() || [];
  const targetPrefix = typeof currentLang === 'string' ? currentLang.slice(0, 2) : 'uz';
  const matchVoice = voices.find(v => v?.lang && typeof v.lang === 'string' && v.lang.startsWith(targetPrefix)) || voices[0];
  if (matchVoice) {
    utterance.voice = matchVoice;
  }

  utterance.onend = () => {
    isSpeaking = false;
    setOrbState('listening', 'Sizni eshitmoqdaman...');
    setTimeout(() => {
      if (overlayEl?.classList.contains('active')) {
        startListening();
      }
    }, 400);
  };

  utterance.onerror = (e) => {
    console.warn('[SPEECH SYNTHESIS ERROR]', e);
    isSpeaking = false;
    startListening();
  };

  window.speechSynthesis.speak(utterance);
}
