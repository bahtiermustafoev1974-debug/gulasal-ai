// ========================================================
// GULASAL AI — INTERACTIVE PARABOLA & MATH LAB
// Real-time Canvas Graphing • Discriminant • Roots • HUD
// ========================================================

export function mountParabolaLab(container, options = {}) {
  let a = typeof options.a === 'number' ? options.a : 1;
  let b = typeof options.b === 'number' ? options.b : -2;
  let c = typeof options.c === 'number' ? options.c : -3;

  container.innerHTML = `
    <div class="parabola-lab-wrap">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div>
          <h4 style="margin:0;font-size:1.15rem;font-weight:800;color:#fff;">
            📊 Interaktiv Parabola & Kvadrat Tenglama Laboratoriyasi
          </h4>
          <span style="font-size:0.75rem;color:#94a3b8;">
            Slayderlarni suring va diskriminant hamda ildizlar o‘zgarishini jonli kuzating
          </span>
        </div>
      </div>

      <div class="lab-presets-bar" style="margin-bottom: 16px;">
        <span style="font-size:0.75rem;color:#a78bfa;font-weight:700;display:flex;align-items:center;">Namunalar:</span>
        <button class="preset-chip" type="button" data-a="1" data-b="-2" data-c="-3">2 ta ildiz (D &gt; 0)</button>
        <button class="preset-chip" type="button" data-a="1" data-b="-4" data-c="4">1 ta ildiz (D = 0)</button>
        <button class="preset-chip" type="button" data-a="1" data-b="2" data-c="5">Ildizsiz (D &lt; 0)</button>
        <button class="preset-chip" type="button" data-a="-1" data-b="4" data-c="-3">Pastga qaragan (a &lt; 0)</button>
        <button class="preset-chip" type="button" data-a="0.5" data-b="0" data-c="-2">Keng parabola</button>
      </div>

      <div class="lab-grid">
        <!-- CONTROLS -->
        <div class="lab-controls-panel">
          <div class="slider-card">
            <div class="slider-header">
              <span>Koeffitsient <strong>a</strong> (yo‘nalish va kenglik)</span>
              <span class="slider-val-badge" id="val-badge-a">${a}</span>
            </div>
            <input type="range" class="lab-range-input" id="slider-a" min="-4" max="4" step="0.1" value="${a}">
            <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#64748b;margin-top:4px;">
              <span>-4.0 (pastga)</span>
              <span>0 (chiziqli)</span>
              <span>+4.0 (yuqoriga)</span>
            </div>
          </div>

          <div class="slider-card">
            <div class="slider-header">
              <span>Koeffitsient <strong>b</strong> (gorizontal siljish)</span>
              <span class="slider-val-badge" id="val-badge-b">${b}</span>
            </div>
            <input type="range" class="lab-range-input" id="slider-b" min="-8" max="8" step="0.5" value="${b}">
          </div>

          <div class="slider-card">
            <div class="slider-header">
              <span>Koeffitsient <strong>c</strong> (OY o‘qini kesish nuqtasi)</span>
              <span class="slider-val-badge" id="val-badge-c">${c}</span>
            </div>
            <input type="range" class="lab-range-input" id="slider-c" min="-8" max="8" step="0.5" value="${c}">
          </div>
        </div>

        <!-- CANVAS & HUD -->
        <div class="lab-canvas-panel">
          <canvas class="parabola-canvas" id="parabola-graph-canvas"></canvas>

          <div class="lab-math-hud">
            <div>
              <div class="hud-equation" id="hud-equation-text">y = x² - 2x - 3</div>
              <div class="hud-roots" id="hud-roots-text" style="margin-top:4px;">Ildizlar hisoblanmoqda...</div>
            </div>

            <div class="hud-metrics">
              <span class="hud-pill d-positive" id="hud-d-pill">D = 16 (D &gt; 0)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#parabola-graph-canvas');
  const ctx = canvas.getContext('2d');

  const sliderA = container.querySelector('#slider-a');
  const sliderB = container.querySelector('#slider-b');
  const sliderC = container.querySelector('#slider-c');

  const badgeA = container.querySelector('#val-badge-a');
  const badgeB = container.querySelector('#val-badge-b');
  const badgeC = container.querySelector('#val-badge-c');

  const eqText = container.querySelector('#hud-equation-text');
  const rootsText = container.querySelector('#hud-roots-text');
  const dPill = container.querySelector('#hud-d-pill');

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 360 * dpr;
    ctx.scale(dpr, dpr);
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = 360;

    ctx.clearRect(0, 0, width, height);

    // Coordinate system settings: scale 24px per math unit
    const scale = 25;
    const originX = width / 2;
    const originY = height / 2;

    // 1. Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let x = originX % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = originY % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Axes (X and Y)
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
    ctx.lineWidth = 1.5;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Numbers on Axes
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';

    for (let i = -15; i <= 15; i++) {
      if (i === 0) continue;
      const px = originX + i * scale;
      if (px >= 0 && px <= width) {
        ctx.fillText(i, px, originY + 12);
      }
      const py = originY - i * scale;
      if (py >= 0 && py <= height) {
        ctx.fillText(i, originX - 10, py + 3);
      }
    }

    // 3. Mathematical calculations
    const D = b * b - 4 * a * c;
    const hasRoots = D >= 0 && Math.abs(a) > 0.001;

    let r1 = null, r2 = null;
    if (hasRoots) {
      r1 = (-b - Math.sqrt(Math.max(0, D))) / (2 * a);
      r2 = (-b + Math.sqrt(Math.max(0, D))) / (2 * a);
    }

    let vx = null, vy = null;
    if (Math.abs(a) > 0.001) {
      vx = -b / (2 * a);
      vy = -D / (4 * a);
    }

    // 4. Draw Parabola Curve
    if (Math.abs(a) > 0.001) {
      // Symmetry line
      const symmPx = originX + vx * scale;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(symmPx, 0);
      ctx.lineTo(symmPx, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Curve
      ctx.strokeStyle = a > 0 ? '#38bdf8' : '#ec4899';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = a > 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(236, 72, 153, 0.6)';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      let started = false;
      const step = 2; // pixel step

      for (let px = 0; px <= width; px += step) {
        const mathX = (px - originX) / scale;
        const mathY = a * mathX * mathX + b * mathX + c;
        const py = originY - mathY * scale;

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Vertex Dot
      const vPx = originX + vx * scale;
      const vPy = originY - vy * scale;
      if (vPx >= 0 && vPx <= width && vPy >= 0 && vPy <= height) {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(vPx, vPy, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`Uch (${vx.toFixed(1)}, ${vy.toFixed(1)})`, vPx, vPy - 9);
      }

      // Draw Roots Dots on OX
      if (hasRoots) {
        [r1, r2].forEach(r => {
          const rPx = originX + r * scale;
          const rPy = originY;
          if (rPx >= 0 && rPx <= width) {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(rPx, rPy, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(`x = ${r.toFixed(2)}`, rPx, rPy + 16);
          }
        });
      }

      // Draw Y-intercept (0, c)
      const cPx = originX;
      const cPy = originY - c * scale;
      if (cPy >= 0 && cPy <= height) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cPx, cPy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Update HUD Info
    const signB = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    const signC = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    eqText.textContent = `y = ${a}x² ${signB}x ${signC}`;

    if (D > 0) {
      dPill.className = 'hud-pill d-positive';
      dPill.textContent = `D = ${D.toFixed(1)} > 0 (2 ta ildiz)`;
      rootsText.innerHTML = `Ildizlar: <strong style="color:#4ade80;">x₁ = ${r1.toFixed(2)}</strong>, <strong style="color:#4ade80;">x₂ = ${r2.toFixed(2)}</strong> &bull; Cho‘qqi: (${vx.toFixed(1)}, ${vy.toFixed(1)})`;
    } else if (Math.abs(D) < 0.001) {
      dPill.className = 'hud-pill d-zero';
      dPill.textContent = `D = 0 (1 ta ildiz)`;
      rootsText.innerHTML = `Yagona ildiz: <strong style="color:#facc15;">x = ${r1.toFixed(2)}</strong> (Parabola OX o‘qiga tegib turadi)`;
    } else {
      dPill.className = 'hud-pill d-negative';
      dPill.textContent = `D = ${D.toFixed(1)} < 0 (Ildiz yo‘q)`;
      rootsText.innerHTML = `<span style="color:#f87171;">Haqiqiy ildiz mavjud emas</span> (Parabola OX o‘qini kesib o‘tmaydi) &bull; Cho‘qqi: (${vx.toFixed(1)}, ${vy.toFixed(1)})`;
    }
  }

  function update() {
    a = parseFloat(sliderA.value);
    b = parseFloat(sliderB.value);
    c = parseFloat(sliderC.value);

    badgeA.textContent = a.toFixed(1);
    badgeB.textContent = b.toFixed(1);
    badgeC.textContent = c.toFixed(1);

    draw();
  }

  sliderA.addEventListener('input', update);
  sliderB.addEventListener('input', update);
  sliderC.addEventListener('input', update);

  // Preset chips
  container.querySelectorAll('.preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      sliderA.value = btn.dataset.a;
      sliderB.value = btn.dataset.b;
      sliderC.value = btn.dataset.c;
      update();
    });
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
  });

  // Init
  setTimeout(() => {
    resizeCanvas();
    draw();
  }, 50);

  return {
    updateValues: (newA, newB, newC) => {
      sliderA.value = newA;
      sliderB.value = newB;
      sliderC.value = newC;
      update();
    }
  };
}
