/**
 * ICCB 2027 — International Conference on Cancer Biology
 * Premium Interactive JavaScript
 * ============================================================
 */

'use strict';

// ============================================================
// 1. HERO CANVAS — DNA Helix & Molecular Particle System
// ============================================================
(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, animId;
  const particles = [];
  const connections = [];
  const PARTICLE_COUNT = 80;
  const NODE_COUNT = 22;

  // Colors extracted from ICCB27 logo
  const COLORS = {
    gold: 'rgba(214,178,76,',
    red: 'rgba(153,34,33,',
    blue: 'rgba(39,83,156,',
    burgundy: 'rgba(92,15,29,',
    molBlue: 'rgba(14,35,97,',
    white: 'rgba(255,255,255,'
  };

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  // Floating particle class
  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : H + 10;
      this.size = Math.random() * 2.5 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.5 + 0.15);
      this.life = Math.random();
      this.maxLife = Math.random() * 0.6 + 0.4;
      const c = [COLORS.gold, COLORS.red, COLORS.blue, COLORS.molBlue];
      this.color = c[Math.floor(Math.random() * c.length)];
      this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 0.0012;
      this.pulse += 0.04;
      if (this.life <= 0 || this.y < -20) this.reset();
    }

    draw() {
      const alpha = Math.min(this.life / 0.2, 1) * this.maxLife;
      const r = this.size + Math.sin(this.pulse) * 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + alpha + ')';
      ctx.fill();
    }
  }

  // Molecular network node class
  class Node {
    constructor() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.size = Math.random() * 3 + 2;
      const c = [COLORS.gold, COLORS.red, COLORS.blue, COLORS.white, COLORS.molBlue];
      this.color = c[Math.floor(Math.random() * c.length)];
      this.phase = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.phase += 0.025;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    }

    draw() {
      const r = this.size + Math.sin(this.phase) * 1.2;
      // Glow
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 4);
      grad.addColorStop(0, this.color + '0.6)');
      grad.addColorStop(1, this.color + '0)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + '0.9)';
      ctx.fill();
    }
  }

  // DNA helix parameters
  let helixOffset = 0;

  function drawDNAHelix() {
    helixOffset += 0.008;
    const cx = W / 2;
    const amp = Math.min(W * 0.06, 60);
    const freq = 0.018;
    const step = 4;

    ctx.lineWidth = 2;

    for (let y = 0; y < H; y += step) {
      const phase1 = y * freq + helixOffset;
      const phase2 = y * freq + helixOffset + Math.PI;

      const x1 = cx + Math.cos(phase1) * amp;
      const x2 = cx + Math.cos(phase2) * amp;

      const prog = y / H;
      const alpha = 0.25 * Math.sin(Math.PI * prog);

      // Strand 1 — gold
      ctx.beginPath();
      ctx.arc(x1, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.gold + alpha + ')';
      ctx.fill();

      // Strand 2 — blue
      ctx.beginPath();
      ctx.arc(x2, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.blue + alpha + ')';
      ctx.fill();

      // Base pair rungs every ~40px
      if (y % 40 < step) {
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = COLORS.white + (alpha * 0.5) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  function drawConnections(nodes) {
    const MAX_DIST = Math.min(W * 0.15, 180);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = COLORS.blue + alpha + ')';
          ctx.lineWidth = (1 - dist / MAX_DIST) * 1.5;
          ctx.stroke();
        }
      }
    }
  }

  // Initialize
  resize();
  window.addEventListener('resize', () => { resize(); });

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
  const nodes = Array.from({ length: NODE_COUNT }, () => new Node());

  function loop() {
    ctx.clearRect(0, 0, W, H);

    // DNA helix in background
    drawDNAHelix();

    // Molecular network
    drawConnections(nodes);
    nodes.forEach(n => { n.update(); n.draw(); });

    // Floating particles
    particles.forEach(p => { p.update(); p.draw(); });

    animId = requestAnimationFrame(loop);
  }

  loop();

  // Pause when tab not visible for performance
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      loop();
    }
  });
})();


// ============================================================
// SCIENTIFIC THEMES — Interactive DNA helix
// ============================================================
(function initScientificThemes() {
  const section = document.querySelector('.iccb-themes');
  const canvas = document.getElementById('iccb-themes-canvas');
  if (!section || !canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const themeButtons = Array.from(section.querySelectorAll('.iccb-theme-card'));
  const details = section.querySelector('.iccb-themes__details');
  const detailsContent = section.querySelector('.iccb-themes__details-content');
  const detailsTitle = section.querySelector('.iccb-themes__details-title');
  const detailsCopy = section.querySelector('.iccb-themes__details-copy');
  const motionButton = section.querySelector('.iccb-themes__motion');
  const motionIcon = motionButton.querySelector('i');
  const motionText = motionButton.querySelector('span');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const themes = themeButtons.map((button, index) => ({
    name: button.querySelector('.iccb-theme-card__name').textContent.trim(),
    // description: button.querySelector('.iccb-theme-card__description').textContent.trim(),
    color: getComputedStyle(button).getPropertyValue('--theme-accent').trim(),
    side: index < 3 ? 'L' : 'R',
    row: index % 3
  }));

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let rotation = 0;
  let velocity = 0;
  let activeTheme = null;
  let frameId = 0;
  let lastFrameTime = 0;
  let isVisible = false;
  let isDragging = false;
  let pointerX = 0;
  let userPaused = false;

  const strandColors = {
    gold: [150, 115, 39],
    blue: [49, 95, 156],
    violet: [112, 88, 133]
  };

  function rgb(color) {
    const value = color.replace('#', '');
    return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16));
  }

  function mix(first, second, amount) {
    return first.map((value, index) => value + (second[index] - value) * amount);
  }

  function rgba(color, alpha) {
    return `rgba(${color[0] | 0}, ${color[1] | 0}, ${color[2] | 0}, ${alpha})`;
  }

  function setMotionControl() {
    const reduced = motionPreference.matches;
    motionButton.disabled = reduced;
    motionButton.setAttribute('aria-pressed', String(userPaused || reduced));
    motionButton.setAttribute('aria-label', reduced
      ? 'Automatic motion disabled by reduced motion preference'
      : `${userPaused ? 'Start' : 'Pause'} rotation`);
    motionIcon.className = `fa-solid ${userPaused || reduced ? 'fa-play' : 'fa-pause'}`;
    motionText.textContent = reduced ? 'Reduced motion' : userPaused ? 'Start rotation' : 'Pause rotation';
  }

  function shouldAnimate() {
    return isVisible && !document.hidden && !userPaused && !motionPreference.matches;
  }

  function drawHelix() {
    if (!width || !height) return;

    context.clearRect(0, 0, width, height);
    const top = 28;
    const helixHeight = height - top * 2;
    const centerX = width / 2;
    const radius = Math.min(width * 0.34, 105);
    const active = activeTheme === null ? null : themes[activeTheme];
    const themeColor = active ? rgb(active.color) : null;
    const isWide = window.matchMedia('(min-width: 1101px)').matches;

    if (active) {
      const bandTop = top + active.row * helixHeight / 3;
      const band = context.createLinearGradient(0, bandTop, 0, bandTop + helixHeight / 3);
      band.addColorStop(0, rgba(themeColor, 0));
      band.addColorStop(0.5, rgba(themeColor, 0.085));
      band.addColorStop(1, rgba(themeColor, 0));
      context.fillStyle = band;
      context.fillRect(0, bandTop, width, helixHeight / 3);
    }

    if (isWide) {
      themes.forEach((theme, index) => {
        const y = top + (theme.row + 0.5) * helixHeight / 3;
        const selected = index === activeTheme;
        context.strokeStyle = rgba(rgb(theme.color), selected ? 0.7 : 0.2);
        context.lineWidth = selected ? 1.35 : 0.9;
        context.setLineDash([2, 6]);
        context.beginPath();
        if (theme.side === 'L') {
          context.moveTo(0, y);
          context.lineTo(centerX - radius * 1.05, y);
        } else {
          context.moveTo(width, y);
          context.lineTo(centerX + radius * 1.05, y);
        }
        context.stroke();
      });
      context.setLineDash([]);
    }

    const particles = [];
    const pointCount = 120;
    const rungCount = 24;
    const rungDots = 6;
    const turns = 2.25;
    const rowIsActive = progress => active !== null && active.row === Math.min(2, Math.floor(progress * 3));

    for (let strand = 0; strand < 2; strand++) {
      for (let point = 0; point < pointCount; point++) {
        const progress = point / (pointCount - 1);
        const phase = progress * turns * Math.PI * 2 + rotation + strand * Math.PI;
        const envelope = 0.6 + 0.4 * Math.sin(Math.PI * progress);
        const highlighted = rowIsActive(progress);
        const baseColor = strand === 0 ? strandColors.gold : strandColors.blue;
        const color = highlighted ? mix(baseColor, themeColor, 0.5) : baseColor;
        particles.push({
          x: centerX + radius * envelope * Math.cos(phase),
          y: top + progress * helixHeight,
          z: Math.sin(phase) * envelope,
          color,
          kind: 0,
          highlighted
        });
      }
    }

    for (let rung = 0; rung < rungCount; rung++) {
      const progress = (rung + 0.5) / rungCount;
      const phase = progress * turns * Math.PI * 2 + rotation;
      const envelope = 0.6 + 0.4 * Math.sin(Math.PI * progress);
      const firstX = centerX + radius * envelope * Math.cos(phase);
      const secondX = centerX - radius * envelope * Math.cos(phase);
      const depth = Math.sin(phase) * envelope;
      const y = top + progress * helixHeight;
      const highlighted = rowIsActive(progress);

      for (let dot = 0; dot <= rungDots; dot++) {
        const amount = dot / rungDots;
        const baseColor = amount < 0.5
          ? mix(strandColors.gold, strandColors.violet, amount * 2)
          : mix(strandColors.violet, strandColors.blue, (amount - 0.5) * 2);
        particles.push({
          x: firstX + (secondX - firstX) * amount,
          y,
          z: depth * (1 - 2 * amount),
          color: highlighted ? mix(baseColor, themeColor, 0.55) : baseColor,
          kind: dot === 0 || dot === rungDots ? 2 : 1,
          highlighted
        });
      }
    }

    particles.sort((first, second) => first.z - second.z);
    context.globalCompositeOperation = 'lighter';
    particles.forEach(particle => {
      const depth = (particle.z + 1) / 2;
      const alpha = (0.28 + 0.72 * depth) * (particle.highlighted ? 1 : 0.88);
      let pointRadius = particle.kind === 0
        ? 1.4 + 1.9 * depth
        : particle.kind === 1
          ? 0.9 + 1.2 * depth
          : 2.3 + 2.1 * depth;
      if (particle.highlighted) pointRadius *= 1.15;

      context.fillStyle = rgba(particle.color, alpha * 0.13);
      context.beginPath();
      context.arc(particle.x, particle.y, pointRadius * 2.8, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = rgba(particle.color, alpha);
      context.beginPath();
      context.arc(particle.x, particle.y, pointRadius, 0, Math.PI * 2);
      context.fill();

      if (particle.kind === 2) {
        context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.76})`;
        context.beginPath();
        context.arc(particle.x, particle.y, pointRadius * 0.38, 0, Math.PI * 2);
        context.fill();
      }
    });
    context.globalCompositeOperation = 'source-over';
  }

  function render(time) {
    frameId = 0;
    const elapsed = Math.min((time - lastFrameTime) / 1000 || 0.016, 0.05);
    lastFrameTime = time;
    if (!isDragging) {
      velocity += ((shouldAnimate() ? 0.7 : 0) - velocity) * Math.min(1, elapsed * 2.5);
      rotation += velocity * elapsed;
    }
    drawHelix();

    if (shouldAnimate() || Math.abs(velocity) > 0.001) {
      frameId = requestAnimationFrame(render);
    }
  }

  function requestRender() {
    if (!frameId) frameId = requestAnimationFrame(render);
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    width = bounds.width;
    height = bounds.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    requestRender();
  }

  function selectTheme(index) {
    if (!themes[index] || activeTheme === index) return;
    activeTheme = index;
    themeButtons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    details.style.setProperty('--theme-accent', themes[index].color);
    detailsTitle.textContent = themes[index].name;
    detailsCopy.textContent = themes[index].description;
    if (!motionPreference.matches && typeof detailsContent.animate === 'function') {
      detailsContent.animate(
        [{ opacity: 0.45, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 260, easing: 'ease-out' }
      );
    }
    requestRender();
  }

  themeButtons.forEach((button, index) => {
    button.addEventListener('pointerenter', () => {
      if (window.matchMedia('(hover: hover)').matches) selectTheme(index);
    });
    button.addEventListener('focus', () => selectTheme(index));
    button.addEventListener('click', () => selectTheme(index));
  });

  canvas.addEventListener('pointerdown', event => {
    isDragging = true;
    pointerX = event.clientX;
    velocity = 0;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', event => {
    if (!isDragging) return;
    const delta = event.clientX - pointerX;
    rotation += delta * 0.012;
    velocity = delta * 0.7;
    pointerX = event.clientX;
    requestRender();
  });

  function stopDragging() {
    isDragging = false;
  }

  canvas.addEventListener('pointerup', stopDragging);
  canvas.addEventListener('pointercancel', stopDragging);
  canvas.addEventListener('lostpointercapture', stopDragging);

  canvas.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    rotation += event.key === 'ArrowLeft' ? -0.25 : 0.25;
    requestRender();
  });

  motionButton.addEventListener('click', () => {
    if (motionPreference.matches) return;
    userPaused = !userPaused;
    velocity = Math.min(velocity, 0.7);
    setMotionControl();
    lastFrameTime = 0;
    requestRender();
  });

  motionPreference.addEventListener('change', () => {
    setMotionControl();
    lastFrameTime = 0;
    requestRender();
  });

  document.addEventListener('visibilitychange', () => {
    lastFrameTime = 0;
    if (document.hidden && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else {
      requestRender();
    }
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(resizeCanvas).observe(canvas);
  } else {
    window.addEventListener('resize', resizeCanvas, { passive: true });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      isVisible = entries[0].isIntersecting;
      lastFrameTime = 0;
      if (isVisible) requestRender();
      else if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }, { threshold: 0.05 }).observe(section);
  } else {
    isVisible = true;
  }

  setMotionControl();
  resizeCanvas();
})();


// ============================================================
// 2. SCROLL PROGRESS INDICATOR
// ============================================================
(function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  let updateFrame = 0;

  function updateProgress() {
    updateFrame = 0;
    const scroller = document.scrollingElement || document.documentElement;
    const viewportHeight = scroller.clientHeight || window.innerHeight;
    const scrollableHeight = Math.max(0, scroller.scrollHeight - viewportHeight);
    const progress = scrollableHeight > 0
      ? Math.min(1, Math.max(0, scroller.scrollTop / scrollableHeight))
      : 0;
    bar.style.transform = `scaleX(${progress})`;
  }

  function scheduleUpdate() {
    if (!updateFrame) updateFrame = requestAnimationFrame(updateProgress);
  }

  updateProgress();
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('pageshow', scheduleUpdate);
  window.visualViewport?.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleUpdate, { passive: true });

  if ('ResizeObserver' in window) {
    new ResizeObserver(scheduleUpdate).observe(document.documentElement);
  }
})();


// ============================================================
// 3. STICKY NAVIGATION
// ============================================================
// (function initNav() {
//   const navbar = document.getElementById('navbar');
//   if (!navbar) return;

//   window.addEventListener('scroll', () => {
//     if (window.scrollY > 60) {
//       navbar.classList.add('scrolled');
//     } else {
//       navbar.classList.remove('scrolled');
//     }
//   }, { passive: true });

//   // Active nav link on scroll
//   const sections = document.querySelectorAll('section[id]');
//   const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

//   const observer = new IntersectionObserver((entries) => {
//     entries.forEach(entry => {
//       if (entry.isIntersecting) {
//         const id = entry.target.getAttribute('id');
//         navLinks.forEach(link => {
//           link.classList.remove('active');
//           if (link.getAttribute('href') === '#' + id) {
//             link.classList.add('active');
//           }
//         });
//       }
//     });
//   }, { rootMargin: '-40% 0px -55% 0px' });

//   sections.forEach(s => observer.observe(s));
// })();


// ============================================================
// 4. MOBILE MENU TOGGLE
// ============================================================
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (!hamburger || !mobileNav) return;

  function closeMenu() {
    hamburger.classList.remove('active');
    mobileNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      hamburger.classList.add('active');
      mobileNav.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  });

  // Close menu on link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on backdrop click (clicking outside nav content)
  mobileNav.addEventListener('click', (e) => {
    if (e.target === mobileNav) closeMenu();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMenu();
  });
})();


// ============================================================
// 5. SCROLL REVEAL ANIMATIONS
// ============================================================
(function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!reveals.length) return;

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  reveals.forEach(el => revealObserver.observe(el));
})();


// ============================================================
// 6. ANIMATED NUMBER COUNTERS
// ============================================================
(function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));
})();


// ============================================================
// 7. COMMITTEE TABS
// ============================================================
(function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.add('active');
        // Re-trigger reveals within the newly shown tab
        target.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
          el.classList.add('revealed');
        });
      }
    });
  });
})();


// ============================================================
// 8. FAQ ACCORDION
// ============================================================
(function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!question || !answer) return;

    function toggleItem() {
      const isOpen = item.classList.contains('open');

      // Close all
      faqItems.forEach(i => {
        i.classList.remove('open');
        const a = i.querySelector('.faq-answer');
        if (a) a.classList.remove('open');
        const q = i.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      // Open current if it was closed
      if (!isOpen) {
        item.classList.add('open');
        answer.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      }
    }

    question.addEventListener('click', toggleItem);
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleItem();
      }
    });
  });
})();


// ============================================================
// 9. SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================================
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#' || href === '#!') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = 80; // navbar height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


// ============================================================
// 10. BACK TO TOP BUTTON
// ============================================================
(function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


// ============================================================
// 11. HERO LOGO FALLBACK (SVG if PNG missing)
// ============================================================
(function initLogoFallback() {
  const logos = document.querySelectorAll('img[src="assets/iccb27-logo.png"]');
  logos.forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const svg = img.nextElementSibling;
      if (svg && svg.tagName === 'svg') {
        svg.style.display = 'block';
      }
    });
  });
})();


// ============================================================
// 12. CONTACT FORM SUBMISSION (Placeholder)
// ============================================================
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<span class="btn-icon">✓</span> Message Sent!';
    btn.disabled = true;
    btn.style.background = 'linear-gradient(135deg, #2a7a2a, #1a5a1a)';

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.background = '';
      form.reset();
    }, 3500);
  });
})();


// ============================================================
// 13. BUTTON RIPPLE EFFECT
// ============================================================
(function initRipple() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute;
        border-radius:50%;
        background:rgba(255,255,255,0.25);
        width:100px;height:100px;
        left:${x - 50}px;top:${y - 50}px;
        animation:rippleAnim 0.6s ease-out forwards;
        pointer-events:none;
      `;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // Inject ripple keyframe dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rippleAnim {
      from { transform: scale(0); opacity: 1; }
      to   { transform: scale(3); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();


// ============================================================
// 14. PARALLAX SUBTLE EFFECT on HERO
// ============================================================
// (function initParallax() {
//   const hero = document.getElementById('hero');
//   const canvas = document.getElementById('hero-canvas');
//   if (!hero || !canvas) return;

//   window.addEventListener('scroll', () => {
//     const scrolled = window.scrollY;
//     if (scrolled < window.innerHeight) {
//       canvas.style.transform = `translateY(${scrolled * 0.25}px)`;
//     }
//   }, { passive: true });
// })();


// ============================================================
// 15. DYNAMIC DNA VISUAL IN ABOUT SECTION (subtle animation)
// ============================================================
(function animateDNA() {
  const dnaGroup = document.getElementById('dna-anim');
  if (!dnaGroup) return;

  let angle = 0;

  function tick() {
    angle += 0.5;
    dnaGroup.style.transform = `translateY(${Math.sin(angle * 0.02) * 8}px)`;
    requestAnimationFrame(tick);
  }

  tick();
})();


// ============================================================
// 16. PRELOAD / PAGE ENTRY ANIMATION
// ============================================================
(function initPageEntry() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.6s ease';

  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });

  // Fallback if load takes too long
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 800);
})();


// ============================================================
// 17. DOWNLOAD BROCHURE (placeholder click handler)
// ============================================================
(function initBrochureBtn() {
  const btn = document.getElementById('hero-brochure-btn');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // Show a notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;
      bottom:100px;
      left:50%;
      transform:translateX(-50%);
      background:rgba(37,9,21,0.95);
      border:1px solid rgba(214,178,76,0.5);
      border-radius:12px;
      padding:16px 28px;
      color:#F8F7F5;
      font-family:'Inter',sans-serif;
      font-size:0.9rem;
      z-index:9999;
      backdrop-filter:blur(20px);
      box-shadow:0 8px 32px rgba(0,0,0,0.5);
      animation:fadeInUp 0.3s ease;
    `;
    toast.innerHTML = '📋 Brochure will be available soon! <span style="color:#D6B24C;">Check back shortly.</span>';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  });
})();


// ============================================================
// 18. HIGHLIGHT CARD STAGGER ON LOAD
// ============================================================
(function initHighlightStagger() {
  const cards = document.querySelectorAll('.highlight-card, .why-card');
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, idx * 60);
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  cards.forEach(card => {
    if (!card.classList.contains('reveal')) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      staggerObserver.observe(card);
    }
  });
})();


// ============================================================
// 19. KEYBOARD NAVIGATION ENHANCEMENT
// ============================================================
(function initKeyboardNav() {
  // Trap focus in mobile menu when open
  const mobileNav = document.getElementById('mobile-nav');
  if (!mobileNav) return;

  const focusableEls = mobileNav.querySelectorAll('a, button, [tabindex]');

  mobileNav.addEventListener('keydown', (e) => {
    if (!mobileNav.classList.contains('open')) return;
    if (e.key !== 'Tab') return;

    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();


// ============================================================
// 20. CONSOLE BRANDING
// ============================================================
(function consoleBranding() {
  const styles = [
    'background: linear-gradient(135deg, #250915, #0E2361)',
    'color: #D6B24C',
    'font-size: 14px',
    'padding: 10px 20px',
    'border-radius: 8px',
    'font-family: Space Grotesk, sans-serif',
    'font-weight: bold'
  ].join(';');

  console.log('%c🧬 ICCB 2027 — International Conference on Cancer Biology', styles);
  console.log('%c  IIT Madras, Chennai · February 4–6, 2027', 'color:#D6B24C;font-size:11px;');
  console.log('%c  Built with scientific precision for scientific excellence.', 'color:#999;font-size:11px;');
})();


/* ============================================================
   21. ICCB 2027 LIVE COUNTDOWN
   ============================================================ */

(function initConferenceCountdown() {
  const targetDate = new Date("February 4, 2027 00:00:00").getTime();

  const daysEl = document.getElementById("countdown-days");
  const hoursEl = document.getElementById("countdown-hours");
  const minutesEl = document.getElementById("countdown-minutes");
  const secondsEl = document.getElementById("countdown-seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
    return;
  }

  function updateCountdown() {
    const now = Date.now();
    const distance = targetDate - now;

    if (distance <= 0) {
      daysEl.textContent = "0";
      hoursEl.textContent = "0";
      minutesEl.textContent = "0";
      secondsEl.textContent = "0";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));

    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) /
      (1000 * 60 * 60)
    );

    const minutes = Math.floor(
      (distance % (1000 * 60 * 60)) /
      (1000 * 60)
    );

    const seconds = Math.floor(
      (distance % (1000 * 60)) /
      1000
    );

    daysEl.textContent = days;
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
})();


/* ============================================================
   22. Update Timeline Statuses
   ============================================================ */

(function updateTimelineStatuses() {

  const today = new Date();

  // Compare dates only, not time
  today.setHours(0, 0, 0, 0);

  document.querySelectorAll(".timeline-status").forEach((status) => {
    const dateString = status.dataset.date;

    if (!dateString) return;

    const eventDate = new Date(`${dateString}T00:00:00`);

    const beforeText = status.dataset.before || "Upcoming";
    const onText = status.dataset.on || "Today";
    const afterText = status.dataset.after || "Closed";

    status.classList.remove(
      "status-upcoming",
      "status-open",
      "status-closed"
    );

    if (today < eventDate) {
      status.textContent = beforeText;
      status.classList.add("status-upcoming");
    } else if (today.getTime() === eventDate.getTime()) {
      status.textContent = onText;
      status.classList.add("status-open");
    } else {
      status.textContent = afterText;
      status.classList.add("status-closed");
    }
  });

})();