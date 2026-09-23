import {useEffect, useRef, useState} from 'react';
import type {PointerEvent} from 'react';
import confetti from 'canvas-confetti';

const STAR_COLORS = ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'];

function themeCannonColors(root: HTMLElement | null): string[] {
  const page = root?.closest('.invitation-page') as HTMLElement | null;
  const accent =
    (page && getComputedStyle(page).getPropertyValue('--invite-color').trim()) ||
    '#c9a24a';
  // Theme accent + paper highlights (side-cannon pair like the Buckeyes recipe)
  return [accent, '#ffffff', '#fff6d8', accent];
}

/** Side cannons (theme colors) + star/circle bursts on reveal. */
function celebrateReveal(root: HTMLElement | null) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const colors = themeCannonColors(root);
  const end = Date.now() + 15_000;

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: {x: 0},
      colors,
      zIndex: 80,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: {x: 1},
      colors,
      zIndex: 80,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  const defaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: STAR_COLORS,
    zIndex: 80,
  };

  const shoot = () => {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['star'],
    });
    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ['circle'],
    });
  };

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

export function Scratch({date, time}: {date: string; time: string}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const cells = useRef(new Set<string>());
  const celebrated = useRef(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 260, 240);
    gradient.addColorStop(0, '#c69b57');
    gradient.addColorStop(0.45, '#efd493');
    gradient.addColorStop(1, '#ac7d3c');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 260, 240);
    context.textAlign = 'center';
    context.fillStyle = '#75562d';
    context.font = '18px Georgia';
    context.fillText('Scratch to reveal', 130, 116);
    context.font = '13px Georgia';
    context.fillText('our special day', 130, 139);
  }, []);

  useEffect(() => {
    if (!revealed || celebrated.current) return;
    celebrated.current = true;
    celebrateReveal(wrap.current);
  }, [revealed]);

  const scratch = (event: PointerEvent<HTMLCanvasElement>) => {
    const c = event.currentTarget;
    const context = c.getContext('2d');
    if (!context) return;
    const rect = c.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * 260) / rect.width;
    const y = ((event.clientY - rect.top) * 240) / rect.height;
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(x, y, 24, 0, Math.PI * 2);
    context.fill();
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        cells.current.add(`${Math.floor(x / 20) + dx},${Math.floor(y / 20) + dy}`);
    if (cells.current.size > 65) setRevealed(true);
  };

  return (
    <div className="scratch-heart" ref={wrap}>
      <div className="scratch-date" aria-live="polite" aria-hidden={!revealed}>
        <em>You’re Invited!</em>
        <strong>
          {new Date(date + 'T12:00').toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </strong>
        <span>
          {new Date(date + 'T12:00').toLocaleDateString('en-US', {weekday: 'long'})}
        </span>
        <small>{time}</small>
      </div>
      {!revealed && (
        <canvas
          ref={canvas}
          width={260}
          height={240}
          role="button"
          tabIndex={0}
          aria-label="Scratch to reveal the event date"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setRevealed(true);
            }
          }}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            scratch(e);
          }}
          onPointerMove={(e) => {
            if (dragging.current) scratch(e);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
        />
      )}
    </div>
  );
}
