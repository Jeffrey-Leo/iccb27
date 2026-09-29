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
// 2. SCROLL PROGRESS INDICATOR
// ============================================================
(function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }, { passive: true });
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
  const cards = document.querySelectorAll('.highlight-card, .why-card, .theme-card');
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
