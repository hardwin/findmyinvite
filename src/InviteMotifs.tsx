import {useEffect, useRef} from 'react';
import {MOTIF_SVG, motifKitFor, type MotifKit, type MotifShape} from './motif-kits';

type Layer = 'back' | 'mid' | 'front';

type Particle = {
  x: number;
  y: number;
  z: number;
  layer: Layer;
  depthScale: number;
  vx: number;
  vy: number;
  ix: number;
  iy: number;
  rot: number;
  spin: number;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  shape: MotifShape;
  color: string;
  fromTouch: boolean;
  phase: number;
};

type SwipeDetail = {dy?: number; dx?: number};

const tintCache = new Map<string, HTMLImageElement | Promise<HTMLImageElement>>();

const WIND_BASE = 16;
const WIND_AMP = 5;
const WIND_BOB = 3.5;
const WIND_OMEGA = 0.85;
const WIND_EASE = 2.2;
const IMPULSE_GAIN = 0.28;
const IMPULSE_MAX = 520;
const IMPULSE_DECAY = 6;
const MAX_PARTICLES = 36;

function cacheKey(shape: MotifShape, color: string) {
  return shape + '|' + color;
}

function loadTintedMotif(shape: MotifShape, color: string): Promise<HTMLImageElement> {
  const key = cacheKey(shape, color);
  const hit = tintCache.get(key);
  if (hit instanceof HTMLImageElement) return Promise.resolve(hit);
  if (hit) return hit;

  const job = (async () => {
    const file = MOTIF_SVG[shape];
    const res = await fetch('/assets/motifs/' + file + '.svg');
    if (!res.ok) throw new Error('motif ' + file);
    let svg = await res.text();
    svg = svg
      .replaceAll('stroke="#000"', `stroke="${color}"`)
      .replaceAll('fill="#000"', `fill="${color}"`)
      .replaceAll("stroke='#000'", `stroke='${color}'`)
      .replaceAll("fill='#000'", `fill='${color}'`);
    const blob = new Blob([svg], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    URL.revokeObjectURL(url);
    tintCache.set(key, img);
    return img;
  })().catch((err) => {
    tintCache.delete(key);
    throw err;
  });

  tintCache.set(key, job);
  return job;
}

function peekTinted(shape: MotifShape, color: string): HTMLImageElement | null {
  const hit = tintCache.get(cacheKey(shape, color));
  return hit instanceof HTMLImageElement ? hit : null;
}

function layerFor(z: number): Layer {
  if (z < 0.33) return 'back';
  if (z < 0.66) return 'mid';
  return 'front';
}

function depthScaleFor(layer: Layer): number {
  if (layer === 'back') return 0.35;
  if (layer === 'front') return 1.55;
  return 1;
}

function sizeScaleFor(layer: Layer): number {
  if (layer === 'back') return 0.7;
  if (layer === 'front') return 1.25;
  return 1;
}

function spawn(kit: MotifKit, w: number, h: number, touch?: {x: number; y: number}): Particle {
  const z = Math.random();
  const layer = layerFor(z);
  const depthScale = depthScaleFor(layer);
  const shape = kit.shapes[Math.floor(Math.random() * kit.shapes.length)];
  const color = kit.colors[Math.floor(Math.random() * kit.colors.length)];
  const fromTouch = Boolean(touch);
  const drift = kit.drift || 1;

  let baseX: number;
  let baseY: number;
  if (touch) {
    baseX = touch.x + (Math.random() - 0.5) * 12;
    baseY = touch.y + (Math.random() - 0.5) * 12;
  } else if (Math.random() < 0.7) {
    const band = Math.floor(Math.random() * 4);
    if (band === 0) {
      baseX = Math.random() * w;
      baseY = Math.random() * h * 0.22;
    } else if (band === 1) {
      baseX = Math.random() * w;
      baseY = h * 0.78 + Math.random() * h * 0.22;
    } else if (band === 2) {
      baseX = Math.random() * w * 0.18;
      baseY = Math.random() * h;
    } else {
      baseX = w * 0.82 + Math.random() * w * 0.18;
      baseY = Math.random() * h;
    }
  } else {
    baseX = Math.random() * w;
    baseY = Math.random() * h;
  }

  return {
    x: baseX,
    y: baseY,
    z,
    layer,
    depthScale,
    vx: WIND_BASE * 0.02 * depthScale * drift,
    vy: (Math.random() - 0.5) * 0.08 * depthScale * drift,
    ix: 0,
    iy: 0,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.012 * drift,
    size: (9 + Math.random() * 8) * sizeScaleFor(layer) * (fromTouch ? 1.25 : 1),
    life: 1,
    maxLife: fromTouch ? 0.9 + Math.random() * 1.1 : 1e9,
    alpha: layer === 'mid' ? 0.5 + Math.random() * 0.3 : 0.32 + Math.random() * 0.28,
    shape,
    color,
    fromTouch,
    phase: Math.random() * Math.PI * 2,
  };
}

function mediaRects(page: HTMLElement | null): DOMRect[] {
  if (!page) return [];
  const scope =
    (page.querySelector('.swiper-slide-active') as HTMLElement | null) || page;
  const nodes = scope.querySelectorAll(
    [
      'video',
      'img',
      '.invitation-hero',
      '.invite-chapter-inner',
      '.scratch-heart',
      '.photo-slideshow',
      '.classic-hero-photo',
      '.gallery',
      '.moments-gallery',
      '.photo-grid',
    ].join(','),
  );
  const vh = window.innerHeight || 1;
  const vw = window.innerWidth || 1;
  const out: DOMRect[] = [];
  nodes.forEach((el) => {
    const r = (el as HTMLElement).getBoundingClientRect();
    if (r.width <= 12 || r.height <= 12) return;
    if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return;
    out.push(r);
  });
  return out;
}

function isLowEndDevice() {
  const nav = navigator as Navigator & {deviceMemory?: number};
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return true;
  if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) {
    return true;
  }
  return false;
}

type Props = {templateId: string; accent?: string; active: boolean};

/**
 * Viewport-fixed SVG motifs — layered parallax breeze on idle text sections.
 * Back/front CSS-blurred; mid sharp. Surges with section swipe, then L→R wind.
 */
export default function InviteMotifs({templateId, accent, active}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const midRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const kitRef = useRef<MotifKit>(motifKitFor(templateId, accent));
  kitRef.current = motifKitFor(templateId, accent);

  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const backEl = backRef.current;
    const midEl = midRef.current;
    const frontEl = frontRef.current;
    if (!wrap || !backEl || !midEl || !frontEl) return;

    const ctxBack = backEl.getContext('2d');
    const ctxMid = midEl.getContext('2d');
    const ctxFront = frontEl.getContext('2d');
    if (!ctxBack || !ctxMid || !ctxFront) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowEnd = isLowEndDevice();
    const useBlur = !reduced && !lowEnd;
    wrap.classList.toggle('is-blurred', useBlur);
    wrap.classList.toggle('is-flat', !useBlur);

    const page = wrap.closest('.invitation-page') as HTMLElement | null;
    const hero = page?.querySelector('.invitation-hero') as HTMLElement | null;
    const pager = page?.querySelector('.invite-pager-live') as HTMLElement | null;

    let w = 0;
    let h = 0;
    let scrollY = 0;
    let frame = 0;
    let last = performance.now();
    let tSec = 0;
    let holes: DOMRect[] = [];
    let holeTick = 0;
    let hidden = document.hidden;
    const particles: Particle[] = [];
    let down: {x: number; y: number; id: number} | null = null;

    const layerList: {el: HTMLCanvasElement; ctx: CanvasRenderingContext2D; layer: Layer}[] = [
      {el: backEl, ctx: ctxBack, layer: 'back'},
      {el: midEl, ctx: ctxMid, layer: 'mid'},
      {el: frontEl, ctx: ctxFront, layer: 'front'},
    ];

    const refreshHoles = () => {
      holes = mediaRects(page);
    };

    for (const shape of kitRef.current.shapes) {
      for (const color of kitRef.current.colors) void loadTintedMotif(shape, color);
    }

    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 1.75);
      w = innerWidth;
      h = innerHeight;
      for (const {el, ctx} of layerList) {
        el.width = Math.floor(w * ratio);
        el.height = Math.floor(h * ratio);
        el.style.width = w + 'px';
        el.style.height = h + 'px';
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      refreshHoles();
    };

    const seed = () => {
      particles.length = 0;
      const k = kitRef.current;
      const count = reduced
        ? Math.min(12, Math.floor(k.density * 0.5))
        : Math.min(MAX_PARTICLES, Math.floor(k.density * 1.35));
      for (let i = 0; i < count; i++) particles.push(spawn(k, w, h));
    };

    const applyImpulse = (dy: number, dx = 0) => {
      if (reduced) return;
      for (const p of particles) {
        if (p.fromTouch) continue;
        p.iy += Math.max(-IMPULSE_MAX, Math.min(IMPULSE_MAX, dy * IMPULSE_GAIN * p.depthScale));
        p.ix += Math.max(
          -IMPULSE_MAX * 0.35,
          Math.min(IMPULSE_MAX * 0.35, dx * IMPULSE_GAIN * 0.4 * p.depthScale),
        );
        p.ix += (Math.random() - 0.5) * 40 * p.depthScale;
      }
    };

    const onSwipe = (e: Event) => {
      const detail = (e as CustomEvent<SwipeDetail>).detail || {};
      const dy = typeof detail.dy === 'number' ? detail.dy : 0;
      const dx = typeof detail.dx === 'number' ? detail.dx : 0;
      if (dy || dx) applyImpulse(dy, dx);
    };

    const bloomAt = (clientX: number, clientY: number) => {
      refreshHoles();
      if (
        holes.some(
          (r) => clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom,
        )
      ) {
        return;
      }
      const heroSlide = hero?.closest('.swiper-slide');
      if (heroSlide?.classList.contains('swiper-slide-active')) return;
      const rect = wrap.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const k = kitRef.current;
      const n = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const p = spawn(k, w, h, {x, y});
        p.ix += (Math.random() - 0.5) * 180;
        p.iy += (Math.random() - 0.5) * 180;
        particles.push(p);
        void loadTintedMotif(p.shape, p.color);
      }
      if (particles.length > MAX_PARTICLES + 20) {
        particles.splice(0, particles.length - (MAX_PARTICLES + 20));
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (reduced) return;
      if (
        (e.target as HTMLElement | null)?.closest(
          'button,a,input,textarea,select,label,.sound-toggle,.language-toggle,.use-design,.skip-opening,.royal-open-target,.invitation-hero',
        )
      ) {
        return;
      }
      down = {x: e.clientX, y: e.clientY, id: e.pointerId};
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 14) {
        bloomAt(e.clientX, e.clientY);
      }
      down = null;
    };

    const onPointerCancel = () => {
      down = null;
    };

    const onScroll = () => {
      scrollY = window.scrollY || page?.scrollTop || 0;
      refreshHoles();
    };

    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden) last = performance.now();
    };

    resize();
    seed();
    onScroll();
    refreshHoles();

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, {passive: true});
    page?.addEventListener('scroll', onScroll, {passive: true});
    page?.addEventListener('pointerdown', onPointerDown, {passive: true});
    page?.addEventListener('pointerup', onPointerUp, {passive: true});
    page?.addEventListener('pointercancel', onPointerCancel, {passive: true});
    window.addEventListener('pointerup', onPointerUp, {passive: true});
    document.addEventListener('visibilitychange', onVisibility);
    pager?.addEventListener('invite-swipe', onSwipe);
    page?.addEventListener('invite-swipe', onSwipe);

    const slideObserver = new MutationObserver(() => refreshHoles());
    page?.querySelectorAll('.swiper-slide').forEach((el) => {
      slideObserver.observe(el, {attributes: true, attributeFilter: ['class']});
    });

    const wrapPos = (v: number, max: number) => {
      if (v < -40) return max + 40;
      if (v > max + 40) return -40;
      return v;
    };

    const wrapScreen = (v: number, max: number) => {
      const m = max || 1;
      return ((v % m) + m) % m;
    };

    const drawLayer = (ctx: CanvasRenderingContext2D, layer: Layer) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        if (p.layer !== layer) continue;
        const alpha = Math.max(0, Math.min(0.8, p.fromTouch ? p.life * p.alpha : p.alpha));
        if (alpha <= 0.03) continue;
        const drawY = p.fromTouch
          ? p.y
          : wrapScreen(p.y - scrollY * (0.02 + p.z * 0.1), h);
        const img = peekTinted(p.shape, p.color);
        ctx.save();
        ctx.translate(p.x, drawY);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        const s = p.size * 2;
        if (img?.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -s / 2, -s / 2, s, s);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.38, s * 0.24, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (holes.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        for (const r of holes) ctx.fillRect(r.left, r.top, r.width, r.height);
        ctx.restore();
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (hidden) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      tSec += dt;
      if (holeTick++ % 6 === 0) refreshHoles();

      const heroSlide = hero?.closest('.swiper-slide');
      if (heroSlide?.classList.contains('swiper-slide-active')) {
        ctxBack.clearRect(0, 0, w, h);
        ctxMid.clearRect(0, 0, w, h);
        ctxFront.clearRect(0, 0, w, h);
        return;
      }

      const drift = kitRef.current.drift || 1;

      if (!reduced) {
        for (const p of particles) {
          const windX =
            (WIND_BASE + WIND_AMP * Math.sin(tSec * WIND_OMEGA + p.phase)) * drift;
          const windY =
            WIND_BOB * Math.sin(tSec * WIND_OMEGA * 0.65 + p.phase * 1.3) * drift;

          p.vx += (windX * p.depthScale - p.vx) * WIND_EASE * dt;
          p.vy += (windY * p.depthScale - p.vy) * WIND_EASE * dt;

          const decay = Math.exp(-IMPULSE_DECAY * dt);
          p.ix *= decay;
          p.iy *= decay;

          p.x += (p.vx + p.ix) * dt;
          p.y += (p.vy + p.iy) * dt;
          p.rot += p.spin * (60 * dt);

          if (p.fromTouch) p.life -= dt / p.maxLife;
          else {
            p.x = wrapPos(p.x, w);
            p.y = wrapPos(p.y, h);
          }
        }
      }

      drawLayer(ctxBack, 'back');
      drawLayer(ctxMid, 'mid');
      drawLayer(ctxFront, 'front');

      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].fromTouch && particles[i].life <= 0) particles.splice(i, 1);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      page?.removeEventListener('scroll', onScroll);
      page?.removeEventListener('pointerdown', onPointerDown);
      page?.removeEventListener('pointerup', onPointerUp);
      page?.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('visibilitychange', onVisibility);
      pager?.removeEventListener('invite-swipe', onSwipe);
      page?.removeEventListener('invite-swipe', onSwipe);
      slideObserver.disconnect();
    };
  }, [active, templateId, accent]);

  if (!active) return null;

  return (
    <div ref={wrapRef} className="invite-motifs" aria-hidden="true">
      <canvas ref={backRef} className="invite-motifs-back" />
      <canvas ref={midRef} className="invite-motifs-mid" />
      <canvas ref={frontRef} className="invite-motifs-front" />
    </div>
  );
}
