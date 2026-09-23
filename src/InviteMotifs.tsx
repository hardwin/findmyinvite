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
  shape: MotifShape;
  color: string;
  fromTouch: boolean;
};

const tintCache = new Map<string, HTMLImageElement | Promise<HTMLImageElement>>();

function cacheKey(shape: MotifShape, color: string) {
  return shape + '|' + color;
}

/** Load /assets/motifs/{name}.svg and recolor for canvas drawImage. */
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
  const depthScale = .55 + (1 - z) * .7;
  return {
    x: touch ? touch.x + (Math.random() - .5) * 18 : Math.random() * w,
    y: touch ? touch.y + (Math.random() - .5) * 18 : Math.random() * h,
    z,
    vx: (Math.random() - .5) * .2 * kit.drift * depthScale,
    vy: (-.12 - Math.random() * .28) * kit.drift * depthScale,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - .5) * .015 * kit.drift,
    size: (3.5 + Math.random() * 5.5) * depthScale * (fromTouch ? 1.2 : 1),
    life: 1,
    maxLife: fromTouch ? .8 + Math.random() * 1.2 : 1e9,
    shape,
    color,
    fromTouch,
  };
}

type Props = {templateId: string; accent?: string; active: boolean};

/** Floating multi-depth SVG motifs (vendored pack) + scroll parallax + touch spawn. */
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
      const count = reduced ? Math.min(14, Math.floor(k.density * .4)) : Math.floor(k.density * 1.2);
      for (let i = 0; i < count; i++) particles.push(spawn(k, w, h));
    };

    const onScroll = () => {scrollY = window.scrollY || page?.scrollTop || 0;};

    const onPointer = (e: PointerEvent) => {
      if (reduced) return;
      if ((e.target as HTMLElement | null)?.closest('button,a,input,textarea,select,label,.sound-toggle,.language-toggle,.use-design,.skip-opening,.royal-open-target')) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const k = kitRef.current;
      const n = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const p = spawn(k, w, h, {x, y});
        p.vx += (Math.random() - .5) * 1.2;
        p.vy -= .35 + Math.random() * 1;
        particles.push(p);
        void loadTintedMotif(p.shape, p.color);
      }
      if (particles.length > 140) particles.splice(0, particles.length - 140);
    };

    resize();
    seed();
    onScroll();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, {passive: true});
    page?.addEventListener('scroll', onScroll, {passive: true});
    page?.addEventListener('pointerdown', onPointer);

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
            if (p.y < -30) p.y = h + 30;
            if (p.y > h + 30) p.y = -30;
            if (p.x < -30) p.x = w + 30;
            if (p.x > w + 30) p.x = -30;
          }
        }
        const parallax = scrollY * (0.06 + p.z * 0.38);
        const alpha = Math.max(0, Math.min(0.5, p.fromTouch ? p.life * 0.5 : 0.16 + (1 - p.z) * 0.2));
        if (alpha <= 0.02) continue;
        const img = peekTinted(p.shape, p.color);
        ctx.save();
        ctx.translate(p.x, p.y - parallax);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        if (img?.complete) {
          const s = p.size * 2.2;
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
      page?.removeEventListener('pointerdown', onPointer);
    };
  }, [active, templateId]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="invite-motifs" aria-hidden="true"/>;
}
