/**
 * GULASAL AI — Custom 7-Stage AI Lesson Generator Modal
 * Prompts Gemini AI to craft custom lessons on ANY topic
 */

export function openAiLessonModal(onLessonCreated) {
  document.getElementById('ai-lesson-modal-root')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'ai-lesson-modal-root';
  overlay.className = 'premium-modal-backdrop ai-lesson-backdrop is-visible';

  overlay.innerHTML = `
    <div class="ai-lesson-modal" role="dialog" aria-modal="true">
      <div class="ai-lesson-header">
        <div class="ai-lesson-title-wrap">
          <span class="ai-lesson-icon">✨</span>
          <div>
            <h3>AI Dars Yaratuvchi (Gemini 3.8)</h3>
            <p>Istalgan mavzuni kiriting — AI to‘liq 7 bosqichli boy dars yaratadi</p>
          </div>
        </div>
        <button type="button" class="player-close-btn" id="ail-close-btn" title="Yopish">✕</button>
      </div>

      <div class="ai-lesson-body" id="ail-form-container">
        <div class="form-group">
          <label for="ail-topic-input">Dars mavzusi:</label>
          <input
            type="text"
            id="ail-topic-input"
            class="ail-input"
            placeholder="Masalan: Kvant fizikasi, Python dekoratorlari, Fotosintez..."
            autocomplete="off"
          />
        </div>

        <div class="form-group" style="margin-top: 14px;">
          <label for="ail-subject-select">Fan sohasi:</label>
          <select id="ail-subject-select" class="ail-select">
            <option value="math">📐 Matematika</option>
            <option value="physics">⚡ Fizika</option>
            <option value="it" selected>💻 Axborot Texnologiyalari (IT)</option>
            <option value="english">🇬🇧 Ingliz tili</option>
            <option value="chem">🧪 Kimyo</option>
            <option value="bio">🧬 Biologiya</option>
            <option value="uzb">🇺🇿 Ona tili va Adabiyot</option>
          </select>
        </div>

        <div class="ai-lesson-samples">
          <span style="font-size: 12px; color: #94a3b8;">Tezkor mavzular:</span>
          <div class="samples-row">
            <button type="button" class="sample-tag">Kvant kompyuterlari</button>
            <button type="button" class="sample-tag">Docker va Konteynerlar</button>
            <button type="button" class="sample-tag">Oqsillar biosintezi</button>
            <button type="button" class="sample-tag">IELTS Reading strategiyalari</button>
          </div>
        </div>

        <div class="ai-lesson-actions">
          <button type="button" class="btn-create-lesson-submit" id="ail-submit-btn">
            <span>✨ 7 Bosqichli Darsni Generatsiya Qilish</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  function close() {
    overlay.remove();
    document.body.style.overflow = '';
  }

  overlay.querySelector('#ail-close-btn')?.addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  const topicInput = overlay.querySelector('#ail-topic-input');
  topicInput?.focus();

  overlay.querySelectorAll('.sample-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      if (topicInput) {
        topicInput.value = tag.textContent.trim();
        topicInput.focus();
      }
    });
  });

  const submitBtn = overlay.querySelector('#ail-submit-btn');
  submitBtn?.addEventListener('click', async () => {
    const topic = topicInput?.value?.trim();
    if (!topic) {
      alert('Iltimos, dars mavzusini kiriting.');
      topicInput?.focus();
      return;
    }

    const subjectSelect = overlay.querySelector('#ail-subject-select');
    const subjectHint = subjectSelect?.value || 'it';

    const container = overlay.querySelector('#ail-form-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 10px;">
          <div class="loading-icon" style="font-size: 40px; animation: spin 1s infinite linear;">✦</div>
          <h4 style="margin: 16px 0 6px; font-size: 18px;">AI darsni loyihalashtirmoqda...</h4>
          <p style="color: #cbd5e1; font-size: 14px; max-width: 380px; margin: 0 auto;">
            Nazariya, formulalar, misollar, interaktiv simulyator va yakuniy test savollari tuzilmoqda. Bunga 5-10 soniya ketadi.
          </p>
        </div>
      `;
    }

    try {
      const res = await fetch('/api/curriculum/generate-lesson', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subjectHint })
      });
      const json = await res.json();
      if (!json.success || !json.data?.lesson) {
        throw new Error(json.message || 'Dars yaratishda xatolik yuz berdi.');
      }

      close();

      if (typeof onLessonCreated === 'function') {
        onLessonCreated(json.data.lesson.id);
      } else {
        alert('🎉 Dars muvaffaqiyatli yaratildi va o‘quv rejasiga qo‘shildi!');
      }

    } catch (err) {
      alert('Xatolik: ' + err.message);
      close();
    }
  });
}
