import {useEffect, type RefObject} from 'react';
import type Lenis from 'lenis';
import type Snap from 'lenis/snap';

/** Warm Lenis + Snap while opening / hero videos play. */
export function preloadInviteScroll() {
  return Promise.all([import('lenis'), import('lenis/snap')]);
}

/**
 * Physics-smooth section scroll (Lenis + mandatory Snap).
 * One flick → one full-viewport chapter. No GSAP pins (those stuck mid-section).
 * WebGL depth stage removed — it sat on the hero and made scroll gritty.
 */
export function useInviteScroll(
  enabled: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onProgress?: (progress: number) => void,
  preload = false,
) {
  useEffect(() => {
    if (!preload && !enabled) return;
    void preloadInviteScroll();
  }, [preload, enabled]);

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;

    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('invite-scroll-static');
      root.classList.remove('invite-scroll-live');
      return;
    }

    let cancelled = false;
    let lenis: Lenis | null = null;
    let snap: Snap | null = null;
    let rafId = 0;
    let onResize: (() => void) | null = null;
    let refreshTimer = 0;
    const page = root.closest('.invitation-page') as HTMLElement | null;
    const html = document.documentElement;
    const prevScrollBehavior = html.style.scrollBehavior;

    (async () => {
      const [{default: LenisCtor}, {default: SnapCtor}] = await preloadInviteScroll();
      if (cancelled || !rootRef.current) return;

      root.classList.add('invite-scroll-live');
      root.classList.remove('invite-scroll-static');
      html.style.scrollBehavior = 'auto';
      page?.classList.add('invite-snap-page');

      lenis = new LenisCtor({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.05,
        syncTouch: false,
        wheelMultiplier: 0.9,
      });

      snap = new SnapCtor(lenis, {
        type: 'mandatory',
        duration: 0.95,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        debounce: 40,
      });

      const hero = page?.querySelector<HTMLElement>('.invitation-hero');
      const chapters = Array.from(root.querySelectorAll<HTMLElement>('.invite-chapter'));
      const snapTargets = [hero, ...chapters].filter((el): el is HTMLElement => Boolean(el));
      snap.addElements(snapTargets, {align: 'start'});

      const onScroll = () => {
        if (!onProgress || !lenis) return;
        const limit = lenis.limit || 1;
        onProgress(limit > 0 ? lenis.scroll / limit : 0);
      };
      lenis.on('scroll', onScroll);

      const tick = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      onResize = () => {
        snap?.resize();
      };
      window.addEventListener('resize', onResize);
      refreshTimer = window.setTimeout(() => snap?.resize(), 350);
    })().catch(() => {
      root.classList.add('invite-scroll-static');
    });

    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
      if (onResize) window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      snap?.destroy();
      lenis?.destroy();
      html.style.scrollBehavior = prevScrollBehavior;
      page?.classList.remove('invite-snap-page');
      root.classList.remove('invite-scroll-live');
      onProgress?.(0);
    };
  }, [enabled, rootRef, onProgress]);
}
