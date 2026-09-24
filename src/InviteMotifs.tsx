import {useEffect, useRef} from 'react';
import {MOTIF_SVG, motifKitFor, type MotifKit, type MotifShape} from './motif-kits';

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  shape: MotifShape;
  color: string;
  fromTouch: boolean;
};

const tintCache = new Map<string, HTMLImageElement | Promise<HTMLImageElement>>();

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
    let svg = await res.text();
    svg = svg
      .replaceAll('stroke="#000"', `stroke="${color}"`)
      .replaceAll('fill="#000"', `fill="${color}"`)
      .replaceAll('stroke-width="2"', 'stroke-width="0.9"')
      .replaceAll('stroke-width="1.5"', 'stroke-width="0.75"')
      .replaceAll('stroke-width="3"', 'stroke-width="1"');
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
  })();

  tintCache.set(key, job);
  return job;
}

function peekTinted(shape: MotifShape, color: string): HTMLImageElement | null {
  const hit = tintCache.get(cacheKey(shape, color));
  return hit instanceof HTMLImageElement ? hit : null;
}

function spawn(kit: MotifKit, w: number, h: number, touch?: {x: number; y: number}): Particle {
  const z = Math.random();
  const shape = kit.shapes[Math.floor(Math.random() * kit.shapes.length)];
  const color = kit.colors[Math.floor(Math.random() * kit.colors.length)];
  const fromTouch = Boolean(touch);
  const depthScale = .45 + (1 - z) * .4;
  const driftDir = Math.random() < .55 ? -1 : 1;
  // Sparse random distribution — jitter into thirds so they feel scattered
  const col = Math.floor(Math.random() * 3);
  const row = Math.floor(Math.random() * 3);
  const baseX = ((col + Math.random()) / 3) * w;
  const baseY = ((row + Math.random()) / 3) * h;
  return {
    x: touch ? touch.x + (Math.random() - .5) * 10 : baseX,
    y: touch ? touch.y + (Math.random() - .5) * 10 : baseY,
    z,
    vx: (Math.random() - .5) * .1 * kit.drift * depthScale,
    vy: driftDir * (.04 + Math.random() * .12) * kit.drift * depthScale,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - .5) * .007 * kit.drift,
    size: (2.5 + Math.random() * 3.5) * depthScale * (fromTouch ? 1.15 : 1),
    life: 1,
    maxLife: fromTouch ? .9 + Math.random() * 1.1 : 1e9,
    alpha: .18 + Math.random() * .28,
    shape,
    color,
    fromTouch,
  };
}

/** Videos, photos, and plate sections — motifs are punched out of these rects. */
function mediaRects(page: HTMLElement | null): DOMRect[] {
  if (!page) return [];
  // Swiper keeps every slide in the DOM; only punch the active (visible) slide.
  const scope =
    (page.querySelector('.swiper-slide-active') as HTMLElement | null) || page;
  const nodes = scope.querySelectorAll(
    [
      'video',
      'img',
      '.invitation-hero',
      '[class*="invite-plate-"]',
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
    // Ignore off-screen rects so translated slides cannot erase the canvas.
    if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return;
    out.push(r);
  });
  return out;
}

function pointInRects(x: number, y: number, rects: DOMRect[]) {
  return rects.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
}

type Props = {templateId: string; accent?: string; active: boolean};

/**
 * Viewport-fixed SVG motifs. Visible on text-only sections; hole-punched under
 * videos, images, and photo plates so they never sit on media.
 */
export default function InviteMotifs({templateId, accent, active}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kitRef = useRef<MotifKit>(motifKitFor(templateId, accent));
  kitRef.current = motifKitFor(templateId, accent);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const page = canvas.closest('.invitation-page') as HTMLElement | null;
    const hero = page?.querySelector('.invitation-hero') as HTMLElement | null;

    let w = 0, h = 0, scrollY = 0, frame = 0, last = performance.now();
    let holes: DOMRect[] = [];
    let holeTick = 0;
    const particles: Particle[] = [];
    let down: {x: number; y: number; id: number} | null = null;

    const refreshHoles = () => {
      holes = mediaRects(page);
    };

    const kit = kitRef.current;
    for (const shape of kit.shapes) {
      for (const color of kit.colors) void loadTintedMotif(shape, color);
    }

    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 1.75);
      w = innerWidth;
      h = innerHeight;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      refreshHoles();
    };

    const seed = () => {
      particles.length = 0;
      const k = kitRef.current;
      // Half the prior population — quiet, thin atmosphere
      const count = reduced
        ? Math.min(8, Math.floor(k.density * .22))
        : Math.floor(k.density * .7);
      for (let i = 0; i < count; i++) particles.push(spawn(k, w, h));
    };

    const bloomAt = (clientX: number, clientY: number) => {
      refreshHoles();
      if (pointInRects(clientX, clientY, holes)) return;
      const hr = hero?.getBoundingClientRect();
      if (hr && clientY >= hr.top && clientY <= hr.bottom) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const k = kitRef.current;
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const p = spawn(k, w, h, {x, y});
        p.vx += (Math.random() - .5) * .8;
        p.vy += (Math.random() - .5) * .8;
        particles.push(p);
        void loadTintedMotif(p.shape, p.color);
      }
      if (particles.length > 80) particles.splice(0, particles.length - 80);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (reduced) return;
      if (
        (e.target as HTMLElement | null)?.closest(
          'button,a,input,textarea,select,label,.sound-toggle,.language-toggle,.use-design,.skip-opening,.royal-open-target,.invitation-hero',
        )
      )
        return;
      down = {x: e.clientX, y: e.clientY, id: e.pointerId};
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 14) bloomAt(e.clientX, e.clientY);
      down = null;
    };

    const onPointerCancel = () => {
      down = null;
    };

    const onScroll = () => {
      scrollY = window.scrollY || page?.scrollTop || 0;
      refreshHoles();
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

    const wrap = (v: number, max: number) => {
      if (v < -40) return max + 40;
      if (v > max + 40) return -40;
      return v;
    };

    const wrapScreen = (v: number, max: number) => {
      const m = max || 1;
      return ((v % m) + m) % m;
    };

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2.5);
      last = now;
      if (holeTick++ % 6 === 0) refreshHoles();
      ctx.clearRect(0, 0, w, h);

      // Hero slide still owns the viewport — draw nothing over the opening/hero.
      // With Swiper, inactive slides stay in the DOM; only gate on the active slide.
      const heroSlide = hero?.closest('.swiper-slide');
      const heroActive =
        !heroSlide || heroSlide.classList.contains('swiper-slide-active');
      const hr = hero?.getBoundingClientRect();
      if (heroActive && hr && hr.bottom > h * 0.72) {
        frame = requestAnimationFrame(draw);
        return;
      }

      const ordered = particles.slice().sort((a, b) => b.z - a.z);
      for (const p of ordered) {
        if (!reduced) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.spin * dt;
          if (p.fromTouch) p.life -= dt / (p.maxLife * 60);
          if (!p.fromTouch) {
            p.x = wrap(p.x, w);
            p.y = wrap(p.y, h);
          }
        }
        const alpha = Math.max(0, Math.min(0.4, p.fromTouch ? p.life * p.alpha : p.alpha));
        if (alpha <= 0.02) continue;
        const drawY = p.fromTouch
          ? p.y
          : wrapScreen(p.y - scrollY * (0.03 + p.z * 0.12), h);
        const img = peekTinted(p.shape, p.color);
        ctx.save();
        ctx.translate(p.x, drawY);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        if (img?.complete) {
          const s = p.size * 1.55;
          ctx.drawImage(img, -s / 2, -s / 2, s, s);
        }
        ctx.restore();
      }
      // Punch motifs out of media so they only show on text/paper sections
      if (holes.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        for (const r of holes) ctx.fillRect(r.left, r.top, r.width, r.height);
        ctx.restore();
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].fromTouch && particles[i].life <= 0) particles.splice(i, 1);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      page?.removeEventListener('scroll', onScroll);
      page?.removeEventListener('pointerdown', onPointerDown);
      page?.removeEventListener('pointerup', onPointerUp);
      page?.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [active, templateId]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="invite-motifs" aria-hidden="true" />;
}
