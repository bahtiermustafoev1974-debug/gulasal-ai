
/* ==========================================================================
   USTOZ-AI / GULASAL AI — CURRICULUM & DYNAMIC PRACTICE 4.5
   - Standardized IELTS (Akademiya)
   - Dynamic 6-Question Individual Practice for Math, Physics, IT
   - 7-Stage Interactive Lesson Player with Formula & Theory Progression
   ========================================================================== */

import { mountParabolaLab } from '../utils/parabolaGrapher.js';
import { SpeechReader } from '../utils/speechReader.js';
import { exportLessonNotes } from '../utils/lessonNotesExporter.js';
import { openAiLessonModal } from '../utils/aiLessonModal.js';

/* ==========================================
   HELPERS
========================================== */

function escapeHTML(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeProgress(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

/* ==========================================
   API CLIENT FUNCTIONS
========================================== */

export async function getSubjects() {
  try {
    const response = await fetch('/api/curriculum/subjects', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    const json = await response.json().catch(() => ({}));
    if (response.ok && json.success && Array.isArray(json.data) && json.data.length) {
      return json.data;
    }
  } catch {}

  const response = await fetch('/api/subjects', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const json = await response.json().catch(() => ({}));
  return safeArray(json.data);
}

async function fetchDailyLessons() {
  const response = await fetch('/api/lessons/daily', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Kunlik darslarni yuklab bo‘lmadi.');
  }
  return json.data || { date: '', total: 0, completed: 0, percentage: 0, lessons: [] };
}

async function toggleLessonStatus(lessonId, completed) {
  const response = await fetch('/api/lessons/toggle', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonId, completed })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Dars holatini o‘zgartirib bo‘lmadi.');
  }
  return json.data;
}

async function fetchCurriculumSubjects() {
  const response = await fetch('/api/curriculum/subjects', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'O‘quv dasturini yuklab bo‘lmadi.');
  }
  return safeArray(json.data);
}

async function fetchLessonDetail(lessonId) {
  const response = await fetch(`/api/curriculum/lesson/${encodeURIComponent(lessonId)}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Dars ma’lumotini yuklab bo‘lmadi.');
  }
  return json.data;
}

async function completeLessonStage(lessonId, stageNumber) {
  const response = await fetch(`/api/curriculum/lesson/${encodeURIComponent(lessonId)}/stage`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stageNumber })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Bosqichni yakunlashda xatolik yuz berdi.');
  }
  return json.data;
}

async function submitLessonTest(lessonId, answers) {
  const response = await fetch(`/api/curriculum/lesson/${encodeURIComponent(lessonId)}/test`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Testni topshirishda xatolik yuz berdi.');
  }
  return json.data;
}

async function fetchLessonQuiz(lessonId, forceNew = false) {
  const url = `/api/curriculum/lesson/${encodeURIComponent(lessonId)}/quiz${forceNew ? '?forceNew=true' : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Test savollarini yuklab bo‘lmadi.');
  }
  return json.data;
}

async function resetLessonProgress(lessonId) {
  const response = await fetch(`/api/curriculum/lesson/${encodeURIComponent(lessonId)}/reset`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  const json = await response.json().catch(() => ({}));
  return json.data;
}

/* Dynamic Practice API */
async function fetchDynamicSession(subjectId) {
  const response = await fetch(`/api/dynamic-practice/session/${encodeURIComponent(subjectId)}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Mashq savollarini yuklab bo‘lmadi.');
  }
  return json.data;
}

async function submitDynamicAnswers(subjectId, answers) {
  const response = await fetch('/api/dynamic-practice/submit', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjectId, answers })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Javoblarni tekshirib bo‘lmadi.');
  }
  return json.data;
}

async function fetchDynamicStats() {
  const response = await fetch('/api/dynamic-practice/stats', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const json = await response.json().catch(() => ({}));
  return json.data || {};
}

/* ==========================================
   STATE
========================================== */
let activeView = 'catalog'; // 'catalog' or 'curriculum'
let currentSubjectId = null;
let currentCurriculumData = [];
let onTutorCallback = null;

// Dynamic Practice State
let activeDynamicSubject = 'math';
let currentDynamicSession = null;
let currentDynamicAnswers = {};
let dynamicRoundSubmitted = false;
let currentDynamicResults = null;

/* ==========================================
   RENDER DAILY PROGRESS HERO
========================================== */

function renderDailyProgressCard(data) {
  const total = Number(data?.total) || 0;
  const completed = Number(data?.completed) || 0;
  const percentage = safeProgress(data?.percentage);
  const lessons = safeArray(data?.lessons);
  const dateStr = data?.date || new Date().toLocaleDateString('uz-UZ');

  return `
    <div class="daily-progress-container" id="daily-progress-widget">
      <div class="daily-progress-hero">
        <div class="daily-progress-header">
          <div class="daily-progress-badge">
            <span class="pulse-indicator"></span>
            <span>BUGUNGI DARS PROGRESSI • ${escapeHTML(dateStr)}</span>
          </div>
          <span class="daily-ratio">
            <strong>${completed}</strong> / ${total} dars yakunlandi
          </span>
        </div>

        <div class="daily-bar-wrap">
          <div class="daily-percentage-label">
            <span>Kunlik reja bajarilishi</span>
            <strong class="daily-percent-num">${percentage}%</strong>
          </div>
          <div class="daily-track">
            <div
              class="daily-fill"
              id="daily-progress-fill"
              style="width: ${percentage}%;"
            ></div>
          </div>
        </div>
      </div>

      <div class="daily-lessons-list">
        <div class="daily-lessons-heading">
          <span>📋 Bugungi tavsiya etilgan darslar:</span>
          <small>Bosqichlarni o‘rganib bajaring, progress avtomatik hisoblanadi</small>
        </div>

        <div class="daily-items-grid" id="daily-lessons-items">
          ${lessons.map(lesson => {
            return `
              <div class="daily-lesson-item ${lesson.completed ? 'is-done' : ''}" data-lesson-id="${escapeHTML(lesson.id)}">
                <button
                  type="button"
                  class="daily-check-btn ${lesson.completed ? 'checked' : ''}"
                  data-action="toggle-lesson"
                  data-id="${escapeHTML(lesson.id)}"
                  aria-label="Darsni yakunlash"
                  title="${lesson.completed ? 'Yakunlangan' : 'Belgilash'}"
                >
                  ${lesson.completed ? '✓' : ''}
                </button>
                <div class="daily-lesson-info">
                  <div class="daily-lesson-top">
                    <span class="daily-lesson-subject">${escapeHTML(lesson.icon || '📚')} ${escapeHTML(lesson.subject)}</span>
                    <span class="daily-lesson-duration">⏱ ${escapeHTML(lesson.duration)}</span>
                  </div>
                  <strong class="daily-lesson-title">${escapeHTML(lesson.title)}</strong>
                  <p class="daily-lesson-desc">${escapeHTML(lesson.description)}</p>

                  <div style="margin-top: 8px;">
                    <button
                      type="button"
                      class="btn btn-sm btn-start-interactive-lesson"
                      data-action="open-lesson"
                      data-lesson-id="${escapeHTML(lesson.id)}"
                      style="background: #6366f1; color: #fff; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.08); padding: 6px 14px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 12px;"
                    >
                      <span>📖 7 bosqichli darsga kirish</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   DYNAMIC PRACTICE WIDGET (6 QUESTIONS PER ROUND)
========================================================================== */

function renderDynamicPracticeWidget(session, results = null) {
  if (!session) return '<div class="mentor-empty">Mashqlar yuklanmoqda...</div>';

  const questions = safeArray(session.questions);
  const subjectName = session.subjectName || 'Fan';
  const round = session.round || 1;
  const stats = session.stats || {};
  const currentDiff = session.currentDifficulty || 'medium';

  return `
    <div class="dynamic-practice-section" id="dynamic-practice-card">
      <div class="dynamic-practice-header">
        <div class="dynamic-title-area">
          <h3>
            <span>🎯</span>
            <span>Individual Mashqlar & Dinamik Savollar</span>
          </h3>
          <p>IELTSdan tashqari 3 ta bo‘lim uchun savollar har bir o‘quvchiga individual va takrorlanmas shakllanadi.</p>
        </div>

        <div class="dynamic-tabs-bar" id="dynamic-subject-tabs">
          <button type="button" class="dynamic-tab-btn ${activeDynamicSubject === 'math' ? 'is-active' : ''}" data-subject="math">
            <span>📐 Matematika</span>
          </button>
          <button type="button" class="dynamic-tab-btn ${activeDynamicSubject === 'physics' ? 'is-active' : ''}" data-subject="physics">
            <span>⚡ Fizika</span>
          </button>
          <button type="button" class="dynamic-tab-btn ${activeDynamicSubject === 'informatics' ? 'is-active' : ''}" data-subject="informatics">
            <span>💻 Informatika va IT</span>
          </button>
        </div>
      </div>

      <div class="dynamic-meta-bar">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span class="dynamic-round-pill">
            <span>⚡ ${round}-bosqich</span>
            <span>• 6 ta yangi savol</span>
          </span>
          <span class="dynamic-difficulty-pill ${currentDiff}">
            Qiyinlik: ${currentDiff === 'hard' ? 'Qiyin' : currentDiff === 'easy' ? 'Boshlang‘ich' : 'O‘rta'}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
          <span class="dynamic-stats-item">
            Yechilgan: <strong>${stats.totalQuestions || 0} ta</strong>
          </span>
          <span class="dynamic-stats-item">
            Aniqlik darajasi: <strong>${stats.accuracy || 0}%</strong>
          </span>
          <span class="dynamic-stats-item">
            Bosqichlar: <strong>${stats.roundsCompleted || 0} ta</strong>
          </span>
        </div>
      </div>

      ${
        results
          ? `
            <div class="quiz-celebration-banner" style="margin-bottom: 8px;">
              <div class="quiz-celebration-icon">🎯</div>
              <h4>${results.round}-bosqich natijasi: ${results.correctCount} / 6 to‘g‘ri (${results.percentage}%)</h4>
              <p style="margin: 0; color: #e5e2f0; font-size: 13px;">
                Eski savollar to‘plami muvaffaqiyatli topshirildi. Keyingi bosqichda yana 6 ta yangi, takrorlanmas savol taqdim etiladi!
              </p>
            </div>
          `
          : ''
      }

      <!-- 6 QUESTIONS GRID -->
      <div class="dynamic-questions-grid">
        ${questions.map((q, idx) => {
          const res = results?.results?.find(r => r.id === q.id);
          const isSubmitted = Boolean(res);

          return `
            <div class="dynamic-card ${isSubmitted ? (res.isCorrect ? 'answered-correct' : 'answered-incorrect') : ''}" id="dynamic-card-${q.id}">
              <div class="dynamic-card-top">
                <span class="dynamic-card-num">${idx + 1}-SAVOL</span>
                <span class="dynamic-card-topic">${escapeHTML(q.topic || '')}</span>
              </div>

              <h4 class="dynamic-card-question">${escapeHTML(q.question)}</h4>

              <div class="dynamic-options-list">
                ${safeArray(q.options).map(opt => {
                  let optClass = '';
                  if (isSubmitted) {
                    if (opt.id === res.correctAnswer) optClass = 'is-correct';
                    else if (opt.id === res.userAnswer && !res.isCorrect) optClass = 'is-wrong';
                  }

                  return `
                    <label class="dynamic-opt-label ${optClass}" data-q-id="${q.id}" data-opt-id="${opt.id}">
                      <input
                        type="radio"
                        name="dyn_${q.id}"
                        value="${opt.id}"
                        class="quiz-option-radio"
                        ${isSubmitted ? 'disabled' : ''}
                        ${currentDynamicAnswers[q.id] === opt.id ? 'checked' : ''}
                      >
                      <span><strong>${opt.id})</strong> ${escapeHTML(opt.text)}</span>
                    </label>
                  `;
                }).join('')}
              </div>

              ${
                isSubmitted && res.explanation
                  ? `
                    <div class="quiz-explanation-box" style="margin-top: 6px;">
                      💡 <strong>To‘g‘ri javob (${res.correctAnswer}):</strong> ${escapeHTML(res.explanation)}
                    </div>
                  `
                  : ''
              }
            </div>
          `;
        }).join('')}
      </div>

      <!-- FOOTER ACTIONS -->
      <div class="dynamic-actions-bar">
        ${
          results
            ? `
              <button type="button" class="btn-next-dynamic" id="btn-next-dynamic-round">
                <span>Keyingi 6 ta yangi savol (${results.nextRound}-bosqich)</span>
                <span>→</span>
              </button>
            `
            : `
              <button type="button" class="btn-submit-dynamic" id="btn-submit-dynamic-round">
                <span>6 ta savol javoblarini tekshirish ✓</span>
              </button>
            `
        }
      </div>
    </div>
  `;
}

/* ==========================================
   RENDER SUBJECT CARD (CATALOG VIEW)
========================================== */

function renderSubjectCard(subject, index) {
  const id = escapeHTML(subject.id || 'math');
  const name = escapeHTML(subject.name || 'Nomsiz fan');
  const icon = escapeHTML(subject.icon || '📚');
  const description = escapeHTML(
    subject.description || 'Ushbu fan bo‘yicha interaktiv darsliklar va amaliy mashqlar.'
  );

  const method = escapeHTML(subject.method || 'Interaktiv modellashtirish va bosqichli ta’lim');
  const opportunity = escapeHTML(subject.opportunity || 'Oliy darajadagi bilim va ko‘nikmalar');
  const topics = Math.max(0, Number(subject.totalTopics || subject.topics) || 0);
  const progress = safeProgress(subject.progress);
  const modules = safeArray(subject.modules || (subject.topics ? subject.topics.map(t => t.title) : []));

  return `
    <article
      class="subject-card"
      style="animation-delay:${Math.min(index * 60, 600)}ms"
    >
      <div class="subject-top">
        <span class="subject-icon">${icon}</span>
        <span class="subject-topics">${topics} ta mavzu</span>
      </div>

      <div class="subject-main-info">
        <h4 class="subject-title">${name}</h4>
        <p class="subject-desc">${description}</p>
      </div>

      <div class="subject-feature-badge">
        <span class="feature-icon">💡</span>
        <div class="feature-text">
          <small>Ta’lim imkoniyati:</small>
          <span>${opportunity}</span>
        </div>
      </div>

      ${
        modules.length
          ? `
            <div class="subject-modules">
              <strong>Asosiy o‘quv mavzulari:</strong>
              <ul>
                ${modules.slice(0, 4).map(module => `
                  <li>${escapeHTML(typeof module === 'object' ? module.title : module)}</li>
                `).join('')}
              </ul>
            </div>
          `
          : ''
      }

      <div class="subject-progress">
        <div class="subject-progress-info">
          <span>O‘zlashtirish darajasi</span>
          <strong>${progress}%</strong>
        </div>

        <div
          class="progress-bar-bg"
          role="progressbar"
          aria-valuenow="${progress}"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="${name} o‘zlashtirish darajasi"
        >
          <div
            class="progress-bar-fill"
            style="width:${progress}%"
          ></div>
        </div>
      </div>

      <div class="subject-footer" style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; gap: 8px; width: 100%;">
          <button
            class="btn btn-primary open-curriculum-btn"
            type="button"
            data-subject-id="${id}"
            style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 700;"
          >
            <span>📚 O‘quv dasturi</span>
            <span>→</span>
          </button>

          <button
            class="btn ask-tutor-btn"
            type="button"
            data-subject-index="${index}"
            title="AI repetitor bilan suhbat"
            style="background: rgba(255, 255, 255, 0.08); color: #fff; padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.12);"
          >
            <span>💬 AI</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

/* ==========================================
   RENDER DETAILED SUBJECT CURRICULUM VIEW
========================================== */

function renderSubjectCurriculumView(subject, container, onBack) {
  const name = escapeHTML(subject.name);
  const icon = escapeHTML(subject.icon);
  const progress = safeProgress(subject.progress);
  const topics = safeArray(subject.topics);
  const totalLessons = subject.totalLessons || 0;
  const completedLessons = subject.completedLessons || 0;

  container.innerHTML = `
    <div class="curriculum-container">
      <button type="button" class="curriculum-back-btn" id="curriculum-back-btn">
        <span>←</span>
        <span>Barcha fanlar katalogiga qaytish</span>
      </button>

      <!-- SUBJECT HERO BANNER -->
      <div class="curriculum-header-hero">
        <div class="curriculum-hero-top">
          <div class="curriculum-subject-badge">
            <div class="curriculum-subject-icon">${icon}</div>
            <div class="curriculum-subject-titles">
              <h2>${name} — Rasmiy O‘quv Dasturi</h2>
              <p>${escapeHTML(subject.description)}</p>
            </div>
          </div>

          <div class="curriculum-subject-stats">
            <div class="curriculum-stat-item">
              <small>Mavzular</small>
              <strong>${topics.length} ta</strong>
            </div>
            <div style="width: 1px; height: 32px; background: rgba(255, 255, 255, 0.1);"></div>
            <div class="curriculum-stat-item">
              <small>Yakunlangan</small>
              <strong>${completedLessons} / ${totalLessons}</strong>
            </div>
          </div>
        </div>

        <div class="curriculum-progress-wrap">
          <div class="curriculum-progress-meta">
            <span>Fan bo‘yicha umumiy o‘zlashtirish progressi</span>
            <strong>${progress}%</strong>
          </div>
          <div class="curriculum-progress-bar">
            <div class="curriculum-progress-fill" style="width: ${progress}%;"></div>
          </div>
        </div>
      </div>

      <!-- TOPICS & LESSONS ROADMAP -->
      <div class="catalog-section-label" style="font-size: 13px; font-weight: 700; letter-spacing: 1.2px; color: #a1a1b5; margin-top: 10px;">
        MAVZULAR VA BOSQICHLI DARSLAR KETMA-KETLIGI
      </div>

      <div class="curriculum-topics-list">
        ${topics.map((topic, tIdx) => `
          <div class="curriculum-topic-card">
            <div class="curriculum-topic-header">
              <span class="curriculum-topic-tag">${tIdx + 1}-MAVZU</span>
              <h3 class="curriculum-topic-title">${escapeHTML(topic.title)}</h3>
              <p class="curriculum-topic-desc">${escapeHTML(topic.description)}</p>
            </div>

            <div class="curriculum-lessons-grid">
              ${safeArray(topic.lessons).map(lesson => {
                const totalStages = lesson.totalStages || 5;
                const completedCount = lesson.completedStagesCount || 0;
                const isDone = lesson.completed || completedCount >= totalStages;

                return `
                  <div class="curriculum-lesson-row ${isDone ? 'is-completed' : ''}">
                    <div class="curriculum-lesson-info">
                      <div class="curriculum-lesson-icon">${escapeHTML(lesson.icon || icon)}</div>
                      <div class="curriculum-lesson-text">
                        <div class="curriculum-lesson-name">
                          <span>${escapeHTML(lesson.title)}</span>
                          ${lesson.badge ? `<span class="curriculum-badge-pill">${escapeHTML(lesson.badge)}</span>` : ''}
                        </div>
                        <span class="curriculum-lesson-subtitle">${escapeHTML(lesson.subtitle || '')}</span>
                        <div class="curriculum-lesson-meta">
                          <span>⏱ ${escapeHTML(lesson.duration)}</span>
                          <span>•</span>
                          <span class="curriculum-stages-badge">
                            📖 ${completedCount} / ${totalStages} bosqich o‘zlashtirildi
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="curriculum-lesson-actions">
                      <button
                        type="button"
                        class="btn-start-lesson ${isDone ? 'is-done' : ''}"
                        data-action="open-lesson"
                        data-lesson-id="${escapeHTML(lesson.id)}"
                      >
                        <span>${isDone ? '✓ Qayta ko‘rish' : (completedCount > 0 ? 'Davom ettirish' : 'Darsni boshlash')}</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Bind back button
  container.querySelector('#curriculum-back-btn')?.addEventListener('click', onBack);

  // Bind start lesson buttons
  container.querySelectorAll('[data-action="open-lesson"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lessonId = btn.dataset.lessonId;
      openLessonPlayer(lessonId, () => {
        renderSubjectCurriculumView(subject, container, onBack);
      });
    });
  });
}

/* ==========================================================================
   INTERACTIVE 7-STAGE LESSON PLAYER
========================================================================== */

let activeLessonData = null;
let activeDynamicQuiz = null;
let currentStageIndex = 1;
let currentQuizAnswers = {};

async function openLessonPlayer(lessonId = 'lesson_math_quadratic', onModalClosed) {
  try {
    const data = await fetchLessonDetail(lessonId);
    activeLessonData = data;
    currentQuizAnswers = {};

    currentStageIndex = data.progress?.currentStage || 1;
    if (currentStageIndex > data.lesson.totalStages) {
      currentStageIndex = data.lesson.totalStages;
    }

    document.getElementById('lesson-player-modal-root')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lesson-player-modal-root';
    overlay.className = 'lesson-player-overlay';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    renderModalContent(overlay, onModalClosed);
  } catch (error) {
    alert('Darsni ochishda xatolik: ' + error.message);
  }
}

function renderModalContent(overlay, onModalClosed) {
  if (!activeLessonData) return;

  const { lesson, subject, progress } = activeLessonData;
  const totalStages = lesson.totalStages || 7;
  const completedStages = safeArray(progress.completedStages);
  const completedCount = completedStages.length;
  const percentage = Math.min(100, Math.round((completedCount / totalStages) * 100));

  overlay.innerHTML = `
    <div class="lesson-player-modal" role="dialog" aria-modal="true">
      <div class="lesson-player-header">
        <div class="player-header-top">
          <div class="player-subject-tag">
            <span>${escapeHTML(subject.icon)}</span>
            <span>${escapeHTML(subject.name)} • O‘quv dasturi</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="audio-read-btn" id="player-audio-read-btn" title="Ushbu bosqichni ovozda eshitish">
              <span>🔊</span>
              <span class="audio-btn-label">Ovozda eshitish</span>
            </button>
            <button type="button" class="btn-export-notes" id="player-export-notes-btn" title="Dars konspektini PDF qilib yuklab olish">
              <span>📄 Konspekt (PDF)</span>
            </button>
            <button type="button" class="player-close-btn" id="player-close-btn" title="Yopish (Esc)">✕</button>
          </div>
        </div>

        <div class="player-title-row">
          <h3>${escapeHTML(lesson.title)}</h3>
          <div class="player-progress-badge">
            <span>📖</span>
            <span>${completedCount} / ${totalStages} bosqich o‘zlashtirildi</span>
            <strong>(${percentage}%)</strong>
          </div>
        </div>

        <div class="player-progress-bar-wrap">
          <div class="player-progress-bar-fill" style="width: ${percentage}%;"></div>
        </div>

        <div class="player-stepper" id="player-stepper-list">
          ${(lesson.stages || []).map(stg => {
            const num = stg.stage;
            const isDone = completedStages.includes(num);
            const isActive = num === currentStageIndex;
            const isUnlocked = num === 1 || completedStages.includes(num - 1) || isDone;

            return `
              <button
                type="button"
                class="stepper-pill ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''} ${!isUnlocked ? 'is-locked' : ''}"
                data-stage="${num}"
                ${!isUnlocked ? 'disabled' : ''}
                title="${escapeHTML(stg.title)}"
              >
                <span class="stepper-circle">${isDone ? '✓' : num}</span>
                <span>${num}. ${escapeHTML(stg.title)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <div class="lesson-player-body" id="player-stage-body">
        ${renderStageBody(lesson, currentStageIndex)}
      </div>

      <div class="lesson-player-footer">
        <button
          type="button"
          class="btn-player-nav btn-player-prev"
          id="btn-stage-prev"
          ${currentStageIndex === 1 ? 'disabled' : ''}
        >
          <span>← Oldingi bosqich</span>
        </button>

        <div style="display: flex; align-items: center; gap: 10px;">
          ${
            progress.completed
              ? `
                <button type="button" class="curriculum-back-btn" id="btn-reset-lesson" style="font-size: 12px; padding: 6px 12px;">
                  🔄 Darsni qayta o‘rganish
                </button>
              `
              : ''
          }

          ${
            currentStageIndex === totalStages
              ? `
                <button
                  type="button"
                  class="btn-player-nav btn-player-finish"
                  id="btn-stage-submit-quiz"
                >
                  <span>Yakuniy testni tekshirish ✓</span>
                </button>
              `
              : `
                <button
                  type="button"
                  class="btn-player-nav btn-player-next"
                  id="btn-stage-next"
                >
                  <span>Bosqichni yakunlash & Keyingisi →</span>
                </button>
              `
          }
        </div>
      </div>
    </div>
  `;

  function closeModal() {
    SpeechReader.stop();
    overlay.remove();
    document.body.style.overflow = '';
    if (typeof onModalClosed === 'function') onModalClosed();
  }

  overlay.querySelector('#player-audio-read-btn')?.addEventListener('click', (e) => {
    const stageBody = overlay.querySelector('#player-stage-body');
    const textToRead = stageBody ? stageBody.innerText : (lesson.title || '');
    SpeechReader.speak(textToRead, 'uz-UZ', e.currentTarget);
  });

  overlay.querySelector('#player-export-notes-btn')?.addEventListener('click', () => {
    exportLessonNotes(lesson, subject);
  });

  overlay.querySelector('#player-close-btn')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  const onKeyDown = e => {
    if (e.key === 'Escape') {
      window.removeEventListener('keydown', onKeyDown);
      closeModal();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  overlay.querySelectorAll('.stepper-pill:not(.is-locked)').forEach(btn => {
    btn.addEventListener('click', () => {
      currentStageIndex = Number(btn.dataset.stage);
      renderModalContent(overlay, onModalClosed);
    });
  });

  overlay.querySelector('#btn-stage-prev')?.addEventListener('click', () => {
    if (currentStageIndex > 1) {
      currentStageIndex--;
      renderModalContent(overlay, onModalClosed);
    }
  });

  overlay.querySelector('#btn-stage-next')?.addEventListener('click', async () => {
    const nextBtn = overlay.querySelector('#btn-stage-next');
    if (nextBtn) nextBtn.disabled = true;

    try {
      const updated = await completeLessonStage(lesson.id, currentStageIndex);
      activeLessonData = updated;

      if (currentStageIndex < totalStages) {
        currentStageIndex++;
      }
      renderModalContent(overlay, onModalClosed);
    } catch (err) {
      alert('Xatolik: ' + err.message);
      if (nextBtn) nextBtn.disabled = false;
    }
  });

  overlay.querySelector('#btn-stage-submit-quiz')?.addEventListener('click', async () => {
    const submitBtn = overlay.querySelector('#btn-stage-submit-quiz');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const quizRes = await submitLessonTest(lesson.id, currentQuizAnswers);
      activeLessonData = quizRes.lessonDetail;

      const stageBody = overlay.querySelector('#player-stage-body');
      if (stageBody) {
        stageBody.innerHTML = renderQuizResultsView(quizRes);

        stageBody.querySelector('#btn-quiz-retake-new')?.addEventListener('click', async () => {
          const retakeBtn = stageBody.querySelector('#btn-quiz-retake-new');
          if (retakeBtn) {
            retakeBtn.disabled = true;
            retakeBtn.innerHTML = '<span>Savollar tayyorlanmoqda...</span>';
          }
          currentQuizAnswers = {};
          stageBody.innerHTML = `
            <div class="stage-section-block" style="text-align: center; padding: 50px 20px;">
              <div style="font-size: 38px; display: inline-block; margin-bottom: 12px; animation: spin 1.5s infinite linear;">⚙️</div>
              <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">AI Yangi Savollar To‘plamini Generatsiya Qilmoqda...</h3>
              <p style="color: #b8b1cc; font-size: 14px; max-width: 500px; margin: 0 auto; line-height: 1.6;">
                O‘quvchining o‘zlashtirish darajasiga mos ravishda yangi savollar yaratilmoqda...
              </p>
            </div>
          `;
          try {
            const fresh = await fetchLessonQuiz(lesson.id, true);
            activeDynamicQuiz = fresh;
            stageBody.innerHTML = renderStageBody(lesson, currentStageIndex);
            bindInteractiveQuiz(overlay);
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Yakuniy testni tekshirish ✓';
              submitBtn.className = 'btn-player-nav btn-player-finish';
            }
          } catch (err) {
            alert('Yangi testni yuklashda xatolik: ' + err.message);
          }
        });

        stageBody.querySelector('#btn-quiz-finish-close')?.addEventListener('click', () => {
          closeModal();
        });
      }

      const fill = overlay.querySelector('.player-progress-bar-fill');
      if (fill) fill.style.width = '100%';
      const badgeStrong = overlay.querySelector('.player-progress-badge strong');
      if (badgeStrong) badgeStrong.textContent = '(100%)';
      const badgeSpan = overlay.querySelector('.player-progress-badge span:nth-child(2)');
      if (badgeSpan) badgeSpan.textContent = '7 / 7 bosqich o‘zlashtirildi';

      if (submitBtn) {
        submitBtn.textContent = '✓ Dars 100% Yakunlandi';
        submitBtn.className = 'btn-player-nav btn-player-finish';
      }
    } catch (err) {
      alert('Testni tekshirishda xatolik: ' + err.message);
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  overlay.querySelector('#btn-reset-lesson')?.addEventListener('click', async () => {
    if (confirm('Ushbu dars progressini qaytadan o‘rganish uchun nolga tushirasizmi?')) {
      const reset = await resetLessonProgress(lesson.id);
      activeLessonData = reset;
      currentStageIndex = 1;
      currentQuizAnswers = {};
      renderModalContent(overlay, onModalClosed);
    }
  });

  // Parabola Lab Inside Lesson Toggle
  const labBtn = overlay.querySelector('#btn-open-parabola-lab-lesson');
  const labMount = overlay.querySelector('#lesson-parabola-mount');
  labBtn?.addEventListener('click', () => {
    if (labMount.style.display === 'none') {
      labMount.style.display = 'block';
      labBtn.textContent = '▲ Parabola laboratoriyasini yopish';
      mountParabolaLab(labMount);
    } else {
      labMount.style.display = 'none';
      labBtn.textContent = '📊 Jonli Parabola Simulyatorini ochish (D > 0, D = 0, D < 0 ni sinash)';
    }
  });

  bindInteractiveExercises(overlay);
  bindInteractiveQuiz(overlay);

  // Dynamic AI Quiz Auto-loader for Stage 7
  if (currentStageIndex === totalStages || (lesson.stages && lesson.stages[currentStageIndex - 1]?.type === 'quiz')) {
    if (!activeDynamicQuiz || activeDynamicQuiz.lessonId !== lesson.id) {
      fetchLessonQuiz(lesson.id, false).then(quiz => {
        activeDynamicQuiz = quiz;
        const stageBody = overlay.querySelector('#player-stage-body');
        if (stageBody && (currentStageIndex === totalStages || (lesson.stages && lesson.stages[currentStageIndex - 1]?.type === 'quiz'))) {
          stageBody.innerHTML = renderStageBody(lesson, currentStageIndex);
          bindInteractiveQuiz(overlay);
        }
      }).catch(err => {
        console.warn('[DYNAMIC QUIZ FETCH WARN]', err);
      });
    }
  }
}

function renderStageBody(lesson, stageNum) {
  const stage = (lesson.stages || []).find(s => s.stage === stageNum) || lesson.stages?.[0];
  if (!stage) return '<div class="mentor-empty">Bosqich topilmadi</div>';

  const type = stage.type;
  const content = stage.content || {};

  let innerHTML = '';

  if (type === 'theory' || stageNum === 1) {
    innerHTML = `
      <div class="stage-section-block">
        <h4 style="color: #fff; font-size: 17px; margin-top: 0;">📌 Umumiy tushuncha</h4>
        <p>${escapeHTML(content.overview || '')}</p>
      </div>

      ${content.history ? `
      <div class="stage-highlight-box">
        <strong>📜 Tarixiy ma’lumot va fanning rivojlanishi:</strong>
        <p style="margin: 0; color: #e5e2f0; font-size: 14px; line-height: 1.6;">
          ${escapeHTML(content.history || '')}
        </p>
      </div>` : ''}

      <div class="stage-section-block">
        <h4 style="color: #fff; font-size: 17px; margin-top: 0;">🎯 Darsning asosiy maqsadlari:</h4>
        <ul style="padding-left: 20px; margin: 0; display: flex; flex-direction: column; gap: 8px;">
          ${safeArray(content.goals).map(g => `<li style="color: #faf7ff;">${escapeHTML(g)}</li>`).join('')}
        </ul>
      </div>

      <div style="background: rgba(103, 213, 255, 0.08); border: 1px solid rgba(103, 213, 255, 0.25); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">💡</span>
        <span style="font-size: 13px; color: #b8b1cc;">${escapeHTML(content.tip || '')}</span>
      </div>
    `;
  } else if (type === 'concept' || stageNum === 2) {
    innerHTML = `
      <div class="stage-section-block">
        <p style="font-size: 15px; margin-top: 0;">${escapeHTML(content.definition || '')}</p>
        <div class="formula-showcase-box">
          <div class="formula-label">Kvadrat tenglamaning kanonik (umumiy) ko‘rinishi</div>
          <div class="formula-display">${escapeHTML(content.formula || 'ax² + bx + c = 0')}</div>
          <div class="formula-subnote">${escapeHTML(content.condition || 'a ≠ 0')}</div>
        </div>
      </div>

      <div class="stage-section-block">
        <h4 style="color: #fff; font-size: 17px; margin-top: 0;">🔍 Koeffitsiyentlar tahlili:</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
          ${safeArray(content.components).map(c => `
            <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px;">
              <strong style="color: var(--purple, #a78bfa); font-size: 20px; display: block; font-family: serif;">${escapeHTML(c.label)}</strong>
              <span style="color: #fff; font-weight: 700; font-size: 14px; display: block; margin: 4px 0;">${escapeHTML(c.name)}</span>
              <p style="color: var(--muted, #b8b1cc); font-size: 12px; margin: 0;">${escapeHTML(c.desc)}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="stage-section-block">
        <h4 style="color: #fff; font-size: 17px; margin-top: 0;">📑 Kvadrat tenglamaning asosiy turlari:</h4>
        <div class="conditions-grid">
          ${safeArray(content.types).map(t => `
            <div class="condition-card">
              <strong style="color: #fff; font-size: 14px;">${escapeHTML(t.type)}</strong>
              <div class="condition-roots-formula">${escapeHTML(t.formula)}</div>
              <small style="color: #86efac; font-weight: 600;">Misol: ${escapeHTML(t.example)}</small>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (type === 'formula' || stageNum === 3) {
    innerHTML = `
      <div class="stage-section-block">
        <p style="font-size: 15px; margin-top: 0;">${escapeHTML(content.intro || '')}</p>
        <div class="formula-showcase-box">
          <div class="formula-label">Diskriminantni hisoblash formulasi</div>
          <div class="formula-display" style="color: #ec8df5;">${escapeHTML(content.mainFormula || 'D = b² - 4ac')}</div>
        </div>
      </div>

      <div class="catalog-section-label" style="font-size: 13px; font-weight: 700; letter-spacing: 1.2px; color: #a1a1b5;">
        DISKRIMINANT ISHORASIGA KO‘RA 3 TA ASOSIY HOLAT:
      </div>

      <div class="conditions-grid">
        ${safeArray(content.cases).map(c => `
          <div class="condition-card ${escapeHTML(c.color)}">
            <div class="condition-header">
              <span class="condition-formula">${escapeHTML(c.condition)}</span>
              <span class="condition-badge">${escapeHTML(c.badge)}</span>
            </div>
            <p style="margin: 0; font-size: 13px; color: #faf7ff;">${escapeHTML(c.explanation)}</p>
            <div class="condition-roots-formula">${escapeHTML(c.formula)}</div>
            <small style="color: var(--muted, #b8b1cc);">${escapeHTML(c.detail)}</small>
            <div class="condition-geometry">📐 ${escapeHTML(c.geometry)}</div>
          </div>
        `).join('')}
      </div>

      ${lesson.id === 'lesson_math_quadratic' ? `
      <div style="margin-top: 20px; text-align: center;">
        <button type="button" class="btn btn-secondary" id="btn-open-parabola-lab-lesson" style="background: rgba(168, 85, 247, 0.18); border-color: #a855f7; color: #fff; font-weight: 700; padding: 10px 18px; border-radius: 12px; cursor: pointer;">
          📊 Jonli Parabola Simulyatorini ochish (D &gt; 0, D = 0, D &lt; 0 ni sinash)
        </button>
        <div id="lesson-parabola-mount" style="display: none; margin-top: 16px; text-align: left;"></div>
      </div>` : ''}
    `;
  } else if (type === 'method' || stageNum === 4) {
    innerHTML = `
      <div class="catalog-section-label" style="font-size: 13px; font-weight: 700; letter-spacing: 1.2px; color: #a1a1b5;">
        ${content.steps?.length || 4} QADAMLI ANIQ QO‘LLASH METODIKASI:
      </div>

      <div class="algorithm-steps-list">
        ${safeArray(content.steps).map(st => `
          <div class="algorithm-step-item">
            <div class="algorithm-step-num">${st.num}</div>
            <div class="algorithm-step-content">
              <strong>${escapeHTML(st.title)}</strong>
              <p>${escapeHTML(st.desc)}</p>
            </div>
          </div>
        `).join('')}
      </div>

      ${
        content.vietRule
          ? `
            <div class="stage-highlight-box" style="border-color: rgba(103, 240, 224, 0.4); background: rgba(103, 240, 224, 0.08);">
              <strong style="color: var(--cyan, #67f0e0); font-size: 16px;">✨ ${escapeHTML(content.vietRule.title)}</strong>
              <div class="formula-display" style="font-size: 22px; margin: 12px 0; color: #fff;">
                ${escapeHTML(content.vietRule.formula)}
              </div>
              <p style="margin: 0; color: #b8b1cc; font-size: 13px;">${escapeHTML(content.vietRule.note)}</p>
            </div>
          `
          : ''
      }
    `;
  } else if (type === 'practice' || stageNum === 5) {
    innerHTML = `
      <div class="stage-section-block" style="background: rgba(167, 139, 250, 0.08); border-color: rgba(167, 139, 250, 0.25);">
        <p style="margin: 0; font-size: 14px; color: #faf7ff;">
          Quyida <strong>${escapeHTML(lesson.title)}</strong> bo‘yicha 5 ta namunaviy amaliy vazifa va ularning bosqichma-bosqich tahlili keltirilgan.
        </p>
      </div>

      <div class="examples-grid">
        ${safeArray(content.examples).map(ex => `
          <div class="example-card">
            <div class="example-card-header">
              <span class="example-number-badge">${escapeHTML(ex.title)}</span>
              <span class="example-equation-pill">${escapeHTML(ex.equation)}</span>
            </div>

            <div class="example-steps-list">
              ${safeArray(ex.steps).map(step => `
                <div class="example-step-line">• ${escapeHTML(step)}</div>
              `).join('')}
            </div>

            <div class="example-answer-box">
              <span class="example-answer-text">${escapeHTML(ex.answer)}</span>
              <span class="example-check-text">✓ ${escapeHTML(ex.check)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (type === 'exercises' || stageNum === 6) {
    innerHTML = `
      <div class="stage-section-block">
        <p style="margin: 0; font-size: 14px; color: #faf7ff;">
          Bilimingizni sinash uchun quyidagi mashqlarning to‘g‘ri variantini tanlang va «Tekshirish» tugmasini bosing:
        </p>
      </div>

      <div class="quiz-questions-list">
        ${safeArray(content.exercises).map((ex, exIdx) => `
          <div class="quiz-question-card" id="ex-card-${ex.id}">
            <div class="quiz-question-title">
              <span style="color: var(--purple-light, #c4a8ff);">${exIdx + 1}-Mashq:</span> ${escapeHTML(ex.question)}
            </div>

            <div class="quiz-options-list">
              ${safeArray(ex.options).map(opt => `
                <label class="quiz-option-label" data-exercise-id="${ex.id}" data-opt-id="${opt.id}" data-correct="${Boolean(opt.correct)}">
                  <input type="radio" name="ex_${ex.id}" value="${opt.id}" class="quiz-option-radio">
                  <span><strong>${opt.id})</strong> ${escapeHTML(opt.text)}</span>
                </label>
              `).join('')}
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
              <button type="button" class="btn btn-sm btn-check-exercise" data-exercise-id="${ex.id}" style="background: rgba(167, 139, 250, 0.2); border: 1px solid rgba(167, 139, 250, 0.4); color: #fff; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700;">
                Javobni tekshirish
              </button>
              <span class="exercise-feedback-badge" id="ex-feedback-${ex.id}" style="font-size: 12px; font-weight: 700;"></span>
            </div>

            <div class="quiz-explanation-box" id="ex-expl-${ex.id}" style="display: none;">
              💡 <strong>Tahlil:</strong> ${escapeHTML(ex.explanation)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (type === 'quiz' || stageNum === 7) {
    if (!activeDynamicQuiz || activeDynamicQuiz.lessonId !== lesson.id) {
      innerHTML = `
        <div class="stage-section-block" style="text-align: center; padding: 50px 20px;">
          <div style="font-size: 38px; display: inline-block; margin-bottom: 12px; animation: spin 1.5s infinite linear;">⚙️</div>
          <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">AI Mavzuga Mos Yangi Test Savollarini Yaratmoqda...</h3>
          <p style="color: #b8b1cc; font-size: 14px; max-width: 500px; margin: 0 auto; line-height: 1.6;">
            Gulasal AI sizning o‘zlashtirish tarixingizni tahlil qilib, dars nazariyasiga to‘liq mos keluvchi yangi va takrorlanmaydigan 5 ta sifatli savol to‘plamini generatsiya qilmoqda...
          </p>
        </div>
      `;
    } else {
      const qList = activeDynamicQuiz.questions || [];
      const diffLabel = activeDynamicQuiz.difficultyLabel || 'O‘rta';
      const attemptNum = activeDynamicQuiz.attemptNumber || 1;
      const diffColor = activeDynamicQuiz.difficulty === 'hard' ? '#f43f5e' : (activeDynamicQuiz.difficulty === 'easy' ? '#10b981' : '#a855f7');

      innerHTML = `
        <div class="stage-section-block" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 14px 18px; margin-bottom: 14px;">
          <div>
            <h4 style="color: #fff; margin: 0 0 4px 0; font-size: 16px;">🎯 Dinamik AI Yakuniy Testi</h4>
            <p style="margin: 0; font-size: 13px; color: #b8b1cc;">
              Har bir yangi urinishda dars mavzusiga oid yangi, takrorlanmas savollar beriladi.
            </p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="background: rgba(255,255,255,0.06); border: 1px solid ${diffColor}; color: ${diffColor}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">
              📊 Qiyinlik: ${escapeHTML(diffLabel)}
            </span>
            <span style="background: rgba(103, 240, 224, 0.12); border: 1px solid rgba(103, 240, 224, 0.35); color: #67f0e0; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">
              🔄 ${attemptNum}-urinish
            </span>
          </div>
        </div>

        <div class="quiz-questions-list" id="final-quiz-questions">
          ${qList.map((q, qIdx) => `
            <div class="quiz-question-card" id="quiz-card-${q.id}">
              <div class="quiz-question-title">
                <span style="color: var(--cyan, #67f0e0);">${qIdx + 1}-Savol:</span> ${escapeHTML(q.question)}
              </div>

              <div class="quiz-options-list">
                ${safeArray(q.options).map(opt => `
                  <label class="quiz-option-label ${currentQuizAnswers[q.id] === opt.id ? 'is-selected' : ''}" data-q-id="${q.id}" data-opt-id="${opt.id}">
                    <input type="radio" name="quiz_${q.id}" value="${opt.id}" class="quiz-option-radio" ${currentQuizAnswers[q.id] === opt.id ? 'checked' : ''}>
                    <span><strong>${opt.id})</strong> ${escapeHTML(opt.text)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  return `
    <div class="stage-card-header">
      <div class="stage-eyebrow">BOSQICH ${stageNum} / ${lesson.totalStages || 7}</div>
      <h2 class="stage-card-title">${escapeHTML(stage.title)}</h2>
      <p class="stage-card-subtitle">${escapeHTML(stage.subtitle || '')}</p>
    </div>

    ${innerHTML}
  `;
}

function bindInteractiveExercises(overlay) {
  overlay.querySelectorAll('.btn-check-exercise').forEach(btn => {
    btn.addEventListener('click', () => {
      const exId = btn.dataset.exerciseId;
      const card = overlay.querySelector(`#ex-card-${exId}`);
      if (!card) return;

      const selected = card.querySelector(`input[name="ex_${exId}"]:checked`);
      const feedback = card.querySelector(`#ex-feedback-${exId}`);
      const expl = card.querySelector(`#ex-expl-${exId}`);

      if (!selected) {
        if (feedback) {
          feedback.style.color = '#ffbd75';
          feedback.textContent = 'Iltimos, avval variantni tanlang!';
        }
        return;
      }

      const label = selected.closest('.quiz-option-label');
      const isCorrect = label?.dataset.correct === 'true';

      if (isCorrect) {
        card.classList.add('answered-correct');
        card.classList.remove('answered-incorrect');
        label.classList.add('is-correct');
        if (feedback) {
          feedback.style.color = '#86efac';
          feedback.textContent = '✓ To‘g‘ri javob!';
        }
      } else {
        card.classList.add('answered-incorrect');
        card.classList.remove('answered-correct');
        label.classList.add('is-wrong');
        card.querySelector('[data-correct="true"]')?.classList.add('is-correct');
        if (feedback) {
          feedback.style.color = '#ff8585';
          feedback.textContent = '✗ Noto‘g‘ri!';
        }
      }

      if (expl) expl.style.display = 'block';
    });
  });

  overlay.querySelectorAll('.quiz-option-label input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const container = radio.closest('.quiz-options-list');
      if (!container) return;
      container.querySelectorAll('.quiz-option-label').forEach(l => l.classList.remove('is-selected'));
      radio.closest('.quiz-option-label')?.classList.add('is-selected');
    });
  });
}

function bindInteractiveQuiz(overlay) {
  overlay.querySelectorAll('#final-quiz-questions .quiz-option-label input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const qId = radio.closest('.quiz-option-label')?.dataset.qId;
      const optId = radio.value;
      if (qId && optId) {
        currentQuizAnswers[qId] = optId;
      }
    });
  });
}

function renderQuizResultsView(quizRes) {
  const score = quizRes.score || {};
  const results = safeArray(quizRes.results);
  const isPassed = Boolean(score.passed || score.scorePercentage >= 60);

  let adaptiveNote = '';
  if (score.scorePercentage >= 80) {
    adaptiveNote = 'Ajoyib natija (80%+)! Siz mavzuni a’lo darajada o‘zlashtirdingiz. Keyingi urinishda siz uchun yanada chuqurlashtirilgan Murakkab darajadagi yangi savollar beriladi.';
  } else if (score.scorePercentage >= 50) {
    adaptiveNote = 'Yaxshi natija! Mavzuning asosiy qoidalari o‘zlashtirildi. Keyingi urinishda O‘rta darajadagi yangi savollar bilan bilimlarni mustahkamlashingiz mumkin.';
  } else {
    adaptiveNote = 'Mavzuni yana bir bor takrorlash tavsiya etiladi. Keyingi urinishda savollar soddalashtiriladi (Boshlang‘ich daraja).';
  }

  return `
    <div class="quiz-celebration-banner" style="background: ${isPassed ? '#12151b' : '#181215'}; border: 1px solid ${isPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; border-radius: 14px; padding: 24px; text-align: center;">
      <div class="quiz-celebration-icon" style="font-size: 36px; margin-bottom: 8px;">${isPassed ? '🎉' : '📚'}</div>
      <h3 style="color: #fff; margin: 0 0 6px 0; font-size: 18px; font-weight: 700;">
        ${isPassed ? 'Tabriklaymiz! Test muvaffaqiyatli topshirildi!' : 'Test yakunlandi — Bilimlarni mustahkamlang'}
      </h3>
      <p style="margin: 0 auto; color: #cbd5e1; font-size: 13.5px; max-width: 520px; line-height: 1.5;">
        ${escapeHTML(adaptiveNote)}
      </p>

      <div style="display: flex; justify-content: center; gap: 12px; margin-top: 14px; flex-wrap: wrap;">
        <div class="quiz-score-pill" style="display: inline-block; padding: 5px 14px; border-radius: 999px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-weight: 600; font-size: 14px;">
          Natija: ${score.correctCount || 0} / ${score.totalQuestions || 5} to‘g‘ri (${score.scorePercentage || 0}%)
        </div>
        <div style="display: inline-block; padding: 5px 14px; border-radius: 999px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; font-weight: 600; font-size: 13px;">
          Keyingi daraja: ${escapeHTML(score.nextDifficultyLabel || score.difficultyLabel || 'O‘rta')}
        </div>
      </div>

      <div style="display: flex; justify-content: center; gap: 10px; margin-top: 18px; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary" id="btn-quiz-retake-new" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); color: #f4f4f5; font-weight: 600; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px;">
          <span>🔄</span>
          <span>Yangi savollar bilan qayta topshirish</span>
        </button>
        <button type="button" class="btn btn-primary" id="btn-quiz-finish-close" style="background: #10b981; border: 1px solid rgba(255,255,255,0.08); color: #fff; font-weight: 600; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 13px;">
          ✓ Darsni yakunlash
        </button>
      </div>
    </div>

    <div class="catalog-section-label" style="font-size: 13px; font-weight: 700; letter-spacing: 1.2px; color: #a1a1b5; margin-top: 20px;">
      SAVOLLAR BO‘YICHA TO‘LIQ TAHLIL VA TUSHUNTIRISHLAR:
    </div>

    <div class="quiz-questions-list">
      ${results.map((r, idx) => `
        <div class="quiz-question-card ${r.isCorrect ? 'answered-correct' : 'answered-incorrect'}" style="border: 1px solid ${r.isCorrect ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; background: ${r.isCorrect ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'}; margin-bottom: 12px; padding: 16px; border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #fff; font-size: 14px;">${idx + 1}-Savol: ${escapeHTML(r.question || '')}</strong>
            <span style="font-size: 12px; font-weight: 700; color: ${r.isCorrect ? '#86efac' : '#ff8585'}; padding: 3px 8px; border-radius: 8px; background: rgba(0,0,0,0.3);">
              ${r.isCorrect ? '✓ To‘g‘ri' : '✗ Noto‘g‘ri'}
            </span>
          </div>

          <div style="font-size: 13px; color: #e5e2f0; margin-bottom: 8px;">
            Sizning javobingiz: <strong style="color: ${r.isCorrect ? '#86efac' : '#ff8585'}">${escapeHTML(r.userAnswer || 'Belgilanmagan')}</strong> | 
            To‘g‘ri javob: <strong style="color: #86efac">${escapeHTML(r.correctAnswer || '')}</strong>
          </div>

          <div class="quiz-explanation-box" style="background: rgba(0,0,0,0.25); border-left: 3px solid #a855f7; padding: 10px 14px; border-radius: 6px; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
            💡 <strong>Tushuntirish:</strong> ${escapeHTML(r.explanation || 'Dars qoidasi bo‘yicha to‘g‘ri javob.')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ==========================================
   RENDER MAIN SUBJECTS / ROOT
========================================== */

export function renderSubjects(
  containerId = 'view-container',
  subjects = [],
  onAskTutor
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  onTutorCallback = onAskTutor;
  activeView = 'catalog';
  currentSubjectId = null;

  renderCatalog();

  async function renderCatalog() {
    activeView = 'catalog';
    let subjectList = safeArray(subjects);

    try {
      const fresh = await fetchCurriculumSubjects();
      if (fresh.length) {
        subjectList = fresh;
        currentCurriculumData = fresh;
      }
    } catch {}

    container.innerHTML = `
      <section class="subjects-page">
        <div class="section-header">
          <div>
            <span class="mentor-eyebrow">
              GULASAL AI • INTERAKTIV BILIM PLATFORMASI
            </span>
            <h2>📚 O‘quv Fanlari & Bosqichli Darslar</h2>
            <p>
              Professional o‘quv dasturlari va har bir o‘quvchi uchun individual dinamik savollar tizimi.
            </p>
          </div>

          <div class="subjects-total">
            <span>📖</span>
            <strong>${subjectList.length}</strong>
            <small>ta fan</small>
          </div>
        </div>

        <!-- RICH EXPANSION TOOLBAR -->
        <div class="subjects-features-toolbar">
          <button type="button" class="toolbar-pill-btn pill-highlight" id="toolbar-ai-lesson-btn" title="Istalgan mavzuni 7 bosqichli darsga aylantirish">
            <span>✨ AI Dars Yaratuvchi</span>
          </button>
        </div>

        <!-- DAILY LESSON COMPLETION SECTION -->
        <div id="daily-progress-mount">
          <div class="mentor-empty" style="padding: 24px;">Kunlik darslar yuklanmoqda...</div>
        </div>

        <!-- DYNAMIC ADAPTIVE PRACTICE (6-QUESTION ROUNDS) -->
        <div id="dynamic-practice-mount">
          <div class="mentor-empty" style="padding: 24px;">Dinamik mashqlar yuklanmoqda...</div>
        </div>

        <!-- SUBJECTS CATALOG -->
        <div class="catalog-section-label" style="margin: 32px 0 16px; font-size: 13px; font-weight: 700; letter-spacing: 1.2px; color: #a1a1b5;">
          BARCHA FANLARNING RASMIY O‘QUV DASTURLARI
        </div>

        <div class="cards-grid subjects-grid">
          ${
            subjectList.length
              ? subjectList.map(renderSubjectCard).join('')
              : '<div class="mentor-empty">Fanlar topilmadi</div>'
          }
        </div>
      </section>
    `;

    // 0. Bind Expansion Toolbar Events
    container.querySelector('#toolbar-ai-lesson-btn')?.addEventListener('click', () => {
      openAiLessonModal((createdLessonId) => {
        openLessonPlayer(createdLessonId, () => renderCatalog());
      });
    });

    // 1. Mount daily progress
    const dailyMount = container.querySelector('#daily-progress-mount');
    async function loadDailyProgress() {
      try {
        const data = await fetchDailyLessons();
        if (!dailyMount) return;

        dailyMount.innerHTML = renderDailyProgressCard(data);

        dailyMount.querySelectorAll('[data-action="toggle-lesson"]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const lessonId = btn.dataset.id;
            btn.disabled = true;
            try {
              const updated = await toggleLessonStatus(lessonId);
              dailyMount.innerHTML = renderDailyProgressCard(updated);
              loadDailyProgress();
            } catch (err) {
              alert(err.message || 'Xatolik yuz berdi');
            } finally {
              btn.disabled = false;
            }
          });
        });

        dailyMount.querySelectorAll('[data-action="open-lesson"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const lessonId = btn.dataset.lessonId;
            openLessonPlayer(lessonId, () => {
              renderCatalog();
            });
          });
        });
      } catch (err) {
        if (dailyMount) {
          dailyMount.innerHTML = `
            <div class="daily-progress-container" style="padding: 18px; text-align: center; color: #a1a1b5;">
              Kunlik darslarni yuklashda muammo bo‘ldi. Qayta urinib ko‘ring.
            </div>
          `;
        }
      }
    }
    loadDailyProgress();

    // 2. Mount dynamic practice system
    const dynamicMount = container.querySelector('#dynamic-practice-mount');
    async function loadDynamicPractice(subjectId = activeDynamicSubject) {
      activeDynamicSubject = subjectId;
      currentDynamicAnswers = {};
      dynamicRoundSubmitted = false;
      currentDynamicResults = null;

      try {
        const session = await fetchDynamicSession(subjectId);
        currentDynamicSession = session;
        if (!dynamicMount) return;

        dynamicMount.innerHTML = renderDynamicPracticeWidget(session, null);
        bindDynamicPracticeEvents(dynamicMount, loadDynamicPractice);
      } catch (err) {
        if (dynamicMount) {
          dynamicMount.innerHTML = `
            <div class="dynamic-practice-section" style="padding: 20px; text-align: center; color: #a1a1b5;">
              Dinamik savollarni yuklashda xatolik: ${escapeHTML(err.message)}
            </div>
          `;
        }
      }
    }
    loadDynamicPractice(activeDynamicSubject);

    // 3. Bind "Open Curriculum" buttons on subject cards
    container.querySelectorAll('.open-curriculum-btn').forEach(button => {
      button.addEventListener('click', () => {
        const subId = button.dataset.subjectId;
        const sub = currentCurriculumData.find(s => s.id === subId) ||
                    subjectList.find(s => s.id === subId) ||
                    subjectList[0];

        if (sub) {
          activeView = 'curriculum';
          currentSubjectId = subId;
          renderSubjectCurriculumView(sub, container, () => {
            renderCatalog();
          });
        }
      });
    });

    // 4. Bind AI Tutor buttons
    container.querySelectorAll('.ask-tutor-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.subjectIndex);
        const subject = subjectList[index];

        if (!subject || typeof onAskTutor !== 'function') return;

        const subjectName = String(subject.name || 'Tanlangan fan');
        const method = String(subject.method || 'Interaktiv amaliyot');

        onAskTutor(
          `Menga ${subjectName} fani bo‘yicha "${method}" uslubida asosiy tushunchalar, ` +
          `muhim qoidalar va misollar bilan batafsil dars o‘tib ber.`
        );
      });
    });
  }
}

/* ==========================================
   DYNAMIC PRACTICE DOM EVENT BINDING
========================================== */

function bindDynamicPracticeEvents(dynamicMount, reloadCallback) {
  // Tabs: Math, Physics, IT
  dynamicMount.querySelectorAll('#dynamic-subject-tabs .dynamic-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.dataset.subject;
      if (sub && sub !== activeDynamicSubject) {
        reloadCallback(sub);
      }
    });
  });

  // Radio option selection
  dynamicMount.querySelectorAll('.dynamic-opt-label input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const card = radio.closest('.dynamic-card');
      const qId = radio.closest('.dynamic-opt-label')?.dataset.qId;
      const optId = radio.value;

      if (card) {
        card.querySelectorAll('.dynamic-opt-label').forEach(l => l.classList.remove('is-selected'));
        radio.closest('.dynamic-opt-label')?.classList.add('is-selected');
      }

      if (qId && optId) {
        currentDynamicAnswers[qId] = optId;
      }
    });
  });

  // Submit 6 questions
  dynamicMount.querySelector('#btn-submit-dynamic-round')?.addEventListener('click', async () => {
    const answeredCount = Object.keys(currentDynamicAnswers).length;
    if (answeredCount < 6) {
      if (!confirm(`Siz hali 6 ta savoldan faqat ${answeredCount} tasiga javob berdingiz. Tekshirishni davom ettirasizmi?`)) {
        return;
      }
    }

    const submitBtn = dynamicMount.querySelector('#btn-submit-dynamic-round');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Tekshirilmoqda...';
    }

    try {
      const results = await submitDynamicAnswers(activeDynamicSubject, currentDynamicAnswers);
      currentDynamicResults = results;
      dynamicRoundSubmitted = true;

      // Re-render widget with results highlighted!
      dynamicMount.innerHTML = renderDynamicPracticeWidget(currentDynamicSession, results);
      bindDynamicPracticeEvents(dynamicMount, reloadCallback);
    } catch (err) {
      alert('Xatolik: ' + err.message);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '6 ta savol javoblarini tekshirish ✓';
      }
    }
  });

  // Next round of 6 questions!
  dynamicMount.querySelector('#btn-next-dynamic-round')?.addEventListener('click', () => {
    reloadCallback(activeDynamicSubject);
  });
}
