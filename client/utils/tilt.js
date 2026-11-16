// =========================================================
// GULASAL AI — LUXURY 3D TILT & MOUSE-FOLLOWING SPOTLIGHT ENGINE
// 60fps RAF Lerp Physics • Global Ambient Spotlight • Specular Glare
// =========================================================

export function initSpotlightAndTilt() {
  if (typeof window === 'undefined') return;

  // Touch screen check: cleanly disabled on phones to guarantee 120Hz lag-free scrolling
  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches;

  if (isTouchDevice) {
    document.body.classList.add('touch-optimized');
    return;
  }

  // =======================================================
  // 1. GLOBAL SMOOTH MOUSE-FOLLOWING SPOTLIGHT AURA
  // =======================================================
  let spotlight = document.getElementById('gulasal-mouse-spotlight');
  if (!spotlight) {
    spotlight = document.createElement('div');
    spotlight.id = 'gulasal-mouse-spotlight';
    spotlight.className = 'gulasal-mouse-spotlight';
    spotlight.setAttribute('aria-hidden', 'true');
    document.body.prepend(spotlight);
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentSpotX = mouseX;
  let currentSpotY = mouseY;
  let spotlightActive = false;
  let globalRafId = null;

  function updateGlobalSpotlight() {
    // Ultra-smooth lerp damping (0.12)
    currentSpotX += (mouseX - currentSpotX) * 0.12;
    currentSpotY += (mouseY - currentSpotY) * 0.12;

    if (spotlight) {
      spotlight.style.transform = `translate3d(${currentSpotX}px, ${currentSpotY}px, 0)`;
      if (!spotlightActive) {
        spotlight.style.opacity = '1';
        spotlightActive = true;
      }
    }

    document.documentElement.style.setProperty('--global-mouse-x', `${currentSpotX.toFixed(1)}px`);
    document.documentElement.style.setProperty('--global-mouse-y', `${currentSpotY.toFixed(1)}px`);

    globalRafId = requestAnimationFrame(updateGlobalSpotlight);
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!globalRafId) {
      globalRafId = requestAnimationFrame(updateGlobalSpotlight);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    if (spotlight) {
      spotlight.style.opacity = '0';
      spotlightActive = false;
    }
  });

  // =======================================================
  // 2. CARD-LEVEL 3D TILT & MOUSE SPECULAR SHEEN
  // =======================================================
  const targetSelector = [
    '#google-glass-btn',
    '#guest-button',
    '.auth-glass-card',
    '.auth-card-circular',
    '.admin-stat-card',
    '.admin-actions-card',
    '.intro-feature-pill',
    '.intro-glass-emblem',
    '.intro-cta-btn',
    '.landing-primary-btn',
    '.landing-mockup-frame',
    '.bento-card',
    '.story-ielts-feature-card',
    '.mentor-stat-box',
    '.final-cta-card',
    '.apple-nav-register-btn',
    '.ga-suggestions button',
    '.nav-link',
    '.sidebar-support-btn',
    '.curriculum-topic-card',
    '.curriculum-lesson-row',
    '.tool-card',
    '.user-profile',
    '.mentor-card',
    '.eilist-lesson-card',
    '.eilist-progress-card',
    '.comm-member-card'
  ].join(', ');

  function setupCard(card) {
    if (card.dataset.tiltAttached === 'true') return;
    card.dataset.tiltAttached = 'true';

    // Ensure 3D perspective context
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform, box-shadow';

    let bounds = null;
    let cardRafId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHovered = false;

    function updateCardTransform() {
      if (!isHovered) return;

      // Smooth damping interpolation (lerp)
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;

      const maxTilt = 6.0; // degrees (restrained, modern minimalism)
      const rotX = (-currentY * maxTilt).toFixed(2);
      const rotY = (currentX * maxTilt).toFixed(2);

      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(5px) scale3d(1.015, 1.015, 1.015)`;

      cardRafId = requestAnimationFrame(updateCardTransform);
    }

    card.addEventListener('mouseenter', (e) => {
      bounds = card.getBoundingClientRect();
      isHovered = true;
      card.style.transition = 'box-shadow 0.25s ease, border-color 0.25s ease';
      card.classList.add('has-tilt-active');

      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      card.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);

      cardRafId = requestAnimationFrame(updateCardTransform);
    });

    card.addEventListener('mousemove', (e) => {
      if (!bounds) bounds = card.getBoundingClientRect();

      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;

      card.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);

      // Normalized coordinates from -0.5 to 0.5
      targetX = (x / bounds.width) - 0.5;
      targetY = (y / bounds.height) - 0.5;
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      cancelAnimationFrame(cardRafId);
      targetX = 0;
      targetY = 0;
      currentX = 0;
      currentY = 0;

      card.classList.remove('has-tilt-active');
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
      bounds = null;
    });
  }

  function attachAll() {
    const cards = document.querySelectorAll(targetSelector);
    cards.forEach(setupCard);
  }

  attachAll();

  // MutationObserver to automatically attach to dynamically loaded cards
  if (!window._gulasalTiltObserver) {
    const observer = new MutationObserver(() => {
      attachAll();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window._gulasalTiltObserver = observer;
  }
}
