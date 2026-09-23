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
  alpha: number; // base opacity 0.2–0.6
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
      .replaceAll('fill="#000"', `fill="${color}"`);
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
  const depthScale = .6 + (1 - z) * .55;
  // Mix up/down drift so density stays even (not all rising to the top)
  const driftDir = Math.random() < .55 ? -1 : 1;
  return {
    x: touch ? touch.x + (Math.random() - .5) * 14 : Math.random() * w,
    // Uniform vertical seed — not clustered at top
    y: touch ? touch.y + (Math.random() - .5) * 14 : Math.random() * h,
    z,
    vx: (Math.random() - .5) * .18 * kit.drift * depthScale,
    vy: driftDir * (.08 + Math.random() * .22) * kit.drift * depthScale,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - .5) * .012 * kit.drift,
    // Slightly larger than previous tiny pass (~10–22px draw)
    size: (6 + Math.random() * 8) * depthScale * (fromTouch ? 1.25 : 1),
    life: 1,
    maxLife: fromTouch ? .9 + Math.random() * 1.1 : 1e9,
    alpha: .2 + Math.random() * .4, // 20%–60%
    shape,
    color,
    fromTouch,
  };
}

type Props = {templateId: string; accent?: string; active: boolean};

/**
 * Viewport-fixed SVG motifs. Positions stay in screen space so scroll does not
 * shove them to the top; touch/click spawns at the finger.
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

    let w = 0, h = 0, scrollY = 0, frame = 0, last = performance.now();
    const particles: Particle[] = [];
    // Distinguish tap from scroll: only bloom if finger barely moved
    let down: {x: number; y: number; id: number} | null = null;

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
    };

    const seed = () => {
      particles.length = 0;
      const k = kitRef.current;
      const count = reduced ? Math.min(16, Math.floor(k.density * .45)) : Math.floor(k.density * 1.25);
      for (let i = 0; i < count; i++) particles.push(spawn(k, w, h));
    };

    const bloomAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const k = kitRef.current;
      const n = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const p = spawn(k, w, h, {x, y});
        p.vx += (Math.random() - .5) * 1.1;
        p.vy += (Math.random() - .5) * 1.1;
        particles.push(p);
        void loadTintedMotif(p.shape, p.color);
      }
      if (particles.length > 150) particles.splice(0, particles.length - 150);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (reduced) return;
      if ((e.target as HTMLElement | null)?.closest('button,a,input,textarea,select,label,.sound-toggle,.language-toggle,.use-design,.skip-opening,.royal-open-target')) return;
      down = {x: e.clientX, y: e.clientY, id: e.pointerId};
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const moved = Math.hypot(dx, dy);
      // Treat as tap if finger moved < 14px (scroll gestures move more)
      if (moved < 14) bloomAt(e.clientX, e.clientY);
      down = null;
    };

    const onPointerCancel = () => {down = null;};

    const onScroll = () => {scrollY = window.scrollY || page?.scrollTop || 0;};

    resize();
    seed();
    onScroll();
    // Listen on page + window so taps on invite content register (canvas is pointer-events:none)
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

    /** Keep even top→bottom fill: parallax offset wraps inside the viewport. */
    const wrapScreen = (v: number, max: number) => {
      const m = max || 1;
      return ((v % m) + m) % m;
    };

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2.5);
      last = now;
      ctx.clearRect(0, 0, w, h);
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
        const alpha = Math.max(0, Math.min(0.6, p.fromTouch ? p.life * p.alpha : p.alpha));
        if (alpha <= 0.02) continue;
        // Touch blooms stay under the finger (viewport coords). Ambient gets wrapped parallax.
        const drawY = p.fromTouch
          ? p.y
          : wrapScreen(p.y - scrollY * (0.05 + p.z * 0.22), h);
        const img = peekTinted(p.shape, p.color);
        ctx.save();
        ctx.translate(p.x, drawY);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        if (img?.complete) {
          const s = p.size * 2.6;
          ctx.drawImage(img, -s / 2, -s / 2, s, s);
        }
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
  return <canvas ref={canvasRef} className="invite-motifs" aria-hidden="true"/>;
}
