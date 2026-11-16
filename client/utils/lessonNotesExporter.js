/**
 * GULASAL AI — Lesson Notes PDF / Printable Exporter
 * Generates an official, beautifully styled print sheet ready to Save as PDF
 */

export function exportLessonNotes(lesson, subject) {
  if (!lesson) return;

  const title = lesson.title || 'Dars konspekti';
  const subjectName = subject?.name || 'Fan';
  const icon = subject?.icon || '📖';

  const stages = lesson.stages || [];
  const theoryStage = stages.find(s => s.type === 'theory' || s.stage === 1);
  const formulaStage = stages.find(s => s.type === 'formula' || s.stage === 2);
  const exampleStage = stages.find(s => s.type === 'examples' || s.stage === 3);
  const summaryStage = stages.find(s => s.type === 'summary' || s.stage === 5);

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (!printWindow) {
    alert('Iltimos, brauzerda qalqib chiquvchi oynalarga (pop-up) ruxsat bering.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(title)} — Konspekt (PDF)</title>
  <style>
    @page { margin: 18mm 15mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1a1a24;
      line-height: 1.6;
      margin: 0;
      padding: 24px;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #6366f1;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      color: #4338ca;
      letter-spacing: -0.5px;
    }
    .brand span { color: #a855f7; }
    .badge {
      font-size: 11px;
      text-transform: uppercase;
      background: #eef2ff;
      color: #4f46e5;
      padding: 4px 10px;
      border-radius: 999px;
      font-weight: 700;
    }
    h1 {
      font-size: 24px;
      margin: 8px 0 4px;
      color: #0f172a;
    }
    .meta {
      font-size: 13px;
      color: #64748b;
    }
    .section {
      margin-bottom: 22px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #312e81;
      margin-top: 0;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 6px;
    }
    .formula-box {
      background: #ffffff;
      border-left: 4px solid #6366f1;
      padding: 10px 14px;
      margin: 8px 0;
      border-radius: 4px;
    }
    .formula-code {
      font-family: "Courier New", monospace;
      font-weight: 700;
      color: #1e1b4b;
      font-size: 15px;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .print-bar {
      position: sticky;
      top: 0;
      background: #4f46e5;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .btn-print {
      background: #ffffff;
      color: #4338ca;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .print-bar { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>

  <div class="print-bar">
    <span>📄 <strong>${escapeHTML(title)}</strong> — Tayyor konspekt</span>
    <button class="btn-print" onclick="window.print()">📥 PDF Sifatida Saqlash / Chop etish</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">GULASAL <span>AI</span> • USTOZ-AI</div>
      <h1>${icon} ${escapeHTML(title)}</h1>
      <div class="meta">${escapeHTML(subjectName)} • 7 Bosqichli O‘quv Dasturi Konspekti</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">Rasmiy Konspekt</span>
      <div class="meta" style="margin-top: 6px;">Sana: ${new Date().toLocaleDateString('uz-UZ')}</div>
    </div>
  </div>

  ${theoryStage?.content ? `
  <div class="section">
    <div class="section-title">📘 1. Nazariya va Asosiy Mohiyat</div>
    <p>${escapeHTML(theoryStage.content.text || '')}</p>
    ${theoryStage.content.keyPoints?.length ? `
      <ul>
        ${theoryStage.content.keyPoints.map(kp => `<li><strong>${escapeHTML(kp)}</strong></li>`).join('')}
      </ul>
    ` : ''}
  </div>` : ''}

  ${formulaStage?.content ? `
  <div class="section">
    <div class="section-title">📐 2. Asosiy Formulalar va Qoidalar</div>
    ${(formulaStage.content.formulas || []).map(f => `
      <div class="formula-box">
        <div class="formula-code">${escapeHTML(f.tex || f.name)}</div>
        <div style="font-size: 13px; color: #475569; margin-top: 4px;">${escapeHTML(f.meaning || f.name)}</div>
      </div>
    `).join('')}
    ${formulaStage.content.notes ? `<p style="font-size: 13px; color: #64748b; margin-top: 8px;"><em>Eslatma: ${escapeHTML(formulaStage.content.notes)}</em></p>` : ''}
  </div>` : ''}

  ${exampleStage?.content ? `
  <div class="section">
    <div class="section-title">💡 3. Bosqichma-bosqich Yechilgan Misol</div>
    ${exampleStage.content.exampleProblem ? `<p><strong>Masala:</strong> ${escapeHTML(exampleStage.content.exampleProblem)}</p>` : ''}
    ${(exampleStage.content.steps || []).map(st => `
      <div style="margin: 6px 0; font-size: 14px;">
        <strong>${st.step || '•'}-qadam:</strong> ${escapeHTML(st.action || '')}
      </div>
    `).join('')}
  </div>` : ''}

  ${summaryStage?.content ? `
  <div class="section">
    <div class="section-title">✨ 4. Xulosa va Tezkor Eslatma</div>
    ${summaryStage.content.takeaways?.length ? `
      <ul>
        ${summaryStage.content.takeaways.map(t => `<li>${escapeHTML(t)}</li>`).join('')}
      </ul>
    ` : ''}
    ${summaryStage.content.cheatSheet ? `
      <div class="formula-box" style="border-left-color: #10b981; background: #ecfdf5;">
        <strong>Qisqa Shporgalka:</strong> ${escapeHTML(summaryStage.content.cheatSheet)}
      </div>
    ` : ''}
  </div>` : ''}

  <div class="footer">
    © 2026 Gulasal AI & Ustoz-AI Ta'lim Ekosistemasi. Ushbu konspekt talaba shaxsiy ta'limi uchun generatsiya qilindi.
  </div>

</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHTML(str = '') {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
