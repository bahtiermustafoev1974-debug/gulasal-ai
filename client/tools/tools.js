/* ========================================================
   GULASAL AI — PREMIUM TOOLS 3.0
   Photo Math • Parabola Lab • IELTS Speaking • Code • Math
   ======================================================== */

import { mountParabolaLab } from '../utils/parabolaGrapher.js';

export const availableTools = [
  {
    id: 'photo-math',
    name: '📸 Photo Math AI (Kameradan)',
    icon: '📸',
    category: 'Vision AI & Matematika',
    description: 'Daftardagi yoki kitobdagi masalani rasmga olib yuklang — to‘liq bosqichma-bosqich yechim beradi.',
    placeholder: 'Masala rasmini yuklang yoki ixtiyoriy tushuntirish yozing...'
  },
  {
    id: 'parabola-grapher',
    name: '📊 Parabola & Grafik Laboratoriyasi',
    icon: '📊',
    category: 'Vizual Matematika',
    description: 'Kvadrat funksiya va tenglamalarni jonli koordinata grafigida ko‘rish, slayderlar bilan diskriminantni hisoblash.',
    placeholder: ''
  },
  {
    id: 'speaking-examiner',
    name: '🎙️ IELTS Speaking Examiner (Ovozli AI)',
    icon: '🎙️',
    category: 'IELTS & Ovozli Suhbat',
    description: 'Jonli ovozli imtihon, 9-band mezonida tahlil, talaffuz, ravonlik va grammatikani tekshirish.',
    placeholder: 'Ovozda gapiring yoki ingliz tilida javobingizni yozing...'
  },
  {
    id: 'math-solver',
    name: '🧮 Formula & Tenglama Yechuvchi',
    icon: '🧮',
    category: 'Aniq fanlar',
    description: 'Har qanday murakkab matematik masalalar va tenglamalarni tahlil qilish.',
    placeholder: 'Masalan: 3x² - 12x + 9 = 0 tenglamani yeching...'
  },
  {
    id: 'essay-check',
    name: '✍️ Insho & Esse Tekshiruvchi',
    icon: '✍️',
    category: 'Tillar va Adabiyot',
    description: 'Insho va esselarni imlo, uslub va akademik so‘z boyligi bo‘yicha tekshirish.',
    placeholder: 'O‘zbek yoki ingliz tilidagi inshongizni bu yerga kiriting...'
  },
  {
    id: 'code-helper',
    name: '⚙️ Kod Yozish Yordamchisi',
    icon: '⚙️',
    category: 'IT va Dasturlash',
    description: 'Dasturlash, xatolarni tuzatish va algoritmlarni o‘rganish yordamchisi.',
    placeholder: 'Masalan: JavaScript yoki Python tilida saralash algoritmini yozib bering...'
  },
  {
    id: 'quiz-generator',
    name: '📝 Test Generator',
    icon: '📝',
    category: 'Ta’lim',
    description: 'Ixtiyoriy mavzu bo‘yicha 4 variantli test savollari va kalitlarini tuzish.',
    placeholder: 'Masalan: Nyuton qonunlari bo‘yicha 5 ta test savoli...'
  }
];

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function showToolNotification(message) {
  let toast = document.querySelector('.mentor-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'mentor-toast';
    document.body.appendChild(toast);
  }
  toast.className = 'mentor-toast error';
  toast.textContent = message;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.remove(), 3000);
}

function formatMarkdown(text = '') {
  let html = escapeHTML(text);

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h4 style="color:#f4f4f5;font-weight:600;margin:12px 0 6px;">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 style="color:#faf7ff;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px;margin:16px 0 8px;">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 style="color:#fff;margin:18px 0 10px;">$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#fff;">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/gim, '<pre style="background:rgba(0,0,0,0.5);padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);overflow-x:auto;"><code>$1</code></pre>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li style="margin-left:20px;color:#cbd5e1;">$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul style="padding-left:10px;margin:8px 0;">$1</ul>');

  // Line breaks
  html = html.replace(/\n/gim, '<br>');

  return html;
}

function renderResult(container, result) {
  container.replaceChildren();

  const content = document.createElement('div');
  content.className = 'tool-result-content';
  content.style.cssText = 'line-height:1.65;font-size:0.95rem;color:#e2e8f0;padding:16px;background:rgba(255,255,255,0.02);border-radius:14px;border:1px solid rgba(255,255,255,0.06);';
  content.innerHTML = formatMarkdown(result);

  container.appendChild(content);

  // KaTeX rendering if available
  try {
    if (window.renderMathInElement) {
      window.renderMathInElement(content, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  } catch (e) {
    console.warn('[KATEX RENDER WARN]', e);
  }
}

export function renderTools(containerId = 'view-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <section class="tools-page">
      <div class="section-header">
        <div>
          <span class="mentor-eyebrow">GULASAL AI • ADVANCED SUITE 2026</span>
          <h2>🛠️ AI Ta’lim & Innovatsion Asboblar</h2>
          <p>Kameradan masala yechish, interaktiv grafiklar, IELTS Speaking simulyatori va chuqur tahlillar.</p>
        </div>
      </div>

      <div class="cards-grid" id="tools-cards-grid">
        ${availableTools.map((tool, index) => `
          <button
            class="tool-card"
            type="button"
            data-tool-id="${escapeHTML(tool.id)}"
            aria-label="${escapeHTML(tool.name)} vositasini ochish"
            style="animation-delay:${index * 50}ms"
          >
            <div class="tool-header">
              <div class="tool-icon">${tool.icon}</div>
              <div>
                <h4>${escapeHTML(tool.name)}</h4>
                <span class="tool-category">${escapeHTML(tool.category)}</span>
              </div>
            </div>
            <p>${escapeHTML(tool.description)}</p>
            <span class="tool-card-action">Ishga tushirish <span>→</span></span>
          </button>
        `).join('')}
      </div>

      <!-- WORKSPACE -->
      <section class="tool-interactive-box" id="tool-workspace" hidden>
        <div class="tool-workspace-header">
          <div>
            <span class="mentor-eyebrow">GULASAL AI • ISH MAYDONI</span>
            <h3 id="active-tool-title">AI vosita</h3>
          </div>
          <button class="btn btn-secondary" id="close-workspace-btn" type="button">✕ Yopish</button>
        </div>

        <!-- SPECIAL CONTAINER FOR INTERACTIVE PARABOLA GRAPH -->
        <div id="parabola-lab-mount" style="display:none;margin-bottom:16px;"></div>

        <!-- SPECIAL CONTAINER FOR PHOTO MATH UPLOAD -->
        <div id="photo-math-mount" style="display:none;margin-bottom:16px;">
          <div class="photo-dropzone" id="photo-dropzone">
            <span style="font-size:2.2rem;display:block;margin-bottom:8px;">📷</span>
            <strong style="color:#fff;font-size:1rem;display:block;margin-bottom:4px;">
              Daftardagi yoki kitobdagi masalani yuklang
            </strong>
            <span style="font-size:0.8rem;color:#94a3b8;">
              Rasmni bu yerga tashlang yoki faylni tanlang (JPG, PNG, WebP)
            </span>
            <input type="file" id="photo-file-input" accept="image/*" capture="environment" style="display:none;">
            <div style="margin-top:14px;">
              <button type="button" class="btn btn-secondary" id="browse-photo-btn" style="font-size:0.8rem;padding:6px 14px;">
                📂 Rasm tanlash / Suratga olish
              </button>
            </div>
          </div>

          <div class="photo-preview-box" id="photo-preview-box" style="display:none;">
            <img class="photo-preview-img" id="photo-preview-img" alt="Masala rasmi">
            <div class="photo-scanner-beam" id="photo-scanner-beam"></div>
            <button class="photo-remove-btn" id="photo-remove-btn" type="button" title="Rasmni o‘chirish">✕</button>
          </div>
        </div>

        <!-- SPECIAL CONTAINER FOR IELTS SPEAKING SIMULATOR -->
        <div id="speaking-mount" style="display:none;margin-bottom:16px;">
          <div class="speaking-examiner-wrap">
            <div class="examiner-header">
              <div class="examiner-avatar">👨‍🏫</div>
              <div>
                <h4 style="margin:0;color:#fff;font-size:1rem;">IELTS Certified AI Examiner</h4>
                <span style="font-size:0.75rem;color:#38bdf8;">Rasmiy 9-band mezonida tekshirish</span>
              </div>
            </div>

            <div style="display:flex;gap:8px;margin-bottom:14px;">
              <button type="button" class="preset-chip active" id="btn-part1">Part 1 (Interview)</button>
              <button type="button" class="preset-chip" id="btn-part2">Part 2 (Cue Card)</button>
              <button type="button" class="preset-chip" id="btn-part3">Part 3 (Discussion)</button>
              <button type="button" class="preset-chip" id="btn-random-q" style="margin-left:auto;">🎲 Yangi savol</button>
            </div>

            <div class="examiner-question-card">
              <h4 id="examiner-part-badge">Part 1: Introduction</h4>
              <p id="examiner-question-text">"Could you describe your hometown and what you like most about it?"</p>
              <button type="button" class="btn btn-secondary" id="btn-speak-question" style="margin-top:10px;font-size:0.75rem;padding:4px 10px;">
                🔊 Savolni ovozda eshitish
              </button>
            </div>

            <div class="voice-controls-bar">
              <button type="button" class="voice-pulse-btn" id="btn-record-voice" title="Gapirish uchun bosing">
                🎙️
              </button>
              <span id="voice-record-status" style="font-size:0.85rem;color:#cbd5e1;font-weight:600;">
                Mikrofonni bosib ingliz tilida javob bering
              </span>
              <div class="audio-waves-container">
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- STANDARD TEXTAREA -->
        <div id="standard-textarea-wrap">
          <label for="tool-input-textarea" class="tool-input-label" id="tool-textarea-label">
            Savolingiz yoki matningiz
          </label>
          <textarea
            class="tool-textarea"
            id="tool-input-textarea"
            maxlength="10000"
            rows="6"
            placeholder="Bu yerga matn kiriting..."
          ></textarea>
        </div>

        <div class="tool-workspace-footer">
          <span id="tool-character-count">0 / 10000</span>
          <button class="btn btn-primary" id="run-tool-btn" type="button">
            ⚡ AI tahlilni boshlash
          </button>
        </div>

        <div class="tool-result" id="tool-result-box" hidden aria-live="polite"></div>
      </section>
    </section>
  `;

  // Selectors
  const workspace = container.querySelector('#tool-workspace');
  const activeTitle = container.querySelector('#active-tool-title');
  const textarea = container.querySelector('#tool-input-textarea');
  const textareaLabel = container.querySelector('#tool-textarea-label');
  const standardTextareaWrap = container.querySelector('#standard-textarea-wrap');
  const runBtn = container.querySelector('#run-tool-btn');
  const resultBox = container.querySelector('#tool-result-box');
  const closeBtn = container.querySelector('#close-workspace-btn');
  const characterCount = container.querySelector('#tool-character-count');

  // Mounts
  const parabolaMount = container.querySelector('#parabola-lab-mount');
  const photoMount = container.querySelector('#photo-math-mount');
  const speakingMount = container.querySelector('#speaking-mount');

  // Photo Math Elements
  const dropzone = container.querySelector('#photo-dropzone');
  const fileInput = container.querySelector('#photo-file-input');
  const browseBtn = container.querySelector('#browse-photo-btn');
  const previewBox = container.querySelector('#photo-preview-box');
  const previewImg = container.querySelector('#photo-preview-img');
  const scannerBeam = container.querySelector('#photo-scanner-beam');
  const removePhotoBtn = container.querySelector('#photo-remove-btn');

  // Speaking Elements
  const partBadge = container.querySelector('#examiner-part-badge');
  const questionText = container.querySelector('#examiner-question-text');
  const speakQBtn = container.querySelector('#btn-speak-question');
  const recordVoiceBtn = container.querySelector('#btn-record-voice');
  const voiceStatus = container.querySelector('#voice-record-status');
  const btnPart1 = container.querySelector('#btn-part1');
  const btnPart2 = container.querySelector('#btn-part2');
  const btnPart3 = container.querySelector('#btn-part3');
  const btnRandomQ = container.querySelector('#btn-random-q');

  let currentTool = null;
  let requestController = null;
  let currentBase64Image = null;
  let recognition = null;
  let isRecording = false;

  const IELTS_QUESTIONS = {
    'Part 1': [
      'Could you describe your hometown and what you like most about it?',
      'Do you prefer studying alone or with a group of friends? Why?',
      'How often do you use technology in your daily studies?'
    ],
    'Part 2': [
      'Describe a difficult challenge you successfully overcame. You should say: what it was, how you handled it, and what you learned.',
      'Describe an interesting book or article you recently read and why it influenced you.'
    ],
    'Part 3': [
      'In what ways do you think artificial intelligence will transform higher education in the next decade?',
      'Do you think modern students rely too heavily on internet search engines instead of critical thinking?'
    ]
  };
  let currentSpeakingPart = 'Part 1';

  /* ==========================================
     TOOL SELECTION
  ========================================== */
  container.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.dataset.toolId;
      const selected = availableTools.find(t => t.id === toolId);
      if (!selected) return;

      currentTool = selected;
      activeTitle.textContent = `${selected.icon} ${selected.name}`;
      workspace.hidden = false;
      resultBox.hidden = true;
      resultBox.replaceChildren();
      runBtn.disabled = false;
      runBtn.textContent = '⚡ AI tahlilni boshlash';

      // Reset mounts
      parabolaMount.style.display = 'none';
      photoMount.style.display = 'none';
      speakingMount.style.display = 'none';
      standardTextareaWrap.style.display = 'block';

      if (toolId === 'parabola-grapher') {
        parabolaMount.style.display = 'block';
        standardTextareaWrap.style.display = 'none';
        runBtn.style.display = 'none';
        mountParabolaLab(parabolaMount);
      } else if (toolId === 'photo-math') {
        photoMount.style.display = 'block';
        standardTextareaWrap.style.display = 'block';
        textareaLabel.textContent = 'Qo‘shimcha izoh yoki savol (ixtiyoriy):';
        textarea.placeholder = 'Rasm yuklang yoki kerakli shartni yozing...';
        runBtn.style.display = 'inline-block';
        runBtn.textContent = '📸 Masalani yechish';
      } else if (toolId === 'speaking-examiner') {
        speakingMount.style.display = 'block';
        standardTextareaWrap.style.display = 'block';
        textareaLabel.textContent = 'Sizning javobingiz (Nutq transkripti):';
        textarea.placeholder = 'Mikrofon orqali gapiring yoki inglizcha matningizni kiriting...';
        runBtn.style.display = 'inline-block';
        runBtn.textContent = '🏆 9-Band ballni baholash';
      } else {
        standardTextareaWrap.style.display = 'block';
        textareaLabel.textContent = 'Savolingiz yoki matningiz:';
        textarea.placeholder = selected.placeholder;
        runBtn.style.display = 'inline-block';
        runBtn.textContent = '⚡ AI tahlilni boshlash';
      }

      workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ==========================================
     PHOTO MATH DRAG & DROP & FILE
  ========================================== */
  browseBtn?.addEventListener('click', () => fileInput.click());
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput.click();
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
      showToolNotification('Faqat rasm fayllari (JPG, PNG) qabul qilinadi.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentBase64Image = e.target.result;
      previewImg.src = currentBase64Image;
      previewBox.style.display = 'block';
      dropzone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  removePhotoBtn?.addEventListener('click', () => {
    currentBase64Image = null;
    previewBox.style.display = 'none';
    dropzone.style.display = 'block';
    fileInput.value = '';
  });

  /* ==========================================
     IELTS SPEAKING EXAMINER CONTROLS
  ========================================== */
  function updateQuestion() {
    const list = IELTS_QUESTIONS[currentSpeakingPart] || IELTS_QUESTIONS['Part 1'];
    const q = list[Math.floor(Math.random() * list.length)];
    partBadge.textContent = currentSpeakingPart;
    questionText.textContent = `"${q}"`;
  }

  btnPart1?.addEventListener('click', () => {
    currentSpeakingPart = 'Part 1';
    [btnPart1, btnPart2, btnPart3].forEach(b => b.classList.remove('active'));
    btnPart1.classList.add('active');
    updateQuestion();
  });

  btnPart2?.addEventListener('click', () => {
    currentSpeakingPart = 'Part 2';
    [btnPart1, btnPart2, btnPart3].forEach(b => b.classList.remove('active'));
    btnPart2.classList.add('active');
    updateQuestion();
  });

  btnPart3?.addEventListener('click', () => {
    currentSpeakingPart = 'Part 3';
    [btnPart1, btnPart2, btnPart3].forEach(b => b.classList.remove('active'));
    btnPart3.classList.add('active');
    updateQuestion();
  });

  btnRandomQ?.addEventListener('click', updateQuestion);

  speakQBtn?.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = questionText.textContent.replace(/"/g, '');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  });

  // SPEECH RECOGNITION (VOICE MIC)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript + ' ';
      }
      textarea.value = finalTranscript.trim();
      characterCount.textContent = `${textarea.value.length} / 10000`;
    };

    recognition.onerror = (e) => {
      console.warn('[SPEECH ERROR]', e.error);
      isRecording = false;
      recordVoiceBtn.classList.remove('recording');
      voiceStatus.textContent = 'Ovoz yozish to‘xtadi (Matn sifatida yozishingiz mumkin).';
    };

    recognition.onend = () => {
      isRecording = false;
      recordVoiceBtn.classList.remove('recording');
      voiceStatus.textContent = 'Ovoz yozib olindi. Baholash tugmasini bosing.';
    };
  }

  recordVoiceBtn?.addEventListener('click', () => {
    if (!recognition) {
      showToolNotification('Brauzeringiz ovozli yozishni qo‘llab-quvvatlamaydi. Matn kiriting.');
      return;
    }

    if (!isRecording) {
      try {
        recognition.start();
        isRecording = true;
        recordVoiceBtn.classList.add('recording');
        voiceStatus.textContent = 'Tinglanmoqda... Ingliz tilida ravon gapiring!';
      } catch (err) {
        recognition.stop();
        isRecording = false;
      }
    } else {
      recognition.stop();
      isRecording = false;
      recordVoiceBtn.classList.remove('recording');
      voiceStatus.textContent = 'Yozib olish yakunlandi.';
    }
  });

  /* ==========================================
     CLOSE WORKSPACE
  ========================================== */
  closeBtn?.addEventListener('click', () => {
    if (requestController) requestController.abort();
    if (recognition && isRecording) recognition.stop();
    window.speechSynthesis?.cancel();

    workspace.hidden = true;
    currentTool = null;
    currentBase64Image = null;
    textarea.value = '';
    resultBox.replaceChildren();
    resultBox.hidden = true;
  });

  textarea?.addEventListener('input', () => {
    characterCount.textContent = `${textarea.value.length} / 10000`;
  });

  /* ==========================================
     EXECUTE TOOL API
  ========================================== */
  runBtn?.addEventListener('click', async () => {
    if (!currentTool) return;
    const input = textarea.value.trim();
    const toolId = currentTool.id;

    if (toolId === 'photo-math' && !currentBase64Image && !input) {
      showToolNotification('Masala rasmini yuklang yoki masalani yozing.');
      return;
    }

    if (toolId !== 'photo-math' && !input) {
      showToolNotification('Iltimos, matn yoki javobingizni kiriting.');
      textarea.focus();
      return;
    }

    if (requestController) requestController.abort();
    requestController = new AbortController();

    runBtn.disabled = true;
    runBtn.textContent = '⏳ Tahlil qilinmoqda...';
    if (scannerBeam) scannerBeam.classList.add('active');

    resultBox.hidden = false;
    resultBox.replaceChildren();
    const loading = document.createElement('div');
    loading.className = 'tool-loading';
    loading.style.padding = '20px';
    loading.style.textAlign = 'center';
    loading.style.color = '#a78bfa';
    loading.textContent = 'Gulasal AI chuqur tahlil qilmoqda...';
    resultBox.appendChild(loading);

    try {
      const payload = {
        toolId,
        input: input || 'Ushbu rasmdagi masalani batafsil yechib bering.'
      };

      if (toolId === 'photo-math' && currentBase64Image) {
        payload.image = currentBase64Image;
      }

      if (toolId === 'speaking-examiner') {
        payload.part = currentSpeakingPart;
        payload.question = questionText.textContent.replace(/"/g, '');
      }

      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: requestController.signal
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'AI tahlilida xatolik.');
      }

      renderResult(resultBox, data.result);

    } catch (err) {
      if (err.name === 'AbortError') return;
      resultBox.innerHTML = `<p class="tool-error" style="color:#f87171;padding:12px;">⚠️ ${err.message}</p>`;
      showToolNotification(err.message);
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = toolId === 'photo-math' ? '📸 Masalani yechish' : (toolId === 'speaking-examiner' ? '🏆 9-Band ballni baholash' : '⚡ AI tahlilni boshlash');
      if (scannerBeam) scannerBeam.classList.remove('active');
      requestController = null;
    }
  });
}
