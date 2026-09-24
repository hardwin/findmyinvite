import {useCallback, useEffect, useRef, useState} from 'react';
import {motion} from 'motion/react';
import MomentsRibbon from './moments/MomentsRibbon';

type Props = {
  photos: string[];
  title?: string;
  kicker?: string;
  line?: string;
  username?: string;
};

const EDGE_PX = 56;
const SCRUB_PX = 200;

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function emitEdge(dir: 'next' | 'prev') {
  window.dispatchEvent(new CustomEvent('invite-moments-edge', {detail: {dir}}));
}

/**
 * Our Moments: cream stage, invite copy top/bottom, Instagram 1:1 carousel.
 * Forward: scrub photos, leave only after last + edge.
 * Reverse (toward top): emitEdge('prev') immediately — no photo walk-back.
 */
export default function MomentsWall({
  photos,
  title = 'Our Moments',
  kicker = 'A love story in frames',
  line = 'Every glance, every vow, every quiet forever — held in light.',
  username = 'our.moments',
}: Props) {
  const n = photos.length;
  const rootRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    index: number;
    pointerId: number;
    edge: number;
    axis: 'x' | 'y' | null;
    reverse: boolean;
  } | null>(null);
  const indexRef = useRef(0);
  const reducedRef = useRef(prefersReducedMotion());
  const [reduced, setReduced] = useState(reducedRef.current);
  const [index, setIndex] = useState(0);

  indexRef.current = index;

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
    };
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (!reduced || n <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % n), 4500);
    return () => window.clearInterval(id);
  }, [reduced, n]);

  const clampIndex = useCallback((i: number) => Math.max(0, Math.min(n - 1, i)), [n]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedRef.current || n <= 0) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement | null)?.closest?.('button, .swiper-pagination')) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      index: indexRef.current,
      pointerId: e.pointerId,
      edge: 0,
      axis: null,
      reverse: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - drag.x;
    const dy = drag.y - e.clientY; // up = positive (forward / next photo)

    if (!drag.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      drag.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }

    // Reverse toward top: finger down (dy < 0) or finger left (dx < 0).
    // Leave Moments immediately — do not walk photos backward.
    const reverse = drag.axis === 'y' ? dy < 0 : dx < 0;
    if (reverse) {
      drag.reverse = true;
      const amount = drag.axis === 'y' ? -dy : -dx;
      drag.edge = -amount;
      if (amount >= EDGE_PX * 0.35) {
        dragRef.current = null;
        try {
          e.currentTarget.releasePointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
        emitEdge('prev');
      }
      return;
    }

    drag.reverse = false;
    // Forward only: scrub photos; accumulate edge past last.
    const delta = (drag.axis === 'x' ? dx : dy) / SCRUB_PX;
    let next = drag.index + delta;
    let edge = 0;
    if (next < 0) {
      next = 0;
    } else if (next > n - 1) {
      edge = (next - (n - 1)) * SCRUB_PX;
      next = n - 1;
    }
    drag.edge = edge;
    setIndex(clampIndex(Math.round(next)));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (drag.reverse && drag.edge <= -EDGE_PX * 0.35) {
      emitEdge('prev');
      return;
    }
    const i = indexRef.current;
    if (drag.edge >= EDGE_PX && i >= n - 1) {
      emitEdge('next');
    }
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced || n <= 0) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dy = e.deltaY;
      const dx = e.deltaX;
      const dominant = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      const forward = dominant === 'x' ? dx > 0 : dy > 0;
      const delta = dominant === 'x' ? dx : dy;

      // Reverse toward top → leave section immediately (any photo index).
      if (!forward) {
        if (delta < -EDGE_PX * 0.35) emitEdge('prev');
        return;
      }

      const i = indexRef.current;
      if (i >= n - 1) {
        if (delta > EDGE_PX * 0.35) emitEdge('next');
        return;
      }
      if (Math.abs(delta) < 8) return;
      setIndex((cur) => clampIndex(cur + 1));
    };
    el.addEventListener('wheel', onWheel, {passive: false});
    return () => el.removeEventListener('wheel', onWheel);
  }, [reduced, n, clampIndex]);

  if (!n) return null;

  const hint =
    index >= n - 1
      ? 'Last photo · pull up for next section'
      : 'Swipe right or up for next photo';

  return (
    <section
      ref={rootRef}
      data-section="gallery"
      className="invite-section invite-chapter moments-wall-chapter reveal invite-no-swipe"
      aria-roledescription="photo carousel"
      aria-label={title}
    >
      <div
        className="moments-wall invite-no-swipe"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <motion.header
          className="moments-copy moments-copy--top"
          initial={reduced ? false : {opacity: 0, y: 14}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.55, ease: [0.22, 1, 0.36, 1]}}
        >
          <p className="moments-kicker">{kicker}</p>
          <h2 className="moments-title">{title}</h2>
          <div className="moments-divider" aria-hidden="true">
            <i />
            <span />
            <i />
          </div>
        </motion.header>

        <div className="moments-stage">
          <MomentsRibbon
            photos={photos}
            index={index}
            onIndexChange={setIndex}
            username={username}
            caption={line}
            reduced={reduced}
          />
        </div>

        <motion.footer
          className="moments-copy moments-copy--bottom"
          initial={reduced ? false : {opacity: 0, y: 12}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1]}}
        >
          <p className="moments-line">{line}</p>
          <p className="moments-hint" aria-hidden="true">
            {hint}
          </p>
        </motion.footer>
      </div>
    </section>
  );
}
