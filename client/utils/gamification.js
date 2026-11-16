// ========================================================
// GULASAL AI — GAMIFICATION ENGINE
// Streak • XP • Levels • Leaderboard • Badges
// ========================================================

let gamificationCache = null;

export async function fetchGamificationProfile(userId = null) {
  try {
    const headers = userId ? { 'x-user-id': userId } : {};
    const res = await fetch('/api/gamification/profile', {
      headers,
      credentials: 'same-origin',
      cache: 'no-store'
    });
    const data = await res.json();
    if (data.success && data.profile) {
      gamificationCache = data.profile;
      return data.profile;
    }
  } catch (e) {
    console.warn('[GAMIFICATION PROFILE FETCH WARN]', e);
  }
  return null;
}

export function updateGamificationUI(profile) {
  if (!profile) return;
  const streakEl = document.getElementById('nav-streak-val');
  const xpEl = document.getElementById('nav-xp-val');
  const lvlEl = document.getElementById('nav-lvl-val');

  if (streakEl) streakEl.textContent = profile.streak || 1;
  if (xpEl) xpEl.textContent = profile.xp || 0;
  if (lvlEl) lvlEl.textContent = `Lvl ${profile.level || 1}`;
}

export function showXpToast(xp = 20, message = 'Ball qo‘shildi!') {
  let toast = document.getElementById('xp-floating-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'xp-floating-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      padding: 12px 20px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.95rem;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
      z-index: 100000;
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateY(30px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>⭐</span> +${xp} XP &bull; <span>${message}</span>`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
  }, 3200);
}

export async function openLeaderboardModal(userId = null) {
  let modal = document.getElementById('leaderboard-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'leaderboard-modal';
    modal.className = 'premium-modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="premium-modal-dialog">
      <div class="modal-header-row">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.6rem;">🏆</span>
          <div>
            <h3>Peshqadamlar & Yutuqlar</h3>
            <span style="font-size:0.75rem;color:#94a3b8;">Haftalik musobaqa va shaxsiy rivojlanish</span>
          </div>
        </div>
        <button class="modal-close-btn" id="close-leaderboard-btn" type="button">✕</button>
      </div>

      <div id="modal-profile-hero" class="user-hero-card">
        <div style="text-align:center;padding:15px;color:#cbd5e1;">Ma'lumotlar yuklanmoqda...</div>
      </div>

      <div class="modal-nav-tabs">
        <button class="modal-nav-tab active" data-tab="tab-leaderboard" type="button">🏅 Peshqadamlar Jadvali</button>
        <button class="modal-nav-tab" data-tab="tab-badges" type="button">🎖️ Medallar & Yutuqlar</button>
      </div>

      <div id="tab-leaderboard" class="modal-tab-content">
        <div class="leaderboard-list" id="leaderboard-list-box">
          <div style="text-align:center;padding:20px;color:#94a3b8;">Reyting yuklanmoqda...</div>
        </div>
      </div>

      <div id="tab-badges" class="modal-tab-content" style="display:none;">
        <div class="badges-grid" id="modal-badges-grid"></div>
      </div>
    </div>
  `;

  modal.classList.add('active');

  modal.querySelector('#close-leaderboard-btn').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Tab switching
  modal.querySelectorAll('.modal-nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll('.modal-nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      modal.querySelector('#tab-leaderboard').style.display = target === 'tab-leaderboard' ? 'block' : 'none';
      modal.querySelector('#tab-badges').style.display = target === 'tab-badges' ? 'block' : 'none';
    });
  });

  // Load Data
  try {
    const [profileRes, leadRes] = await Promise.all([
      fetch('/api/gamification/profile', { headers: userId ? { 'x-user-id': userId } : {} }),
      fetch('/api/gamification/leaderboard', { headers: userId ? { 'x-user-id': userId } : {} })
    ]);

    const profileData = await profileRes.json();
    const leadData = await leadRes.json();

    if (profileData.success && profileData.profile) {
      const p = profileData.profile;
      gamificationCache = p;
      updateGamificationUI(p);

      const heroBox = modal.querySelector('#modal-profile-hero');
      heroBox.innerHTML = `
        <div class="user-hero-stats">
          <div class="hero-stat-box">
            <h4 style="color:#fb923c;">🔥 ${p.streak} kun</h4>
            <p>Uzluksiz zanjir</p>
          </div>
          <div class="hero-stat-box">
            <h4 style="color:#facc15;">⭐ ${p.xp}</h4>
            <p>Jami XP</p>
          </div>
          <div class="hero-stat-box">
            <h4 style="color:#c084fc;">💎 ${p.levelTitle}</h4>
            <p>${p.level}-daraja</p>
          </div>
        </div>
        <div class="xp-progress-bar-wrap">
          <div class="xp-bar-labels">
            <span>Daraja ${p.level} rivojlanishi</span>
            <span>${p.progressPercent}% (${p.xp} / ${p.nextLevelXp} XP)</span>
          </div>
          <div class="xp-bar-track">
            <div class="xp-bar-fill" style="width: ${p.progressPercent}%;"></div>
          </div>
        </div>
      `;

      // Render Badges
      const badgesBox = modal.querySelector('#modal-badges-grid');
      const unlockedIds = new Set((p.badges || []).map(b => b.id));
      badgesBox.innerHTML = (p.allBadgeDefinitions || []).map(b => {
        const isUnlocked = unlockedIds.has(b.id);
        return `
          <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-title">${b.name}</div>
            <div class="badge-desc">${b.desc}</div>
            <span style="font-size:0.65rem;font-weight:700;color:${isUnlocked ? '#4ade80' : '#64748b'};display:inline-block;margin-top:6px;">
              ${isUnlocked ? '✓ Qo‘lga kiritildi' : '🔒 Qulflangan'}
            </span>
          </div>
        `;
      }).join('');
    }

    if (leadData.success && leadData.leaderboard) {
      const listBox = modal.querySelector('#leaderboard-list-box');
      listBox.innerHTML = leadData.leaderboard.map(item => {
        let rankClass = 'rank-other';
        if (item.rank === 1) rankClass = 'rank-1';
        else if (item.rank === 2) rankClass = 'rank-2';
        else if (item.rank === 3) rankClass = 'rank-3';

        return `
          <div class="leaderboard-item ${item.isCurrent ? 'current-user-rank' : ''}">
            <div class="leaderboard-left">
              <span class="rank-badge ${rankClass}">${item.rank}</span>
              <div class="leader-avatar">${item.avatar}</div>
              <div class="leader-details">
                <h5>${item.name} ${item.isCurrent ? ' <span style="font-size:0.7rem;color:#c084fc;">(Siz)</span>' : ''}</h5>
                <span>${item.league} &bull; ${item.levelTitle}</span>
              </div>
            </div>
            <div class="leaderboard-right">
              <div class="leader-xp">⭐ ${item.xp} XP</div>
              <div class="leader-streak">🔥 ${item.streak} kun</div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('[LOAD LEADERBOARD ERROR]', err);
  }
}
