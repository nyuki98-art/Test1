/* ════════════════════════════════════════════════════
   BLOEM — KADO DIGITAL PERSONAL
   app.js — Complete Interaction & Animation Engine
════════════════════════════════════════════════════ */

'use strict';

/* ── UTILITIES ──────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = arr => arr[randInt(0, arr.length - 1)];

/* ── PHASE MANAGER ─────────────────────────────────── */
class PhaseManager {
  constructor() {
    this.phases = {
      loading: $('#phase-loading'),
      unlock:  $('#phase-unlock'),
      main:    $('#phase-main'),
    };
    this.current = 'loading';
  }

  transition(from, to, delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        const fromEl = this.phases[from];
        const toEl   = this.phases[to];

        // fade out current
        fromEl.style.opacity = '0';
        fromEl.style.pointerEvents = 'none';

        setTimeout(() => {
          fromEl.classList.remove('phase--active');
          fromEl.style.opacity = '';

          // show next
          toEl.classList.add('phase--active');
          // For main, un-fix positioning
          if (to === 'main') {
            toEl.style.position = 'relative';
            toEl.style.zIndex   = '1';
            document.body.style.overflow = '';
          }

          this.current = to;
          resolve();
        }, 700);
      }, delay);
    });
  }
}

/* ── BLOOM LOADER ──────────────────────────────────── */
class BloomLoader {
  constructor(phase) {
    this.phase   = phase;
    this.bar     = $('#loadFill');
    this.pctEl   = $('#loadPct');
    this.petals  = $$('.petal');
    this.progress = 0;
    this.done    = false;
  }

  start() {
    return new Promise(resolve => {
      // Animate petals blooming in sequence
      this.petals.forEach((petal, i) => {
        setTimeout(() => {
          petal.style.animation = `petalBloom 600ms cubic-bezier(0.34,1.56,0.64,1) forwards`;
          petal.style.animationDelay = '0ms';
        }, i * 120);
      });

      // Fake loading progress
      const interval = setInterval(() => {
        const increment = rand(3, 14);
        this.progress = clamp(this.progress + increment, 0, 100);

        this.bar.style.width   = this.progress + '%';
        this.pctEl.textContent = Math.floor(this.progress) + '%';

        if (this.progress >= 100 && !this.done) {
          this.done = true;
          clearInterval(interval);
          setTimeout(resolve, 500);
        }
      }, 100);
    });
  }
}

/* ── PETAL CANVAS (falling petals on unlock screen) ── */
class PetalCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.petals = [];
    this.running = false;
    this.raf = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createPetal() {
    const emojis = ['🌸','🌷','🌹','🌺','🪷'];
    return {
      x:     rand(0, this.canvas.width),
      y:     rand(-80, -10),
      size:  rand(14, 28),
      emoji: pick(emojis),
      vx:    rand(-0.6, 0.6),
      vy:    rand(1.2, 2.8),
      angle: rand(0, Math.PI * 2),
      va:    rand(-0.025, 0.025),
      alpha: rand(0.3, 0.7),
    };
  }

  start() {
    this.running = true;
    // seed petals
    for (let i = 0; i < 18; i++) {
      const p = this.createPetal();
      p.y = rand(0, this.canvas.height); // spread initial
      this.petals.push(p);
    }
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  loop() {
    if (!this.running) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // add new petal occasionally
    if (Math.random() < 0.06) this.petals.push(this.createPetal());

    this.petals = this.petals.filter(p => {
      p.x    += p.vx;
      p.y    += p.vy;
      p.angle += p.va;

      if (p.y > this.canvas.height + 40) return false;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();

      return true;
    });

    this.raf = requestAnimationFrame(() => this.loop());
  }
}

/* ── ORBIT SATELLITES ──────────────────────────────── */
function initOrbitSatellites() {
  const wrap = $('#orbitSatellites');
  if (!wrap) return;

  const items = ['📸','🌸','💌','✨','🌹'];
  items.forEach((emoji, i) => {
    const deg = (i / items.length) * 360;
    const chip = document.createElement('div');
    chip.className = 'sat-chip';
    chip.textContent = emoji;
    chip.style.transform = `rotate(${deg}deg) translateY(-100px) rotate(-${deg}deg)`;
    wrap.appendChild(chip);
  });
}

/* ── SCROLL REVEAL ─────────────────────────────────── */
class ScrollReveal {
  constructor() {
    this.els = $$('.reveal-up');
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
  }

  observe() {
    this.els.forEach(el => this.observer.observe(el));
  }
}

/* ── MEMORY TAGS ───────────────────────────────────── */
class MemoryTags {
  constructor() {
    this.tags   = $$('.mem-tag');
    this.popup  = $('#memoryPopup');
    this.active = null;
  }

  init() {
    this.tags.forEach(tag => {
      tag.addEventListener('click', () => this.select(tag));
      tag.addEventListener('keypress', e => {
        if (e.key === 'Enter' || e.key === ' ') this.select(tag);
      });
    });
  }

  select(tag) {
    if (this.active === tag) return;

    // deactivate prev
    if (this.active) this.active.classList.remove('is-active');

    tag.classList.add('is-active');
    this.active = tag;

    const popup = this.popup;
    popup.classList.remove('is-visible');

    setTimeout(() => {
      popup.textContent = tag.dataset.msg;
      popup.classList.add('is-visible');
    }, 120);
  }
}

/* ── LETTER ENVELOPE ───────────────────────────────── */
class LetterEnvelope {
  constructor() {
    this.envelope = $('#letterEnvelope');
    this.opened   = false;
  }

  init() {
    if (!this.envelope) return;
    this.envelope.addEventListener('click',    () => this.toggle());
    this.envelope.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.toggle();
    });
    this.envelope.setAttribute('tabindex', '0');
    this.envelope.setAttribute('role', 'button');
    this.envelope.setAttribute('aria-label', 'Buka surat');
  }

  toggle() {
    this.opened = !this.opened;
    this.envelope.classList.toggle('is-open', this.opened);
    this.envelope.setAttribute('aria-label', this.opened ? 'Tutup surat' : 'Buka surat');
  }
}

/* ── MUSIC PLAYER ──────────────────────────────────── */
class MusicPlayer {
  constructor() {
    this.playBtn  = $('#playBtn');
    this.vinyl    = $('#vinylDisc');
    this.fill     = $('#progressFill');
    this.thumb    = $('#progressThumb');
    this.pBar     = $('#progressBar');
    this.curTime  = $('#currentTime');
    this.waveform = $('#waveformBars');

    this.playing  = false;
    this.progress = 0; // 0-100
    this.duration = 204; // seconds (3:24)
    this.elapsed  = 0;
    this.raf      = null;
    this.lastTs   = null;
    this.bars     = [];
  }

  init() {
    this.buildWaveform();

    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.pBar) {
      this.pBar.addEventListener('click', e => {
        const rect = this.pBar.getBoundingClientRect();
        const pct  = (e.clientX - rect.left) / rect.width;
        this.seek(pct * 100);
      });
    }

    // Prev / Next buttons (simulated)
    const prev = $('.music-btn--prev');
    const next = $('.music-btn--next');
    if (prev) prev.addEventListener('click', () => this.seek(0));
    if (next) next.addEventListener('click', () => { this.seek(100); this.pause(); });
  }

  buildWaveform() {
    if (!this.waveform) return;
    const NUM = 40;
    // Preset heights for a nice waveform shape
    const heights = Array.from({ length: NUM }, (_, i) => {
      const x = i / NUM;
      return 20 + 50 * Math.abs(Math.sin(x * Math.PI * 3)) * (0.5 + 0.5 * Math.random());
    });

    heights.forEach((h, i) => {
      const bar = document.createElement('div');
      bar.className = 'wave-bar';
      bar.style.height = `${h}%`;
      bar.dataset.i = i;
      this.waveform.appendChild(bar);
      this.bars.push(bar);
    });
  }

  togglePlay() {
    this.playing ? this.pause() : this.play();
  }

  play() {
    this.playing = true;
    this.playBtn.classList.add('is-playing');
    this.vinyl.classList.add('is-spinning');
    this.lastTs  = null;
    this.animateWaveform();
    this.raf = requestAnimationFrame(ts => this.tick(ts));
  }

  pause() {
    this.playing = false;
    this.playBtn.classList.remove('is-playing');
    this.vinyl.classList.remove('is-spinning');
    cancelAnimationFrame(this.raf);
    // reset bars
    this.bars.forEach(b => b.classList.remove('is-active'));
  }

  seek(pct) {
    this.progress = clamp(pct, 0, 100);
    this.elapsed  = (pct / 100) * this.duration;
    this.updateProgress();
  }

  tick(ts) {
    if (!this.playing) return;
    if (this.lastTs === null) this.lastTs = ts;

    const delta = (ts - this.lastTs) / 1000; // seconds
    this.lastTs = ts;

    this.elapsed += delta;
    if (this.elapsed >= this.duration) {
      this.elapsed = this.duration;
      this.progress = 100;
      this.updateProgress();
      this.pause();
      return;
    }

    this.progress = (this.elapsed / this.duration) * 100;
    this.updateProgress();

    this.raf = requestAnimationFrame(ts2 => this.tick(ts2));
  }

  updateProgress() {
    const pct = this.progress;

    if (this.fill)  this.fill.style.width = pct + '%';
    if (this.thumb) this.thumb.style.left  = pct + '%';

    if (this.curTime) {
      const mins = Math.floor(this.elapsed / 60);
      const secs = Math.floor(this.elapsed % 60);
      this.curTime.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
    }

    // Update active waveform bars
    const activePct = pct / 100;
    this.bars.forEach((bar, i) => {
      bar.classList.toggle('is-active', i / this.bars.length < activePct);
    });
  }

  animateWaveform() {
    if (!this.playing) return;
    // Slightly animate bar heights for live feel
    this.bars.forEach((bar, i) => {
      const base = parseFloat(bar.dataset.baseH || bar.style.height);
      if (!bar.dataset.baseH) bar.dataset.baseH = bar.style.height;
      const jitter = (Math.random() - 0.5) * 12;
      bar.style.height = clamp(base + jitter, 8, 90) + '%';
    });
    setTimeout(() => {
      if (this.playing) this.animateWaveform();
    }, 120);
  }
}

/* ── BOUQUET SECTION ───────────────────────────────── */
class BouquetSection {
  constructor() {
    this.bg = $('#bouquetPetalsBg');
  }

  init() {
    if (!this.bg) return;
    const emojis = ['🌹','🌸','🌷','🌺','🪷','💮','🌼'];
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('div');
      el.className = 'bouquet-petal-float';
      el.textContent = pick(emojis);
      el.style.left     = rand(0, 100) + '%';
      el.style.bottom   = '-40px';
      el.style.fontSize = rand(16, 32) + 'px';
      el.style.animationDuration  = rand(8, 18) + 's';
      el.style.animationDelay     = rand(0, 10) + 's';
      this.bg.appendChild(el);
    }
  }
}

/* ── CONFETTI ENGINE ───────────────────────────────── */
class Confetti {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.particles = [];
    this.raf     = null;
    this.running = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticle(x, y) {
    const emojis = ['🌸','🌹','🌷','💗','✨','🌺','💐','🎊','🪷','💮'];
    const colors = ['#c4715c','#e8c4b8','#8b3828','#c9a060','#f0d4cc','#e89080'];
    const isEmoji = Math.random() > 0.45;

    return {
      x, y,
      vx:    rand(-5, 5),
      vy:    rand(-12, -4),
      ax:    0,
      ay:    0.35,
      angle: rand(0, Math.PI * 2),
      va:    rand(-0.12, 0.12),
      size:  isEmoji ? rand(14, 28) : rand(6, 14),
      color: pick(colors),
      emoji: pick(emojis),
      isEmoji,
      life:  1,
      decay: rand(0.008, 0.018),
      scaleX: rand(0.4, 1),
    };
  }

  burst(originX, originY, count = 80) {
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(originX, originY));
    }
    if (!this.running) {
      this.running = true;
      this.loop();
    }
  }

  loop() {
    if (!this.running) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter(p => {
      p.vx += p.ax;
      p.vy += p.ay;
      p.x  += p.vx;
      p.y  += p.vy;
      p.angle += p.va;
      p.life  -= p.decay;

      if (p.life <= 0) return false;

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      if (p.isEmoji) {
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
      } else {
        ctx.scale(p.scaleX, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size / 2, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return true;
    });

    if (this.particles.length === 0) {
      this.running = false;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.raf = requestAnimationFrame(() => this.loop());
  }
}

/* ── HERO SCROLL PARALLAX ──────────────────────────── */
class HeroParallax {
  constructor() {
    this.hero     = $('#heroSection');
    this.hint     = $('#scrollHint');
    this.heroText = $('#heroText');
    this.ticking  = false;
  }

  init() {
    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.update();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }, { passive: true });
  }

  update() {
    const sy = window.scrollY;
    if (sy > 200) {
      if (this.hint) this.hint.style.opacity = Math.max(0, 1 - (sy - 200) / 100) + '';
    }
    if (this.heroText) {
      this.heroText.style.transform = `translateY(${sy * 0.18}px)`;
      this.heroText.style.opacity   = Math.max(0, 1 - sy / 400) + '';
    }
  }
}

/* ── ORBIT PHOTO COUNTER-ROTATE ────────────────────── */
// Makes orbit photos appear stationary while orbit ring rotates
function initOrbitPhotosCounterRotate() {
  const photosWrap = $('#orbitPhotos');
  if (!photosWrap) return;

  let angle = 0;
  const speed = 360 / (22 * 60); // 22s period at 60fps

  function frame() {
    angle += speed;
    // Images counter-rotate
    $$('.orbit-photo__img').forEach(img => {
      img.style.transform = `rotate(${-angle}deg)`;
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ── APP INIT ──────────────────────────────────────── */
(async function init() {
  // Prevent scroll during loading
  document.body.style.overflow = 'hidden';

  const phases   = new PhaseManager();
  const loader   = new BloomLoader(phases.phases.loading);
  const petalCV  = new PetalCanvas($('#petalCanvas'));
  const confetti = new Confetti($('#confettiCanvas'));

  // ── PHASE 1: Loading ──────────────────────────────
  await loader.start();

  // ── PHASE 2: Unlock ───────────────────────────────
  initOrbitSatellites();
  petalCV.start();

  await phases.transition('loading', 'unlock');

  // Setup unlock button
  const unlockBtn = $('#unlockBtn');
  unlockBtn.addEventListener('click', async () => {
    // ripple effect
    unlockBtn.style.transform = 'scale(0.95)';
    setTimeout(() => unlockBtn.style.transform = '', 200);

    // mini confetti burst
    const rect = unlockBtn.getBoundingClientRect();
    confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30);

    petalCV.stop();
    await phases.transition('unlock', 'main', 200);

    // ── PHASE 3: Main experience ───────────────────
    document.body.style.overflow = '';

    // Init all components
    new ScrollReveal().observe();
    new MemoryTags().init();
    new LetterEnvelope().init();
    new MusicPlayer().init();
    new BouquetSection().init();
    new HeroParallax().init();
    initOrbitPhotosCounterRotate();

    // Confetti button
    const confBtn = $('#confettiBtn');
    if (confBtn) {
      confBtn.addEventListener('click', () => {
        const rect = confBtn.getBoundingClientRect();
        confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 120);
        // Secondary burst from random top positions
        setTimeout(() => {
          confetti.burst(rand(0, window.innerWidth), 0, 60);
        }, 300);
        setTimeout(() => {
          confetti.burst(rand(0, window.innerWidth), 0, 60);
        }, 600);
      });
    }

    // Trigger hero text entrance animation
    const heroText = $('#heroText');
    if (heroText) {
      heroText.style.opacity   = '0';
      heroText.style.transform = 'translateY(24px)';
      setTimeout(() => {
        heroText.style.transition = 'opacity 900ms cubic-bezier(0.16,1,0.3,1), transform 900ms cubic-bezier(0.16,1,0.3,1)';
        heroText.style.opacity    = '1';
        heroText.style.transform  = 'translateY(0)';
      }, 200);
    }
  });

})();
