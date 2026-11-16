// USTOZ-AI 2.0 Dashboard Page Component
export function renderDashboard(containerId, data = {}, onNavigate) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const stats = data.stats || {
    totalStudents: 1540,
    interactiveLessons: 128,
    totalSubjects: 40,
    aiAnswersGiven: 14200
  };

  const subjects = data.subjects || [];

  container.innerHTML = `
    <!-- Hero Welcome Banner -->
    <div class="hero-banner">
      <h2>Xush kelibsiz, Marufjon! 🚀</h2>
      <p>
        USTOZ-AI sizning shaxsiy ta'lim yordamchingiz. Istalgan fandan savol bering, 
        formulalarni yeching va milliy kutubxonamizdan bepul foydalaning.
      </p>
      <div class="hero-buttons">
        <button class="btn btn-primary" id="dash-chat-btn">🤖 AI Ustoz bilan suhbat</button>
        <button class="btn btn-secondary" id="dash-tools-btn">🛠️ AI Asboblarni ko'rish</button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div>
          <div class="stat-number">${(stats.totalStudents || 1540).toLocaleString()}</div>
          <div class="stat-label">Faol O'quvchilar</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div>
          <div class="stat-number">${(stats.aiAnswersGiven || 14200).toLocaleString()}+</div>
          <div class="stat-label">AI Bergan Javoblar</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div>
          <div class="stat-number">${stats.totalSubjects || 40} ta</div>
          <div class="stat-label">O'quv Fanlari</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div>
          <div class="stat-number">${stats.interactiveLessons || 128} ta</div>
          <div class="stat-label">Interaktiv Amaliyot</div>
        </div>
      </div>
    </div>

    <!-- Active Subjects Preview -->
    <div class="section-header">
      <h3>📚 O'quv Fanlari va Progressingiz</h3>
      <button class="btn btn-secondary" style="font-size: 0.85rem;" id="dash-all-subjects">Barchasini ko'rish &rarr;</button>
    </div>

    <div class="cards-grid">
      ${subjects.slice(0, 3).map(sub => `
        <div class="subject-card">
          <div class="subject-top">
            <span class="subject-icon">${sub.icon}</span>
            <span class="subject-topics">${sub.topics} ta dars</span>
          </div>
          <div>
            <h4 class="subject-title">${sub.name}</h4>
            <p class="subject-desc">${sub.description || ''}</p>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 6px; color: #94a3b8;">
              <span>O'zlashtirish</span>
              <span style="font-weight: 600; color: #60a5fa;">${sub.progress}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${sub.progress}%;"></div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: #64748b;">
            Metod: <strong>${sub.method || 'Interaktiv amaliyot'}</strong>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Tugmalar bosilganda o'tish
  container.querySelector('#dash-chat-btn')?.addEventListener('click', () => onNavigate('chat'));
  container.querySelector('#dash-tools-btn')?.addEventListener('click', () => onNavigate('tools'));
  container.querySelector('#dash-all-subjects')?.addEventListener('click', () => onNavigate('subjects'));
}
