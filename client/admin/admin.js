// =========================================================
// GULASAL AI — ENTERPRISE ADMIN DASHBOARD 2026
// Strict bahtiermustafoev1974@gmail.com Protection
// 1. Users & Moderation (Ban/Mute) • 2. Broadcast Banner
// 3. Promocodes • 4. Curriculum Content • 5. AI Health
// 6. Support Inbox • 7. Group Moderation • 8. Audit Logs
// =========================================================

let adminController = null;
let activeTab = 'users'; // 'users' | 'broadcast' | 'promocodes' | 'curriculum' | 'ai-health' | 'support' | 'community' | 'audit'
let allUsers = [];
let supportInbox = [];
let activeSupportUserId = null;
let groupMessages = [];
let curriculumSubjects = [];
let activeCurriculumSubjectId = null;

function escapeHTML(str = '') {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}

export function renderAdmin(containerId, onGoToChat) {
  const container = document.getElementById(containerId);
  if (!container) return;

  adminController?.abort();
  adminController = new AbortController();
  const { signal } = adminController;

  container.innerHTML = `
    <div class="admin-dashboard-wrap">
      
      <!-- HERO BANNER -->
      <div class="admin-hero-banner">
        <div class="admin-hero-left">
          <div class="admin-crown-icon">👑</div>
          <div>
            <h1 class="admin-hero-title">Sayt Boshqaruv Markazi (Admin)</h1>
            <p class="admin-hero-desc">
              <span id="admin-user-display">Administrator: Tekshirilmoqda...</span>
            </p>
          </div>
        </div>
        <div class="admin-live-badge">Boshqaruv Huquqi Faol</div>
      </div>

      <!-- NAVIGATION TABS -->
      <div class="admin-tabs-nav" id="admin-tabs-nav">
        <button type="button" class="admin-tab-btn active" data-tab="users">
          <span>👥</span>
          <span>Foydalanuvchilar</span>
          <span class="admin-badge-count" id="badge-users-count" style="display: none;">0</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="analytics">
          <span>📊</span>
          <span>Analitika & Reyting</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="broadcast">
          <span>📢</span>
          <span>E’lonlar (Banner)</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="promocodes">
          <span>🎁</span>
          <span>Promokodlar</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="curriculum">
          <span>📚</span>
          <span>Darslar & Fanlar</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="ai-settings">
          <span>🧠</span>
          <span>AI Sozlamalari</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="ai-health">
          <span>🤖</span>
          <span>AI Salomatligi</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="system">
          <span>⚙️</span>
          <span>Tizim & Profilaktika</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="payments">
          <span>💳</span>
          <span>To‘lovlar & PRO</span>
          <span class="admin-badge-count" id="badge-payments-count" style="display: none; background: #10b981;">0</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="questions">
          <span>🧮</span>
          <span>Savollar Banki</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="support">
          <span>💬</span>
          <span>Support Inbox</span>
          <span class="admin-badge-count" id="badge-support-count" style="display: none;">0</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="community">
          <span>🛡️</span>
          <span>Guruh Nazorati</span>
        </button>

        <button type="button" class="admin-tab-btn" data-tab="audit">
          <span>📋</span>
          <span>Audit & Jurnallar</span>
        </button>
      </div>

      <!-- ========================================================
           TAB 1: USERS & PRO & MODERATION
      ======================================================== -->
      <div id="tab-pane-users" class="admin-tab-pane">
        
        <!-- STATS CARDS -->
        <div class="admin-stats-grid" style="margin-bottom: 22px;">
          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #60a5fa;">👥</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="stat-total-users">0</span>
              <span class="admin-stat-label">Jami Foydalanuvchilar</span>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #c084fc;">⭐</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="stat-pro-users" style="color: #c084fc;">0</span>
              <span class="admin-stat-label">Faol PRO Obunachilar</span>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #f87171;">🚫</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="stat-banned-users" style="color: #f87171;">0</span>
              <span class="admin-stat-label">Bloklanganlar (Ban)</span>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #fbbf24;">💬</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="stat-support-tickets">0</span>
              <span class="admin-stat-label">Support Murojaatlari</span>
            </div>
          </div>
        </div>

        <!-- SEARCH BAR -->
        <div class="admin-search-bar">
          <input
            type="search"
            id="admin-users-search"
            class="admin-search-input"
            placeholder="🔍 Foydalanuvchini Google email yoki ismi bo‘yicha qidiring..."
            autocomplete="off"
          >
        </div>

        <!-- USERS TABLE -->
        <div class="admin-table-wrap">
          <table class="admin-users-table">
            <thead>
              <tr>
                <th>Foydalanuvchi</th>
                <th>Google Email</th>
                <th>Ro‘yxatdan o‘tgan</th>
                <th>So‘nggi faollik</th>
                <th>Holat / Tarif</th>
                <th style="text-align: right;">Amallar</th>
              </tr>
            </thead>
            <tbody id="admin-users-table-body">
              <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">
                  Foydalanuvchilar yuklanmoqda...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================
           TAB 2: BROADCAST ANNOUNCEMENT BANNER
      ======================================================== -->
      <div id="tab-pane-broadcast" class="admin-tab-pane" style="display: none;">
        <div class="admin-actions-card">
          <div class="admin-card-head">
            <h2 class="admin-card-title">
              <span style="color: #38bdf8;">📢</span> Sayt Bo‘ylab Umumiy E’lon (Broadcast Banner)
            </h2>
            <span style="font-size: 13px; color: #a5a4b8;">Barcha sahifalarning eng yuqori qismida ko‘rinadigan e’lon matni</span>
          </div>

          <form id="broadcast-form" style="display: flex; flex-direction: column; gap: 16px; max-width: 720px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 6px;">
                E’lon Matni:
              </label>
              <textarea
                id="broadcast-text"
                rows="3"
                placeholder="Masalan: 🎉 Gulasal AI yangilandi! Yangi mavzular va darslar qo‘shildi."
                style="width: 100%; padding: 12px 14px; border-radius: 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 14px; outline: none; font-family: inherit; resize: vertical;"
              ></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <label style="display: block; font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 6px;">
                  Banner Rangi & Turi:
                </label>
                <select id="broadcast-type" style="width: 100%; padding: 10px 12px; border-radius: 10px; background: rgba(22, 17, 44, 0.95); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 13.5px; outline: none;">
                  <option value="info">ℹ️ Ma’lumot (Moviy ko‘k)</option>
                  <option value="warning">⚠️ Ogohlantirish (Sariq / To‘q sariq)</option>
                  <option value="success">🎉 Yangilik & Yutuq (Zumrad yashil)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 6px;">
                  Holat (Status):
                </label>
                <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; cursor: pointer;">
                  <input type="checkbox" id="broadcast-active" style="width: 18px; height: 18px; accent-color: #a855f7;">
                  <span style="font-size: 13.5px; font-weight: 700; color: #fff;">Saytda ko‘rsatish (Faol)</span>
                </label>
              </div>
            </div>

            <!-- LIVE PREVIEW BOX -->
            <div style="margin-top: 8px;">
              <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Jonli Ko‘rinish (Live Preview):</span>
              <div id="broadcast-preview-box" style="margin-top: 6px; padding: 10px 16px; border-radius: 10px; background: linear-gradient(90deg, #1e1b4b, #2563eb); color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                <span id="broadcast-preview-icon">📢</span>
                <span id="broadcast-preview-text" style="flex: 1;">E’lon matni bu yerda ko‘rinadi...</span>
                <span>✕</span>
              </div>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 10px;">
              <button type="submit" id="broadcast-save-btn" style="padding: 12px 24px; border-radius: 12px; background: linear-gradient(135deg, #a855f7, #6366f1); border: none; color: #fff; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <span>💾</span>
                <span>Saqlash va Saytga Chiqarish</span>
              </button>
            </div>
            <div id="broadcast-feedback" style="font-size: 13px; font-weight: 700; display: none;"></div>
          </form>
        </div>
      </div>

      <!-- ========================================================
           TAB 3: PROMOCODES MANAGEMENT
      ======================================================== -->
      <div id="tab-pane-promocodes" class="admin-tab-pane" style="display: none;">
        
        <div style="display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start;">
          <!-- CREATE PROMOCODE CARD -->
          <div class="admin-actions-card">
            <div class="admin-card-head">
              <h2 class="admin-card-title">
                <span style="color: #ec4899;">🎁</span> Yangi Promokod
              </h2>
              <span style="font-size: 12.5px; color: #a5a4b8;">PRO beruvchi maxsus kod yaratish</span>
            </div>

            <form id="promocode-create-form" style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label style="display: block; font-size: 12.5px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px;">
                  Promokod Matni:
                </label>
                <input
                  type="text"
                  id="promo-code-input"
                  placeholder="Masalan: GULASAL2026"
                  required
                  style="width: 100%; padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 14px; text-transform: uppercase; outline: none; font-weight: 800; letter-spacing: 1px;"
                >
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px;">
                    Muddati (Kun):
                  </label>
                  <input
                    type="number"
                    id="promo-days-input"
                    value="30"
                    min="1"
                    max="365"
                    style="width: 100%; padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 14px; outline: none;"
                  >
                </div>

                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px;">
                    Maks. Ishlatish:
                  </label>
                  <input
                    type="number"
                    id="promo-max-input"
                    value="50"
                    min="1"
                    max="1000"
                    style="width: 100%; padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 14px; outline: none;"
                  >
                </div>
              </div>

              <button type="submit" id="promo-submit-btn" style="padding: 12px; border-radius: 12px; background: linear-gradient(135deg, #ec4899, #a855f7); border: none; color: #fff; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>➕</span>
                <span>Promokodni Yaratish</span>
              </button>
              <div id="promo-feedback" style="font-size: 12px; font-weight: 700; display: none;"></div>
            </form>
          </div>

          <!-- PROMOCODES LIST -->
          <div class="admin-actions-card">
            <div class="admin-card-head">
              <h2 class="admin-card-title">
                <span>📋</span> Mavjud Promokodlar Ro‘yxati
              </h2>
              <span id="promocodes-count-badge" style="font-size: 12.5px; color: #a5a4b8;">0 ta promokod</span>
            </div>

            <div class="admin-table-wrap">
              <table class="admin-users-table">
                <thead>
                  <tr>
                    <th>Promokod</th>
                    <th>PRO Muddati</th>
                    <th>Ishlatilgan</th>
                    <th>Holat</th>
                    <th style="text-align: right;">Amallar</th>
                  </tr>
                </thead>
                <tbody id="promocodes-table-body">
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: #94a3b8;">
                      Promokodlar yuklanmoqda...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================================
           TAB 4: CURRICULUM & CONTENT MANAGEMENT
      ======================================================== -->
      <div id="tab-pane-curriculum" class="admin-tab-pane" style="display: none;">
        
        <div style="display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start;">
          <!-- SUBJECTS LIST -->
          <div class="admin-actions-card">
            <div class="admin-card-head">
              <h2 class="admin-card-title" style="font-size: 16px;">
                <span>📚</span> Fanlar
              </h2>
              <span style="font-size: 12px; color: #94a3b8;">Mavzularni ko‘rish uchun fanni tanlang</span>
            </div>

            <div id="curriculum-subjects-list" style="display: flex; flex-direction: column; gap: 8px;">
              <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">Fanlar yuklanmoqda...</div>
            </div>
          </div>

          <!-- TOPICS LIST & ADD FORM -->
          <div class="admin-actions-card">
            <div class="admin-card-head" style="justify-content: space-between;">
              <div>
                <h2 class="admin-card-title" id="curriculum-active-subject-title">
                  <span>📖</span> Fan mavzulari
                </h2>
                <span id="curriculum-active-subject-desc" style="font-size: 12.5px; color: #a5a4b8;">Fanga tegishli mavzular</span>
              </div>
              <button type="button" id="btn-open-add-topic" style="padding: 8px 16px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <span>➕</span>
                <span>Yangi Mavzu Qo‘shish</span>
              </button>
            </div>

            <!-- TOPICS CONTAINER -->
            <div id="curriculum-topics-container" style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
              <div style="padding: 40px; text-align: center; color: #94a3b8; font-size: 13px;">Chap tomondan fanni tanlang.</div>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================================
           TAB 5: AI HEALTH & METRICS MONITOR
      ======================================================== -->
      <div id="tab-pane-ai-health" class="admin-tab-pane" style="display: none;">
        
        <div class="admin-actions-card" style="margin-bottom: 20px;">
          <div class="admin-card-head" style="justify-content: space-between;">
            <div>
              <h2 class="admin-card-title">
                <span style="color: #38bdf8;">🤖</span> Sun’iy Intellekt (AI) Holati va API Tarmoq Monitoringi
              </h2>
              <span style="font-size: 13px; color: #a5a4b8;">Groq Cloud va Google Gemini API larining jonli holati</span>
            </div>
            <button type="button" id="btn-ping-ai" style="padding: 10px 18px; border-radius: 12px; background: linear-gradient(135deg, #38bdf8, #6366f1); border: none; color: #fff; font-weight: 800; font-size: 13.5px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <span>🔄</span>
              <span id="btn-ping-ai-text">Aloqani Tekshirish (Ping)</span>
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">
            
            <!-- GROQ STATUS CARD -->
            <div style="background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 24px;">⚡</span>
                  <div>
                    <strong style="color: #fff; font-size: 16px; display: block;">Groq Cloud API</strong>
                    <small style="color: #94a3b8;">Darslar & Tezkor JSON generatori</small>
                  </div>
                </div>
                <span id="ai-groq-badge" style="padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; background: rgba(255,255,255,0.1); color: #cbd5e1;">
                  Kutilmoqda...
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #cbd5e1;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">Asosiy model:</span>
                  <span style="color: #fff; font-family: monospace;">openai/gpt-oss-120b</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">Javob tezligi (Ping):</span>
                  <span id="ai-groq-ping" style="color: #38bdf8; font-weight: 750;">— ms</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">API Kalit holati:</span>
                  <span id="ai-groq-key" style="color: #86efac; font-family: monospace; font-size: 12px;">—</span>
                </div>
              </div>
            </div>

            <!-- GEMINI STATUS CARD -->
            <div style="background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 24px;">🧠</span>
                  <div>
                    <strong style="color: #fff; font-size: 16px; display: block;">Google Gemini API</strong>
                    <small style="color: #94a3b8;">Tutor AI & Vision Maslahatchi</small>
                  </div>
                </div>
                <span id="ai-gemini-badge" style="padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; background: rgba(255,255,255,0.1); color: #cbd5e1;">
                  Kutilmoqda...
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #cbd5e1;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">Asosiy model:</span>
                  <span style="color: #fff; font-family: monospace;">gemini-3.8-flash</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">Javob tezligi (Ping):</span>
                  <span id="ai-gemini-ping" style="color: #38bdf8; font-weight: 750;">— ms</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">API Kalit holati:</span>
                  <span id="ai-gemini-key" style="color: #86efac; font-family: monospace; font-size: 12px;">—</span>
                </div>
              </div>
            </div>

            <!-- USAGE STATS CARD -->
            <div style="background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <span style="font-size: 24px;">📊</span>
                <div>
                  <strong style="color: #fff; font-size: 16px; display: block;">Kunlik AI Faolligi</strong>
                  <small style="color: #94a3b8;">Server statistikasi</small>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #cbd5e1;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">Bugungi so‘rovlar:</span>
                  <strong id="ai-daily-count" style="color: #a855f7; font-size: 15px;">0 ta</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">Server uzluksiz ishi (Uptime):</span>
                  <span id="ai-uptime" style="color: #fff;">— soat</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">So‘nggi tekshiruv:</span>
                  <span id="ai-checked-time" style="color: #94a3b8; font-size: 11.5px;">—</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- ========================================================
           TAB 6: SUPPORT INBOX
      ======================================================== -->
      <div id="tab-pane-support" class="admin-tab-pane" style="display: none;">
        <div class="admin-support-layout">
          
          <!-- LEFT INBOX LIST -->
          <div class="admin-inbox-pane">
            <div class="admin-inbox-header">
              <span>Murojaatlar ro‘yxati</span>
              <span id="admin-inbox-unread-summary" style="font-size: 12px; color: #a855f7;">0 ta yangi</span>
            </div>
            <div class="admin-inbox-list" id="admin-inbox-list">
              <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 13px;">
                Murojaatlar yuklanmoqda...
              </div>
            </div>
          </div>

          <!-- RIGHT ACTIVE CHAT -->
          <div class="admin-chat-pane">
            <div class="admin-chat-topbar" id="admin-chat-topbar">
              <div style="color: #94a3b8; font-size: 13px;">Murojaatni tanlang</div>
            </div>

            <div class="admin-chat-thread" id="admin-chat-thread">
              <div style="text-align: center; color: #8c89a8; padding: 60px 20px; font-size: 14px;">
                💬 Chap tomondan foydalanuvchi murojaatini tanlang.
              </div>
            </div>

            <!-- COMPOSER -->
            <div class="admin-chat-composer" id="admin-chat-composer" style="display: none;">
              <input type="file" id="adm-chat-file" accept="image/*" style="display: none;">
              <button type="button" id="adm-chat-attach-btn" title="Rasm biriktirish" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; cursor: pointer;">
                📷
              </button>
              <textarea id="adm-chat-input" rows="1" placeholder="Foydalanuvchiga rasmiy javob yozing..." style="flex: 1; resize: none; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 14px; color: #fff; font-family: inherit; font-size: 13.5px; outline: none;"></textarea>
              <button type="button" id="adm-chat-send-btn" style="background: linear-gradient(135deg, #a855f7, #6366f1); border: none; color: #fff; padding: 10px 18px; border-radius: 12px; font-weight: 800; cursor: pointer;">
                Yuborish
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ========================================================
           TAB 7: COMMUNITY GROUP MODERATION
      ======================================================== -->
      <div id="tab-pane-community" class="admin-tab-pane" style="display: none;">
        
        <div class="admin-actions-card">
          <div class="admin-card-head">
            <h2 class="admin-card-title">
              <span style="color: #ef4444;">🛡️</span> Qizlar Guruhi Chatini Boshqarish & Tozalash
            </h2>
            <span style="font-size: 13px; color: #a5a4b8;">Guruh xabarlarini real-time nazorat qilish va tozalash</span>
          </div>

          <div class="admin-actions-row">
            <button type="button" class="admin-btn-danger" id="admin-clear-chat-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Chat tarixini butunlay tozalash</span>
            </button>

            <button type="button" class="admin-btn-secondary" id="admin-go-chat-btn">
              <span>💬 Qizlar guruhi chatiga o‘tish →</span>
            </button>
          </div>
        </div>

        <div class="admin-actions-card" style="border-color: rgba(167, 139, 250, 0.25);">
          <div class="admin-card-head">
            <h2 class="admin-card-title">
              <span style="color: #a78bfa;">📝</span> Guruhdagi So‘nggi Xabarlar
            </h2>
            <span style="font-size: 13px; color: #a5a4b8;">Xabarlarni bittalab o‘chirish imkoniyati</span>
          </div>

          <div class="admin-messages-list" id="admin-messages-container">
            <div class="admin-empty-notice">Xabarlar yuklanmoqda...</div>
          </div>
        </div>

      </div>

      <!-- ========================================================
           TAB 8: AUDIT LOG & MODERATION LIST
      ======================================================== -->
      <div id="tab-pane-audit" class="admin-tab-pane" style="display: none;">
        
        <!-- ACTIVE BANS & MUTES -->
        <div class="admin-actions-card" style="margin-bottom: 20px;">
          <div class="admin-card-head">
            <h2 class="admin-card-title">
              <span style="color: #f87171;">🛡️</span> Bloklangan va Cheklanganlar Ro‘yxati
            </h2>
            <span style="font-size: 13px; color: #a5a4b8;">Ban va Mute cheklovlarini bekor qilish</span>
          </div>

          <div id="moderation-summary-container">
            <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">Moderatsiya ma’lumotlari yuklanmoqda...</div>
          </div>
        </div>

        <!-- AUDIT LOGS TABLE -->
        <div class="admin-table-wrap">
          <table class="admin-users-table">
            <thead>
              <tr>
                <th>Harakat (Action)</th>
                <th>Administrator</th>
                <th>Foydalanuvchi ID</th>
                <th>Tafsilotlar</th>
                <th>Vaqti</th>
              </tr>
            </thead>
            <tbody id="admin-audit-table-body">
              <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">
                  Audit loglari yuklanmoqda...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================
           TAB: ANALYTICS & STUDENT LEADERBOARD
      ======================================================== -->
      <div id="tab-pane-analytics" class="admin-tab-pane" style="display: none;">
        
        <!-- ANALYTICS STATS -->
        <div class="admin-stats-grid" style="margin-bottom: 22px;">
          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #60a5fa;">🎓</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="an-stat-students">0</span>
              <span class="admin-stat-label">Faol O‘rganuvchilar</span>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #34d399;">📖</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="an-stat-lessons" style="color: #34d399;">0</span>
              <span class="admin-stat-label">Tugatilgan Darslar</span>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #fbbf24;">📝</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="an-stat-quizzes" style="color: #fbbf24;">0</span>
              <span class="admin-stat-label">Topshirilgan Testlar</span>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #c084fc;">🎯</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="an-stat-avg-score" style="color: #c084fc;">0%</span>
              <span class="admin-stat-label">O‘rtacha Test Natijasi</span>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start;">
          <!-- LEADERBOARD TABLE -->
          <div class="admin-actions-card">
            <div class="admin-card-head">
              <h2 class="admin-card-title">
                <span style="color: #fbbf24;">🏆</span> Top-10 Eng Faol O‘quvchilar Reytingi
              </h2>
              <span style="font-size: 13px; color: #a5a4b8;">O‘rganilgan darslar va test ballari asosida</span>
            </div>

            <div class="admin-table-wrap">
              <table class="admin-users-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">O‘rin</th>
                    <th>O‘quvchi</th>
                    <th style="text-align: center;">Darslar</th>
                    <th style="text-align: center;">Test o‘rt.</th>
                    <th style="text-align: center;">Tarif</th>
                    <th style="text-align: right;">Amal</th>
                  </tr>
                </thead>
                <tbody id="an-leaderboard-tbody">
                  <tr>
                    <td colspan="6" style="text-align: center; padding: 30px; color: #94a3b8;">
                      Reyting yuklanmoqda...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- SUBJECT POPULARITY -->
          <div class="admin-actions-card">
            <div class="admin-card-head">
              <h2 class="admin-card-title">
                <span style="color: #a855f7;">📈</span> Fanlar Mashhurligi
              </h2>
              <span style="font-size: 13px; color: #a5a4b8;">O‘quvchilar darslarni o‘rganish ulushi</span>
            </div>

            <div id="an-subjects-list" style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
              <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
                Fanlar statistikasi yuklanmoqda...
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================================
           TAB: AI SETTINGS & RATE LIMITS
      ======================================================== -->
      <div id="tab-pane-ai-settings" class="admin-tab-pane" style="display: none;">
        
        <!-- REAL-TIME TOKEN & USAGE METRICS -->
        <div class="admin-stats-grid" style="margin-bottom: 22px;">
          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #60a5fa;">⚡</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="ai-stat-today-requests">0</span>
              <span class="admin-stat-label">Bugungi AI So‘rovlar</span>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #a855f7;">🪙</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="ai-stat-today-tokens" style="color: #c084fc;">0</span>
              <span class="admin-stat-label">Taxminiy Tokenlar Sarfi</span>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #34d399;">👥</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="ai-stat-active-users" style="color: #34d399;">0</span>
              <span class="admin-stat-label">Bugungi Faol Foydalanuvchilar</span>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon-wrap" style="color: #fbbf24;">🛡️</div>
            <div class="admin-stat-info">
              <span class="admin-stat-value" id="ai-stat-current-limit" style="color: #fbbf24;">20 ta</span>
              <span class="admin-stat-label">Kunlik Bepul Limit</span>
            </div>
          </div>
        </div>

        <div class="admin-actions-card" style="max-width: 800px;">
          <div class="admin-card-head">
            <h2 class="admin-card-title">
              <span style="color: #a855f7;">🧠</span> AI Tyutor Model, Limit & Uslub Sozlamalari
            </h2>
            <span style="font-size: 13px; color: #a5a4b8;">Sun'iy intellekt xatti-harakati, kunlik so‘rovlar limiti va model provayderini boshqarish</span>
          </div>

          <form id="ai-settings-form" style="display: flex; flex-direction: column; gap: 20px; margin-top: 10px;">
            <!-- DAILY FREE REQUESTS LIMIT -->
            <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 14px; padding: 14px 18px;">
              <label style="display: block; font-size: 14px; font-weight: 800; color: #f1f5f9; margin-bottom: 6px;">
                ⚡ Kunlik Bepul So‘rovlar Limiti (Free foydalanuvchilar uchun):
              </label>
              <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 10px;">
                Oddiy va mehmon foydalanuvchilar 1 kunda ko‘pi bilan shuncha savol bera oladi. Limit tugagach, ularga PRO obunaga o‘tish taklif etiladi (PRO larda cheksiz).
              </p>
              <div style="display: flex; align-items: center; gap: 12px;">
                <input
                  type="number"
                  id="ai-daily-free-limit"
                  min="1"
                  max="500"
                  value="20"
                  style="width: 140px; padding: 10px 14px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1.5px solid rgba(168, 85, 247, 0.6); color: #fff; font-size: 16px; font-weight: 900; outline: none;"
                >
                <span style="font-size: 13px; color: #a5a4b8;">ta so‘rov / kuniga</span>
              </div>
            </div>

            <!-- PROVIDER SELECTION -->
            <div>
              <label style="display: block; font-size: 13.5px; font-weight: 750; color: #f1f5f9; margin-bottom: 8px;">
                Asosiy AI Modeli va Provayderi:
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <label style="display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); cursor: pointer;">
                  <input type="radio" name="ai-provider" value="groq" checked style="width: 18px; height: 18px; accent-color: #a855f7;">
                  <div>
                    <div style="font-size: 14px; font-weight: 800; color: #fff;">⚡ Groq Cloud</div>
                    <div style="font-size: 12px; color: #94a3b8;">openai/gpt-oss-120b (Ultra tezkor javob)</div>
                  </div>
                </label>

                <label style="display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); cursor: pointer;">
                  <input type="radio" name="ai-provider" value="gemini" style="width: 18px; height: 18px; accent-color: #a855f7;">
                  <div>
                    <div style="font-size: 14px; font-weight: 800; color: #fff;">🌟 Google Gemini</div>
                    <div style="font-size: 12px; color: #94a3b8;">gemini-2.5-flash (Chuqur tahlil)</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- TUTOR STYLE -->
            <div>
              <label style="display: block; font-size: 13.5px; font-weight: 750; color: #f1f5f9; margin-bottom: 8px;">
                AI Tyutor Uslubi (Ohangi):
              </label>
              <select id="ai-tutor-style" style="width: 100%; padding: 12px 14px; border-radius: 12px; background: rgba(22, 17, 44, 0.95); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 14px; outline: none;">
                <option value="friendly">🤗 Do‘stona & Rag‘batlantiruvchi (Samimiy qo‘llab-quvvatlaydi, maqtaydi)</option>
                <option value="academic">📚 Akademik & Aniq (Qat’iy ilmiy tushuntirish, qisqa va aniq)</option>
                <option value="socratic">🤔 Sokratik Savol-Javob (Darhol tayyor javob aytmay, savollar beradi)</option>
                <option value="custom">✍️ Maxsus Prompt (Quyida yozilgan maxsus ko‘rsatma bo‘yicha)</option>
              </select>
            </div>

            <!-- TEMPERATURE SLIDER -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label style="font-size: 13.5px; font-weight: 750; color: #f1f5f9;">
                  Kreativlik / Harorat (Temperature):
                </label>
                <span id="ai-temp-display" style="font-size: 14px; font-weight: 800; color: #a855f7; font-family: monospace;">0.70</span>
              </div>
              <input type="range" id="ai-temperature" min="0.1" max="1.0" step="0.05" value="0.7" style="width: 100%; accent-color: #a855f7; cursor: pointer;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 4px;">
                <span>0.1 (Aniq, bir xil)</span>
                <span>0.7 (Balanslashgan)</span>
                <span>1.0 (Ijodiy, rang-barang)</span>
              </div>
            </div>

            <!-- CUSTOM SYSTEM PROMPT -->
            <div>
              <label style="display: block; font-size: 13.5px; font-weight: 750; color: #f1f5f9; margin-bottom: 8px;">
                Qo‘shimcha AI Tizimli Ko‘rsatma (System Prompt):
              </label>
              <textarea
                id="ai-custom-prompt"
                rows="4"
                placeholder="AI o‘zini qanday tutishi bo‘yicha qo‘shimcha yo‘riqnoma (ixtiyoriy)..."
                style="width: 100%; padding: 12px 14px; border-radius: 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13.5px; outline: none; font-family: inherit; resize: vertical;"
              ></textarea>
            </div>

            <div>
              <button type="submit" id="ai-settings-save-btn" style="padding: 12px 26px; border-radius: 12px; background: linear-gradient(135deg, #a855f7, #6366f1); border: none; color: #fff; font-weight: 800; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                <span>💾</span>
                <span>AI Sozlamalarini Saqlash</span>
              </button>
              <div id="ai-settings-feedback" style="margin-top: 10px; font-size: 13px; font-weight: 700; display: none;"></div>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================================
           TAB: SYSTEM & MAINTENANCE MODE
      ======================================================== -->
      <div id="tab-pane-system" class="admin-tab-pane" style="display: none;">
        <div class="admin-actions-card" style="max-width: 760px;">
          <div class="admin-card-head">
            <h2 class="admin-card-title">
              <span style="color: #fbbf24;">🚧</span> Texnik Profilaktika Rejimi (Maintenance Mode)
            </h2>
            <span style="font-size: 13px; color: #a5a4b8;">Saytda yangilanish yoki profilaktika o‘tkazilayotganda foydalanuvchilar kirishini cheklash</span>
          </div>

          <form id="system-settings-form" style="display: flex; flex-direction: column; gap: 18px; margin-top: 10px;">
            <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 14px; padding: 14px 18px; font-size: 13px; color: #fef08a; line-height: 1.5;">
              ⚠️ <strong>Eslatma:</strong> Profilaktika yoqilganda barcha oddiy o‘quvchilar profilaktika ekranini ko‘rishadi. Administrator (<strong>bahtiermustafoev1974@gmail.com</strong>) saytga to‘siqsiz kirishda va boshqarishda davom etadi.
            </div>

            <!-- TOGGLE -->
            <div>
              <label style="display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; cursor: pointer;">
                <input type="checkbox" id="sys-maintenance-active" style="width: 22px; height: 22px; accent-color: #fbbf24; cursor: pointer;">
                <div>
                  <div style="font-size: 14.5px; font-weight: 800; color: #fff;">Profilaktika Rejimini Yoqish</div>
                  <div style="font-size: 12.5px; color: #94a3b8;">Belgilanganda oddiy foydalanuvchilar uchun sayt vaqtincha yopiladi</div>
                </div>
              </label>
            </div>

            <!-- MESSAGE -->
            <div>
              <label style="display: block; font-size: 13.5px; font-weight: 750; color: #f1f5f9; margin-bottom: 6px;">
                Foydalanuvchilarga Ko‘rsatiladigan Xabar:
              </label>
              <textarea
                id="sys-maintenance-message"
                rows="3"
                placeholder="Platformada rejaviy texnik profilaktika ishlari olib borilmoqda..."
                style="width: 100%; padding: 12px 14px; border-radius: 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13.5px; outline: none; font-family: inherit; resize: vertical;"
              ></textarea>
            </div>

            <!-- ETA -->
            <div>
              <label style="display: block; font-size: 13.5px; font-weight: 750; color: #f1f5f9; margin-bottom: 6px;">
                Taxminiy Tugash Vaqti:
              </label>
              <input
                type="text"
                id="sys-maintenance-eta"
                placeholder="Masalan: Bugun soat 23:45 da yoki 1 soat ichida"
                style="width: 100%; padding: 11px 14px; border-radius: 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13.5px; outline: none;"
              >
            </div>

            <div>
              <button type="submit" id="sys-settings-save-btn" style="padding: 12px 26px; border-radius: 12px; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #fff; font-weight: 800; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                <span>💾</span>
                <span>Tizim Sozlamalarini Saqlash</span>
              </button>
              <div id="sys-settings-feedback" style="margin-top: 10px; font-size: 13px; font-weight: 700; display: none;"></div>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================================
           TAB: PAYMENTS & AUTOMATED SUBSCRIPTIONS (OFFICIAL CARD: 9860 1606 3566 3802)
      ======================================================== -->
      <div id="tab-pane-payments" class="admin-tab-pane" style="display: none;">
        
        <!-- CARD INFO & SUMMARY STATS -->
        <div style="display: grid; grid-template-columns: 1.2fr 2fr; gap: 20px; margin-bottom: 22px; align-items: stretch;">
          
          <!-- OFFICIAL PLASTIC CARD DISPLAY -->
          <div style="background: linear-gradient(135deg, #2e1065 0%, #1e1b4b 60%, #0f172a 100%); border: 1.5px solid rgba(168, 85, 247, 0.5); border-radius: 20px; padding: 22px; color: #fff; box-shadow: 0 12px 35px rgba(0,0,0,0.6); position: relative; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span style="font-size: 13px; font-weight: 800; color: #c084fc; letter-spacing: 0.5px;">GULASAL AI RASMIY KARTASI</span>
              <span style="font-size: 11px; font-weight: 700; background: rgba(59, 130, 246, 0.25); color: #93c5fd; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.4);">HUMO / UZCARD</span>
            </div>
            <div style="font-family: 'Courier New', monospace; font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #fff; margin-bottom: 14px;">
              9860 1606 3566 3802
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px;">
              <div>
                <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Karta Egasi</span>
                <div style="font-weight: 800; color: #fff;">BAXTIYOR M.</div>
              </div>
              <span style="background: rgba(16, 185, 129, 0.2); color: #86efac; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;">
                ● To‘lovlar Faol
              </span>
            </div>
          </div>

          <!-- REVENUE & PAYMENTS STATS -->
          <div class="admin-stats-grid" style="margin-bottom: 0;">
            <div class="admin-stat-card">
              <div class="admin-stat-icon-wrap" style="color: #fbbf24;">⏳</div>
              <div class="admin-stat-info">
                <span class="admin-stat-value" id="pay-stat-pending" style="color: #fbbf24;">0</span>
                <span class="admin-stat-label">Kutilayotgan To‘lovlar</span>
              </div>
            </div>

            <div class="admin-stat-card">
              <div class="admin-stat-icon-wrap" style="color: #34d399;">✅</div>
              <div class="admin-stat-info">
                <span class="admin-stat-value" id="pay-stat-approved" style="color: #34d399;">0</span>
                <span class="admin-stat-label">Tasdiqlangan PRO</span>
              </div>
            </div>

            <div class="admin-stat-card">
              <div class="admin-stat-icon-wrap" style="color: #a855f7;">💰</div>
              <div class="admin-stat-info">
                <span class="admin-stat-value" id="pay-stat-revenue" style="color: #c084fc;">0 so‘m</span>
                <span class="admin-stat-label">Jami Tushum</span>
              </div>
            </div>
          </div>

        </div>

        <!-- PAYMENTS MANAGEMENT TABLE CARD -->
        <div class="admin-actions-card">
          <div class="admin-card-head" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
              <h2 class="admin-card-title">
                <span style="color: #10b981;">💳</span> Kelib Tushgan To‘lov Arizalari & Cheklar
              </h2>
              <span style="font-size: 13px; color: #a5a4b8;">Foydalanuvchilar cheklarini tekshirish va 1 tugma bilan avtomatik PRO yoqish</span>
            </div>

            <!-- FILTER BUTTONS -->
            <div style="display: flex; gap: 8px;">
              <button type="button" class="admin-pay-filter-btn active" data-filter="all" style="padding: 6px 14px; border-radius: 10px; background: rgba(168, 85, 247, 0.2); border: 1px solid #a855f7; color: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                Barchasi
              </button>
              <button type="button" class="admin-pay-filter-btn" data-filter="pending" style="padding: 6px 14px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fbbf24; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                ⏳ Kutilmoqda
              </button>
              <button type="button" class="admin-pay-filter-btn" data-filter="approved" style="padding: 6px 14px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #34d399; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                ✅ Tasdiqlangan
              </button>
              <button type="button" class="admin-pay-filter-btn" data-filter="rejected" style="padding: 6px 14px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #f87171; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                ❌ Rad etilgan
              </button>
            </div>
          </div>

          <div class="admin-table-wrap">
            <table class="admin-users-table">
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>O‘quvchi / Email</th>
                  <th>Tanlangan Tarif</th>
                  <th>Summa</th>
                  <th>Chek / Rasm</th>
                  <th>Izoh / Karta</th>
                  <th>Holat</th>
                  <th style="text-align: right;">Boshqaruv</th>
                </tr>
              </thead>
              <tbody id="payments-tbody">
                <tr>
                  <td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">
                    To‘lovlar yuklanmoqda...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ========================================================
           TAB: QUESTION BANK (TESTLAR VA SAVOLLAR BANKI)
      ======================================================== -->
      <div id="tab-pane-questions" class="admin-tab-pane" style="display: none;">
        
        <!-- STATS & ACTION HEADER -->
        <div class="admin-actions-card" style="margin-bottom: 22px;">
          <div class="admin-card-head" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
              <h2 class="admin-card-title">
                <span style="color: #38bdf8;">🧮</span> Testlar & Savollar Banki Boshqaruvi
              </h2>
              <span style="font-size: 13px; color: #a5a4b8;">Matematika, Fizika, IT va IELTS uchun yangi savollar qo‘shish, tahrirlash va o‘chirish</span>
            </div>

            <button type="button" id="btn-open-add-question" style="padding: 10px 20px; border-radius: 12px; background: linear-gradient(135deg, #0284c7, #2563eb); border: none; color: #fff; font-weight: 800; font-size: 13.5px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);">
              <span>➕</span>
              <span>Yangi Savol Qo‘shish</span>
            </button>
          </div>

          <!-- FILTER BAR -->
          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 14px;">
            <div style="display: flex; gap: 8px;" id="qb-subject-filters">
              <button type="button" class="admin-qb-filter-btn active" data-subject="all" style="padding: 6px 14px; border-radius: 10px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                Barcha Fanlar (<span id="qb-total-count">0</span>)
              </button>
              <button type="button" class="admin-qb-filter-btn" data-subject="math" style="padding: 6px 14px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                📐 Matematika (<span id="qb-math-count">0</span>)
              </button>
              <button type="button" class="admin-qb-filter-btn" data-subject="physics" style="padding: 6px 14px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                ⚡ Fizika (<span id="qb-physics-count">0</span>)
              </button>
              <button type="button" class="admin-qb-filter-btn" data-subject="informatics" style="padding: 6px 14px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                💻 IT & Informatika (<span id="qb-info-count">0</span>)
              </button>
              <button type="button" class="admin-qb-filter-btn" data-subject="ielts" style="padding: 6px 14px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                🎧 IELTS & Tillar (<span id="qb-ielts-count">0</span>)
              </button>
            </div>

            <div style="flex: 1; min-width: 220px;">
              <input
                type="text"
                id="qb-search-input"
                placeholder="Savol matni yoki mavzu bo‘yicha qidirish..."
                style="width: 100%; box-sizing: border-box; padding: 8px 14px; border-radius: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); color: #fff; font-size: 13px; outline: none;"
              >
            </div>
          </div>
        </div>

        <!-- QUESTIONS CARDS / LIST -->
        <div id="qb-questions-list" style="display: flex; flex-direction: column; gap: 14px;">
          <div style="padding: 40px; text-align: center; color: #94a3b8;">
            Savollar yuklanmoqda...
          </div>
        </div>

      </div>

      <!-- MODAL MOUNT -->
      <div id="admin-modal-mount"></div>

    </div>
  `;

  const $ = sel => container.querySelector(sel);
  const userDisplay = $('#admin-user-display');
  const modalMount = $('#admin-modal-mount');

  // Tabs switching
  const tabBtns = container.querySelectorAll('.admin-tab-btn');
  const tabPanes = {
    users: $('#tab-pane-users'),
    analytics: $('#tab-pane-analytics'),
    payments: $('#tab-pane-payments'),
    questions: $('#tab-pane-questions'),
    broadcast: $('#tab-pane-broadcast'),
    promocodes: $('#tab-pane-promocodes'),
    curriculum: $('#tab-pane-curriculum'),
    'ai-settings': $('#tab-pane-ai-settings'),
    'ai-health': $('#tab-pane-ai-health'),
    system: $('#tab-pane-system'),
    support: $('#tab-pane-support'),
    community: $('#tab-pane-community'),
    audit: $('#tab-pane-audit')
  };

  function switchTab(tabId) {
    activeTab = tabId;
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    Object.entries(tabPanes).forEach(([id, pane]) => {
      if (pane) pane.style.display = id === tabId ? 'block' : 'none';
    });

    if (tabId === 'users') loadUsers();
    if (tabId === 'analytics') loadAnalytics();
    if (tabId === 'payments') loadPayments();
    if (tabId === 'questions') loadQuestions();
    if (tabId === 'broadcast') loadBroadcastBanner();
    if (tabId === 'promocodes') loadPromocodes();
    if (tabId === 'curriculum') loadCurriculumSubjects();
    if (tabId === 'ai-settings') {
      loadAiSettings();
      loadAiUsage();
    }
    if (tabId === 'ai-health') loadAiHealth();
    if (tabId === 'system') loadSystemSettings();
    if (tabId === 'support') loadSupportInbox();
    if (tabId === 'community') loadGroupChat();
    if (tabId === 'audit') {
      loadAuditLogs();
      loadModerationList();
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    }, { signal });
  });

  // Verify Admin Authentication
  async function verifyAdmin() {
    try {
      const sessRes = await fetch('/api/auth/session');
      const sessData = await sessRes.json();
      const u = sessData?.user;

      if (!u || !u.isAdmin) {
        container.innerHTML = `
          <div style="padding: 80px 20px; text-align: center; color: #f87171;">
            <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
            <h2 style="margin: 0 0 10px; font-size: 24px; color: #fff;">403 — Kirish taqiqlangan</h2>
            <p style="color: #cbd5e1; font-size: 15px; max-width: 500px; margin: 0 auto 24px; line-height: 1.5;">
              Ushbu sahifaga kirish faqat rasmiy administrator (<strong>bahtiermustafoev1974@gmail.com</strong>) uchun ruxsat etiladi.
            </p>
          </div>
        `;
        return false;
      }

      if (userDisplay) {
        userDisplay.innerHTML = `Administrator: <strong style="color: #fde047;">${escapeHTML(u.email || u.name)}</strong> (Faol)`;
      }
      return true;
    } catch {
      return false;
    }
  }

  /* ========================================================
     1. USERS & PRO & MODERATION
  ======================================================== */

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Xatolik');

      allUsers = data.users || [];
      renderStats(allUsers);
      renderUsersTable(allUsers);
    } catch (err) {
      const tbody = $('#admin-users-table-body');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#f87171;">${escapeHTML(err.message)}</td></tr>`;
      }
    }
  }

  function renderStats(users) {
    const totalUsersEl = $('#stat-total-users');
    const proUsersEl = $('#stat-pro-users');
    const bannedUsersEl = $('#stat-banned-users');
    const badgeUsersCount = $('#badge-users-count');

    const total = users.length;
    const pro = users.filter(u => u.subscription?.isVip).length;
    const banned = users.filter(u => u.moderation?.isBanned).length;

    if (totalUsersEl) totalUsersEl.textContent = total;
    if (proUsersEl) proUsersEl.textContent = pro;
    if (bannedUsersEl) bannedUsersEl.textContent = banned;
    if (badgeUsersCount) {
      badgeUsersCount.textContent = total;
      badgeUsersCount.style.display = total > 0 ? 'inline-block' : 'none';
    }
  }

  function renderUsersTable(users) {
    const tbody = $('#admin-users-table-body');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Foydalanuvchilar topilmadi.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => {
      const isPro = Boolean(u.subscription?.isVip);
      const isBanned = Boolean(u.moderation?.isBanned);
      const isMuted = Boolean(u.moderation?.isMuted);
      const isGoogle = u.type === 'google' || Boolean(u.id && typeof u.id === 'string' && u.id.startsWith('google_'));
      const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
      const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
      
      const avatarHtml = u.picture
        ? `<img src="${escapeHTML(u.picture)}" class="user-avatar-circle" alt="Avatar">`
        : `<div class="user-avatar-circle">${escapeHTML((u.name || 'U')[0].toUpperCase())}</div>`;

      let badgeHtml = '';
      if (isBanned) {
        badgeHtml = `<span style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 800;">🚫 BLOKLANGAN</span>`;
      } else if (isMuted) {
        badgeHtml = `<span style="background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); color: #fcd34d; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 800;">🔇 MUTED</span>`;
      } else if (isPro) {
        badgeHtml = `<span class="status-pill-pro" title="Muddat: ${escapeHTML(u.subscription?.durationLabel || 'Cheksiz')}">⭐ PRO (${escapeHTML(u.subscription?.daysRemaining === 'unlimited' ? 'Cheksiz' : u.subscription?.daysRemaining + ' kun')})</span>`;
      } else {
        badgeHtml = `<span class="status-pill-free">FREE (Standart)</span>`;
      }

      return `
        <tr data-user-row="${escapeHTML(u.id)}">
          <td>
            <div class="user-cell">
              ${avatarHtml}
              <div>
                <span class="user-name-title">${escapeHTML(u.name || 'Ismsiz')} ${isGoogle ? '🔹' : ''}</span>
                <span class="user-email-subtitle">ID: ${escapeHTML(u.id.slice(0, 16))}...</span>
              </div>
            </div>
          </td>
          <td>
            <span style="color: #cbd5e1; font-family: monospace; font-size: 13px;">${escapeHTML(u.email || 'Email yo‘q')}</span>
          </td>
          <td style="color: #a5a4b8; font-size: 13px;">${regDate}</td>
          <td style="color: #a5a4b8; font-size: 13px;">${lastActive}</td>
          <td>${badgeHtml}</td>
          <td style="text-align: right;">
            <button type="button" class="btn-manage-user" data-user-id="${escapeHTML(u.id)}">
              Boshqarish ⚙️
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-manage-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-user-id');
        const user = allUsers.find(x => x.id === uid);
        if (user) openUserManagementModal(user);
      });
    });
  }

  // Live Search filter
  const searchInput = $('#admin-users-search');
  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      renderUsersTable(allUsers);
      return;
    }
    const filtered = allUsers.filter(u => 
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
    renderUsersTable(filtered);
  }, { signal });

  // USER MANAGEMENT MODAL
  function openUserManagementModal(user) {
    const isPro = Boolean(user.subscription?.isVip);
    const isBanned = Boolean(user.moderation?.isBanned);
    const isMuted = Boolean(user.moderation?.isMuted);
    const sub = user.subscription || {};

    modalMount.innerHTML = `
      <div class="comm-modal-overlay" id="adm-user-modal-bg" style="position: fixed; inset: 0; z-index: 99999; display: grid; place-items: center; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); padding: 20px;">
        <div style="background: rgba(22, 17, 44, 0.98); border: 1px solid rgba(168, 85, 247, 0.45); border-radius: 24px; padding: 32px 28px; max-width: 560px; width: 100%; box-shadow: 0 25px 70px rgba(0,0,0,0.85); max-height: 90vh; overflow-y: auto;">
          
          <!-- MODAL HEADER -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div style="display: flex; gap: 14px; align-items: center;">
              ${user.picture 
                ? `<img src="${escapeHTML(user.picture)}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #a855f7;">`
                : `<div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #6366f1); display: grid; place-items: center; color: #fff; font-size: 22px; font-weight: 800;">${escapeHTML((user.name || 'U')[0].toUpperCase())}</div>`
              }
              <div>
                <h3 style="margin: 0; font-size: 18px; color: #fff; font-weight: 800;">${escapeHTML(user.name || 'Foydalanuvchi')}</h3>
                <span style="font-size: 13px; color: #cbd5e1; font-family: monospace;">${escapeHTML(user.email || 'Email yo‘q')}</span>
              </div>
            </div>
            <button type="button" id="adm-user-close-btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; cursor: pointer;">✕</button>
          </div>

          <!-- USER STATUS BADGES BOX -->
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Tarif holati:</span>
              <span>${isPro ? '<strong style="color: #c084fc;">⭐ PRO (Faol)</strong>' : '<strong style="color: #94a3b8;">Standart (FREE)</strong>'}</span>
            </div>
            ${isPro ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Amal qilish muddati:</span>
              <span style="color: #fff;">${escapeHTML(sub.durationLabel || 'Cheksiz')} (${escapeHTML(sub.daysRemaining === 'unlimited' ? 'Cheksiz' : sub.daysRemaining + ' kun qoldi')})</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Moderatsiya holati:</span>
              <span>
                ${isBanned ? '<strong style="color: #f87171;">🚫 Saytdan Bloklangan</strong>' : (isMuted ? '<strong style="color: #fbbf24;">🔇 Guruhda Mute qilingan</strong>' : '<strong style="color: #86efac;">✅ Cheklovlar yo‘q</strong>')}
              </span>
            </div>
          </div>

          <!-- 1. GRANT / REVOKE PRO -->
          <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 18px; padding: 16px; margin-bottom: 16px;">
            <h4 style="margin: 0 0 10px; font-size: 14px; color: #f3e8ff; display: flex; align-items: center; gap: 6px;">
              <span>👑</span>
              <span>PRO OBUNASINI BOSHQARISH</span>
            </h4>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
              <label style="display: flex; flex-direction: column; align-items: center; padding: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; cursor: pointer; font-size: 12px; color: #fff;">
                <input type="radio" name="pro-duration" value="30" checked style="margin-bottom: 4px;">
                <span>30 kun</span>
              </label>

              <label style="display: flex; flex-direction: column; align-items: center; padding: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; cursor: pointer; font-size: 12px; color: #fff;">
                <input type="radio" name="pro-duration" value="90" style="margin-bottom: 4px;">
                <span>90 kun</span>
              </label>

              <label style="display: flex; flex-direction: column; align-items: center; padding: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; cursor: pointer; font-size: 12px; color: #fff;">
                <input type="radio" name="pro-duration" value="365" style="margin-bottom: 4px;">
                <span>1 yil</span>
              </label>

              <label style="display: flex; flex-direction: column; align-items: center; padding: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; cursor: pointer; font-size: 12px; color: #fff;">
                <input type="radio" name="pro-duration" value="unlimited" style="margin-bottom: 4px;">
                <span>Cheksiz</span>
              </label>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="button" id="adm-btn-grant-pro" style="flex: 1; padding: 10px; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #6366f1); border: none; color: #fff; font-weight: 800; font-size: 13px; cursor: pointer;">
                ⭐ PRO Berish
              </button>
              ${isPro ? `
                <button type="button" id="adm-btn-revoke-pro" style="padding: 10px 14px; border-radius: 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-weight: 800; font-size: 13px; cursor: pointer;">
                  Bekor qilish
                </button>
              ` : ''}
            </div>
          </div>

          <!-- 2. MODERATION (BAN / MUTE) -->
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 18px; padding: 16px;">
            <h4 style="margin: 0 0 10px; font-size: 14px; color: #fca5a5; display: flex; align-items: center; gap: 6px;">
              <span>🛡️</span>
              <span>MODERATSIYA VA CHEKLOV</span>
            </h4>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <!-- BAN BUTTON -->
              ${isBanned ? `
                <button type="button" id="adm-btn-unban" style="padding: 10px; border-radius: 10px; background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4); color: #86efac; font-weight: 800; font-size: 13px; cursor: pointer;">
                  ✅ Blokdan Chiqarish (Unban)
                </button>
              ` : `
                <button type="button" id="adm-btn-ban" style="padding: 10px; border-radius: 10px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; font-weight: 800; font-size: 13px; cursor: pointer;">
                  🚫 Saytdan Bloklash (Ban)
                </button>
              `}

              <!-- MUTE BUTTON -->
              ${isMuted ? `
                <button type="button" id="adm-btn-unmute" style="padding: 10px; border-radius: 10px; background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4); color: #86efac; font-weight: 800; font-size: 13px; cursor: pointer;">
                  🔊 Mutedan Chiqarish
                </button>
              ` : `
                <button type="button" id="adm-btn-mute" style="padding: 10px; border-radius: 10px; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); color: #fcd34d; font-weight: 800; font-size: 13px; cursor: pointer;">
                  🔇 Chatda Mute Qilish (24s)
                </button>
              `}
            </div>
          </div>

          <!-- 3. SEND DIRECT PERSONAL NOTICE -->
          <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 18px; padding: 16px; margin-top: 16px;">
            <h4 style="margin: 0 0 10px; font-size: 14px; color: #bae6fd; display: flex; align-items: center; gap: 6px;">
              <span>📨</span>
              <span>SHAXSIY BILDIRISHNOMA YUBORISH</span>
            </h4>
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 10px; line-height: 1.4;">
              Foydalanuvchi saytga kirganda ekranda maxsus tabrik yoki ogohlantirish oynasi ochiladi.
            </p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <input type="text" id="adm-user-notice-title" placeholder="Xabar sarlavhasi (masalan: Tabriklaymiz! 🎉)" style="width: 100%; padding: 8px 12px; border-radius: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none;">
              <textarea id="adm-user-notice-msg" rows="2" placeholder="Xabar matnini yozing..." style="width: 100%; padding: 8px 12px; border-radius: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; resize: vertical; font-family: inherit; outline: none;"></textarea>
              <div style="display: flex; gap: 8px; align-items: center;">
                <select id="adm-user-notice-type" style="padding: 8px 10px; border-radius: 8px; background: rgba(22,17,44,0.95); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 12px; flex: 1; outline: none;">
                  <option value="celebration">🎉 Tabrik & Rag‘bat</option>
                  <option value="info">ℹ️ Muhim Ma’lumot</option>
                  <option value="warning">⚠️ Ogohlantirish</option>
                </select>
                <button type="button" id="adm-btn-send-notice" style="padding: 8px 16px; border-radius: 8px; background: linear-gradient(135deg, #0284c7, #38bdf8); border: none; color: #fff; font-weight: 800; font-size: 13px; cursor: pointer;">
                  Yuborish ✈️
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    const close = () => { modalMount.innerHTML = ''; };
    $('#adm-user-close-btn')?.addEventListener('click', close);
    $('#adm-user-modal-bg')?.addEventListener('click', e => {
      if (e.target.id === 'adm-user-modal-bg') close();
    });

    // Grant PRO
    $('#adm-btn-grant-pro')?.addEventListener('click', async () => {
      const selected = modalMount.querySelector('input[name="pro-duration"]:checked')?.value || '30';
      const days = selected === 'unlimited' ? 'unlimited' : parseInt(selected, 10);
      try {
        const res = await fetch(`/api/admin/user/${encodeURIComponent(user.id)}/grant-pro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days, email: user.email })
        });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.message);
        alert(d.message);
        close();
        loadUsers();
      } catch (err) {
        alert(err.message || 'Xatolik');
      }
    });

    // Revoke PRO
    $('#adm-btn-revoke-pro')?.addEventListener('click', async () => {
      if (!confirm('Foydalanuvchining PRO obunasini bekor qilasizmi?')) return;
      try {
        const res = await fetch(`/api/admin/user/${encodeURIComponent(user.id)}/revoke-pro`, { method: 'POST' });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.message);
        alert(d.message);
        close();
        loadUsers();
      } catch (err) {
        alert(err.message || 'Xatolik');
      }
    });

    // Ban
    $('#adm-btn-ban')?.addEventListener('click', async () => {
      const reason = prompt('Bloklash sababini kiriting:', 'Qoidalarni buzganlik');
      if (reason === null) return;
      try {
        const res = await fetch(`/api/admin/moderation/ban/${encodeURIComponent(user.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.message);
        alert(d.message);
        close();
        loadUsers();
      } catch (err) {
        alert(err.message || 'Xatolik');
      }
    });

    // Unban
    $('#adm-btn-unban')?.addEventListener('click', async () => {
      try {
        const res = await fetch(`/api/admin/moderation/unban/${encodeURIComponent(user.id)}`, { method: 'POST' });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.message);
        alert(d.message);
        close();
        loadUsers();
      } catch (err) {
        alert(err.message || 'Xatolik');
      }
    });

    // Mute
    $('#adm-btn-mute')?.addEventListener('click', async () => {
      const reason = prompt('Mute qilish sababini kiriting:', 'Chat qoidalarini buzganlik');
      if (reason === null) return;
      try {
        const res = await fetch(`/api/admin/moderation/mute/${encodeURIComponent(user.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason, hours: 24 })
        });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.message);
        alert(d.message);
        close();
        loadUsers();
      } catch (err) {
        alert(err.message || 'Xatolik');
      }
    });

    // Unmute
    $('#adm-btn-unmute')?.addEventListener('click', async () => {
      try {
        const res = await fetch(`/api/admin/moderation/unmute/${encodeURIComponent(user.id)}`, { method: 'POST' });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.message);
        alert(d.message);
        close();
        loadUsers();
      } catch (err) {
        alert(err.message || 'Xatolik');
      }
    });

    // Send Personal Direct Notice
    $('#adm-btn-send-notice')?.addEventListener('click', async () => {
      const title = $('#adm-user-notice-title')?.value.trim();
      const message = $('#adm-user-notice-msg')?.value.trim();
      const type = $('#adm-user-notice-type')?.value || 'info';
      if (!message) {
        alert('Iltimos, xabarnoma matnini kiriting.');
        return;
      }
      const btn = $('#adm-btn-send-notice');
      btn.disabled = true;
      btn.textContent = 'Yuborilmoqda...';
      try {
        const res = await fetch('/api/admin/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, title, message, type })
        });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.message);
        alert('✓ ' + d.message);
        if ($('#adm-user-notice-title')) $('#adm-user-notice-title').value = '';
        if ($('#adm-user-notice-msg')) $('#adm-user-notice-msg').value = '';
      } catch (err) {
        alert(err.message || 'Xatolik');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Yuborish ✈️';
      }
    });
  }

  /* ========================================================
     2. BROADCAST BANNER LOGIC
  ======================================================== */

  async function loadBroadcastBanner() {
    try {
      const res = await fetch('/api/admin/announcement');
      const data = await res.json();
      const ann = data?.announcement || {};

      const textEl = $('#broadcast-text');
      const typeEl = $('#broadcast-type');
      const activeEl = $('#broadcast-active');

      if (textEl) textEl.value = ann.text || '';
      if (typeEl) typeEl.value = ann.type || 'info';
      if (activeEl) activeEl.checked = Boolean(ann.active);

      updateBroadcastPreview();
    } catch (e) {
      console.warn('[LOAD BANNER WARN]', e);
    }
  }

  function updateBroadcastPreview() {
    const text = $('#broadcast-text')?.value || 'E’lon matni bu yerda ko‘rinadi...';
    const type = $('#broadcast-type')?.value || 'info';
    const previewBox = $('#broadcast-preview-box');
    const previewText = $('#broadcast-preview-text');
    const previewIcon = $('#broadcast-preview-icon');

    if (previewText) previewText.textContent = text;
    if (previewIcon) {
      previewIcon.textContent = type === 'warning' ? '⚠️' : (type === 'success' ? '🎉' : '📢');
    }
    if (previewBox) {
      if (type === 'warning') previewBox.style.background = 'linear-gradient(90deg, #451a03, #d97706)';
      else if (type === 'success') previewBox.style.background = 'linear-gradient(90deg, #064e3b, #059669)';
      else previewBox.style.background = 'linear-gradient(90deg, #1e1b4b, #2563eb)';
    }
  }

  $('#broadcast-text')?.addEventListener('input', updateBroadcastPreview, { signal });
  $('#broadcast-type')?.addEventListener('change', updateBroadcastPreview, { signal });

  $('#broadcast-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#broadcast-save-btn');
    const feedback = $('#broadcast-feedback');
    const text = $('#broadcast-text')?.value.trim();
    const type = $('#broadcast-type')?.value || 'info';
    const active = $('#broadcast-active')?.checked;

    btn.disabled = true;
    btn.textContent = 'Saqlanmoqda...';

    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type, active })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#86efac';
        feedback.textContent = '✓ ' + data.message;
        setTimeout(() => { feedback.style.display = 'none'; }, 4000);
      }
      window.dispatchEvent(new CustomEvent('announcement-updated'));
    } catch (err) {
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#f87171';
        feedback.textContent = err.message || 'Xatolik';
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>💾</span><span>Saqlash va Saytga Chiqarish</span>';
    }
  }, { signal });

  /* ========================================================
     3. PROMOCODES LOGIC
  ======================================================== */

  async function loadPromocodes() {
    try {
      const res = await fetch('/api/admin/promocodes');
      const data = await res.json();
      const list = data?.promocodes || [];
      const tbody = $('#promocodes-table-body');
      const badge = $('#promocodes-count-badge');

      if (badge) badge.textContent = `${list.length} ta promokod`;

      if (!tbody) return;
      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #94a3b8;">Hali promokodlar yaratilmagan.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map(p => `
        <tr>
          <td><strong style="color: #f3e8ff; font-family: monospace; font-size: 14px;">${escapeHTML(p.code)}</strong></td>
          <td style="color: #cbd5e1;">${p.days} kun</td>
          <td><span style="color: #c084fc; font-weight: 750;">${p.usedCount || 0} / ${p.maxUses}</span></td>
          <td>
            <span style="padding: 3px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 800; background: ${p.active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}; color: ${p.active ? '#86efac' : '#f87171'};">
              ${p.active ? 'Faol' : 'Nofaol'}
            </span>
          </td>
          <td style="text-align: right;">
            <button type="button" class="btn-delete-promo" data-promo-code="${escapeHTML(p.code)}" style="padding: 6px 10px; border-radius: 8px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; font-weight: 700; cursor: pointer; font-size: 12px;">
              🗑️ O‘chirish
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.btn-delete-promo').forEach(btn => {
        btn.addEventListener('click', async () => {
          const code = btn.getAttribute('data-promo-code');
          if (!confirm(`«${code}» promokodini o‘chirmoqchimisiz?`)) return;
          try {
            const delRes = await fetch(`/api/admin/promocodes/${encodeURIComponent(code)}`, { method: 'DELETE' });
            const d = await delRes.json();
            if (!delRes.ok || !d.success) throw new Error(d.message);
            loadPromocodes();
          } catch (err) {
            alert(err.message || 'Xatolik');
          }
        });
      });
    } catch (e) {
      console.warn('[LOAD PROMOCODES ERROR]', e);
    }
  }

  $('#promocode-create-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = $('#promo-code-input')?.value.trim().toUpperCase();
    const days = parseInt($('#promo-days-input')?.value, 10) || 30;
    const maxUses = parseInt($('#promo-max-input')?.value, 10) || 50;
    const feedback = $('#promo-feedback');
    const submitBtn = $('#promo-submit-btn');

    if (!code) return;
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/admin/promocodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, days, maxUses })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#86efac';
        feedback.textContent = '✓ ' + data.message;
        setTimeout(() => { feedback.style.display = 'none'; }, 3000);
      }
      $('#promo-code-input').value = '';
      loadPromocodes();
    } catch (err) {
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#f87171';
        feedback.textContent = err.message || 'Xatolik';
      }
    } finally {
      submitBtn.disabled = false;
    }
  }, { signal });

  /* ========================================================
     4. CURRICULUM CONTENT MANAGEMENT
  ======================================================== */

  async function loadCurriculumSubjects() {
    try {
      const res = await fetch('/api/admin/curriculum/subjects');
      const data = await res.json();
      curriculumSubjects = data?.subjects || [];
      renderCurriculumSubjectsList();

      if (!activeCurriculumSubjectId && curriculumSubjects.length > 0) {
        activeCurriculumSubjectId = curriculumSubjects[0].id;
      }
      renderActiveSubjectTopics();
    } catch (e) {
      console.warn('[LOAD CURRICULUM ERROR]', e);
    }
  }

  function renderCurriculumSubjectsList() {
    const listEl = $('#curriculum-subjects-list');
    if (!listEl) return;

    listEl.innerHTML = curriculumSubjects.map(s => `
      <button
        type="button"
        class="comm-member-card ${s.id === activeCurriculumSubjectId ? 'is-active' : ''}"
        data-subject-id="${escapeHTML(s.id)}"
        style="width: 100%; text-align: left; padding: 12px 14px; border-radius: 12px; background: ${s.id === activeCurriculumSubjectId ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${s.id === activeCurriculumSubjectId ? '#a855f7' : 'rgba(255,255,255,0.08)'}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;"
      >
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">${s.icon || '📚'}</span>
          <strong style="color: #fff; font-size: 13.5px;">${escapeHTML(s.name)}</strong>
        </div>
        <span style="font-size: 11.5px; color: #a5a4b8; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 999px;">
          ${s.topicsCount} mavzu
        </span>
      </button>
    `).join('');

    listEl.querySelectorAll('[data-subject-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCurriculumSubjectId = btn.getAttribute('data-subject-id');
        renderCurriculumSubjectsList();
        renderActiveSubjectTopics();
      });
    });
  }

  function renderActiveSubjectTopics() {
    const activeSub = curriculumSubjects.find(s => s.id === activeCurriculumSubjectId);
    const titleEl = $('#curriculum-active-subject-title');
    const descEl = $('#curriculum-active-subject-desc');
    const containerEl = $('#curriculum-topics-container');

    if (!activeSub) return;
    if (titleEl) titleEl.innerHTML = `<span>${activeSub.icon || '📖'}</span> ${escapeHTML(activeSub.name)} Mavzulari`;
    if (descEl) descEl.textContent = `Jami ${activeSub.topics?.length || 0} ta mavzu mavjud`;

    if (!containerEl) return;
    const topics = activeSub.topics || [];
    if (topics.length === 0) {
      containerEl.innerHTML = `<div style="padding: 30px; text-align: center; color: #94a3b8;">Ushbu fanda hali mavzular yo‘q. Yuqoridagi «➕ Yangi Mavzu Qo‘shish» tugmasi orqali qo‘shing!</div>`;
      return;
    }

    containerEl.innerHTML = topics.map((t, idx) => `
      <div style="padding: 14px 18px; border-radius: 14px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; gap: 14px;">
        <div style="display: flex; gap: 12px; align-items: center; flex: 1; min-width: 0;">
          <span style="width: 28px; height: 28px; border-radius: 50%; background: rgba(168, 85, 247, 0.2); color: #c084fc; display: grid; place-items: center; font-size: 12px; font-weight: 800; flex-shrink: 0;">
            ${idx + 1}
          </span>
          <div style="min-width: 0;">
            <strong style="color: #fff; font-size: 14px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(t.title)}
            </strong>
            <p style="margin: 2px 0 0; color: #94a3b8; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(t.description || 'Tavsif kiritilmagan')}
            </p>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-shrink: 0;">
          <button type="button" class="btn-edit-topic" data-topic-id="${escapeHTML(t.id)}" style="padding: 6px 10px; border-radius: 8px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #93c5fd; font-size: 12px; font-weight: 700; cursor: pointer;">
            ✏️ Tahrirlash
          </button>
          <button type="button" class="btn-delete-topic" data-topic-id="${escapeHTML(t.id)}" style="padding: 6px 10px; border-radius: 8px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 12px; font-weight: 700; cursor: pointer;">
            🗑️ O‘chirish
          </button>
        </div>
      </div>
    `).join('');

    // Delete topic
    containerEl.querySelectorAll('.btn-delete-topic').forEach(btn => {
      btn.addEventListener('click', async () => {
        const topicId = btn.getAttribute('data-topic-id');
        if (!confirm('Ushbu mavzuni butunlay o‘chirib tashlamoqchimisiz?')) return;
        try {
          const res = await fetch(`/api/admin/curriculum/topic/${encodeURIComponent(activeCurriculumSubjectId)}/${encodeURIComponent(topicId)}`, {
            method: 'DELETE'
          });
          const d = await res.json();
          if (!res.ok || !d.success) throw new Error(d.message);
          alert(d.message);
          loadCurriculumSubjects();
        } catch (err) {
          alert(err.message || 'Xatolik');
        }
      });
    });

    // Edit topic
    containerEl.querySelectorAll('.btn-edit-topic').forEach(btn => {
      btn.addEventListener('click', async () => {
        const topicId = btn.getAttribute('data-topic-id');
        const topic = topics.find(x => x.id === topicId);
        if (!topic) return;

        const newTitle = prompt('Mavzu nomini kiriting:', topic.title);
        if (!newTitle) return;
        const newDesc = prompt('Mavzu tavsifini kiriting:', topic.description || '');

        try {
          const res = await fetch(`/api/admin/curriculum/topic/${encodeURIComponent(activeCurriculumSubjectId)}/${encodeURIComponent(topicId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle, description: newDesc })
          });
          const d = await res.json();
          if (!res.ok || !d.success) throw new Error(d.message);
          alert(d.message);
          loadCurriculumSubjects();
        } catch (err) {
          alert(err.message || 'Xatolik');
        }
      });
    });
  }

  // Open Add Topic Modal
  $('#btn-open-add-topic')?.addEventListener('click', () => {
    const activeSub = curriculumSubjects.find(s => s.id === activeCurriculumSubjectId);
    if (!activeSub) return;

    modalMount.innerHTML = `
      <div class="comm-modal-overlay" id="adm-topic-modal-bg" style="position: fixed; inset: 0; z-index: 99999; display: grid; place-items: center; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); padding: 20px;">
        <div style="background: rgba(22, 17, 44, 0.98); border: 1px solid rgba(16, 185, 129, 0.45); border-radius: 24px; padding: 32px 28px; max-width: 500px; width: 100%; box-shadow: 0 25px 70px rgba(0,0,0,0.85);">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #fff; font-size: 18px; font-weight: 800;">
              ➕ «${escapeHTML(activeSub.name)}» faniga yangi mavzu
            </h3>
            <button type="button" id="adm-topic-close-btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; cursor: pointer;">✕</button>
          </div>

          <form id="adm-form-add-topic" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px;">
                Mavzu nomi:
              </label>
              <input
                type="text"
                id="topic-title-input"
                placeholder="Masalan: Logarifmlar va ularning xossalari"
                required
                style="width: 100%; padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 14px; outline: none;"
              >
            </div>

            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px;">
                Qisqacha tavsifi:
              </label>
              <textarea
                id="topic-desc-input"
                rows="3"
                placeholder="Mavzu haqida qisqacha ma’lumot..."
                style="width: 100%; padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none; font-family: inherit; resize: vertical;"
              ></textarea>
            </div>

            <button type="submit" id="topic-create-btn" style="padding: 12px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span>💾</span>
              <span>Mavzuni Saqlash</span>
            </button>
          </form>
        </div>
      </div>
    `;

    const close = () => { modalMount.innerHTML = ''; };
    $('#adm-topic-close-btn')?.addEventListener('click', close);
    $('#adm-topic-modal-bg')?.addEventListener('click', e => {
      if (e.target.id === 'adm-topic-modal-bg') close();
    });

    $('#adm-form-add-topic')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = $('#topic-title-input')?.value.trim();
      const description = $('#topic-desc-input')?.value.trim();
      if (!title) return;

      const btn = $('#topic-create-btn');
      btn.disabled = true;

      try {
        const res = await fetch('/api/admin/curriculum/topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subjectId: activeCurriculumSubjectId, title, description })
        });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.message);
        alert(d.message);
        close();
        loadCurriculumSubjects();
      } catch (err) {
        alert(err.message || 'Xatolik');
      } finally {
        btn.disabled = false;
      }
    });
  }, { signal });

  /* ========================================================
     5. AI HEALTH MONITOR LOGIC
  ======================================================== */

  async function loadAiHealth() {
    try {
      const res = await fetch('/api/admin/ai-health');
      const data = await res.json();
      const h = data?.health || {};

      // Groq
      const groqBadge = $('#ai-groq-badge');
      const groqPing = $('#ai-groq-ping');
      const groqKey = $('#ai-groq-key');

      if (h.groq) {
        if (groqBadge) {
          groqBadge.textContent = h.groq.status === 'active' ? '🟢 Faol' : (h.groq.status === 'no_key' ? '⚠️ Kalit yo‘q' : '🔴 Xatolik');
          groqBadge.style.background = h.groq.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';
          groqBadge.style.color = h.groq.status === 'active' ? '#86efac' : '#fca5a5';
        }
        if (groqPing) groqPing.textContent = h.groq.pingMs ? `${h.groq.pingMs} ms` : '—';
        if (groqKey) groqKey.textContent = h.groq.keyMasked || 'O‘rnatilmagan';
      }

      // Gemini
      const geminiBadge = $('#ai-gemini-badge');
      const geminiPing = $('#ai-gemini-ping');
      const geminiKey = $('#ai-gemini-key');

      if (h.gemini) {
        if (geminiBadge) {
          geminiBadge.textContent = h.gemini.status === 'active' ? '🟢 Faol' : (h.gemini.status === 'no_key' ? '⚠️ Kalit yo‘q' : '🔴 Xatolik');
          geminiBadge.style.background = h.gemini.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';
          geminiBadge.style.color = h.gemini.status === 'active' ? '#86efac' : '#fca5a5';
        }
        if (geminiPing) geminiPing.textContent = h.gemini.pingMs ? `${h.gemini.pingMs} ms` : '—';
        if (geminiKey) geminiKey.textContent = h.gemini.keyMasked || 'O‘rnatilmagan';
      }

      // Stats
      if (h.stats) {
        const countEl = $('#ai-daily-count');
        const uptimeEl = $('#ai-uptime');
        const timeEl = $('#ai-checked-time');
        if (countEl) countEl.textContent = `${h.stats.dailyRequests || 0} ta so‘rov`;
        if (uptimeEl) uptimeEl.textContent = `${h.stats.serverUptimeHours || 0} soat`;
        if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('uz-UZ');
      }
    } catch (e) {
      console.warn('[LOAD AI HEALTH ERROR]', e);
    }
  }

  $('#btn-ping-ai')?.addEventListener('click', async () => {
    const btnText = $('#btn-ping-ai-text');
    if (btnText) btnText.textContent = 'Tekshirilmoqda...';
    await loadAiHealth();
    if (btnText) btnText.textContent = 'Aloqani Tekshirish (Ping)';
  }, { signal });

  /* ========================================================
     6. SUPPORT INBOX
  ======================================================== */

  async function loadSupportInbox() {
    try {
      const res = await fetch('/api/admin/support/inbox');
      const data = await res.json();
      supportInbox = data.conversations || [];
      renderSupportInboxList();
    } catch (err) {
      console.warn('[SUPPORT INBOX LOAD ERROR]', err);
    }
  }

  function renderSupportInboxList() {
    const listEl = $('#admin-inbox-list');
    const badge = $('#badge-support-count');
    const unreadSummary = $('#admin-inbox-unread-summary');
    if (!listEl) return;

    const unreadTotal = supportInbox.reduce((s, c) => s + (c.unreadByAdmin || 0), 0);
    if (badge) {
      badge.textContent = unreadTotal;
      badge.style.display = unreadTotal > 0 ? 'inline-block' : 'none';
    }
    if (unreadSummary) {
      unreadSummary.textContent = `${unreadTotal} ta yangi`;
    }

    if (supportInbox.length === 0) {
      listEl.innerHTML = `<div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 13px;">Hali murojaatlar yo‘q.</div>`;
      return;
    }

    listEl.innerHTML = supportInbox.map(c => `
      <div class="admin-inbox-item ${c.userId === activeSupportUserId ? 'is-active' : ''}" data-conv-user-id="${escapeHTML(c.userId)}">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <strong style="color: #fff; font-size: 13.5px;">${escapeHTML(c.userName || 'Foydalanuvchi')}</strong>
          <small style="color: #94a3b8; font-size: 11px;">${new Date(c.lastMessageAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
        <p style="margin: 0; color: #cbd5e1; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHTML(c.lastMessageText || 'Xabar')}
        </p>
        ${c.unreadByAdmin > 0 ? `<span style="background: #a855f7; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 999px; margin-top: 4px; display: inline-block;">${c.unreadByAdmin} yangi</span>` : ''}
      </div>
    `).join('');

    listEl.querySelectorAll('[data-conv-user-id]').forEach(item => {
      item.addEventListener('click', () => {
        const uid = item.getAttribute('data-conv-user-id');
        openSupportThread(uid);
      });
    });
  }

  async function openSupportThread(userId) {
    activeSupportUserId = userId;
    renderSupportInboxList();
    const topbar = $('#admin-chat-topbar');
    const thread = $('#admin-chat-thread');
    const composer = $('#admin-chat-composer');

    if (composer) composer.style.display = 'flex';
    if (topbar) topbar.innerHTML = `<div style="color: #fff; font-weight: 700;">Foydalanuvchi bilan yozishma</div>`;

    try {
      const res = await fetch(`/api/admin/support/conversation/${encodeURIComponent(userId)}`);
      const data = await res.json();
      const messages = data?.conversation?.messages || [];

      if (!thread) return;
      if (messages.length === 0) {
        thread.innerHTML = `<div style="padding: 40px; text-align: center; color: #94a3b8;">Xabarlar yo‘q.</div>`;
        return;
      }

      thread.innerHTML = messages.map(m => `
        <div style="display: flex; flex-direction: column; align-items: ${m.sender === 'admin' ? 'flex-end' : 'flex-start'}; margin-bottom: 10px;">
          <div style="max-width: 75%; padding: 10px 14px; border-radius: 14px; background: ${m.sender === 'admin' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(255,255,255,0.08)'}; color: #fff; font-size: 13px;">
            ${escapeHTML(m.text || '')}
            ${m.imageUrl ? `<img src="${escapeHTML(m.imageUrl)}" style="max-width: 100%; border-radius: 8px; margin-top: 6px; display: block;">` : ''}
          </div>
          <small style="color: #94a3b8; font-size: 10px; margin-top: 3px;">${new Date(m.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
      `).join('');

      thread.scrollTop = thread.scrollHeight;
    } catch (e) {
      console.warn('[OPEN SUPPORT ERROR]', e);
    }
  }

  $('#adm-chat-send-btn')?.addEventListener('click', async () => {
    const input = $('#adm-chat-input');
    const text = input?.value.trim();
    if (!text || !activeSupportUserId) return;

    try {
      const res = await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeSupportUserId, text })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      if (input) input.value = '';
      openSupportThread(activeSupportUserId);
      loadSupportInbox();
    } catch (err) {
      alert(err.message || 'Xatolik');
    }
  }, { signal });

  /* ========================================================
     7. COMMUNITY GROUP CHAT CLEANER
  ======================================================== */

  async function loadGroupChat() {
    try {
      const res = await fetch('/api/community/messages');
      const data = await res.json();
      groupMessages = data.data || [];
      renderGroupChatList();
    } catch (e) {
      console.warn('[LOAD COMMUNITY ERROR]', e);
    }
  }

  function renderGroupChatList() {
    const containerEl = $('#admin-messages-container');
    if (!containerEl) return;

    if (groupMessages.length === 0) {
      containerEl.innerHTML = `<div class="admin-empty-notice">Guruhda xabarlar yo‘q.</div>`;
      return;
    }

    containerEl.innerHTML = groupMessages.slice(-50).reverse().map(m => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px;">
        <div style="display: flex; gap: 10px; align-items: center; flex: 1; min-width: 0;">
          <strong style="color: #ec4899; font-size: 13px; white-space: nowrap;">${escapeHTML(m.nickname || 'A’zo')}:</strong>
          <span style="color: #cbd5e1; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(m.text || (m.imageUrl ? '📷 Rasm' : ''))}</span>
        </div>
        <button type="button" class="btn-delete-msg" data-msg-id="${escapeHTML(m.id)}" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
          ✕ O‘chirish
        </button>
      </div>
    `).join('');

    containerEl.querySelectorAll('.btn-delete-msg').forEach(btn => {
      btn.addEventListener('click', async () => {
        const msgId = btn.getAttribute('data-msg-id');
        if (!confirm('Ushbu xabarni o‘chirmoqchimisiz?')) return;
        try {
          const res = await fetch(`/api/community/messages/${encodeURIComponent(msgId)}`, { method: 'DELETE' });
          const d = await res.json();
          if (!res.ok || !d.success) throw new Error(d.message);
          loadGroupChat();
        } catch (err) {
          alert(err.message || 'Xatolik');
        }
      });
    });
  }

  $('#admin-clear-chat-btn')?.addEventListener('click', async () => {
    if (!confirm('DIQQAT! Qizlar guruhi chatidagi BARCHA xabarlar o‘chiriladi. Rozimisiz?')) return;
    try {
      const res = await fetch('/api/community/chat/clear', { method: 'POST' });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message);
      alert(d.message || 'Guruh chat tarixi muvaffaqiyatli tozalandi!');
      loadGroupChat();
    } catch (err) {
      alert(err.message || 'Xatolik');
    }
  }, { signal });

  $('#admin-go-chat-btn')?.addEventListener('click', () => {
    if (typeof onGoToChat === 'function') onGoToChat();
  }, { signal });

  /* ========================================================
     8. AUDIT LOGS & MODERATION LIST
  ======================================================== */

  async function loadAuditLogs() {
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      const logs = data.logs || [];
      const tbody = $('#admin-audit-table-body');
      if (!tbody) return;

      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8;">Audit loglari mavjud emas.</td></tr>`;
        return;
      }

      tbody.innerHTML = logs.slice(0, 100).map(l => `
        <tr>
          <td><strong style="color: #c084fc;">${escapeHTML(l.action || 'ACTION')}</strong></td>
          <td style="color: #cbd5e1;">${escapeHTML(l.admin || 'admin')}</td>
          <td><code style="color: #94a3b8; font-size: 12px;">${escapeHTML(l.targetUserId || '—')}</code></td>
          <td style="color: #cbd5e1; font-size: 13px;">${escapeHTML(l.details || '—')}</td>
          <td style="color: #94a3b8; font-size: 12px;">${new Date(l.timestamp).toLocaleString('uz-UZ')}</td>
        </tr>
      `).join('');
    } catch (e) {
      console.warn('[LOAD AUDIT ERROR]', e);
    }
  }

  async function loadModerationList() {
    try {
      const res = await fetch('/api/admin/moderation/list');
      const data = await res.json();
      const banned = data?.data?.banned || [];
      const muted = data?.data?.muted || [];
      const mount = $('#moderation-summary-container');
      if (!mount) return;

      if (banned.length === 0 && muted.length === 0) {
        mount.innerHTML = `<div style="padding: 20px; text-align: center; color: #86efac; font-size: 13px;">✅ Hozirda hech qanday foydalanuvchi bloklanmagan yoki cheklanmagan.</div>`;
        return;
      }

      let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
      banned.forEach(b => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);">
            <div>
              <strong style="color: #fca5a5; font-size: 13.5px;">🚫 BAN: ID ${escapeHTML(b.userId)}</strong>
              <div style="font-size: 12px; color: #fecaca; margin-top: 2px;">Sabab: ${escapeHTML(b.reason)} &bull; ${new Date(b.bannedAt).toLocaleDateString('uz-UZ')}</div>
            </div>
            <button type="button" class="btn-unban-direct" data-unban-uid="${escapeHTML(b.userId)}" style="padding: 6px 12px; border-radius: 8px; background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.4); color: #86efac; font-size: 12px; font-weight: 750; cursor: pointer;">
              Blokdan chiqarish
            </button>
          </div>
        `;
      });

      muted.forEach(m => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3);">
            <div>
              <strong style="color: #fcd34d; font-size: 13.5px;">🔇 MUTE: ID ${escapeHTML(m.userId)}</strong>
              <div style="font-size: 12px; color: #fde68a; margin-top: 2px;">Sabab: ${escapeHTML(m.reason)} &bull; Tugash vaqti: ${m.expiresAt ? new Date(m.expiresAt).toLocaleString('uz-UZ') : 'Cheksiz'}</div>
            </div>
            <button type="button" class="btn-unmute-direct" data-unmute-uid="${escapeHTML(m.userId)}" style="padding: 6px 12px; border-radius: 8px; background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.4); color: #86efac; font-size: 12px; font-weight: 750; cursor: pointer;">
              Mutedan chiqarish
            </button>
          </div>
        `;
      });
      html += '</div>';
      mount.innerHTML = html;

      mount.querySelectorAll('.btn-unban-direct').forEach(btn => {
        btn.addEventListener('click', async () => {
          const uid = btn.getAttribute('data-unban-uid');
          try {
            const res = await fetch(`/api/admin/moderation/unban/${encodeURIComponent(uid)}`, { method: 'POST' });
            const d = await res.json();
            if (!res.ok || !d.success) throw new Error(d.message);
            alert(d.message);
            loadModerationList();
          } catch (err) {
            alert(err.message || 'Xatolik');
          }
        });
      });

      mount.querySelectorAll('.btn-unmute-direct').forEach(btn => {
        btn.addEventListener('click', async () => {
          const uid = btn.getAttribute('data-unmute-uid');
          try {
            const res = await fetch(`/api/admin/moderation/unmute/${encodeURIComponent(uid)}`, { method: 'POST' });
            const d = await res.json();
            if (!res.ok || !d.success) throw new Error(d.message);
            alert(d.message);
            loadModerationList();
          } catch (err) {
            alert(err.message || 'Xatolik');
          }
        });
      });
    } catch (e) {
      console.warn('[LOAD MODERATION ERROR]', e);
    }
  }

  /* ========================================================
     9. ANALYTICS & STUDENT LEADERBOARD
  ======================================================== */

  async function loadAnalytics() {
    try {
      const res = await fetch('/api/admin/analytics/overview');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Xatolik');

      const overview = data.analytics || data.overview || {};
      const totals = overview.totals || {};
      const leaderboard = overview.leaderboard || overview.topStudents || [];
      const subjects = overview.subjectPopularity || [];

      // Platform Totals
      const statStudents = $('#an-stat-students');
      const statLessons = $('#an-stat-lessons');
      const statQuizzes = $('#an-stat-quizzes');
      const statAvg = $('#an-stat-avg-score');

      if (statStudents) statStudents.textContent = totals.totalActiveStudents || 0;
      if (statLessons) statLessons.textContent = totals.totalLessonsCompleted || 0;
      if (statQuizzes) statQuizzes.textContent = totals.totalQuizzesPassed || 0;
      if (statAvg) statAvg.textContent = (totals.overallAverageQuizScore || 0) + '%';

      // Leaderboard
      const tbody = $('#an-leaderboard-tbody');
      if (tbody) {
        if (leaderboard.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: #94a3b8;">Hozircha dars bajargan o‘quvchilar yo‘q.</td></tr>`;
        } else {
          const medals = ['🥇', '🥈', '🥉'];
          tbody.innerHTML = leaderboard.map((st, idx) => {
            const medal = medals[idx] || (idx + 1);
            const isPro = Boolean(st.isPro);
            return `
              <tr>
                <td style="font-weight: 800; font-size: 15px; text-align: center;">${medal}</td>
                <td>
                  <div class="user-cell">
                    ${st.picture 
                      ? `<img src="${escapeHTML(st.picture)}" class="user-avatar-circle" alt="Avatar">`
                      : `<div class="user-avatar-circle">${escapeHTML((st.name || 'U')[0].toUpperCase())}</div>`
                    }
                    <div>
                      <div class="user-name-title">${escapeHTML(st.name || 'O‘quvchi')}</div>
                      <div class="user-email-subtitle">${escapeHTML(st.email || 'Email yo‘q')}</div>
                    </div>
                  </div>
                </td>
                <td style="text-align: center; font-weight: 750; color: #34d399;">${st.lessonsCompleted} ta</td>
                <td style="text-align: center; font-weight: 750; color: #fbbf24;">${st.avgQuizScore}%</td>
                <td style="text-align: center;">
                  ${isPro ? '<span class="status-pill-pro">⭐ PRO</span>' : '<span class="status-pill-free">Standart</span>'}
                </td>
                <td style="text-align: right;">
                  <button type="button" class="btn-quick-grant-pro" data-uid="${escapeHTML(st.id)}" data-email="${escapeHTML(st.email || '')}" style="padding: 6px 12px; border-radius: 8px; background: rgba(168,85,247,0.18); border: 1px solid rgba(168,85,247,0.4); color: #d8b4fe; font-size: 12px; font-weight: 750; cursor: pointer; white-space: nowrap;">
                    ⭐ PRO Sovg'a
                  </button>
                </td>
              </tr>
            `;
          }).join('');

          tbody.querySelectorAll('.btn-quick-grant-pro').forEach(btn => {
            btn.addEventListener('click', async () => {
              const uid = btn.getAttribute('data-uid');
              const email = btn.getAttribute('data-email');
              const daysStr = prompt('Ushbu o‘quvchiga necha kunga PRO bermoqchisiz? (masalan: 30)', '30');
              if (daysStr === null) return;
              const days = parseInt(daysStr, 10);
              if (isNaN(days) || days <= 0) {
                alert('Noto‘g‘ri kun kiritildi.');
                return;
              }
              try {
                const pRes = await fetch(`/api/admin/user/${encodeURIComponent(uid)}/grant-pro`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ days, email })
                });
                const pData = await pRes.json();
                if (!pRes.ok || !pData.success) throw new Error(pData.message);
                alert('✓ ' + pData.message);
                loadAnalytics();
              } catch (err) {
                alert(err.message || 'Xatolik yuz berdi');
              }
            });
          });
        }
      }

      // Subject Popularity
      const subList = $('#an-subjects-list');
      if (subList) {
        if (subjects.length === 0) {
          subList.innerHTML = `<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">Fanlar bo‘yicha darslar hali boshlanmagan.</div>`;
        } else {
          subList.innerHTML = subjects.map(s => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #f1f5f9; margin-bottom: 5px;">
                <span>${escapeHTML(s.title)}</span>
                <span style="color: #a855f7;">${s.count} ta dars (${s.percentage}%)</span>
              </div>
              <div style="width: 100%; height: 8px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden;">
                <div style="height: 100%; width: ${s.percentage}%; border-radius: 999px; background: linear-gradient(90deg, #a855f7, #6366f1); transition: width 0.4s ease;"></div>
              </div>
            </div>
          `).join('');
        }
      }

    } catch (e) {
      console.warn('[LOAD ANALYTICS ERROR]', e);
    }
  }

  /* ========================================================
     10. AI ENGINE & TUTOR SETTINGS
  ======================================================== */

  async function loadAiSettings() {
    try {
      const res = await fetch('/api/admin/system/ai-settings');
      const data = await res.json();
      if (!res.ok || !data.success) return;

      const s = data.aiSettings || {};
      const providerRadio = container.querySelector(`input[name="ai-provider"][value="${s.primaryProvider || 'groq'}"]`);
      if (providerRadio) providerRadio.checked = true;

      const styleSelect = $('#ai-tutor-style');
      if (styleSelect) styleSelect.value = s.tutorStyle || 'friendly';

      const tempInput = $('#ai-temperature');
      const tempDisplay = $('#ai-temp-display');
      if (tempInput) tempInput.value = s.temperature ?? 0.7;
      if (tempDisplay) tempDisplay.textContent = Number(s.temperature ?? 0.7).toFixed(2);

      const promptEl = $('#ai-custom-prompt');
      if (promptEl) promptEl.value = s.customSystemPrompt || '';
    } catch (e) {
      console.warn('[LOAD AI SETTINGS ERROR]', e);
    }
  }

  $('#ai-temperature')?.addEventListener('input', (e) => {
    const disp = $('#ai-temp-display');
    if (disp) disp.textContent = Number(e.target.value).toFixed(2);
  }, { signal });

  $('#ai-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#ai-settings-save-btn');
    const feedback = $('#ai-settings-feedback');

    const primaryProvider = container.querySelector('input[name="ai-provider"]:checked')?.value || 'groq';
    const tutorStyle = $('#ai-tutor-style')?.value || 'friendly';
    const temperature = parseFloat($('#ai-temperature')?.value || '0.7');
    const customSystemPrompt = $('#ai-custom-prompt')?.value.trim();

    btn.disabled = true;
    btn.textContent = 'Saqlanmoqda...';

    try {
      const res = await fetch('/api/admin/system/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryProvider, tutorStyle, temperature, customSystemPrompt })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#86efac';
        feedback.textContent = '✓ ' + data.message;
        setTimeout(() => { feedback.style.display = 'none'; }, 4000);
      }
    } catch (err) {
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#f87171';
        feedback.textContent = err.message || 'Xatolik';
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>💾</span><span>AI Sozlamalarini Saqlash</span>';
    }
  }, { signal });

  /* ========================================================
     11. SYSTEM & MAINTENANCE MODE
  ======================================================== */

  async function loadSystemSettings() {
    try {
      const res = await fetch('/api/system/maintenance');
      const data = await res.json();
      const m = data?.maintenance || {};

      const activeEl = $('#sys-maintenance-active');
      const msgEl = $('#sys-maintenance-message');
      const etaEl = $('#sys-maintenance-eta');

      if (activeEl) activeEl.checked = Boolean(m.enabled);
      if (msgEl) msgEl.value = m.message || '';
      if (etaEl) etaEl.value = m.estimatedEndTime || '';
    } catch (e) {
      console.warn('[LOAD SYSTEM SETTINGS ERROR]', e);
    }
  }

  $('#system-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#sys-settings-save-btn');
    const feedback = $('#sys-settings-feedback');

    const enabled = $('#sys-maintenance-active')?.checked;
    const message = $('#sys-maintenance-message')?.value.trim();
    const estimatedEndTime = $('#sys-maintenance-eta')?.value.trim();

    btn.disabled = true;
    btn.textContent = 'Saqlanmoqda...';

    try {
      const res = await fetch('/api/admin/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, message, estimatedEndTime })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#86efac';
        feedback.textContent = '✓ ' + data.message;
        setTimeout(() => { feedback.style.display = 'none'; }, 4000);
      }
    } catch (err) {
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#f87171';
        feedback.textContent = err.message || 'Xatolik';
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>💾</span><span>Tizim Sozlamalarini Saqlash</span>';
    }
  }, { signal });

  /* ========================================================
     12. PAYMENTS & PRO VERIFICATION (OFFICIAL CARD: 9860 1606 3566 3802)
  ======================================================== */
  let currentPayFilter = 'all';

  async function loadPayments(filter = currentPayFilter) {
    currentPayFilter = filter;
    const tbody = $('#payments-tbody');
    if (!tbody) return;

    try {
      const res = await fetch(`/api/admin/payments?status=${encodeURIComponent(filter)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      const payments = data.payments || [];
      const pendingCount = data.pendingCount || 0;

      // Update badge
      const badge = $('#badge-payments-count');
      if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
      }

      // Update stats
      let approvedCount = 0;
      let totalRevenue = 0;
      payments.forEach(p => {
        if (p.status === 'approved') {
          approvedCount++;
          totalRevenue += (p.amount || 0);
        }
      });
      const pendingStatEl = $('#pay-stat-pending');
      const approvedStatEl = $('#pay-stat-approved');
      const revenueStatEl = $('#pay-stat-revenue');
      if (pendingStatEl) pendingStatEl.textContent = pendingCount;
      if (approvedStatEl) approvedStatEl.textContent = approvedCount;
      if (revenueStatEl) revenueStatEl.textContent = totalRevenue.toLocaleString('uz-UZ') + ' so‘m';

      // Render table rows
      if (payments.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 36px; color: #94a3b8;">
              To‘lov arizalari mavjud emas.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = payments.map(p => {
        const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
        const isPending = p.status === 'pending';
        const isApproved = p.status === 'approved';

        const statusBadge = isPending
          ? '<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800;">⏳ Kutilmoqda</span>'
          : (isApproved
            ? '<span style="background: rgba(16, 185, 129, 0.2); color: #86efac; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800;">✓ Tasdiqlangan</span>'
            : '<span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800;">✗ Rad etilgan</span>');

        const receiptBtn = p.receiptImage
          ? `<button type="button" class="btn-view-receipt" data-receipt="${encodeURIComponent(p.receiptImage)}" style="padding: 4px 10px; border-radius: 8px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #93c5fd; font-size: 11.5px; font-weight: 700; cursor: pointer;">🖼️ Chekni ko‘rish</button>`
          : '<span style="font-size: 11px; color: #94a3b8;">Chek yo‘q</span>';

        const actions = isPending ? `
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button type="button" class="btn-approve-payment" data-id="${p.id}" style="padding: 6px 12px; border-radius: 8px; background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
              <span>✅</span>
              <span>Tasdiqlash & PRO</span>
            </button>
            <button type="button" class="btn-reject-payment" data-id="${p.id}" style="padding: 6px 10px; border-radius: 8px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; font-size: 12px; font-weight: 700; cursor: pointer;">
              Rad etish
            </button>
          </div>
        ` : `<span style="font-size: 11.5px; color: #94a3b8;">${isApproved ? 'PRO faollashtirilgan ✓' : (escapeHTML(p.rejectedReason) || 'Rad etilgan')}</span>`;

        return `
          <tr>
            <td style="font-size: 12px; color: #94a3b8; white-space: nowrap;">${dateStr}</td>
            <td>
              <div style="font-weight: 800; color: #fff;">${escapeHTML(p.userName || 'Foydalanuvchi')}</div>
              <div style="font-size: 11.5px; color: #94a3b8;">${escapeHTML(p.userEmail || p.userId)}</div>
            </td>
            <td><strong style="color: #c084fc;">${escapeHTML(p.planName)}</strong></td>
            <td><span style="font-weight: 800; color: #86efac;">${escapeHTML(p.priceLabel)}</span></td>
            <td>${receiptBtn}</td>
            <td style="font-size: 12px; color: #cbd5e1;">${escapeHTML(p.note || p.senderCard || '—')}</td>
            <td>${statusBadge}</td>
            <td style="text-align: right;">${actions}</td>
          </tr>
        `;
      }).join('');

      // Bind approve & reject
      tbody.querySelectorAll('.btn-approve-payment').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          btn.disabled = true;
          btn.textContent = '...';
          try {
            const aRes = await fetch(`/api/admin/payments/${id}/approve`, { method: 'POST' });
            const aData = await aRes.json();
            if (!aRes.ok || !aData.success) throw new Error(aData.message);
            alert('✓ To‘lov tasdiqlandi va foydalanuvchiga PRO obuna avtomatik yoqildi!');
            loadPayments();
            loadUsers();
          } catch (err) {
            alert('Xatolik: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Tasdiqlash & PRO';
          }
        });
      });

      tbody.querySelectorAll('.btn-reject-payment').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const reason = prompt('Rad etish sababini kiriting (foydalanuvchiga yuboriladi):', 'To‘lov cheki tasdiqlanmadi yoki summa mos kelmadi.');
          if (!reason) return;
          try {
            const rRes = await fetch(`/api/admin/payments/${id}/reject`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason })
            });
            const rData = await rRes.json();
            if (!rRes.ok || !rData.success) throw new Error(rData.message);
            loadPayments();
          } catch (err) {
            alert('Xatolik: ' + err.message);
          }
        });
      });

      // View receipt image
      tbody.querySelectorAll('.btn-view-receipt').forEach(btn => {
        btn.addEventListener('click', () => {
          const imgUrl = decodeURIComponent(btn.getAttribute('data-receipt'));
          openImageModal(imgUrl);
        });
      });

    } catch (e) {
      console.warn('[LOAD PAYMENTS ERROR]', e);
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#f87171;padding:20px;">Yuklashda xatolik: ${e.message}</td></tr>`;
    }
  }

  // Filter clicks
  container.querySelectorAll('.admin-pay-filter-btn').forEach(b => {
    b.addEventListener('click', () => {
      container.querySelectorAll('.admin-pay-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.borderColor = 'rgba(255,255,255,0.15)';
      });
      b.classList.add('active');
      b.style.background = 'rgba(168, 85, 247, 0.2)';
      b.style.borderColor = '#a855f7';
      loadPayments(b.getAttribute('data-filter'));
    });
  });

  /* ========================================================
     13. QUESTION BANK (TESTLAR VA SAVOLLAR BANKI)
  ======================================================== */
  let currentQbSubject = 'all';

  async function loadQuestions(subject = currentQbSubject, search = '') {
    currentQbSubject = subject;
    const listEl = $('#qb-questions-list');
    if (!listEl) return;

    try {
      const q = $('#qb-search-input')?.value.trim() || search;
      const res = await fetch(`/api/admin/questions?subject=${encodeURIComponent(subject)}&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      const questions = data.questions || [];
      const subjectsCount = data.subjects || {};

      // Update counts
      const totalEl = $('#qb-total-count');
      const mathEl = $('#qb-math-count');
      const physEl = $('#qb-physics-count');
      const infoEl = $('#qb-info-count');
      const ieltsEl = $('#qb-ielts-count');
      if (totalEl) totalEl.textContent = data.total || 0;
      if (mathEl) mathEl.textContent = subjectsCount.math || 0;
      if (physEl) physEl.textContent = subjectsCount.physics || 0;
      if (infoEl) infoEl.textContent = subjectsCount.informatics || 0;
      if (ieltsEl) ieltsEl.textContent = subjectsCount.ielts || 0;

      if (questions.length === 0) {
        listEl.innerHTML = `
          <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px; padding: 40px; text-align: center; color: #94a3b8;">
            Savollar topilmadi. "➕ Yangi Savol Qo‘shish" tugmasi orqali yangi savol qo‘shishingiz mumkin.
          </div>
        `;
        return;
      }

      listEl.innerHTML = questions.map((q, idx) => {
        const diffColor = q.difficulty === 'hard' ? '#f87171' : (q.difficulty === 'easy' ? '#86efac' : '#fbbf24');
        const diffText = q.difficulty === 'hard' ? 'Qiyin' : (q.difficulty === 'easy' ? 'Oson' : 'O‘rta');
        const subjectNames = { math: '📐 Matematika', physics: '⚡ Fizika', informatics: '💻 Informatika', ielts: '🎧 IELTS' };

        const optionsHtml = (q.options || []).map(opt => {
          const isCorrect = String(opt.id).toUpperCase() === String(q.correct).toUpperCase();
          return `
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: ${isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isCorrect ? '#10b981' : 'rgba(255,255,255,0.08)'}; font-size: 13px; color: ${isCorrect ? '#86efac' : '#cbd5e1'};">
              <strong style="width: 22px; height: 22px; border-radius: 50%; background: ${isCorrect ? '#10b981' : 'rgba(255,255,255,0.1)'}; color: #fff; display: grid; place-items: center; font-size: 11px;">${opt.id}</strong>
              <span style="flex: 1;">${escapeHTML(opt.text)}</span>
              ${isCorrect ? '<span style="font-size: 11px; font-weight: 800; color: #86efac;">✓ TO‘G‘RI</span>' : ''}
            </div>
          `;
        }).join('');

        return `
          <div class="admin-actions-card" style="padding: 18px 20px; border-radius: 16px; background: rgba(22, 17, 44, 0.9);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
              <div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 11.5px; font-weight: 800; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 2px 8px; border-radius: 6px;">
                    ${subjectNames[q.subject] || q.subject}
                  </span>
                  <span style="font-size: 11.5px; font-weight: 700; color: ${diffColor}; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 6px;">
                    ${diffText}
                  </span>
                  <span style="font-size: 12px; color: #94a3b8;">Mavzu: <strong>${escapeHTML(q.topic || 'Umumiy')}</strong></span>
                </div>
                <h3 style="margin: 0; font-size: 15px; color: #fff; font-weight: 700; line-height: 1.45;">
                  ${idx + 1}. ${escapeHTML(q.question)}
                </h3>
              </div>

              <div style="display: flex; gap: 6px; white-space: nowrap;">
                <button type="button" class="btn-edit-question" data-qid="${q.id}" style="padding: 5px 10px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 12px; cursor: pointer;">
                  ✏️ Tahrirlash
                </button>
                <button type="button" class="btn-delete-question" data-qid="${q.id}" style="padding: 5px 10px; border-radius: 8px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; font-size: 12px; cursor: pointer;">
                  🗑️ O‘chirish
                </button>
              </div>
            </div>

            <!-- OPTIONS GRID -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
              ${optionsHtml}
            </div>

            ${q.explanation ? `
              <div style="font-size: 12px; color: #a5a4b8; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 8px; border-left: 3px solid #38bdf8;">
                💡 <strong>Izoh / Yechim:</strong> ${escapeHTML(q.explanation)}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      // Bind delete
      listEl.querySelectorAll('.btn-delete-question').forEach(btn => {
        btn.addEventListener('click', async () => {
          const qid = btn.getAttribute('data-qid');
          if (!confirm('Haqiqatan ham ushbu savolni o‘chirmoqchimisiz?')) return;
          try {
            const delRes = await fetch(`/api/admin/questions/${qid}`, { method: 'DELETE' });
            const delData = await delRes.json();
            if (!delRes.ok || !delData.success) throw new Error(delData.message);
            loadQuestions();
          } catch (err) {
            alert('Xatolik: ' + err.message);
          }
        });
      });

      // Bind edit
      listEl.querySelectorAll('.btn-edit-question').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.getAttribute('data-qid');
          const question = questions.find(item => item.id === qid);
          if (question) openQuestionModal(question);
        });
      });

    } catch (e) {
      console.warn('[LOAD QUESTIONS ERROR]', e);
      listEl.innerHTML = `<div style="text-align:center;color:#f87171;padding:20px;">Savollarni yuklab bo‘lmadi: ${e.message}</div>`;
    }
  }

  // Question filter tabs
  container.querySelectorAll('.admin-qb-filter-btn').forEach(b => {
    b.addEventListener('click', () => {
      container.querySelectorAll('.admin-qb-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.borderColor = 'rgba(255,255,255,0.15)';
      });
      b.classList.add('active');
      b.style.background = 'rgba(56, 189, 248, 0.2)';
      b.style.borderColor = '#38bdf8';
      loadQuestions(b.getAttribute('data-subject'));
    });
  });

  // Question search input
  $('#qb-search-input')?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      loadQuestions();
    }, 300);
  });

  // Open add question modal
  $('#btn-open-add-question')?.addEventListener('click', () => {
    openQuestionModal();
  });

  function openQuestionModal(editingQuestion = null) {
    const isEdit = Boolean(editingQuestion);
    const q = editingQuestion || {
      subject: 'math',
      topic: '',
      difficulty: 'medium',
      question: '',
      options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
      correct: 'A',
      explanation: ''
    };

    const optA = q.options?.[0]?.text || '';
    const optB = q.options?.[1]?.text || '';
    const optC = q.options?.[2]?.text || '';
    const optD = q.options?.[3]?.text || '';

    modalMount.innerHTML = `
      <div class="premium-modal-backdrop active" id="qb-modal-backdrop" style="position: fixed; inset: 0; z-index: 99999; display: grid; place-items: center; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); padding: 20px;">
        <div class="premium-modal-dialog" style="max-width: 620px; width: 100%; background: rgba(18, 14, 38, 0.98); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 24px; padding: 28px; box-shadow: 0 25px 70px rgba(0,0,0,0.85); text-align: left; max-height: 90vh; overflow-y: auto;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 18px; color: #fff; font-weight: 800;">
              ${isEdit ? '✏️ Savolni Tahrirlash' : '➕ Yangi Test Savoli Qo‘shish'}
            </h3>
            <button type="button" id="qb-modal-close" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; cursor: pointer;">
              ✕
            </button>
          </div>

          <form id="qb-question-form" style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="display: block; font-size: 12.5px; font-weight: 750; color: #e2e8f0; margin-bottom: 5px;">Fan:</label>
                <select id="qbf-subject" style="width: 100%; padding: 9px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none;">
                  <option value="math" ${q.subject === 'math' ? 'selected' : ''}>📐 Matematika</option>
                  <option value="physics" ${q.subject === 'physics' ? 'selected' : ''}>⚡ Fizika</option>
                  <option value="informatics" ${q.subject === 'informatics' ? 'selected' : ''}>💻 IT & Informatika</option>
                  <option value="ielts" ${q.subject === 'ielts' ? 'selected' : ''}>🎧 IELTS & Tillar</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12.5px; font-weight: 750; color: #e2e8f0; margin-bottom: 5px;">Qiyinlik:</label>
                <select id="qbf-difficulty" style="width: 100%; padding: 9px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none;">
                  <option value="easy" ${q.difficulty === 'easy' ? 'selected' : ''}>Oson</option>
                  <option value="medium" ${q.difficulty === 'medium' ? 'selected' : ''}>O‘rta</option>
                  <option value="hard" ${q.difficulty === 'hard' ? 'selected' : ''}>Qiyin</option>
                </select>
              </div>
            </div>

            <div>
              <label style="display: block; font-size: 12.5px; font-weight: 750; color: #e2e8f0; margin-bottom: 5px;">Mavzu nomi:</label>
              <input type="text" id="qbf-topic" value="${escapeHTML(q.topic || '')}" placeholder="Masalan: Kvadrat tenglamalar yoki Dinamika" style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none;">
            </div>

            <div>
              <label style="display: block; font-size: 12.5px; font-weight: 750; color: #e2e8f0; margin-bottom: 5px;">Savol matni:</label>
              <textarea id="qbf-question" rows="3" placeholder="Savol matnini bu yerga yozing..." required style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none; resize: vertical;">${escapeHTML(q.question || '')}</textarea>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px;">
              <span style="font-size: 12.5px; font-weight: 750; color: #e2e8f0; display: block; margin-bottom: 8px;">Javob variantlari:</span>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <strong style="width: 22px; text-align: center; color: #38bdf8;">A:</strong>
                  <input type="text" id="qbf-opt-a" value="${escapeHTML(optA)}" placeholder="Variant A..." required style="flex: 1; padding: 8px 10px; border-radius: 8px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); color: #fff; font-size: 12.5px; outline: none;">
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <strong style="width: 22px; text-align: center; color: #38bdf8;">B:</strong>
                  <input type="text" id="qbf-opt-b" value="${escapeHTML(optB)}" placeholder="Variant B..." required style="flex: 1; padding: 8px 10px; border-radius: 8px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); color: #fff; font-size: 12.5px; outline: none;">
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <strong style="width: 22px; text-align: center; color: #38bdf8;">C:</strong>
                  <input type="text" id="qbf-opt-c" value="${escapeHTML(optC)}" placeholder="Variant C..." style="flex: 1; padding: 8px 10px; border-radius: 8px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); color: #fff; font-size: 12.5px; outline: none;">
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <strong style="width: 22px; text-align: center; color: #38bdf8;">D:</strong>
                  <input type="text" id="qbf-opt-d" value="${escapeHTML(optD)}" placeholder="Variant D..." style="flex: 1; padding: 8px 10px; border-radius: 8px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); color: #fff; font-size: 12.5px; outline: none;">
                </div>
              </div>
            </div>

            <div>
              <label style="display: block; font-size: 12.5px; font-weight: 750; color: #e2e8f0; margin-bottom: 5px;">To‘g‘ri javob varianti:</label>
              <select id="qbf-correct" style="width: 100%; padding: 9px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1.5px solid #10b981; color: #86efac; font-size: 13.5px; font-weight: 800; outline: none;">
                <option value="A" ${q.correct === 'A' ? 'selected' : ''}>Variant A to‘g‘ri</option>
                <option value="B" ${q.correct === 'B' ? 'selected' : ''}>Variant B to‘g‘ri</option>
                <option value="C" ${q.correct === 'C' ? 'selected' : ''}>Variant C to‘g‘ri</option>
                <option value="D" ${q.correct === 'D' ? 'selected' : ''}>Variant D to‘g‘ri</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 12.5px; font-weight: 750; color: #e2e8f0; margin-bottom: 5px;">Yechim tushuntirishi (Izoh):</label>
              <textarea id="qbf-explanation" rows="2" placeholder="O‘quvchiga to‘g‘ri javob sababini tushuntiruvchi izoh..." style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 10px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 13px; outline: none; resize: vertical;">${escapeHTML(q.explanation || '')}</textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
              <button type="button" id="qbf-cancel" style="padding: 10px 18px; border-radius: 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-weight: 700; cursor: pointer;">
                Bekor qilish
              </button>
              <button type="submit" id="qbf-save-btn" style="padding: 10px 22px; border-radius: 10px; background: linear-gradient(135deg, #0284c7, #2563eb); border: none; color: #fff; font-weight: 800; cursor: pointer;">
                ${isEdit ? 'O‘zgarishlarni Saqlash' : 'Savolni Saqlash'}
              </button>
            </div>
            <div id="qbf-feedback" style="display: none; font-size: 12.5px; margin-top: 6px;"></div>
          </form>

        </div>
      </div>
    `;

    const close = () => { modalMount.innerHTML = ''; };
    modalMount.querySelector('#qb-modal-close')?.addEventListener('click', close);
    modalMount.querySelector('#qbf-cancel')?.addEventListener('click', close);
    modalMount.querySelector('#qb-modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'qb-modal-backdrop') close();
    });

    modalMount.querySelector('#qb-question-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = modalMount.querySelector('#qbf-save-btn');
      const feedback = modalMount.querySelector('#qbf-feedback');

      const subject = modalMount.querySelector('#qbf-subject')?.value;
      const difficulty = modalMount.querySelector('#qbf-difficulty')?.value;
      const topic = modalMount.querySelector('#qbf-topic')?.value.trim();
      const questionText = modalMount.querySelector('#qbf-question')?.value.trim();
      const a = modalMount.querySelector('#qbf-opt-a')?.value.trim();
      const b = modalMount.querySelector('#qbf-opt-b')?.value.trim();
      const c = modalMount.querySelector('#qbf-opt-c')?.value.trim();
      const d = modalMount.querySelector('#qbf-opt-d')?.value.trim();
      const correct = modalMount.querySelector('#qbf-correct')?.value;
      const explanation = modalMount.querySelector('#qbf-explanation')?.value.trim();

      const options = [{ id: 'A', text: a }, { id: 'B', text: b }];
      if (c) options.push({ id: 'C', text: c });
      if (d) options.push({ id: 'D', text: d });

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saqlanmoqda...';

      try {
        const url = isEdit ? `/api/admin/questions/${q.id}` : '/api/admin/questions';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, difficulty, topic, question: questionText, options, correct, explanation })
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) throw new Error(resData.message);

        close();
        loadQuestions();
      } catch (err) {
        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.color = '#f87171';
          feedback.textContent = err.message || 'Xatolik yuz berdi.';
        }
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'O‘zgarishlarni Saqlash' : 'Savolni Saqlash';
      }
    });
  }

  function openImageModal(imgSrc) {
    modalMount.innerHTML = `
      <div class="premium-modal-backdrop active" id="img-modal-backdrop" style="position: fixed; inset: 0; z-index: 99999; display: grid; place-items: center; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); padding: 20px;">
        <div style="background: rgba(18, 14, 38, 0.98); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 20px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 25px 70px rgba(0,0,0,0.9);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span style="font-size: 14px; font-weight: 800; color: #fff;">To‘lov Cheki</span>
            <button type="button" id="img-modal-close" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">✕</button>
          </div>
          <img src="${imgSrc}" alt="Chek" style="max-width: 100%; max-height: 70vh; border-radius: 12px; object-fit: contain;">
        </div>
      </div>
    `;
    const close = () => { modalMount.innerHTML = ''; };
    modalMount.querySelector('#img-modal-close')?.addEventListener('click', close);
    modalMount.querySelector('#img-modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'img-modal-backdrop') close();
    });
  }

  /* ========================================================
     14. LIVE AI USAGE & RATE LIMIT STATS
  ======================================================== */
  async function loadAiUsage() {
    try {
      const res = await fetch('/api/admin/ai/usage');
      const data = await res.json();
      if (!res.ok || !data.success) return;
      const s = data.stats || {};
      const reqEl = $('#ai-stat-today-requests');
      const tokEl = $('#ai-stat-today-tokens');
      const actEl = $('#ai-stat-active-users');
      const limEl = $('#ai-stat-current-limit');
      if (reqEl) reqEl.textContent = s.todayRequests || 0;
      if (tokEl) tokEl.textContent = (s.todayTokens || 0).toLocaleString();
      if (actEl) actEl.textContent = s.activeUsersToday || 0;
      if (limEl) limEl.textContent = (s.dailyFreeLimit || 20) + ' ta';
      const limitInput = $('#ai-daily-free-limit');
      if (limitInput) limitInput.value = s.dailyFreeLimit || 20;
    } catch (e) {
      console.warn('[LOAD AI USAGE ERROR]', e);
    }
  }

  // Update AI Settings form submit to also send dailyFreeLimit
  $('#ai-settings-form')?.addEventListener('submit', async () => {
    const dailyFreeLimit = parseInt($('#ai-daily-free-limit')?.value || '20', 10);
    const primaryProvider = container.querySelector('input[name="ai-provider"]:checked')?.value || 'groq';
    try {
      await fetch('/api/admin/ai/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyFreeLimit, primaryProvider })
      });
      loadAiUsage();
    } catch {}
  }, { signal });

  // Initial Startup
  verifyAdmin().then(isAdmin => {
    if (isAdmin) {
      loadUsers();
      loadPayments(); // Pre-load pending payments for badge
    }
  });
}
