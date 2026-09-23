import {useEffect, useRef} from 'react';
import {motifKitFor, type MotifKit, type MotifShape} from './motif-kits';

type Particle = {
  x: number;
  y: number;
  z: number; // 0 near … 1 far — drives parallax + size
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  size: number;
  life: number; // 1 ambient forever-ish; touch fades
  maxLife: number;
  shape: MotifShape;
  color: string;
  fromTouch: boolean;
};

function drawShape(ctx: CanvasRenderingContext2D, shape: MotifShape, size: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (shape) {
    case 'petal': {
      ctx.beginPath();
      ctx.ellipse(0, 0, size * .45, size, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'jasmine': {
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 5);
        ctx.beginPath();
        ctx.ellipse(0, -size * .55, size * .28, size * .55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, size * .22, 0, Math.PI * 2);
      ctx.fillStyle = '#fff8e8';
      ctx.globalAlpha = alpha * .9;
      ctx.fill();
      break;
    }
    case 'leaf': {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * .7, 0, 0, size);
      ctx.quadraticCurveTo(-size * .7, 0, 0, -size);
      ctx.fill();
      break;
    }
    case 'lantern': {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * .7, -size * .2, size * .45, size * .5);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * .45, size * .5);
      ctx.quadraticCurveTo(-size * .7, -size * .2, 0, -size);
      ctx.fill();
      ctx.globalAlpha = alpha * .5;
      ctx.beginPath();
      ctx.arc(0, -size * .15, size * .18, 0, Math.PI * 2);
      ctx.fillStyle = '#fff6d0';
      ctx.fill();
      break;
    }
    case 'spark': {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
        ctx.lineTo(Math.cos(a + Math.PI / 4) * size * .28, Math.sin(a + Math.PI / 4) * size * .28);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, size * .45, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function spawn(kit: MotifKit, w: number, h: number, touch?: {x: number; y: number}): Particle {
  const z = Math.random();
  const shape = kit.shapes[Math.floor(Math.random() * kit.shapes.length)];
  const color = kit.colors[Math.floor(Math.random() * kit.colors.length)];
  const fromTouch = Boolean(touch);
  const depthScale = .45 + (1 - z) * .9;
  return {
    x: touch ? touch.x + (Math.random() - .5) * 24 : Math.random() * w,
    y: touch ? touch.y + (Math.random() - .5) * 24 : Math.random() * h,
    z,
    vx: (Math.random() - .5) * .25 * kit.drift * depthScale,
    vy: (-.15 - Math.random() * .35) * kit.drift * depthScale,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - .5) * .02 * kit.drift,
    size: (4 + Math.random() * 10) * depthScale * (fromTouch ? 1.15 : 1),
    life: fromTouch ? 1 : 1,
    maxLife: fromTouch ? .9 + Math.random() * 1.4 : 1e9,
    shape,
    color,
    fromTouch,
  };
}

type Props = {templateId: string; accent?: string; active: boolean};

/** Floating multi-depth motifs with scroll parallax + touch/click spawn. */
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

    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 1.75);
      w = innerWidth;
      h = Math.max(innerHeight, page?.scrollHeight || innerHeight);
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const seed = () => {
      particles.length = 0;
      const kit = kitRef.current;
      const count = reduced ? Math.min(10, Math.floor(kit.density * .35)) : kit.density;
      for (let i = 0; i < count; i++) particles.push(spawn(kit, w, Math.max(h, innerHeight * 2)));
    };

    const onScroll = () => {scrollY = page?.scrollTop ?? window.scrollY; const next=Math.max(innerHeight, page?.scrollHeight || innerHeight); if(Math.abs(next-h)>80) resize();};

    const onPointer = (e: PointerEvent) => {
      if (reduced) return;
      if ((e.target as HTMLElement | null)?.closest('button,a,input,textarea,select,label,.sound-toggle,.language-toggle,.use-design,.skip-opening,.royal-open-target')) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top + (page?.scrollTop ?? 0);
      const kit = kitRef.current;
      const n = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const p = spawn(kit, w, h, {x, y});
        p.vx += (Math.random() - .5) * 1.4;
        p.vy -= .4 + Math.random() * 1.2;
        particles.push(p);
      }
      if (particles.length > 120) particles.splice(0, particles.length - 120);
    };

    resize();
    seed();
    onScroll();
    window.addEventListener('resize', resize);
    (page || window).addEventListener('scroll', onScroll, {passive: true});
    page?.addEventListener('pointerdown', onPointer);

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2.5);
      last = now;
      ctx.clearRect(0, 0, w, h);
      // Far → near so near motifs paint on top
      const ordered = particles.slice().sort((a, b) => b.z - a.z);
      for (const p of ordered) {
        if (!reduced) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.spin * dt;
          if (p.fromTouch) p.life -= dt / (p.maxLife * 60);
          // soft wrap ambient
          if (!p.fromTouch) {
            if (p.y < -40) p.y = h + 40;
            if (p.y > h + 40) p.y = -40;
            if (p.x < -40) p.x = w + 40;
            if (p.x > w + 40) p.x = -40;
          }
        }
        const parallax = scrollY * (0.08 + p.z * 0.42);
        const alpha = Math.max(0, Math.min(0.85, (p.fromTouch ? p.life : 0.35 + (1 - p.z) * 0.45)));
        if (alpha <= 0.02) continue;
        ctx.save();
        ctx.translate(p.x, p.y - parallax);
        ctx.rotate(p.rot);
        drawShape(ctx, p.shape, p.size, p.color, alpha);
        ctx.restore();
      }
      // drop dead touch particles
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].fromTouch && particles[i].life <= 0) particles.splice(i, 1);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      (page || window).removeEventListener('scroll', onScroll);
      page?.removeEventListener('pointerdown', onPointer);
    };
  }, [active, templateId]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="invite-motifs" aria-hidden="true"/>;
}
