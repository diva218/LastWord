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
    const telemetryEl = document.querySelector('#statusTelemetry');
    const cycleChip = document.querySelector('#statusCycleChip');

    if (!statusTile || !displayWrap) return;
    if (prefersReducedMotion) return;

    const states = [
      {
        name: 'ACTIVE',
        tileClass: 'tile-green',
        desc: 'Cadence verified. AWS EventBridge heartbeat active.',
        telemetry: '[EVENTBRIDGE] Rule: cron(* * * * ? *) ➔ Lambda: PASS (0 alerts)',
        chip: 'STATE 1/4',
      },
      {
        name: 'WARNED',
        tileClass: 'tile-amber',
        desc: 'Check-in missed. Warning email dispatched via AWS SES.',
        telemetry: '[SES] Dispatch: T-0 missed. 48-hour response window started.',
        chip: 'STATE 2/4',
      },
      {
        name: 'GRACE',
        tileClass: 'tile-orange',
        desc: 'Final buffer. Urgent SMS warning dispatched via AWS SNS.',
        telemetry: '[SNS] SMS alert sent to primary number. Grace timer: 24h.',
        chip: 'STATE 3/4',
      },
      {
        name: 'RELEASED',
        tileClass: 'tile-red',
        desc: 'Silence confirmed. Expiring S3 links emailed to trusted contacts.',
        telemetry: '[KMS+S3] Signed URLs generated. 2 beneficiaries notified.',
        chip: 'STATE 4/4',
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
        if (telemetryEl) telemetryEl.textContent = nextState.telemetry;
        if (cycleChip) cycleChip.textContent = nextState.chip;

        // Cross-fade in
        displayWrap.classList.remove('cross-fade-out');
      }, 250);
    }, 4500);
  }

  // ------------------------------------------------------------------------
  // 5. Interactive Check-in Button on Dashboard
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
    initCheckinButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
