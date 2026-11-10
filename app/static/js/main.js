/**
 * LastWord — Tiny, High-Performance Bento Controller
 * Pure vanilla JavaScript + CSS transitions (NO libraries, NO GSAP, NO Lenis)
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------------
  // 1. IntersectionObserver for Bento Tiles (Staggered 60ms Enter Animation)
  // ------------------------------------------------------------------------
  function initTileObserver() {
    const tiles = document.querySelectorAll('.bento-tile');
    if (!tiles.length) return;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      tiles.forEach((t) => t.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    tiles.forEach((tile, index) => {
      tile.style.setProperty('--tile-delay', `${(index % 8) * 60}ms`);
      observer.observe(tile);
    });
  }

  // ------------------------------------------------------------------------
  // 2. Tab Visibility Management (Pause when tab is hidden)
  // ------------------------------------------------------------------------
  let isTabVisible = !document.hidden;

  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
  });

  // ------------------------------------------------------------------------
  // 3. Live Countdown & SVG Stroke-Dashoffset Transition
  // ------------------------------------------------------------------------
  function initCountdown() {
    const digitsEl = document.querySelector('#countdownDigits');
    const ringProgress = document.querySelector('#countdownProgress');
    if (!digitsEl) return;

    // Total circumference for r=40 is 2 * PI * 40 ≈ 251.3
    const totalCircumference = 251.3;
    let secondsRemaining = 14 * 86400 + 8 * 3600 + 42 * 60 + 19;
    const initialSeconds = 30 * 86400; // 30 days total interval

    function updateTick() {
      if (!isTabVisible) return;
      if (secondsRemaining > 0) secondsRemaining--;

      const d = Math.floor(secondsRemaining / 86400);
      const h = Math.floor((secondsRemaining % 86400) / 3600);
      const m = Math.floor((secondsRemaining % 3600) / 60);
      const s = secondsRemaining % 60;

      digitsEl.textContent = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;

      if (ringProgress) {
        const fraction = secondsRemaining / initialSeconds;
        const offset = totalCircumference * (1 - fraction);
        ringProgress.style.strokeDashoffset = offset.toFixed(1);
      }
    }

    updateTick();
    setInterval(updateTick, 1000);
  }

  // ------------------------------------------------------------------------
  // 4. Status Badge Cross-Fade Cycle (Active -> Warned -> Grace -> Released)
  // ------------------------------------------------------------------------
  function initStatusCycle() {
    const statusTile = document.querySelector('#statusCycleTile');
    const displayWrap = document.querySelector('#statusDisplayWrap');
    const nameEl = document.querySelector('#statusStateName');
    const descEl = document.querySelector('#statusStateDesc');

    if (!statusTile || !displayWrap) return;
    if (prefersReducedMotion) return;

    const states = [
      {
        name: 'ACTIVE',
        tileClass: 'tile-green',
        desc: 'Check-ins verified. Vault sealed.',
      },
      {
        name: 'WARNED',
        tileClass: 'tile-amber',
        desc: 'Check-in missed. Warning sent.',
      },
      {
        name: 'GRACE',
        tileClass: 'tile-orange',
        desc: 'Final window. SMS alert dispatched.',
      },
      {
        name: 'RELEASED',
        tileClass: 'tile-red',
        desc: 'No check-in received. Contacts notified.',
      },
    ];

    let currentIndex = 0;

    setInterval(() => {
      if (!isTabVisible) return;

      currentIndex = (currentIndex + 1) % states.length;
      const nextState = states[currentIndex];

      // Cross-fade out
      displayWrap.classList.add('cross-fade-out');

      setTimeout(() => {
        // Swap classes
        statusTile.classList.remove('tile-green', 'tile-amber', 'tile-orange', 'tile-red');
        statusTile.classList.add(nextState.tileClass);

        if (nameEl) nameEl.textContent = nextState.name;
        if (descEl) descEl.textContent = nextState.desc;

        // Cross-fade in
        displayWrap.classList.remove('cross-fade-out');
      }, 250);
    }, 4500);
  }

  // ------------------------------------------------------------------------
  // 5. Tile Hover Tilt — cursor-following translateX (--hx / --hbx)
  // ------------------------------------------------------------------------
  function initTileHover() {
    // Only run on hover-capable pointer devices
    if (prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    // Tiles: ±8px
    document.querySelectorAll('.bento-tile').forEach((tile) => {
      let rafId = null;
      tile.addEventListener('mousemove', (e) => {
        if (rafId) return; // throttle
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const rect = tile.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width; // 0..1
          const hx = (relX - 0.5) * 16; // -8..+8px
          tile.style.setProperty('--hx', `${hx.toFixed(2)}px`);
        });
      });
      tile.addEventListener('mouseleave', () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        tile.style.setProperty('--hx', '0px');
      });
    });

    // Buttons and rows: ±4px
    const nudgeEls = document.querySelectorAll(
      '.btn-pill-black, .btn-pill-ghost, .btn-pill-electric, .btn-checkin-huge, .topbar-btn, .item-card, .contact-row'
    );
    nudgeEls.forEach((el) => {
      let rafId = null;
      el.addEventListener('mousemove', (e) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const rect = el.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width;
          const hbx = (relX - 0.5) * 8; // -4..+4px
          el.style.setProperty('--hbx', `${hbx.toFixed(2)}px`);
        });
      });
      el.addEventListener('mouseleave', () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        el.style.setProperty('--hbx', '0px');
      });
    });
  }

  // ------------------------------------------------------------------------
  // 6. Interactive Check-in Button on Dashboard
  // ------------------------------------------------------------------------
  function initCheckinButton() {
    const btn = document.querySelector('#btnCheckin');
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>✓ PULSE VERIFIED!</span>';
      btn.style.borderColor = '#ffffff';
      btn.style.color = '#ffffff';

      try {
        await fetch('/checkin', {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
      } catch (err) {
        console.warn('Checkin pulse submitted locally:', err);
      }

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 2200);
    });
  }

  // ------------------------------------------------------------------------
  // Initialize on DOM Ready
  // ------------------------------------------------------------------------
  function init() {
    initTileObserver();
    initCountdown();
    initStatusCycle();
    initTileHover();
    initCheckinButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

