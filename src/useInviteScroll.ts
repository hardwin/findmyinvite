import {useEffect, type RefObject} from 'react';
import type Lenis from 'lenis';

/**
 * Boat-style smooth scroll + pinned chapters.
 * Dynamically loads Lenis + GSAP ScrollTrigger (Codrops sync pattern).
 */
export function useInviteScroll(
  enabled: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onProgress?: (progress: number) => void,
) {
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
    let tick: ((time: number) => void) | null = null;
    let removeTicker: (() => void) | null = null;
    const triggers: {kill: () => void}[] = [];
    let onResize: (() => void) | null = null;
    let refreshTimer = 0;

    (async () => {
      const [{default: LenisCtor}, {default: gsap}, {ScrollTrigger}] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled || !rootRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      root.classList.add('invite-scroll-live');
      root.classList.remove('invite-scroll-static');

      lenis = new LenisCtor({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.15,
      });
      lenis.on('scroll', ScrollTrigger.update);

      tick = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      removeTicker = () => {
        if (tick) gsap.ticker.remove(tick);
      };

      const chapters = Array.from(root.querySelectorAll<HTMLElement>('.invite-chapter'));
      chapters.forEach((chapter) => {
        const inner = chapter.querySelector<HTMLElement>('.invite-chapter-inner') || chapter;
        const tween = gsap.fromTo(
          inner,
          {opacity: 0.25, y: 48},
          {
            opacity: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: chapter,
              start: 'top top',
              end: () => '+=' + Math.round(window.innerHeight * 0.95),
              pin: true,
              scrub: 0.65,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          },
        );
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      });

      const progressTrigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => onProgress?.(self.progress),
      });
      triggers.push(progressTrigger);

      onResize = () => ScrollTrigger.refresh();
      window.addEventListener('resize', onResize);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    })().catch(() => {
      root.classList.add('invite-scroll-static');
    });

    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
      if (onResize) window.removeEventListener('resize', onResize);
      removeTicker?.();
      triggers.forEach((t) => t.kill());
      lenis?.destroy();
      root.classList.remove('invite-scroll-live');
      onProgress?.(0);
    };
  }, [enabled, rootRef, onProgress]);
}
