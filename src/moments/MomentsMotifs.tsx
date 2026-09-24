import {useEffect, useMemo, useRef, useState} from 'react';
import {MOTIF_SVG, type MotifShape} from '../motif-kits';

export type Anchor = {x: number; y: number};

type Props = {
  active: boolean;
  stop: number;
  anchors: Anchor[];
  colors: string[];
  shapes: MotifShape[];
  accent: string;
};

type Particle = {
  id: number;
  kind: 'heart' | MotifShape;
  color: string;
  left: number;
  top: number;
  size: number;
  dx: number;
  dy: number;
  rot: number;
  delay: number;
  duration: number;
  src?: string;
};

const tintCache = new Map<string, string>();

async function tintedMotifUrl(shape: MotifShape, color: string): Promise<string | null> {
  const key = shape + '|' + color;
  const hit = tintCache.get(key);
  if (hit) return hit;
  try {
    const file = MOTIF_SVG[shape];
    const res = await fetch('/assets/motifs/' + file + '.svg');
    if (!res.ok) return null;
    let svg = await res.text();
    svg = svg
      .replaceAll('stroke="#000"', `stroke="${color}"`)
      .replaceAll('fill="#000"', `fill="${color}"`)
      .replaceAll("stroke='#000'", `stroke='${color}'`)
      .replaceAll("fill='#000'", `fill='${color}'`);
    const blob = new Blob([svg], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    tintCache.set(key, url);
    return url;
  } catch {
    return null;
  }
}

function palette(colors: string[], accent: string): string[] {
  const base = colors.length ? colors : [accent, '#e0b85c', '#c45a7a', '#8fad8a'];
  return [...new Set([accent, ...base].map((c) => c.trim()).filter(Boolean))].slice(0, 6);
}

/**
 * Heart + theme motifs that chain-pop from behind photo hearts,
 * colored from the invitation theme palette.
 */
export default function MomentsMotifs({
  active,
  stop,
  anchors,
  colors,
  shapes,
  accent,
}: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const urlsRef = useRef<Map<string, string>>(new Map());
  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const colorList = useMemo(() => palette(colors, accent), [colors, accent]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const shape of shapes) {
        for (const color of colorList) {
          const url = await tintedMotifUrl(shape, color);
          if (cancelled || !url) continue;
          urlsRef.current.set(shape + '|' + color, url);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shapes, colorList]);

  useEffect(() => {
    if (!active || reduced || !anchors.length) {
      setParticles([]);
      return;
    }

    let alive = true;
    const timers: number[] = [];

    const spawnBurst = (anchorIndex: number, wave: number) => {
      const anchor = anchors[anchorIndex % anchors.length];
      if (!anchor) return;
      const batch: Particle[] = [];
      const count = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const color = colorList[(stop + wave + i) % colorList.length];
        const useHeart = i % 3 === 0 || Math.random() < 0.4;
        const shape = shapes[(stop + i) % Math.max(shapes.length, 1)] || 'foil';
        const key = shape + '|' + color;
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.45;
        const dist = 30 + Math.random() * 58;
        batch.push({
          id: ++idRef.current,
          kind: useHeart ? 'heart' : shape,
          color,
          left: anchor.x,
          top: anchor.y,
          size: useHeart ? 11 + Math.random() * 16 : 14 + Math.random() * 22,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 14 - Math.random() * 22,
          rot: (Math.random() - 0.5) * 52,
          delay: wave * 0.14 + i * 0.055,
          duration: 1.7 + Math.random() * 1.1,
          src: useHeart ? undefined : urlsRef.current.get(key),
        });
      }
      if (!alive) return;
      setParticles((prev) => [...prev.slice(-48), ...batch]);
      const clearAfter = (batch[batch.length - 1].delay + batch[batch.length - 1].duration + 0.2) * 1000;
      timers.push(
        window.setTimeout(() => {
          if (!alive) return;
          const ids = new Set(batch.map((p) => p.id));
          setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
        }, clearAfter),
      );
    };

    // Chain reaction: each heart pops motifs in sequence
    anchors.forEach((_, i) => {
      timers.push(window.setTimeout(() => spawnBurst(i, i), 160 + i * 340));
    });

    const loop = window.setInterval(() => {
      const i = Math.floor(Math.random() * anchors.length);
      spawnBurst(i, Math.floor(Math.random() * 3));
    }, 2100);
    timers.push(loop);

    return () => {
      alive = false;
      timers.forEach((t) => {
        window.clearTimeout(t);
        window.clearInterval(t);
      });
    };
  }, [active, stop, anchors, colorList, shapes, reduced]);

  if (!active || reduced) return null;

  return (
    <div className="moments-motifs" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className={'moments-motif' + (p.kind === 'heart' ? ' is-heart' : ' is-svg')}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            color: p.color,
            ['--mx' as string]: `${p.dx}px`,
            ['--my' as string]: `${p.dy}px`,
            ['--mrot' as string]: `${p.rot}deg`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.kind === 'heart' || !p.src ? (
            <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          ) : (
            <img src={p.src} alt="" draggable={false} />
          )}
        </span>
      ))}
    </div>
  );
}
