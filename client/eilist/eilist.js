// ========================================================
// GULASAL AI — EILIST (IELTS) ACADEMY MODULE
// Listening Player • 4-Pillar Syllabus • Interactive Test
// ========================================================

let currentAudio = null;
let currentAbortController = null;

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function speakWord(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

export async function renderEilist(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Cleanup existing audio & listeners
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  const { signal } = currentAbortController;

  container.innerHTML = `
    <div class="eilist-container">
      <div class="app-loading" style="padding: 60px 0; text-align: center;">
        <div class="loading-icon">🎧</div>
        <h2 style="margin: 12px 0 6px;">IELTS Akademiya</h2>
        <p style="color: #a5a4b8;">Bugungi dars va listening audiosi yuklanmoqda...</p>
      </div>
    </div>
  `;

  let todayData = null;
  try {
    const res = await fetch('/api/eilist/today', {
      headers: { 'Cache-Control': 'no-store' }
    });
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Dars ma’lumotlari topilmadi.');
    }
    todayData = json.data;
  } catch (err) {
    container.innerHTML = `
      <div class="eilist-container">
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 18px; padding: 28px; text-align: center; color: #fca5a5;">
          <h3>Darsni yuklab bo‘lmadi</h3>
          <p style="margin: 10px 0 16px;">${err.message}</p>
          <button id="eilist-retry-btn" class="section-complete-btn" style="margin: 0; background: #813bff;">Qayta urinish</button>
        </div>
      </div>
    `;
    const retryBtn = document.getElementById('eilist-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => renderEilist(containerId), { signal });
    }
    return;
  }

  const { lesson, progress, stats } = todayData;
  const userAnswers = {};
  let activeTab = 'listening';

  function renderView() {
    const p = todayData.progress;
    const l = todayData.lesson;

    container.innerHTML = `
      <div class="eilist-container">
        <!-- 1. HERO HEADER & DAILY SYLLABUS -->
        <header class="eilist-hero">
          <div class="eilist-hero-top">
            <span class="eilist-badge-source">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              ${l.source || 'Developing Tactics for Listening'}
            </span>
            <span class="eilist-band-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              ${l.targetBand || 'IELTS Band 7.5+'}
            </span>
          </div>

          <h1 class="eilist-hero-title">${l.unit || 'Unit 1: The Weekend & Daily Activities'}</h1>
          <p class="eilist-hero-subtitle">
            IELTS imtihoniga tayyorgarlik bo‘yicha kundalik 4-bosqichli darslik. Har bir dars listening, so‘z boyligi, grammatika va o‘qishdan iborat.
          </p>

          <!-- 4-PILLAR DAILY LESSON TRACKER -->
          <div class="eilist-pillars-tracker">
            <div class="eilist-pillars-header">
              <span class="eilist-pillars-title">
                ✦ Kundalik Dars Standarti:
                <span style="color: ${p.completed ? '#86efac' : '#a78bfa'}; margin-left: 6px;">
                  ${p.completed ? 'Barcha 4 ta bo‘lim yakunlandi! 🎉' : `${p.completedParts} / 4 ta bo‘lim bajarildi`}
                </span>
              </span>
              <span class="eilist-pillars-score">${p.progressPercentage}% Bajarildi</span>
            </div>

            <div class="eilist-pillars-grid">
              <div class="eilist-pillar-pill ${p.listening ? 'is-completed' : ''} ${activeTab === 'listening' ? 'is-active' : ''}" data-pillar="listening">
                <span>🎧</span>
                <span>1. Listening</span>
                <span>${p.listening ? '✓' : '•'}</span>
              </div>
              <div class="eilist-pillar-pill ${p.vocabulary ? 'is-completed' : ''} ${activeTab === 'vocabulary' ? 'is-active' : ''}" data-pillar="vocabulary">
                <span>📖</span>
                <span>2. Vocabulary</span>
                <span>${p.vocabulary ? '✓' : '•'}</span>
              </div>
              <div class="eilist-pillar-pill ${p.grammar ? 'is-completed' : ''} ${activeTab === 'grammar' ? 'is-active' : ''}" data-pillar="grammar">
                <span>✍️</span>
                <span>3. Grammar</span>
                <span>${p.grammar ? '✓' : '•'}</span>
              </div>
              <div class="eilist-pillar-pill ${p.reading ? 'is-completed' : ''} ${activeTab === 'reading' ? 'is-active' : ''}" data-pillar="reading">
                <span>📜</span>
                <span>4. Reading</span>
                <span>${p.reading ? '✓' : '•'}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- 2. SUB-NAVIGATION TABS -->
        <nav class="eilist-nav-tabs" aria-label="IELTS dars bo‘limlari">
          <button class="eilist-tab-btn ${activeTab === 'listening' ? 'is-active' : ''}" data-tab="listening">
            🎧 Listening Test
          </button>
          <button class="eilist-tab-btn ${activeTab === 'vocabulary' ? 'is-active' : ''}" data-tab="vocabulary">
            📖 Vocabulary (${l.vocabulary?.length || 0})
          </button>
          <button class="eilist-tab-btn ${activeTab === 'grammar' ? 'is-active' : ''}" data-tab="grammar">
            ✍️ Grammar & Qoidalar
          </button>
          <button class="eilist-tab-btn ${activeTab === 'reading' ? 'is-active' : ''}" data-tab="reading">
            📜 Reading Passage
          </button>
        </nav>

        <!-- 3. TAB 1: LISTENING & AUDIO PLAYER -->
        <section id="section-listening" class="eilist-section-view ${activeTab === 'listening' ? 'is-visible' : ''}">
          <!-- AUDIO PLAYER CARD -->
          <div class="listening-player-card" id="listening-player-card">
            <div class="player-header">
              <div class="player-track-info">
                <h3>${l.listening.title}</h3>
                <p>Daraja: ${l.listening.difficulty} • Davomiyligi: ${l.listening.duration || '01:05'}</p>
              </div>

              <!-- ANIMATED EQUALIZER SOUND BARS -->
              <div class="player-equalizer-bars" id="player-equalizer" title="Audio to‘lqinlari">
                <span class="player-bar"></span>
                <span class="player-bar"></span>
                <span class="player-bar"></span>
                <span class="player-bar"></span>
                <span class="player-bar"></span>
              </div>
            </div>

            <!-- TIMELINE & SCRUBBER -->
            <div class="player-timeline-wrap">
              <input type="range" class="player-scrubber" id="audio-scrubber" min="0" max="100" value="0" step="0.1" aria-label="Audio vaqtini boshqarish">
              <div class="player-time-display">
                <span id="player-time-current">00:00</span>
                <span id="player-time-duration">${l.listening.duration || '01:05'}</span>
              </div>
            </div>

            <!-- CONTROLS ROW -->
            <div class="player-controls-row">
              <div class="player-center-buttons">
                <!-- REPLAY -10 SECONDS -->
                <button type="button" class="player-btn-replay" id="btn-replay-10" title="10 soniya orqaga">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                </button>

                <!-- PLAY / PAUSE BUTTON -->
                <button type="button" class="player-btn-play" id="btn-play-pause" title="Ijro etish / Pauza">
                  <span id="play-pause-icon">▶</span>
                </button>

                <!-- REPLAY FROM START -->
                <button type="button" class="player-btn-replay" id="btn-replay-start" title="Boshidan ijro etish">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
                </button>
              </div>

              <!-- VOLUME CONTROLS -->
              <div class="player-volume-wrap">
                <button type="button" class="player-volume-btn" id="btn-volume-toggle" title="Ovozni o‘chirish / yoqish">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </button>
                <input type="range" class="player-volume-slider" id="volume-slider" min="0" max="1" step="0.05" value="0.85" aria-label="Ovoz balandligi">
              </div>
            </div>

            <div id="audio-error-msg" style="display:none; margin-top: 14px; font-size: 12.5px; color: #fca5a5; text-align: center;"></div>
          </div>

          <!-- LISTENING QUESTIONS QUIZ -->
          <div class="listening-quiz-card">
            <div class="listening-quiz-header">
              <h3>IELTS Listening Savollari (${l.listening.questions?.length || 0} ta)</h3>
              <p>Audioni tinglang va har bir savol uchun eng to‘g‘ri javobni belgilang. Test yakunida tahlil va to‘liq audio matn (transcript) ochiladi.</p>
            </div>

            <form id="listening-quiz-form">
              <div class="listening-questions-list">
                ${(l.listening.questions || []).map((q, idx) => `
                  <div class="question-block" data-qid="${q.id}">
                    <div class="question-prompt">
                      ${q.question}
                    </div>
                    <div class="options-grid">
                      ${(q.options || []).map((opt, oIdx) => `
                        <label class="option-label ${userAnswers[q.id] === opt ? 'is-selected' : ''}" data-qid="${q.id}" data-opt="${encodeURIComponent(opt)}">
                          <input type="radio" name="answer_${q.id}" value="${opt}" ${userAnswers[q.id] === opt ? 'checked' : ''}>
                          <span>${opt}</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>

              <button type="submit" class="quiz-submit-btn" id="btn-submit-listening">
                Testni yakunlash va natijani tekshirish
              </button>
            </form>

            <!-- RESULTS CARD (initially hidden or shown if already submitted) -->
            <div id="listening-results-area"></div>
          </div>
        </section>

        <!-- 4. TAB 2: VOCABULARY -->
        <section id="section-vocabulary" class="eilist-section-view ${activeTab === 'vocabulary' ? 'is-visible' : ''}">
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 22px; margin: 0 0 6px;">IELTS & Oxford Akademik So‘zlar</h3>
            <p style="color: #a5a4b8; margin: 0;">Listening va Speaking’da Band 7+ olish uchun talab etiladigan faol lug‘at so‘zlari.</p>
          </div>

          <div class="vocab-grid">
            ${(l.vocabulary || []).map(v => `
              <div class="vocab-card">
                <div class="vocab-word-row">
                  <div>
                    <span class="vocab-word">${v.word}</span>
                    <span style="font-size: 11px; color: #a5a4b8; margin-left: 6px; text-transform: uppercase;">(${v.pos})</span>
                  </div>
                  <button type="button" class="vocab-audio-btn" data-speak="${v.word}" title="Talaffuzni tinglash">
                    🔊
                  </button>
                </div>
                <div class="vocab-phonetic">${v.phonetic}</div>
                <div class="vocab-meaning">${v.meaning}</div>
                <div class="vocab-example">"${v.example}"</div>
                ${v.collocation ? `<div style="font-size: 11.5px; color: #c4a8ff; margin-top: 8px;">◈ Birikma: <strong>${v.collocation}</strong></div>` : ''}
              </div>
            `).join('')}
          </div>

          <div style="text-align: right; margin-top: 24px;">
            <button type="button" class="section-complete-btn" data-complete-section="vocabulary">
              ${p.vocabulary ? '✓ Vocabulary yakunlangan' : 'Lug‘at bo‘limini yakunlash ✓'}
            </button>
          </div>
        </section>

        <!-- 5. TAB 3: GRAMMAR -->
        <section id="section-grammar" class="eilist-section-view ${activeTab === 'grammar' ? 'is-visible' : ''}">
          <div class="listening-quiz-card" style="margin-bottom: 24px;">
            <h3 style="font-size: 22px; margin: 0 0 10px;">${l.grammar.topic}</h3>
            <p style="color: #dfdbf5; line-height: 1.6; margin-bottom: 20px;">${l.grammar.summary}</p>

            <h4 style="color: #a78bfa; margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Asosiy Qoidalar:</h4>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
              ${(l.grammar.rules || []).map(r => `
                <div style="padding: 12px 16px; border-radius: 12px; background: rgba(255,255,255,0.04); border-left: 3px solid #a78bfa; font-size: 13.5px; color: #faf7ff;">
                  ${r}
                </div>
              `).join('')}
            </div>

            <h4 style="color: #ec8df5; margin: 0 0 14px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Band 7+ Amaliy Savollar:</h4>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${(l.grammar.quiz || []).map((gq, idx) => `
                <div class="question-block">
                  <div class="question-prompt">${idx + 1}. ${gq.question}</div>
                  <div class="options-grid">
                    ${(gq.options || []).map((opt, oIdx) => `
                      <label class="option-label" style="cursor: pointer;">
                        <input type="radio" name="grammar_q_${idx}" value="${oIdx}">
                        <span>${opt}</span>
                      </label>
                    `).join('')}
                  </div>
                  <div style="display: none; margin-top: 10px; font-size: 13px; color: #86efac;" class="grammar-feedback">
                    ◈ Izoh: ${gq.explanation}
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="text-align: right; margin-top: 24px;">
              <button type="button" class="section-complete-btn" data-complete-section="grammar">
                ${p.grammar ? '✓ Grammatika yakunlangan' : 'Grammatika bo‘limini yakunlash ✓'}
              </button>
            </div>
          </div>
        </section>

        <!-- 6. TAB 4: READING -->
        <section id="section-reading" class="eilist-section-view ${activeTab === 'reading' ? 'is-visible' : ''}">
          <div class="listening-quiz-card">
            <h3 style="font-size: 22px; margin: 0 0 14px;">${l.reading.title}</h3>
            <div style="padding: 20px; border-radius: 16px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); font-size: 14.5px; line-height: 1.75; color: #dfdbf5; margin-bottom: 24px;">
              ${l.reading.passage}
            </div>

            <h4 style="color: #7dd3fc; margin: 0 0 14px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Matn bo‘yicha tushunish savollari:</h4>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${(l.reading.questions || []).map((rq, idx) => `
                <div class="question-block">
                  <div class="question-prompt">${idx + 1}. ${rq.question}</div>
                  <div class="options-grid">
                    ${(rq.options || []).map((opt, oIdx) => `
                      <label class="option-label" style="cursor: pointer;">
                        <input type="radio" name="reading_q_${idx}" value="${oIdx}">
                        <span>${opt}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="text-align: right; margin-top: 24px;">
              <button type="button" class="section-complete-btn" data-complete-section="reading">
                ${p.reading ? '✓ Reading yakunlangan' : 'Reading bo‘limini yakunlash ✓'}
              </button>
            </div>
          </div>
        </section>
      </div>
    `;

    setupEventListeners();
    setupAudioPlayer(l.listening);
  }

  function setupEventListeners() {
    // 1. Tab switches
    container.querySelectorAll('.eilist-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        switchTab(target);
      }, { signal });
    });

    // 2. Pillar switches
    container.querySelectorAll('.eilist-pillar-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const target = pill.dataset.pillar;
        switchTab(target);
      }, { signal });
    });

    // 3. Radio option selection highlight
    container.querySelectorAll('.option-label').forEach(label => {
      label.addEventListener('click', (e) => {
        const qid = label.dataset.qid;
        const optEncoded = label.dataset.opt;
        if (qid && optEncoded) {
          const opt = decodeURIComponent(optEncoded);
          userAnswers[qid] = opt;
          const parent = label.closest('.options-grid');
          if (parent) {
            parent.querySelectorAll('.option-label').forEach(l => l.classList.remove('is-selected'));
            label.classList.add('is-selected');
          }
        }
      }, { signal });
    });

    // 4. Vocabulary pronunciation
    container.querySelectorAll('[data-speak]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakWord(btn.dataset.speak);
      }, { signal });
    });

    // 5. Complete Section buttons (vocabulary, grammar, reading)
    container.querySelectorAll('[data-complete-section]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const section = btn.dataset.completeSection;
        btn.disabled = true;
        btn.textContent = 'Yuklanmoqda...';

        try {
          const res = await fetch('/api/eilist/complete-section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section })
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.message);
          todayData = json.data;
          renderView();
        } catch (err) {
          alert('Xatolik: ' + err.message);
          btn.disabled = false;
        }
      }, { signal });
    });

    // 6. Submit Listening Test
    const quizForm = container.querySelector('#listening-quiz-form');
    if (quizForm) {
      quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = container.querySelector('#btn-submit-listening');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Test tekshirilmoqda...';
        }

        try {
          const res = await fetch('/api/eilist/submit-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: userAnswers })
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.message);

          displayQuizResults(json.data);

          // Update todayData progress
          const ref = await fetch('/api/eilist/today');
          const refJson = await ref.json();
          if (refJson.success) {
            todayData.progress = refJson.data.progress;
            updatePillarHeader();
          }
        } catch (err) {
          alert('Testni yuborishda xatolik: ' + err.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Qayta tekshirish';
          }
        }
      }, { signal });
    }
  }

  function switchTab(tabName) {
    activeTab = tabName;
    container.querySelectorAll('.eilist-tab-btn').forEach(b => {
      b.classList.toggle('is-active', b.dataset.tab === tabName);
    });
    container.querySelectorAll('.eilist-pillar-pill').forEach(p => {
      p.classList.toggle('is-active', p.dataset.pillar === tabName);
    });
    container.querySelectorAll('.eilist-section-view').forEach(s => {
      s.classList.remove('is-visible');
    });
    const targetSection = container.querySelector(`#section-${tabName}`);
    if (targetSection) {
      targetSection.classList.add('is-visible');
    }
  }

  function updatePillarHeader() {
    const p = todayData.progress;
    const titleEl = container.querySelector('.eilist-pillars-title');
    const scoreEl = container.querySelector('.eilist-pillars-score');
    if (titleEl) {
      titleEl.innerHTML = `✦ Kundalik Dars Standarti: <span style="color: ${p.completed ? '#86efac' : '#a78bfa'}; margin-left: 6px;">${p.completed ? 'Barcha 4 ta bo‘lim yakunlandi! 🎉' : `${p.completedParts} / 4 ta bo‘lim bajarildi`}</span>`;
    }
    if (scoreEl) {
      scoreEl.textContent = `${p.progressPercentage}% Bajarildi`;
    }
    container.querySelectorAll('.eilist-pillar-pill').forEach(pill => {
      const k = pill.dataset.pillar;
      pill.classList.toggle('is-completed', Boolean(p[k]));
    });
  }

  function displayQuizResults(data) {
    const resultsArea = container.querySelector('#listening-results-area');
    if (!resultsArea) return;

    const { correctCount, totalQuestions, percentage, bandScore, review } = data;
    const l = todayData.lesson;

    resultsArea.innerHTML = `
      <div class="quiz-results-card">
        <div class="results-score-row">
          <div class="score-circle-badge">
            <div class="score-ring">${percentage}%</div>
            <div class="score-details">
              <h4>${bandScore}</h4>
              <p>Natija: ${correctCount} / ${totalQuestions} to‘g‘ri javob</p>
            </div>
          </div>
          <button type="button" class="toggle-transcript-btn" id="btn-toggle-transcript">
            📜 Audio Matnini (Transcript) Ko‘rish
          </button>
        </div>

        <!-- TRANSCRIPT COLLAPSIBLE -->
        <div class="transcript-panel" id="transcript-panel">
          <h4 style="margin: 0 0 14px; font-size: 15px; color: #a78bfa;">Developing Tactics for Listening • To‘liq Audio Matn:</h4>
          ${(l.listening.transcript || []).map(t => `
            <div class="transcript-line">
              <span class="transcript-time">[${t.time}]</span>
              <span class="transcript-speaker">${t.speaker}:</span>
              <span>${t.text}</span>
            </div>
          `).join('')}
        </div>

        <h4 style="margin: 20px 0 12px; font-size: 15px; color: #faf7ff;">Xatolar Tahlili va To‘g‘ri Javoblar:</h4>
        <div class="review-items-list">
          ${(review || []).map(r => `
            <div class="review-item ${r.isCorrect ? 'is-correct' : 'is-wrong'}">
              <div class="review-item-header">
                <span>${r.question}</span>
                <span class="review-badge">${r.isCorrect ? 'TO‘G‘RI ✓' : 'NOTO‘G‘RI ✗'}</span>
              </div>
              <div style="font-size: 13px; margin: 4px 0;">
                Sizning javobingiz: <strong style="color: ${r.isCorrect ? '#86efac' : '#fca5a5'};">${r.userAnswer || '(Belgilanmagan)'}</strong>
                ${!r.isCorrect ? ` • To‘g‘ri javob: <strong style="color: #86efac;">${r.correctAnswer}</strong>` : ''}
              </div>
              ${r.explanation ? `<div class="review-explanation">💡 ${r.explanation}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const toggleTranscriptBtn = resultsArea.querySelector('#btn-toggle-transcript');
    const transcriptPanel = resultsArea.querySelector('#transcript-panel');
    if (toggleTranscriptBtn && transcriptPanel) {
      toggleTranscriptBtn.addEventListener('click', () => {
        const isOpen = transcriptPanel.classList.toggle('is-open');
        toggleTranscriptBtn.textContent = isOpen ? '✕ Transcriptni Yashirish' : '📜 Audio Matnini (Transcript) Ko‘rish';
      }, { signal });
    }

    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setupAudioPlayer(listeningData) {
    const playPauseBtn = container.querySelector('#btn-play-pause');
    const playPauseIcon = container.querySelector('#play-pause-icon');
    const scrubber = container.querySelector('#audio-scrubber');
    const curTimeEl = container.querySelector('#player-time-current');
    const durTimeEl = container.querySelector('#player-time-duration');
    const cardEl = container.querySelector('#listening-player-card');
    const replay10Btn = container.querySelector('#btn-replay-10');
    const replayStartBtn = container.querySelector('#btn-replay-start');
    const volumeSlider = container.querySelector('#volume-slider');
    const volumeBtn = container.querySelector('#btn-volume-toggle');
    const errorMsgEl = container.querySelector('#audio-error-msg');

    if (!playPauseBtn || !scrubber) return;

    currentAudio = new Audio(listeningData.audioUrl);
    currentAudio.preload = 'metadata';

    // Handle backup fallback on error
    currentAudio.addEventListener('error', () => {
      console.warn('[EILIST AUDIO] Primary audio failed, falling back...');
      if (listeningData.backupAudioUrl && currentAudio.src !== listeningData.backupAudioUrl) {
        currentAudio.src = listeningData.backupAudioUrl;
        currentAudio.load();
      } else {
        if (errorMsgEl) {
          errorMsgEl.style.display = 'block';
          errorMsgEl.textContent = 'Audio yuklashda xatolik yuz berdi. Iltimos brauzer ruxsatlarini tekshiring.';
        }
      }
    }, { signal });

    let isSeeking = false;

    // Play / Pause toggle
    async function togglePlay() {
      if (!currentAudio) return;
      if (currentAudio.paused) {
        try {
          await currentAudio.play();
          playPauseIcon.textContent = '❚❚';
          cardEl.classList.add('is-playing');
        } catch (err) {
          console.warn('[AUDIO PLAY BLOCKED]', err);
        }
      } else {
        currentAudio.pause();
        playPauseIcon.textContent = '▶';
        cardEl.classList.remove('is-playing');
      }
    }

    playPauseBtn.addEventListener('click', togglePlay, { signal });

    // Duration and current time
    currentAudio.addEventListener('loadedmetadata', () => {
      if (durTimeEl && currentAudio.duration) {
        durTimeEl.textContent = formatTime(currentAudio.duration);
      }
    }, { signal });

    currentAudio.addEventListener('timeupdate', () => {
      if (!isSeeking && currentAudio.duration) {
        const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
        scrubber.value = pct;
        if (curTimeEl) curTimeEl.textContent = formatTime(currentAudio.currentTime);
      }
    }, { signal });

    currentAudio.addEventListener('ended', () => {
      playPauseIcon.textContent = '▶';
      cardEl.classList.remove('is-playing');
      scrubber.value = 0;
      if (curTimeEl) curTimeEl.textContent = '00:00';
    }, { signal });

    // Scrubber interaction
    scrubber.addEventListener('input', () => {
      isSeeking = true;
      if (currentAudio.duration) {
        const seekTime = (scrubber.value / 100) * currentAudio.duration;
        if (curTimeEl) curTimeEl.textContent = formatTime(seekTime);
      }
    }, { signal });

    scrubber.addEventListener('change', () => {
      if (currentAudio.duration) {
        currentAudio.currentTime = (scrubber.value / 100) * currentAudio.duration;
      }
      isSeeking = false;
    }, { signal });

    // Replay 10s back
    if (replay10Btn) {
      replay10Btn.addEventListener('click', () => {
        if (currentAudio) {
          currentAudio.currentTime = Math.max(0, currentAudio.currentTime - 10);
        }
      }, { signal });
    }

    // Replay from start
    if (replayStartBtn) {
      replayStartBtn.addEventListener('click', () => {
        if (currentAudio) {
          currentAudio.currentTime = 0;
          currentAudio.play();
          playPauseIcon.textContent = '❚❚';
          cardEl.classList.add('is-playing');
        }
      }, { signal });
    }

    // Volume Slider
    if (volumeSlider) {
      volumeSlider.addEventListener('input', () => {
        if (currentAudio) {
          currentAudio.volume = parseFloat(volumeSlider.value);
        }
      }, { signal });
    }

    // Volume mute toggle
    if (volumeBtn) {
      let prevVolume = 0.85;
      volumeBtn.addEventListener('click', () => {
        if (!currentAudio) return;
        if (currentAudio.volume > 0) {
          prevVolume = currentAudio.volume;
          currentAudio.volume = 0;
          if (volumeSlider) volumeSlider.value = 0;
        } else {
          currentAudio.volume = prevVolume || 0.85;
          if (volumeSlider) volumeSlider.value = currentAudio.volume;
        }
      }, { signal });
    }
  }

  renderView();
}
