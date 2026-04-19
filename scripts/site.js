/* =========================================================
   SITE INTERACTIONS
   - Scroll reveal
   - Navbar behavior
   - Filmstrip scroll progress
   - Case study ticker
   - Tweaks panel
========================================================= */

/* ---- Prevent Scroll Restoration & Remove Hash ---- */
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

if (window.location.hash) {
  window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
}

/* ---- Smooth Scroll for Anchor Links ---- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      // Optionally update URL without jumping
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  });
});

/* ---- Reveal on scroll ---- */
(() => {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal, .reveal-img').forEach((el) => io.observe(el));
})();

/* ---- Navbar: fade-in after hero, active section tracking ---- */
(() => {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 60) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }, { passive: true });

  const links = nav.querySelectorAll('a[data-section]');
  const sections = Array.from(links).map((l) => document.getElementById(l.dataset.section)).filter(Boolean);

  const secIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.toggle('active', l.dataset.section === e.target.id));
      }
    }
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach((s) => secIO.observe(s));
})();

/* ---- Filmstrip drag & wheel ---- */
(() => {
  const strip = document.getElementById('filmstrip');
  if (!strip) return;

  // Horizontal wheel scroll
  strip.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      strip.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  // Drag to scroll
  let isDown = false;
  let startX = 0;
  let startLeft = 0;
  strip.addEventListener('pointerdown', (e) => {
    isDown = true;
    startX = e.clientX;
    startLeft = strip.scrollLeft;
    strip.setPointerCapture(e.pointerId);
    strip.classList.add('dragging');
  });
  strip.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    strip.scrollLeft = startLeft - (e.clientX - startX);
  });
  ['pointerup', 'pointercancel'].forEach((ev) => {
    strip.addEventListener(ev, () => { isDown = false; strip.classList.remove('dragging'); });
  });

  // Progress indicator
  const progress = document.getElementById('filmstrip-progress-bar');
  function updateProgress() {
    if (!progress) return;
    const max = strip.scrollWidth - strip.clientWidth;
    const p = max > 0 ? strip.scrollLeft / max : 0;
    progress.style.transform = `scaleX(${Math.max(0.05, p)})`;
  }
  strip.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Arrow buttons
  const prev = document.getElementById('strip-prev');
  const next = document.getElementById('strip-next');
  if (prev) prev.addEventListener('click', () => strip.scrollBy({ left: -440, behavior: 'smooth' }));
  if (next) next.addEventListener('click', () => strip.scrollBy({ left: 440, behavior: 'smooth' }));
})();

/* ---- Marquee ticker for clients ---- */
(() => {
  // Pure CSS handles this; nothing needed here.
})();

/* ---- Tweaks panel (read TWEAKS defaults from window, host wiring) ---- */
(() => {
  let panelEl = null;
  let visible = false;

  const DEFAULTS = /*EDITMODE-BEGIN*/{
    "accentHue": 14,
    "grainOpacity": 0.06,
    "heroVariant": "auteur",
    "ctaStyle": "gradient"
  }/*EDITMODE-END*/;

  const state = { ...DEFAULTS };

  function apply() {
    // Accent hue shift (rotates primary + secondary around a luxe warm range 0–60)
    const h = +state.accentHue;
    const primary = `oklch(0.82 0.12 ${h + 20})`;
    const secondary = `oklch(0.86 0.14 ${h + 55})`;
    const primaryStrong = `oklch(0.66 0.23 ${h + 18})`;
    const secondaryGlow = `oklch(0.78 0.18 ${h + 60})`;
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--secondary', secondary);
    document.documentElement.style.setProperty('--primary-strong', primaryStrong);
    document.documentElement.style.setProperty('--secondary-glow', secondaryGlow);
    document.documentElement.style.setProperty('--grad-cta',
      `linear-gradient(135deg, ${primaryStrong} 0%, ${secondaryGlow} 100%)`);

    // Grain opacity
    document.documentElement.style.setProperty('--grain-op', state.grainOpacity);

    // Hero variant
    document.body.setAttribute('data-hero', state.heroVariant);

    // CTA style
    document.body.setAttribute('data-cta', state.ctaStyle);
  }

  function persist() {
    try {
      window.parent.postMessage({
        type: '__edit_mode_set_keys',
        edits: { ...state }
      }, '*');
    } catch (e) {}
  }

  function makePanel() {
    const p = document.createElement('div');
    p.id = 'tweaks-panel';
    p.innerHTML = `
      <div class="tp-head">
        <span class="label">Tweaks</span>
        <button class="tp-close" aria-label="Close">×</button>
      </div>
      <div class="tp-body">
        <label class="tp-row">
          <span class="label">Accent hue</span>
          <input type="range" min="0" max="60" step="1" data-key="accentHue" value="${state.accentHue}" />
          <output data-for="accentHue">${state.accentHue}°</output>
        </label>
        <label class="tp-row">
          <span class="label">Film grain</span>
          <input type="range" min="0" max="0.18" step="0.01" data-key="grainOpacity" value="${state.grainOpacity}" />
          <output data-for="grainOpacity">${state.grainOpacity}</output>
        </label>
        <div class="tp-row tp-col">
          <span class="label">Hero object</span>
          <div class="tp-segs" data-group="heroVariant">
            <button data-val="auteur" class="${state.heroVariant==='auteur'?'on':''}">Auteur</button>
            <button data-val="minimal" class="${state.heroVariant==='minimal'?'on':''}">Minimal</button>
            <button data-val="dense" class="${state.heroVariant==='dense'?'on':''}">Dense</button>
          </div>
        </div>
        <div class="tp-row tp-col">
          <span class="label">CTA style</span>
          <div class="tp-segs" data-group="ctaStyle">
            <button data-val="gradient" class="${state.ctaStyle==='gradient'?'on':''}">Gradient</button>
            <button data-val="outline" class="${state.ctaStyle==='outline'?'on':''}">Outline</button>
            <button data-val="solid" class="${state.ctaStyle==='solid'?'on':''}">Solid</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(p);

    p.querySelector('.tp-close').addEventListener('click', () => setVisible(false));
    p.querySelectorAll('input[type=range]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const k = inp.dataset.key;
        state[k] = +inp.value;
        const o = p.querySelector(`output[data-for="${k}"]`);
        if (o) o.textContent = k === 'accentHue' ? `${inp.value}°` : inp.value;
        apply(); persist();
      });
    });
    p.querySelectorAll('.tp-segs').forEach((seg) => {
      const group = seg.dataset.group;
      seg.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          seg.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on');
          state[group] = b.dataset.val;
          apply(); persist();
        });
      });
    });
    return p;
  }

  function setVisible(v) {
    visible = v;
    if (v && !panelEl) panelEl = makePanel();
    if (panelEl) panelEl.classList.toggle('open', v);
  }

  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') setVisible(true);
    if (d.type === '__deactivate_edit_mode') setVisible(false);
  });

  // Apply baseline
  apply();

  // Announce availability last
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
})();
