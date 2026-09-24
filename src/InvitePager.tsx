import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from 'react';
import {Swiper, SwiperSlide} from 'swiper/react';
import {Mousewheel} from 'swiper/modules';
import type {Swiper as SwiperInstance} from 'swiper';
import 'swiper/css';

type Props = {
  /** When true, swipes are allowed. Pager stays mounted so hero video is not remounted. */
  enabled: boolean;
  children: ReactNode;
};

function readViewportHeight() {
  const vv = window.visualViewport;
  return Math.round(vv?.height ?? window.innerHeight);
}

/** Skip empty / anchor-only nodes so they never become blank slides. */
function isSlideChild(child: ReactNode) {
  if (child == null || child === false || child === true) return false;
  if (typeof child === 'string' || typeof child === 'number') return String(child).trim().length > 0;
  if (!isValidElement(child)) return false;
  const t = child.type;
  if (t === 'div') {
    const props = child.props as {id?: string; className?: string; children?: ReactNode};
    if (props.id === 'invitation-details') return false;
    const hasKids = Children.count(props.children) > 0;
    if (!hasKids && !props.className) return false;
  }
  return true;
}

/** Keep inner RSVP/timeline scroll from fighting the pager until the edge. */
function wireNestedScroll(root: HTMLElement | null) {
  if (!root) return () => {};
  let startY = 0;
  let startScroll = 0;
  let target: HTMLElement | null = null;

  const onStart = (e: TouchEvent) => {
    const el = (e.target as HTMLElement | null)?.closest('.invite-slide-scroll') as HTMLElement | null;
    target = el;
    if (!el) return;
    startY = e.touches[0]?.clientY ?? 0;
    startScroll = el.scrollTop;
  };
  const onMove = (e: TouchEvent) => {
    const el = target;
    // Sub-pixel overflow on hero/short slides must not steal the pager swipe.
    if (!el || el.scrollHeight <= el.clientHeight + 8) return;
    // Hero is always pager-owned — never nest-scroll it.
    if (el.querySelector('.invitation-hero')) return;
    // Moments wall owns vertical scrub — never nest-scroll that slide.
    if ((e.target as HTMLElement | null)?.closest?.('.moments-wall, .moments-wall-chapter')) {
      e.stopPropagation();
      return;
    }

    // Active scratch brush owns the gesture — revealed / idle hearts do not.
    const scratch = (e.target as HTMLElement | null)?.closest?.('.scratch-heart') as HTMLElement | null;
    if (scratch && !scratch.classList.contains('is-revealed')) {
      // Only steal while foil canvas is being brushed (pointer capture path);
      // otherwise let the leave-nudge / pager handle the swipe.
      const foil = (e.target as HTMLElement | null)?.closest?.('.scratch-foil, .scratch-foil-layer');
      if (foil) {
        e.stopPropagation();
        return;
      }
    }
    const y = e.touches[0]?.clientY ?? 0;
    const dy = y - startY;
    const atTop = startScroll <= 0;
    const atBottom = startScroll + el.clientHeight >= el.scrollHeight - 1;
    const keepInner =
      (!atTop && !atBottom) || (atTop && dy < 0) || (atBottom && dy > 0);
    if (keepInner) e.stopPropagation();
  };
  const onEnd = () => {
    target = null;
  };

  root.addEventListener('touchstart', onStart, {passive: true, capture: true});
  root.addEventListener('touchmove', onMove, {passive: true, capture: true});
  root.addEventListener('touchend', onEnd, {passive: true, capture: true});
  root.addEventListener('touchcancel', onEnd, {passive: true, capture: true});

  return () => {
    root.removeEventListener('touchstart', onStart, true);
    root.removeEventListener('touchmove', onMove, true);
    root.removeEventListener('touchend', onEnd, true);
    root.removeEventListener('touchcancel', onEnd, true);
  };
}

/**
 * TikTok-style vertical invite pager (Swiper).
 * - One intentional swipe (short or long) → exactly one slide
 * - Never deny / reverse a directional flick past threshold
 * - Height locked to visualViewport so mobile URL bar cannot peek the next slide
 * - While locked (opening video), all swipe / wheel / nested scroll is blocked
 */
export default function InvitePager({enabled, children}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const transitioning = useRef(false);
  const touching = useRef(false);
  const frozenHeight = useRef<number | null>(null);
  const prevSlide = useRef(0);
  const [height, setHeight] = useState(() =>
    typeof window === 'undefined' ? 0 : readViewportHeight(),
  );
  const [reduced] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const applyHeight = useCallback((px: number, force = false) => {
    if (!force && touching.current && frozenHeight.current != null) {
      px = frozenHeight.current;
    }
    setHeight(px);
    const root = rootRef.current;
    if (root) root.style.setProperty('--invite-vvh', `${px}px`);
    document.documentElement.style.setProperty('--invite-vvh', `${px}px`);
  }, []);

  const remasure = useCallback(() => {
    if (touching.current && frozenHeight.current != null) return;
    applyHeight(readViewportHeight());
    const s = swiperRef.current;
    if (s) {
      s.update();
      s.slideTo(s.activeIndex, 0, false);
    }
  }, [applyHeight]);

  useEffect(() => {
    if (reduced) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    // Always lock document while the immersive pager is mounted (open or closed).
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    applyHeight(readViewportHeight(), true);

    const vv = window.visualViewport;
    const onVv = () => remasure();
    vv?.addEventListener('resize', onVv);
    vv?.addEventListener('scroll', onVv);
    window.addEventListener('resize', onVv);
    window.addEventListener('orientationchange', onVv);
    const unwire = wireNestedScroll(rootRef.current);

    // Hard-block touch / wheel when opening video is playing (enabled=false).
    const blockGesture = (e: Event) => {
      if (enabled) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const root = rootRef.current;
    root?.addEventListener('touchmove', blockGesture, {passive: false, capture: true});
    root?.addEventListener('wheel', blockGesture, {passive: false, capture: true});

    return () => {
      vv?.removeEventListener('resize', onVv);
      vv?.removeEventListener('scroll', onVv);
      window.removeEventListener('resize', onVv);
      window.removeEventListener('orientationchange', onVv);
      unwire();
      root?.removeEventListener('touchmove', blockGesture, true);
      root?.removeEventListener('wheel', blockGesture, true);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.removeProperty('--invite-vvh');
      frozenHeight.current = null;
    };
  }, [enabled, reduced, applyHeight, remasure]);

  useEffect(() => {
    const s = swiperRef.current;
    if (!s) return;
    s.allowTouchMove = enabled;
    s.allowSlideNext = enabled;
    s.allowSlidePrev = enabled;
    // Force-sync params — React props alone often stay stale after a locked mount.
    if (s.params) {
      s.params.touchRatio = enabled ? 1 : 0;
      s.params.followFinger = enabled;
      s.params.resistanceRatio = enabled ? 0.65 : 0;
    }
    if (!enabled) {
      s.slideTo(0, 0, false);
      // Kill any in-flight free drag / momentum.
      s.setTranslate(0);
    } else {
      // Re-arm swipe as soon as hero lands (skip or full opening).
      s.setTranslate(s.getTranslate());
    }
    s.update();
  }, [enabled]);

  useEffect(() => {
    const onEdge = (e: Event) => {
      if (!enabled) return;
      const dir = (e as CustomEvent<{dir?: string}>).detail?.dir;
      const s = swiperRef.current;
      if (!s || transitioning.current) return;
      if (dir === 'next') s.slideNext(420);
      else if (dir === 'prev') s.slidePrev(260);
    };
    window.addEventListener('invite-moments-edge', onEdge);
    return () => window.removeEventListener('invite-moments-edge', onEdge);
  }, [enabled]);

  const slides = Children.toArray(children).filter(isSlideChild);

  if (reduced) {
    return <div className="invite-pager invite-pager-static">{children}</div>;
  }

  const style = {
    height: height ? `${height}px` : '100dvh',
    '--invite-vvh': height ? `${height}px` : '100dvh',
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={'invite-pager invite-pager-live' + (enabled ? ' is-enabled' : ' is-locked')}
      style={style}
    >
      <Swiper
        modules={[Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        spaceBetween={0}
        speed={420}
        shortSwipes
        longSwipes
        longSwipesRatio={0.15}
        longSwipesMs={300}
        threshold={6}
        followFinger={enabled}
        resistanceRatio={enabled ? 0.65 : 0}
        touchRatio={enabled ? 1 : 0}
        slidesPerGroup={1}
        freeMode={false}
        allowTouchMove={enabled}
        noSwiping
        noSwipingClass="invite-no-swipe"
        nested={false}
        cssMode={false}
        observer
        observeParents
        watchOverflow
        mousewheel={
          enabled
            ? {
                forceToAxis: true,
                sensitivity: 1,
                releaseOnEdges: false,
                thresholdDelta: 20,
                thresholdTime: 400,
              }
            : false
        }
        className="invite-swiper"
        style={{height: '100%', width: '100%'}}
        onSwiper={(s) => {
          swiperRef.current = s;
          s.allowTouchMove = enabled;
          s.allowSlideNext = enabled;
          s.allowSlidePrev = enabled;
          if (s.params) {
            s.params.touchRatio = enabled ? 1 : 0;
            s.params.followFinger = enabled;
            s.params.resistanceRatio = enabled ? 0.65 : 0;
          }
          s.update();
        }}
        onTouchStart={() => {
          if (!enabled) return;
          touching.current = true;
          frozenHeight.current = readViewportHeight();
          applyHeight(frozenHeight.current, true);
        }}
        onTouchEnd={() => {
          touching.current = false;
          frozenHeight.current = null;
          requestAnimationFrame(() => remasure());
        }}
        onSlideResetTransitionStart={(s) => {
          if (!enabled || transitioning.current) return;
          const diff = s.touches.diff;
          if (Math.abs(diff) <= 6) return;
          transitioning.current = true;
          if (diff < 0) s.slideNext(420);
          else s.slidePrev(260);
        }}
        onSlideChangeTransitionStart={(s) => {
          transitioning.current = true;
          const from = prevSlide.current;
          const to = s.activeIndex;

          // Incomplete scratch: first leave attempt → bounce + pulse; second → allow.
          // Only gate when going deeper (to > from). Reverse toward top is free.
          if (to > from) {
            const fromEl = s.slides[from] as HTMLElement | undefined;
            const heart = fromEl?.querySelector?.('.scratch-heart') as HTMLElement | null;
            if (
              heart &&
              !heart.classList.contains('is-revealed') &&
              !heart.classList.contains('is-bypass')
            ) {
              if (!heart.classList.contains('is-nudged')) {
                heart.classList.add('is-nudged');
                heart.classList.remove('is-attention');
                // Retrigger CSS pulse.
                void heart.offsetWidth;
                heart.classList.add('is-attention');
                window.setTimeout(() => heart.classList.remove('is-attention'), 1200);
                s.slideTo(from, 320);
                prevSlide.current = from;
                return;
              }
              heart.classList.add('is-bypass');
            }
          }

          // Motif parallax: surge along swipe, then settle into L→R wind.
          const raw = s.touches?.diff;
          const dy =
            typeof raw === 'number' && Math.abs(raw) > 1
              ? raw * 2.2
              : from < to
                ? -420
                : 420;
          prevSlide.current = to;
          rootRef.current?.dispatchEvent(
            new CustomEvent('invite-swipe', {bubbles: true, detail: {dy, dx: 0}}),
          );
        }}
        onSlideChangeTransitionEnd={() => {
          transitioning.current = false;
        }}
        onTransitionStart={() => {
          transitioning.current = true;
        }}
        onTransitionEnd={() => {
          transitioning.current = false;
        }}
      >
        {slides.map((child, i) => (
          <SwiperSlide key={i} className="invite-slide">
            <div className="invite-slide-shell">
              <div className={'invite-slide-scroll' + (enabled ? '' : ' is-scroll-locked')}>
                {child}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
