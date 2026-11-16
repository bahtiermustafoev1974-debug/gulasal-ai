// USTOZ-AI 2.0 Library Client Module
export async function getLibraryBooks() {
  const res = await fetch('/api/library');
  const json = await res.json();
  return json.data || [];
}

export function renderLibrary(containerId, books = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h3>📖 Raqamli Ta'lim Kutubxonasi</h3>
        <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 4px;">
          Elektron darsliklar, dasturlash qo'llanmalari va xalqaro til sertifikatlari kitoblari.
        </p>
      </div>
    </div>

    <!-- Filter Buttons -->
    <div style="display: flex; gap: 8px; margin-bottom: 24px; overflow-x: auto;" id="library-filters">
      <button class="suggestion-chip active" data-cat="all">Barchasi</button>
      <button class="suggestion-chip" data-cat="Darslik">Darsliklar</button>
      <button class="suggestion-chip" data-cat="IT">IT va Kodlash</button>
      <button class="suggestion-chip" data-cat="Tillar">Tillar (IELTS/Grammar)</button>
      <button class="suggestion-chip" data-cat="Fan">Aniq Fanlar</button>
    </div>

    <div class="cards-grid" id="library-grid">
      ${renderBookCards(books)}
    </div>
  `;

  function renderBookCards(list) {
    if (!list || list.length === 0) {
      return `<div style="color: #94a3b8; padding: 20px;">Kitoblar topilmadi.</div>`;
    }
    return list.map(b => `
      <div class="library-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span style="font-size: 1.8rem;">📕</span>
            <span style="font-size: 0.75rem; background: rgba(59,130,246,0.15); color: #60a5fa; padding: 2px 8px; border-radius: 4px;">
              ${b.category}
            </span>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">${b.title}</h4>
          <div style="font-size: 0.85rem; color: #94a3b8;">Muallif: ${b.author}</div>
          <p style="font-size: 0.82rem; color: #64748b; margin-top: 8px; line-height: 1.4;">
            ${b.description || ''}
          </p>
        </div>

        <div>
          <div class="library-meta">
            <span>💾 ${b.size}</span>
            <span>⬇️ ${b.downloads} marta</span>
          </div>
          <button class="btn btn-secondary download-book-btn" data-title="${b.title}" style="width: 100%; justify-content: center; margin-top: 12px; font-size: 0.85rem;">
            📥 Yuklab olish
          </button>
        </div>
      </div>
    `).join('');
  }

  // Filter click logic
  const filterBtns = container.querySelectorAll('#library-filters .suggestion-chip');
  const grid = container.querySelector('#library-grid');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      const filtered = cat === 'all' ? books : books.filter(b => b.category === cat);
      grid.innerHTML = renderBookCards(filtered);
      bindDownloadButtons();
    });
  });

  function bindDownloadButtons() {
    container.querySelectorAll('.download-book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-title');
        alert(`"${title}" qo'llanmasi yuklab olish uchun tayyorlanmoqda!`);
      });
    });
  }

  bindDownloadButtons();
}
