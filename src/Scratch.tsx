import {lazy, Suspense, useCallback, useEffect, useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent} from 'react';
import confetti from 'canvas-confetti';
import {motion, AnimatePresence} from 'motion/react';

const HyperText = lazy(() =>
  import('@/akay/ui/hyper-text').then((m) => ({default: m.HyperText})),
);

const W = 260;
const H = 240;
const REVEAL_RATIO = 0.45;
const STAR_COLORS = ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8', '#FFF8E0'];
const DATE_CHARS = Object.freeze(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,'.split(''),
) as readonly string[];

type Glitter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

type SwiperHost = HTMLElement & {
  swiper?: {allowTouchMove: boolean};
};

/** Remember allowTouchMove so unlock restores the pager’s real state. */
let swiperTouchBeforeLock: boolean | null = null;

function themeColors(root: HTMLElement | null): string[] {
  const page = root?.closest('.invitation-page') as HTMLElement | null;
  const accent =
    (page && getComputedStyle(page).getPropertyValue('--invite-color').trim()) ||
    '#c9a24a';
  return [accent, '#ffffff', '#fff6d8', '#ffe4a0', accent];
}

function lockSwiper(lock: boolean) {
  const host = document.querySelector('.invite-swiper') as SwiperHost | null;
  const s = host?.swiper;
  if (!s) return;
  if (lock) {
    if (swiperTouchBeforeLock == null) swiperTouchBeforeLock = s.allowTouchMove;
    s.allowTouchMove = false;
    return;
  }
  const pager = host?.closest('.invite-pager-live');
  const inviteOpen = pager?.classList.contains('is-enabled');
  const restore =
    swiperTouchBeforeLock != null ? swiperTouchBeforeLock : Boolean(inviteOpen);
  swiperTouchBeforeLock = null;
  s.allowTouchMove = restore;
}

function celebrateReveal(root: HTMLElement | null) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const colors = themeColors(root);
  const rect = root?.getBoundingClientRect();
  const origin = rect
    ? {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height * 0.42) / window.innerHeight,
      }
    : {x: 0.5, y: 0.45};

  const burst = (scalar: number, count: number, shapes: ('star' | 'circle')[]) => {
    confetti({
      particleCount: count,
      spread: 70,
      startVelocity: 28,
      decay: 0.92,
      scalar,
      origin,
      colors: [...STAR_COLORS, ...colors],
      shapes,
      zIndex: 80,
    });
  };
  burst(1.35, 55, ['star']);
  burst(0.85, 28, ['circle']);
  setTimeout(() => burst(1.1, 36, ['star']), 120);
  setTimeout(() => burst(0.7, 18, ['circle']), 220);

  const end = Date.now() + 1_600;
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 48,
      origin: {x: 0.08, y: origin.y},
      colors,
      zIndex: 80,
      scalar: 0.9,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 48,
      origin: {x: 0.92, y: origin.y},
      colors,
      zIndex: 80,
      scalar: 0.9,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  try {
    navigator.vibrate?.(18);
  } catch {
    /* ignore */
  }
}

function paintFoil(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#8a6420');
  g.addColorStop(0.22, '#c9a24a');
  g.addColorStop(0.48, '#f0d78a');
  g.addColorStop(0.72, '#d4b05c');
  g.addColorStop(1, '#7a5818');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Fine foil grain (Nicolas-style metal texture).
  const grain = ctx.getImageData(0, 0, W, H);
  const d = grain.data;
  for (let i = 0; i < d.length; i += 16) {
    const n = (Math.random() - 0.5) * 28;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n * 0.92));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.7));
  }
  ctx.putImageData(grain, 0, 0);

  // Soft baked highlight band (live sweep is CSS).
  const shine = ctx.createLinearGradient(W * 0.15, 0, W * 0.7, H);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.48, 'rgba(255,248,220,0.28)');
  shine.addColorStop(0.52, 'rgba(255,255,255,0.42)');
  shine.addColorStop(0.56, 'rgba(255,248,220,0.22)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(70,42,12,0.82)';
  ctx.font = '600 17px Georgia, serif';
  ctx.fillText('Scratch our forever', W / 2, H / 2 - 10);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = 'rgba(90,55,18,0.72)';
  ctx.fillText('peel the foil · reveal the day', W / 2, H / 2 + 16);
}

function sprayErase(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
  const n = 18 + Math.floor(Math.random() * 10);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 22;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    const s = 1.2 + Math.random() * 3.2;
    ctx.beginPath();
    ctx.arc(px, py, s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function clearedRatio(ctx: CanvasRenderingContext2D): number {
  const data = ctx.getImageData(0, 0, W, H).data;
  let clear = 0;
  let total = 0;
  const step = 4 * 6;
  for (let i = 3; i < data.length; i += step) {
    total++;
    if (data[i] < 24) clear++;
  }
  return total ? clear / total : 0;
}

export function Scratch({
  date,
  time,
  forceRevealed = false,
}: {
  date: string;
  time: string;
  /** Export / walkthrough capture — date already scratched. */
  forceRevealed?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glitterRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const celebrated = useRef(false);
  const glitter = useRef<Glitter[]>([]);
  const raf = useRef(0);
  const idleDust = useRef(0);
  const [revealed, setRevealed] = useState(forceRevealed);

  useEffect(() => {
    if (forceRevealed) setRevealed(true);
  }, [forceRevealed]);

  const dateLabel = new Date(date + 'T12:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const weekday = new Date(date + 'T12:00').toLocaleDateString('en-US', {
    weekday: 'long',
  });
  const reduceMotion =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rebuildFoil = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', {willReadFrequently: true});
    if (!canvas || !ctx) return;
    paintFoil(ctx);
  }, []);

  const spawnGlitter = (x: number, y: number, count = 5) => {
    if (reduceMotion) return;
    const colors = ['#fff6d8', '#ffd76a', '#c9a24a', '#ffe9a8', '#ffffff'];
    for (let i = 0; i < count; i++) {
      glitter.current.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2.4,
        vy: -0.6 - Math.random() * 2.2,
        life: 1,
        size: 1.2 + Math.random() * 2.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    if (glitter.current.length > 80) {
      glitter.current.splice(0, glitter.current.length - 80);
    }
  };

  const triggerReveal = useCallback(() => {
    if (revealed) return;
    lockSwiper(false);
    setRevealed(true);
  }, [revealed]);

  useEffect(() => {
    if (revealed) return;
    rebuildFoil();

    const tick = () => {
      idleDust.current += 1;
      if (!dragging.current && idleDust.current % 18 === 0 && !reduceMotion) {
        spawnGlitter(
          W * (0.28 + Math.random() * 0.44),
          H * (0.28 + Math.random() * 0.4),
          1,
        );
      }

      const gCanvas = glitterRef.current;
      const gctx = gCanvas?.getContext('2d');
      if (gctx && gCanvas) {
        gctx.clearRect(0, 0, W, H);
        const next: Glitter[] = [];
        for (const p of glitter.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.06;
          p.life -= 0.028;
          if (p.life <= 0) continue;
          gctx.globalAlpha = Math.max(0, p.life);
          gctx.fillStyle = p.color;
          gctx.beginPath();
          gctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          gctx.fill();
          gctx.strokeStyle = p.color;
          gctx.lineWidth = 0.8;
          gctx.beginPath();
          gctx.moveTo(p.x - p.size * 1.6, p.y);
          gctx.lineTo(p.x + p.size * 1.6, p.y);
          gctx.moveTo(p.x, p.y - p.size * 1.6);
          gctx.lineTo(p.x, p.y + p.size * 1.6);
          gctx.stroke();
          next.push(p);
        }
        glitter.current = next;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idle trail only while foil lives
  }, [revealed, rebuildFoil, reduceMotion]);

  useEffect(() => {
    if (!revealed || celebrated.current) return;
    celebrated.current = true;
    celebrateReveal(wrapRef.current);
  }, [revealed]);

  const scratchAt = (clientX: number, clientY: number, target: HTMLCanvasElement) => {
    const ctx = target.getContext('2d', {willReadFrequently: true});
    if (!ctx) return;
    const rect = target.getBoundingClientRect();
    const x = ((clientX - rect.left) * W) / rect.width;
    const y = ((clientY - rect.top) * H) / rect.height;
    sprayErase(ctx, x, y);
    spawnGlitter(x, y);
    if (clearedRatio(ctx) >= REVEAL_RATIO) triggerReveal();
  };

  const endScratch = (e?: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) {
      lockSwiper(false);
      return;
    }
    dragging.current = false;
    lockSwiper(false);
    e?.stopPropagation();
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    lockSwiper(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
    scratchAt(e.clientX, e.clientY, e.currentTarget);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    e.stopPropagation();
    scratchAt(e.clientX, e.clientY, e.currentTarget);
  };

  // Trap touch only while the finger is scratching — idle pending hearts
  // must let the pager see the swipe so the leave-nudge gate can run.
  const blockTouch = (e: ReactTouchEvent) => {
    if (revealed || !dragging.current) return;
    e.stopPropagation();
  };

  return (
    <div
      className={'scratch-heart' + (revealed ? ' is-revealed' : '')}
      ref={wrapRef}
      data-scratch={revealed ? 'done' : 'pending'}
      onTouchStart={blockTouch}
      onTouchMove={blockTouch}
      onTouchEnd={blockTouch}
    >
      <div className="scratch-glow" aria-hidden="true" />
      <div className="scratch-date" aria-live="polite" aria-hidden={!revealed}>
        <motion.em
          initial={reduceMotion ? false : {opacity: 0, y: 8}}
          animate={revealed ? {opacity: 1, y: 0} : {opacity: 0.35, y: 0}}
          transition={{type: 'spring', stiffness: 260, damping: 22, delay: 0.05}}
        >
          You’re Invited!
        </motion.em>
        {revealed && !reduceMotion ? (
          <Suspense fallback={<strong>{dateLabel}</strong>}>
            <HyperText
              as="span"
              className="scratch-hyper-date"
              duration={1100}
              delay={180}
              animateOnHover={false}
              characterSet={DATE_CHARS}
            >
              {dateLabel}
            </HyperText>
          </Suspense>
        ) : (
          <strong className="scratch-hyper-date">{dateLabel}</strong>
        )}
        <motion.span
          initial={false}
          animate={revealed ? {opacity: 1} : {opacity: 0.4}}
          transition={{delay: 0.35}}
        >
          {weekday}
        </motion.span>
        <motion.small
          initial={false}
          animate={revealed ? {opacity: 1} : {opacity: 0.4}}
          transition={{delay: 0.45}}
        >
          {time}
        </motion.small>
      </div>

      <AnimatePresence>
        {!revealed && (
          <motion.div
            className="scratch-foil-layer"
            key="foil"
            initial={{opacity: 1, scale: 1, filter: 'blur(0px)'}}
            exit={
              reduceMotion
                ? {opacity: 0, transition: {duration: 0.01}}
                : {
                    opacity: 0,
                    scale: 1.08,
                    filter: 'blur(6px)',
                    transition: {type: 'spring', stiffness: 220, damping: 20},
                  }
            }
          >
            <div className="scratch-foil-shine" aria-hidden="true" />
            <canvas
              ref={canvasRef}
              className="scratch-foil"
              width={W}
              height={H}
              role="button"
              tabIndex={0}
              aria-label="Scratch to reveal the event date"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerReveal();
                }
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endScratch}
              onPointerCancel={endScratch}
              onLostPointerCapture={() => endScratch()}
            />
            <canvas
              ref={glitterRef}
              className="scratch-glitter"
              width={W}
              height={H}
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
