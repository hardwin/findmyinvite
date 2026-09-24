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
    if (!res.ok) throw new Error('motif ' + file);
    let svg = await res.text();
    // Tint both fill and stroke motifs (petal fill="#000", lucide stroke="#000").
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

/** Prefer edges/margins so motifs frame the paper card instead of covering copy. */
function spawn(kit: MotifKit, w: number, h: number, touch?: {x: number; y: number}): Particle {
  const z = Math.random();
  const shape = kit.shapes[Math.floor(Math.random() * kit.shapes.length)];
  const color = kit.colors[Math.floor(Math.random() * kit.colors.length)];
  const fromTouch = Boolean(touch);
  const depthScale = 0.55 + (1 - z) * 0.45;
  const driftDir = Math.random() < 0.55 ? -1 : 1;

  let baseX: number;
  let baseY: number;
  if (touch) {
    baseX = touch.x + (Math.random() - 0.5) * 12;
    baseY = touch.y + (Math.random() - 0.5) * 12;
  } else if (Math.random() < 0.7) {
    // Band along edges — visible in cream margins around the card.
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
    vx: (Math.random() - 0.5) * 0.14 * kit.drift * depthScale,
    vy: driftDir * (0.05 + Math.random() * 0.14) * kit.drift * depthScale,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.01 * kit.drift,
    // Clearly visible idle layer (~22–50px).
    size: (18 + Math.random() * 16) * depthScale * (fromTouch ? 1.25 : 1),
    life: 1,
    maxLife: fromTouch ? 0.9 + Math.random() * 1.1 : 1e9,
    // Pastel soft-light on cream was invisible — keep alpha strong with normal blend.
    alpha: 0.4 + Math.random() * 0.35,
    shape,
    color,
    fromTouch,
  };
}

/** Punch only real media + paper cards so margins keep the drifting layer. */
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

type Props = {templateId: string; accent?: string; active: boolean};

/**
 * Viewport-fixed SVG motifs — soft drifting atmosphere on idle text sections.
 * Hidden over hero/media; punched out of paper cards so copy stays clean.
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

    let w = 0;
    let h = 0;
    let scrollY = 0;
    let frame = 0;
    let last = performance.now();
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
      const count = reduced
        ? Math.min(12, Math.floor(k.density * 0.5))
        : Math.floor(k.density * 1.4);
      for (let i = 0; i < count; i++) particles.push(spawn(k, w, h));
    };

    const bloomAt = (clientX: number, clientY: number) => {
      refreshHoles();
      if (holes.some((r) => clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom))
        return;
      const heroSlide = hero?.closest('.swiper-slide');
      if (heroSlide?.classList.contains('swiper-slide-active')) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const k = kitRef.current;
      const n = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const p = spawn(k, w, h, {x, y});
        p.vx += (Math.random() - 0.5) * 0.9;
        p.vy += (Math.random() - 0.5) * 0.9;
        particles.push(p);
        void loadTintedMotif(p.shape, p.color);
      }
      if (particles.length > 90) particles.splice(0, particles.length - 90);
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

    const slideObserver = new MutationObserver(() => refreshHoles());
    page?.querySelectorAll('.swiper-slide').forEach((el) => {
      slideObserver.observe(el, {attributes: true, attributeFilter: ['class']});
    });

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

      // Only skip drawing while the hero slide is the active Swiper slide.
      const heroSlide = hero?.closest('.swiper-slide');
      const heroActive = Boolean(heroSlide?.classList.contains('swiper-slide-active'));
      if (heroActive) {
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
        const alpha = Math.max(0, Math.min(0.75, p.fromTouch ? p.life * p.alpha : p.alpha));
        if (alpha <= 0.03) continue;
        const drawY = p.fromTouch
          ? p.y
          : wrapScreen(p.y - scrollY * (0.03 + p.z * 0.12), h);
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
      slideObserver.disconnect();
    };
  }, [active, templateId]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="invite-motifs" aria-hidden="true" />;
}
