/**
 * LastWord — Motion & Interaction Controller
 * Powered by GSAP, ScrollTrigger & Lenis
 * Branch: ui-redesign
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none) or (pointer: coarse)').matches;

  // ------------------------------------------------------------------------
  // 1. Lenis Smooth Scrolling
  // ------------------------------------------------------------------------
  let lenisInstance = null;

  function initSmoothScroll() {
    if (prefersReducedMotion || isTouchDevice || typeof Lenis === 'undefined') {
      return;
    }

    try {
      lenisInstance = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.4,
      });

      if (typeof ScrollTrigger !== 'undefined') {
        lenisInstance.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          lenisInstance.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      } else {
        function raf(time) {
          lenisInstance.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }
    } catch (err) {
      console.warn('[LastWord Motion] Lenis init skipped:', err);
    }
  }

  // ------------------------------------------------------------------------
  // 2. Custom Soft Cursor Glow (Landing Page)
  // ------------------------------------------------------------------------
  function initCursorGlow() {
    if (prefersReducedMotion || isTouchDevice) return;

    const cursor = document.querySelector('.cursor-glow');
    if (!cursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isMoving = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isMoving) {
        document.body.classList.add('cursor-active');
        isMoving = true;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-active');
      isMoving = false;
    });

    function renderCursor() {
      if (isMoving) {
        currentX += (mouseX - currentX) * 0.16;
        currentY += (mouseY - currentY) * 0.16;
        cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);
  }

  // ------------------------------------------------------------------------
  // 3. Nav Pill Shrink on Scroll
  // ------------------------------------------------------------------------
  function initNavScroll() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;

    const onScroll = () => {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ------------------------------------------------------------------------
  // 4. Hero Word-by-Word Reveal & Staggered Animations
  // ------------------------------------------------------------------------
  function initHeroAnimations() {
    if (typeof gsap === 'undefined') return;

    if (prefersReducedMotion) {
      gsap.set(['.hero-word', '.hero-subhead', '.hero-actions .btn'], { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      '.hero-word',
      { y: '110%', opacity: 0 },
      {
        y: '0%',
        opacity: 1,
        duration: 0.85,
        stagger: 0.045,
        delay: 0.1,
      }
    );

    tl.fromTo(
      '.hero-subhead',
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65 },
      '-=0.4'
    );

    tl.fromTo(
      '.hero-actions .btn',
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.12 },
      '-=0.3'
    );
  }

  // ------------------------------------------------------------------------
  // 5. Cloud Blobs Parallax & Cursor Attraction
  // ------------------------------------------------------------------------
  function initCloudInteractions() {
    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Parallax on ScrollTrigger
    const heroStage = document.querySelector('.stage-hero');
    if (!heroStage) return;

    gsap.to('.cloud-blob-1', {
      yPercent: -22,
      ease: 'none',
      scrollTrigger: {
        trigger: heroStage,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    gsap.to('.cloud-blob-2', {
      yPercent: 28,
      ease: 'none',
      scrollTrigger: {
        trigger: heroStage,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    gsap.to('.cloud-blob-3', {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: {
        trigger: heroStage,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    gsap.to('.cloud-blob-4', {
      yPercent: 24,
      ease: 'none',
      scrollTrigger: {
        trigger: heroStage,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    // Subtle drift toward cursor (throttled)
    if (!isTouchDevice) {
      let targetX = 0;
      let targetY = 0;
      let curX = 0;
      let curY = 0;
      let isHeroHover = false;

      heroStage.addEventListener('mouseenter', () => { isHeroHover = true; });
      heroStage.addEventListener('mouseleave', () => {
        isHeroHover = false;
        targetX = 0;
        targetY = 0;
      });

      heroStage.addEventListener('mousemove', (e) => {
        const rect = heroStage.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        targetX = relX * 24; // max 24px drift
        targetY = relY * 24;
      }, { passive: true });

      function updateCloudDrift() {
        if (isHeroHover || Math.abs(curX) > 0.05 || Math.abs(curY) > 0.05) {
          curX += (targetX - curX) * 0.05;
          curY += (targetY - curY) * 0.05;
          const blobs = heroStage.querySelectorAll('.cloud-blob');
          blobs.forEach((blob, idx) => {
            const factor = (idx + 1) * 0.35;
            blob.style.transform = `translate3d(${curX * factor}px, ${curY * factor}px, 0)`;
          });
        }
        requestAnimationFrame(updateCloudDrift);
      }
      requestAnimationFrame(updateCloudDrift);
    }
  }

  // ------------------------------------------------------------------------
  // 6. Floating App Mockup (Scale-Up + 3D Mouse Tilt)
  // ------------------------------------------------------------------------
  function initMockupInteractions() {
    const mockup = document.querySelector('.app-mockup');
    const wrapper = document.querySelector('.mockup-wrapper');
    if (!mockup || !wrapper) return;

    // Scroll reveal scale from 0.92 to 1.0
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
      gsap.fromTo(
        mockup,
        { scale: 0.92, y: 55, opacity: 0.8 },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: wrapper,
            start: 'top 85%',
            end: 'top 48%',
            scrub: 0.7,
          },
        }
      );
    }

    // 3D Tilt following mouse (max 4deg)
    if (!prefersReducedMotion && !isTouchDevice) {
      let targetRotX = 0;
      let targetRotY = 0;
      let curRotX = 0;
      let curRotY = 0;
      let isHovering = false;

      wrapper.addEventListener('mouseenter', () => { isHovering = true; });
      wrapper.addEventListener('mouseleave', () => {
        isHovering = false;
        targetRotX = 0;
        targetRotY = 0;
      });

      wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width - 0.5;
        const normY = (e.clientY - rect.top) / rect.height - 0.5;

        // Clamp to max 4 degrees
        targetRotX = -normY * 8; // range -4 to +4
        targetRotY = normX * 8;
      }, { passive: true });

      function renderTilt() {
        if (isHovering || Math.abs(curRotX) > 0.02 || Math.abs(curRotY) > 0.02) {
          curRotX += (targetRotX - curRotX) * 0.1;
          curRotY += (targetRotY - curRotY) * 0.1;
          mockup.style.transform = `perspective(1000px) rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg)`;
        }
        requestAnimationFrame(renderTilt);
      }
      requestAnimationFrame(renderTilt);
    }
  }

  // ------------------------------------------------------------------------
  // 7. Live Countdown Ticker & Dynamic Status Cycle Loop
  // ------------------------------------------------------------------------
  function initMockupLiveSimulation() {
    const timeDisplay = document.querySelector('.countdown-inner-time');
    const ringStroke = document.querySelector('.ring-stroke');
    const statusBadge = document.querySelector('.mockup-status-badge');
    const countdownHeadline = document.querySelector('.countdown-headline');
    const countdownSubtext = document.querySelector('.countdown-subtext');
    const retroLogLine = document.querySelector('.retro-log-line-active');

    if (!timeDisplay) return;

    // Total circumference for r=65 is 2 * PI * 65 ≈ 408.4
    const totalCircumference = 408.4;

    // Seconds ticker
    let secondsLeft = 14 * 86400 + 8 * 3600 + 42 * 60 + 19; // 14d 08h 42m 19s
    setInterval(() => {
      if (secondsLeft > 0) secondsLeft--;
      const d = Math.floor(secondsLeft / 86400);
      const h = Math.floor((secondsLeft % 86400) / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;

      // Only update time text if we are in ACTIVE status
      if (currentStatusIndex === 0 && timeDisplay) {
        timeDisplay.textContent = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
      }
    }, 1000);

    // Status cycle definitions
    const stages = [
      {
        name: 'ACTIVE',
        badgeClass: 'status-active',
        badgeText: 'Active',
        strokeColor: '#10b981',
        strokeOffset: 85,
        time: '14d 08h 42m 19s',
        headline: 'Switch Active & Monitoring',
        subtext: 'Your cadence is verified. No action required before Dec 01.',
        retroLog: '[SYS_CHECK] Heartbeat verified. Active cadence window renewed (+14 days). Next deadline: Dec 01, 2026 12:00 UTC.',
      },
      {
        name: 'WARNED',
        badgeClass: 'status-warned',
        badgeText: 'Warned',
        strokeColor: '#f59e0b',
        strokeOffset: 210,
        time: '01d 23h 59m 40s',
        headline: 'Heartbeat Missed — Warning Phase',
        subtext: 'Scheduled ping failed. Dispatching warning alerts across email & SMS.',
        retroLog: '[ESCALATE_01] Heartbeat missed at T-0. Status advanced to WARNED. 48h warning interval active.',
      },
      {
        name: 'GRACE',
        badgeClass: 'status-grace',
        badgeText: 'Grace Period',
        strokeColor: '#f97316',
        strokeOffset: 330,
        time: '00d 07h 14m 02s',
        headline: 'Grace Window Running',
        subtext: 'Final safety buffer. Secondary emergency contacts have been pinged.',
        retroLog: '[ESCALATE_02] Warning interval elapsed without check-in. GRACE timer engaged (24h remaining).',
      },
      {
        name: 'RELEASED',
        badgeClass: 'status-released',
        badgeText: 'Released',
        strokeColor: '#ef4444',
        strokeOffset: 408.4,
        time: '00d 00h 00m 00s',
        headline: 'Vault Released to Beneficiaries',
        subtext: 'Fail-safe protocol completed. Single-use decryption tokens delivered.',
        retroLog: '[RELEASE_COMPLETE] Switch state: RELEASED. 2 one-time cryptographic tokens dispatched to trusted contacts.',
      },
    ];

    let currentStatusIndex = 0;

    function applyStage(idx) {
      const stage = stages[idx];

      if (statusBadge) {
        statusBadge.className = `status-badge ${stage.badgeClass} mockup-status-badge`;
        statusBadge.innerHTML = `<span class="status-badge-dot"></span><span>${stage.badgeText}</span>`;
      }

      if (ringStroke) {
        ringStroke.style.stroke = stage.strokeColor;
        ringStroke.style.strokeDashoffset = stage.strokeOffset;
      }

      if (timeDisplay) {
        timeDisplay.textContent = stage.time;
      }

      if (countdownHeadline) {
        countdownHeadline.textContent = stage.headline;
      }

      if (countdownSubtext) {
        countdownSubtext.textContent = stage.subtext;
      }

      if (retroLogLine) {
        retroLogLine.style.opacity = '0';
        setTimeout(() => {
          retroLogLine.textContent = stage.retroLog;
          retroLogLine.style.opacity = '1';
        }, 150);
      }
    }

    // Set initial stage
    applyStage(0);

    // If reduced motion is requested, do not loop automatically
    if (prefersReducedMotion) return;

    // Loop through statuses every 5 seconds
    setInterval(() => {
      currentStatusIndex = (currentStatusIndex + 1) % stages.length;
      applyStage(currentStatusIndex);
    }, 4800);

    // Interactive "I'm OK - Check in" button feedback
    const checkinBtn = document.querySelector('.btn-checkin');
    if (checkinBtn) {
      checkinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentStatusIndex = 0;
        applyStage(0);
        checkinBtn.innerHTML = `<span>✓ Checked In!</span>`;
        setTimeout(() => {
          checkinBtn.innerHTML = `<span>I'm OK — Check in</span>`;
        }, 2200);
      });
    }
  }

  // ------------------------------------------------------------------------
  // 8. "How It Works" Pinned Scroll Sequence
  // ------------------------------------------------------------------------
  function initHowItWorksSequence() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const sequenceStage = document.querySelector('#how-it-works');
    if (!sequenceStage) return;

    const fillLine = document.querySelector('.sequence-line-fill');
    const stepCards = document.querySelectorAll('.step-card');
    const stepNodes = document.querySelectorAll('.step-node');

    if (prefersReducedMotion || window.innerWidth <= 900) {
      // In mobile or reduced motion: make all steps visible and active
      stepCards.forEach(c => c.classList.add('active'));
      stepNodes.forEach(n => n.classList.add('active'));
      if (fillLine) fillLine.style.height = '100%';
      return;
    }

    // GSAP ScrollTrigger pinned timeline
    ScrollTrigger.create({
      trigger: sequenceStage,
      start: 'top top',
      end: '+=1600',
      pin: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;

        // Animate line height
        if (fillLine) {
          fillLine.style.height = `${(progress * 100).toFixed(1)}%`;
        }

        // Activate step nodes & cards
        const step1Active = progress >= 0;
        const step2Active = progress >= 0.38;
        const step3Active = progress >= 0.72;

        setStepState(1, step1Active, progress < 0.38);
        setStepState(2, step2Active, progress >= 0.38 && progress < 0.72);
        setStepState(3, step3Active, progress >= 0.72);
      },
    });

    function setStepState(stepNum, isPassed, isCurrent) {
      const card = document.querySelector(`.step-card[data-step="${stepNum}"]`);
      const node = document.querySelector(`.step-node[data-step="${stepNum}"]`);

      if (node) {
        if (isPassed) {
          node.classList.add('active');
        } else {
          node.classList.remove('active');
        }
      }

      if (card) {
        if (isCurrent || isPassed) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      }
    }
  }

  // ------------------------------------------------------------------------
  // 9. Magnetic Hover on Buttons
  // ------------------------------------------------------------------------
  function initMagneticButtons() {
    if (prefersReducedMotion || isTouchDevice || typeof gsap === 'undefined') return;

    const buttons = document.querySelectorAll('.btn-magnetic, .btn-pill-black, .btn-ghost');

    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - btnCenterX) * 0.28;
        const deltaY = (e.clientY - btnCenterY) * 0.28;

        gsap.to(btn, {
          x: deltaX,
          y: deltaY,
          duration: 0.25,
          ease: 'power2.out',
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.4)',
        });
      });
    });
  }

  // ------------------------------------------------------------------------
  // 10. General Scroll Reveals
  // ------------------------------------------------------------------------
  function initScrollReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || prefersReducedMotion) {
      return;
    }

    const revealSections = document.querySelectorAll('.scroll-reveal');

    revealSections.forEach((section) => {
      gsap.fromTo(
        section.children,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  }

  // ------------------------------------------------------------------------
  // 11. Page Route Fade Transitions
  // ------------------------------------------------------------------------
  function initPageTransitions() {
    const pageWrapper = document.querySelector('.page-wrapper');
    if (!pageWrapper) return;

    // Initial fade in
    pageWrapper.style.opacity = '1';

    // Intercept internal page navigation links
    const internalLinks = document.querySelectorAll('a[href^="/"]:not([href^="#"]):not([target="_blank"])');
    internalLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const destination = link.getAttribute('href');
        if (!destination || destination === window.location.pathname) return;

        e.preventDefault();
        pageWrapper.style.transition = 'opacity 0.2s ease';
        pageWrapper.style.opacity = '0';
        setTimeout(() => {
          window.location.href = destination;
        }, 220);
      });
    });
  }

  // ------------------------------------------------------------------------
  // Initialize Everything on DOM Ready
  // ------------------------------------------------------------------------
  function init() {
    initSmoothScroll();
    initCursorGlow();
    initNavScroll();
    initHeroAnimations();
    initCloudInteractions();
    initMockupInteractions();
    initMockupLiveSimulation();
    initHowItWorksSequence();
    initMagneticButtons();
    initScrollReveals();
    initPageTransitions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
