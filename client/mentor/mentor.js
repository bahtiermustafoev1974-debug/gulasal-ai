
/* ==========================================
   GULASAL AI — AI MENTOR 2.0
   Goals • Tasks • Daily Plans • Statistics
   Improved • Safe Rendering • Stable Events
========================================== */

const API = '/api/mentor';

let mentorData = null;
let planItems = [];
let mentorRequestController = null;

/* ==============================
   DATE HELPERS
============================== */

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateLabel(date = today()) {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `mentor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ==============================
   SECURITY HELPERS
============================== */

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function safeNumber(value, min = 0, max = 100) {
  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.max(min, Math.min(max, number));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safePriority(value) {
  return ['low', 'medium', 'high'].includes(value)
    ? value
    : 'medium';
}

/* ==============================
   API
============================== */

async function mentorRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    if (response.status === 401) {
      throw new Error('Sessiya tugagan. Qayta tizimga kiring.');
    }

    throw new Error(
      result.message || 'So‘rovni bajarib bo‘lmadi.'
    );
  }

  return result;
}

/* ==============================
   NOTIFICATIONS
============================== */

function notifyMentor(message, type = 'success') {
  let toast = document.querySelector('.mentor-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'mentor-toast';
    document.body.appendChild(toast);
  }

  toast.className = `mentor-toast ${type}`;
  toast.textContent = String(message);

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.remove();
  }, 3000);
}

/* ==============================
   PAGE HTML
============================== */

function renderMentorShell() {
  return `
    <section class="mentor-page">

      <div class="mentor-hero">
        <div class="mentor-hero-content">
          <span class="mentor-eyebrow">
            GULASAL AI • SHAXSIY RIVOJLANISH
          </span>

          <h1>AI Mentor</h1>

          <p>
            Orzularingni aniq maqsadlarga,
            maqsadlaringni natijalarga aylantir.
          </p>

          <div class="mentor-hero-date" id="mentor-date"></div>
        </div>

        <div class="mentor-hero-symbol">
          <div class="mentor-orbit orbit-one"></div>
          <div class="mentor-orbit orbit-two"></div>
          <div class="mentor-hero-star">◈</div>
        </div>
      </div>

      <div class="mentor-stats" id="mentor-stats">

        <div class="mentor-stat-card">
          <span class="mentor-stat-icon">🎯</span>
          <span class="mentor-stat-label">Jami maqsadlar</span>
          <strong id="mentor-total-goals">0</strong>
        </div>

        <div class="mentor-stat-card">
          <span class="mentor-stat-icon">✅</span>
          <span class="mentor-stat-label">Bajarilgan vazifalar</span>
          <strong id="mentor-completed-tasks">0/0</strong>
        </div>

        <div class="mentor-stat-card">
          <span class="mentor-stat-icon">📈</span>
          <span class="mentor-stat-label">Maqsadlar natijasi</span>
          <strong id="mentor-goal-progress">0%</strong>
        </div>

        <div class="mentor-stat-card">
          <span class="mentor-stat-icon">⚡</span>
          <span class="mentor-stat-label">Vazifalar natijasi</span>
          <strong id="mentor-task-progress">0%</strong>
        </div>

      </div>

      <div class="mentor-section-heading">
        <div>
          <span class="mentor-eyebrow">SENING RIVOJLANISHING</span>
          <h2>Shaxsiy boshqaruv markazi</h2>
        </div>

        <button
          class="mentor-refresh-btn"
          id="mentor-refresh"
          type="button"
        >
          ↻ Yangilash
        </button>
      </div>

      <div class="mentor-main-grid">

        <!-- GOALS -->

        <section class="mentor-panel">

          <div class="mentor-panel-heading">
            <div>
              <span class="mentor-panel-icon">🎯</span>
              <h3>Mening maqsadlarim</h3>
            </div>

            <span class="mentor-count" id="mentor-goal-count">0</span>
          </div>

          <form id="mentor-goal-form" class="mentor-form">

            <input
              name="title"
              type="text"
              maxlength="150"
              placeholder="Yangi maqsadingni yoz..."
              required
            >

            <textarea
              name="description"
              maxlength="1000"
              placeholder="Maqsad haqida qisqacha..."
              rows="2"
            ></textarea>

            <div class="mentor-form-row">

              <select name="category">
                <option value="education">📚 Ta’lim</option>
                <option value="career">💼 Kasb</option>
                <option value="personal">🌱 Shaxsiy</option>
                <option value="health">🏃 Faollik</option>
                <option value="other">✨ Boshqa</option>
              </select>

              <input
                name="deadline"
                type="date"
                min="${today()}"
              >

            </div>

            <button type="submit" class="mentor-primary-btn">
              <span>＋</span> Maqsad qo‘shish
            </button>

          </form>

          <div class="mentor-list" id="mentor-goals-list">
            <div class="mentor-empty">Maqsadlar yuklanmoqda...</div>
          </div>

        </section>

        <!-- TASKS -->

        <section class="mentor-panel">

          <div class="mentor-panel-heading">
            <div>
              <span class="mentor-panel-icon">⚡</span>
              <h3>Kunlik vazifalar</h3>
            </div>

            <span class="mentor-count" id="mentor-task-count">0</span>
          </div>

          <form id="mentor-task-form" class="mentor-form">

            <input
              name="title"
              type="text"
              maxlength="150"
              placeholder="Bugun nima qilmoqchisan?"
              required
            >

            <textarea
              name="description"
              maxlength="500"
              placeholder="Vazifa haqida..."
              rows="2"
            ></textarea>

            <div class="mentor-form-row">

              <select name="priority">
                <option value="low">🟢 Past ustuvorlik</option>
                <option value="medium" selected>🟡 O‘rtacha</option>
                <option value="high">🔴 Yuqori ustuvorlik</option>
              </select>

              <input
                name="date"
                type="date"
                value="${today()}"
              >

            </div>

            <button type="submit" class="mentor-primary-btn">
              <span>＋</span> Vazifa qo‘shish
            </button>

          </form>

          <div class="mentor-list" id="mentor-tasks-list">
            <div class="mentor-empty">Vazifalar yuklanmoqda...</div>
          </div>

        </section>

      </div>

      <!-- DAILY PLAN -->

      <section class="mentor-panel mentor-plan-panel">

        <div class="mentor-panel-heading">
          <div>
            <span class="mentor-panel-icon">📅</span>
            <h3>Kunlik reja</h3>
            <p>Bugungi ishlaringni tartibga sol.</p>
          </div>

          <span class="mentor-plan-date">
            ${getDateLabel()}
          </span>
        </div>

        <form id="mentor-plan-form" class="mentor-plan-form">

          <input
            name="title"
            type="text"
            placeholder="Reja bandini yoz..."
            maxlength="150"
            required
          >

          <input name="time" type="time">

          <button type="submit" class="mentor-primary-btn">
            ＋ Qo‘shish
          </button>

        </form>

        <div class="mentor-plan-list" id="mentor-plan-list"></div>

        <button
          id="mentor-save-plan"
          class="mentor-save-btn"
          type="button"
        >
          ✓ Kunlik rejani saqlash
        </button>

      </section>

      <!-- BOTTOM CARD -->

      <section class="mentor-bottom-card">

        <div class="mentor-bottom-icon">🎯</div>

        <div>
          <span class="mentor-eyebrow">
            SENING KEYINGI QADAMING
          </span>

          <h3>
            Kichik qadamlar katta natijalarga olib boradi.
          </h3>

          <p>
            Bugun bitta vazifani yakunla.
            Ertaga yana bir qadam oldinga yur.
          </p>
        </div>

      </section>

    </section>
  `;
}

/* ==============================
   GOALS RENDER
============================== */

function renderGoals() {
  const container = document.getElementById('mentor-goals-list');

  if (!container || !mentorData) return;

  const goals = safeArray(mentorData.goals);

  if (!goals.length) {
    container.innerHTML = `
      <div class="mentor-empty">
        <span>🎯</span>
        <strong>Hali maqsad yo‘q</strong>
        <p>
          Birinchi maqsadingni qo‘sh va rivojlanishni boshlagin.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = goals.map(goal => {
    const progress = safeNumber(goal.progress);
    const id = escapeHTML(goal.id || '');

    return `
      <article class="mentor-item ${goal.completed ? 'is-completed' : ''}">

        <div class="mentor-item-top">

          <div class="mentor-item-info">
            <strong>${escapeHTML(goal.title || 'Nomsiz maqsad')}</strong>

            <p>
              ${escapeHTML(
                goal.description || 'Tavsif kiritilmagan'
              )}
            </p>
          </div>

          <button
            class="mentor-delete-btn"
            type="button"
            data-action="delete-goal"
            data-id="${id}"
            title="O‘chirish"
            aria-label="Maqsadni o‘chirish"
          >×</button>

        </div>

        <div class="mentor-progress-info">
          <span>Rivojlanish</span>
          <strong>${progress}%</strong>
        </div>

        <div class="mentor-progress-track">
          <div
            class="mentor-progress-fill"
            style="width:${progress}%"
          ></div>
        </div>

        <div class="mentor-item-bottom">

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value="${progress}"
            data-action="goal-progress"
            data-id="${id}"
            aria-label="Maqsad rivojlanishi"
          >

          <span>
            ${
              goal.deadline
                ? '📅 ' + escapeHTML(goal.deadline)
                : '🌱 Davom etmoqda'
            }
          </span>

        </div>

      </article>
    `;
  }).join('');
}

/* ==============================
   TASKS RENDER
============================== */

function renderTasks() {
  const container = document.getElementById('mentor-tasks-list');

  if (!container || !mentorData) return;

  const tasks = safeArray(mentorData.tasks)
    .filter(task => task.date === today());

  if (!tasks.length) {
    container.innerHTML = `
      <div class="mentor-empty">
        <span>⚡</span>
        <strong>Bugungi vazifalar yo‘q</strong>
        <p>
          Yangi vazifa qo‘shib, kuningni rejalashtir.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = tasks.map(task => {
    const priority = safePriority(task.priority);

    return `
      <article class="mentor-task-item ${
        task.completed ? 'is-completed' : ''
      }">

        <label class="mentor-task-check">

          <input
            type="checkbox"
            data-action="toggle-task"
            data-id="${escapeHTML(task.id || '')}"
            ${task.completed ? 'checked' : ''}
          >

          <span class="mentor-custom-check"></span>

        </label>

        <div class="mentor-task-info">

          <strong>
            ${escapeHTML(task.title || 'Nomsiz vazifa')}
          </strong>

          <p>
            ${escapeHTML(task.description || 'Bugungi vazifa')}
          </p>

        </div>

        <span class="mentor-priority priority-${priority}">
          ${
            priority === 'high'
              ? 'Yuqori'
              : priority === 'low'
                ? 'Past'
                : 'O‘rtacha'
          }
        </span>

        <button
          class="mentor-delete-btn"
          type="button"
          data-action="delete-task"
          data-id="${escapeHTML(task.id || '')}"
          aria-label="Vazifani o‘chirish"
        >×</button>

      </article>
    `;
  }).join('');
}

/* ==============================
   DAILY PLAN RENDER
============================== */

function renderPlan() {
  const container = document.getElementById('mentor-plan-list');

  if (!container) return;

  if (!planItems.length) {
    container.innerHTML = `
      <div class="mentor-empty mentor-plan-empty">
        <span>📅</span>
        <strong>Rejang hali bo‘sh</strong>
        <p>Yuqoridan yangi reja bandini qo‘sh.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = planItems.map(item => `
    <div class="mentor-plan-item ${
      item.completed ? 'is-completed' : ''
    }">

      <label class="mentor-task-check">

        <input
          type="checkbox"
          data-action="toggle-plan"
          data-id="${escapeHTML(item.id || '')}"
          ${item.completed ? 'checked' : ''}
        >

        <span class="mentor-custom-check"></span>

      </label>

      <span class="mentor-plan-time">
        ${escapeHTML(item.time || '--:--')}
      </span>

      <strong>
        ${escapeHTML(item.title || 'Nomsiz reja')}
      </strong>

      <button
        class="mentor-delete-btn"
        type="button"
        data-action="delete-plan"
        data-id="${escapeHTML(item.id || '')}"
        aria-label="Reja bandini o‘chirish"
      >×</button>

    </div>
  `).join('');
}

/* ==============================
   STATISTICS
============================== */

function renderStats() {
  if (!mentorData) return;

  const stats = mentorData.stats || {};

  const setText = (id, value) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = String(value);
    }
  };

  setText('mentor-total-goals', stats.totalGoals || 0);

  setText(
    'mentor-completed-tasks',
    `${stats.completedTasks || 0}/${stats.totalTasks || 0}`
  );

  setText(
    'mentor-goal-progress',
    `${safeNumber(stats.goalProgress)}%`
  );

  setText(
    'mentor-task-progress',
    `${safeNumber(stats.taskProgress)}%`
  );

  setText('mentor-goal-count', stats.totalGoals || 0);

  const todayTasks = safeArray(mentorData.tasks)
    .filter(task => task.date === today());

  setText('mentor-task-count', todayTasks.length);
}

/* ==============================
   LOAD DATA
============================== */

async function loadMentorData() {
  const result = await mentorRequest(API);

  if (!result.data || typeof result.data !== 'object') {
    throw new Error('Serverdan noto‘g‘ri ma’lumot keldi.');
  }

  mentorData = result.data;

  const savedPlan = safeArray(mentorData.plans).find(
    plan => plan.date === today()
  );

  planItems = savedPlan
    ? safeArray(savedPlan.items).map(item => ({
        id: item.id || createId(),
        title: String(item.title || ''),
        time: String(item.time || ''),
        completed: Boolean(item.completed)
      }))
    : [];

  renderStats();
  renderGoals();
  renderTasks();
  renderPlan();
}

/* ==============================
   FORM HELPERS
============================== */

function getFormData(form) {
  return Object.fromEntries(
    new FormData(form).entries()
  );
}

function setButtonLoading(button, loading, loadingText = 'Yuklanmoqda...') {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;
  } else {
    button.disabled = false;

    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

/* ==============================
   EVENT HANDLERS
============================== */

function bindMentorEvents(root) {
  // Oldingi listenerlarni tozalash.
  if (mentorRequestController) {
    mentorRequestController.abort();
  }

  mentorRequestController = new AbortController();

  const { signal } = mentorRequestController;

  /* ---------- FORM SUBMIT ---------- */

  root.addEventListener('submit', async event => {
    const form = event.target;

    if (!form.matches(
      '#mentor-goal-form, #mentor-task-form, #mentor-plan-form'
    )) {
      return;
    }

    event.preventDefault();

    const button = form.querySelector('[type="submit"]');

    if (button?.disabled) return;

    try {
      const data = getFormData(form);

      if (!String(data.title || '').trim()) {
        notifyMentor('Iltimos, nomini kiriting.', 'error');
        return;
      }

      setButtonLoading(button, true);

      if (form.id === 'mentor-goal-form') {
        data.title = data.title.trim();
        data.description = (data.description || '').trim();

        await mentorRequest(`${API}/goals`, {
          method: 'POST',
          body: JSON.stringify(data)
        });

        form.reset();

        notifyMentor('Yangi maqsad qo‘shildi!');

        await loadMentorData();
      }

      else if (form.id === 'mentor-task-form') {
        data.title = data.title.trim();
        data.description = (data.description || '').trim();

        await mentorRequest(`${API}/tasks`, {
          method: 'POST',
          body: JSON.stringify(data)
        });

        form.reset();

        const dateInput = form.querySelector('[name="date"]');

        if (dateInput) {
          dateInput.value = today();
        }

        notifyMentor('Yangi vazifa qo‘shildi!');

        await loadMentorData();
      }

      else if (form.id === 'mentor-plan-form') {
        if (planItems.length >= 30) {
          throw new Error('Bir kunda 30 tadan ortiq reja qo‘shib bo‘lmaydi.');
        }

        planItems.push({
          id: createId(),
          title: data.title.trim(),
          time: data.time || '',
          completed: false
        });

        form.reset();

        renderPlan();

        notifyMentor('Reja bandi qo‘shildi!');
      }

    } catch (error) {
      notifyMentor(error.message, 'error');
    } finally {
      setButtonLoading(button, false);
    }
  }, { signal });

  /* ---------- BUTTON CLICKS ---------- */

  root.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');

    // Refresh
    if (event.target.closest('#mentor-refresh')) {
      const refreshButton = root.querySelector('#mentor-refresh');

      try {
        setButtonLoading(refreshButton, true, 'Yangilanmoqda...');

        await loadMentorData();

        notifyMentor('Ma’lumotlar yangilandi.');
      } catch (error) {
        notifyMentor(error.message, 'error');
      } finally {
        setButtonLoading(refreshButton, false);
      }

      return;
    }

    // Save daily plan
    if (event.target.closest('#mentor-save-plan')) {
      const saveButton = root.querySelector('#mentor-save-plan');

      try {
        setButtonLoading(saveButton, true, 'Saqlanmoqda...');

        await mentorRequest(`${API}/plans`, {
          method: 'PUT',
          body: JSON.stringify({
            date: today(),
            title: 'Kunlik reja',
            items: planItems
          })
        });

        notifyMentor('Kunlik reja saqlandi!');

        await loadMentorData();
      } catch (error) {
        notifyMentor(error.message, 'error');
      } finally {
        setButtonLoading(saveButton, false);
      }

      return;
    }

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (!id && action !== 'delete-plan') return;

    try {
      if (action === 'delete-goal') {
        if (!confirm('Bu maqsadni o‘chirmoqchimisiz?')) {
          return;
        }

        button.disabled = true;

        await mentorRequest(
          `${API}/goals/${encodeURIComponent(id)}`,
          { method: 'DELETE' }
        );

        notifyMentor('Maqsad o‘chirildi.');

        await loadMentorData();
      }

      else if (action === 'delete-task') {
        if (!confirm('Bu vazifani o‘chirmoqchimisiz?')) {
          return;
        }

        button.disabled = true;

        await mentorRequest(
          `${API}/tasks/${encodeURIComponent(id)}`,
          { method: 'DELETE' }
        );

        notifyMentor('Vazifa o‘chirildi.');

        await loadMentorData();
      }

      else if (action === 'delete-plan') {
        planItems = planItems.filter(item => item.id !== id);

        renderPlan();

        notifyMentor('Reja bandi olib tashlandi.');
      }

    } catch (error) {
      notifyMentor(error.message, 'error');

      await loadMentorData().catch(() => {});
    }
  }, { signal });

  /* ---------- CHECKBOX / RANGE ---------- */

  root.addEventListener('change', async event => {
    const control = event.target;
    const action = control.dataset.action;
    const id = control.dataset.id;

    if (!action) return;

    try {
      if (action === 'toggle-task') {
        control.disabled = true;

        await mentorRequest(
          `${API}/tasks/${encodeURIComponent(id)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              completed: control.checked
            })
          }
        );

        await loadMentorData();
      }

      else if (action === 'toggle-plan') {
        const item = planItems.find(item => item.id === id);

        if (item) {
          item.completed = control.checked;
        }

        renderPlan();
      }

      else if (action === 'goal-progress') {
        control.disabled = true;

        await mentorRequest(
          `${API}/goals/${encodeURIComponent(id)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              progress: safeNumber(control.value)
            })
          }
        );

        await loadMentorData();
      }

    } catch (error) {
      notifyMentor(error.message, 'error');

      await loadMentorData().catch(() => {});
    }
  }, { signal });
}

/* ==============================
   MAIN RENDER
============================== */

export async function renderMentor(containerId = 'view-container') {
  const root = document.getElementById(containerId);

  if (!root) {
    console.error(
      'Mentor uchun HTML konteyner topilmadi:',
      containerId
    );

    return;
  }

  // Oldingi renderdan qolgan listenerlarni tozalash.
  if (mentorRequestController) {
    mentorRequestController.abort();
    mentorRequestController = null;
  }

  root.innerHTML = renderMentorShell();

  const dateElement = root.querySelector('#mentor-date');

  if (dateElement) {
    dateElement.textContent = `📅 ${getDateLabel()}`;
  }

  bindMentorEvents(root);

  try {
    await loadMentorData();
  } catch (error) {
    notifyMentor(error.message, 'error');

    const goals = root.querySelector('#mentor-goals-list');
    const tasks = root.querySelector('#mentor-tasks-list');

    const errorHTML = `
      <div class="mentor-empty">
        <span>⚠️</span>
        <strong>Ma’lumotlarni yuklab bo‘lmadi</strong>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    if (goals) goals.innerHTML = errorHTML;
    if (tasks) tasks.innerHTML = errorHTML;
  }
}
