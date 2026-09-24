import {useEffect, useMemo, useRef, useState} from 'react';
import {Swiper, SwiperSlide} from 'swiper/react';
import {Navigation, Pagination} from 'swiper/modules';
import type {Swiper as SwiperInstance} from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import {motifKitFor, type MotifShape} from '../motif-kits';
import InstagramPostFrame from './InstagramPostFrame';
import MomentsMotifs from './MomentsMotifs';

type Props = {
  photos: string[];
  index: number;
  onIndexChange: (i: number) => void;
  username?: string;
  caption?: string;
  reduced?: boolean;
};

function readTheme(): {templateId: string; accent: string} {
  if (typeof document === 'undefined') return {templateId: '', accent: '#c9a24a'};
  const page =
    document.querySelector('.invitation-page') ||
    document.querySelector('[class*="theme-"]');
  const cs = page ? getComputedStyle(page) : null;
  const accent = cs?.getPropertyValue('--invite-color').trim() || '#c9a24a';
  const themeClass = [...(page?.classList || [])].find((c) => c.startsWith('theme-'));
  const templateId = themeClass ? themeClass.slice('theme-'.length) : '';
  return {templateId, accent};
}

/**
 * Instagram-framed 1:1 photo carousel — dots, side arrows, “Swipe right” hint.
 * Gestures are owned by MomentsWall; Swiper stays in sync via index.
 */
export default function MomentsRibbon({
  photos,
  index,
  onIndexChange,
  username = 'our.moments',
  caption,
  reduced = false,
}: Props) {
  const n = photos.length;
  const swiperRef = useRef<SwiperInstance | null>(null);
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    setTheme(readTheme());
  }, [index]);

  useEffect(() => {
    const s = swiperRef.current;
    if (!s || s.destroyed) return;
    if (s.activeIndex !== index) s.slideTo(index, 280);
  }, [index]);

  const kit = useMemo(
    () => motifKitFor(theme.templateId, theme.accent),
    [theme.templateId, theme.accent],
  );

  const anchors = useMemo(
    () => [
      {x: 50, y: 42},
      {x: 18, y: 30},
      {x: 82, y: 60},
    ],
    [],
  );

  if (!n) return null;

  const showHint = index < n - 1;

  return (
    <div className="moments-ribbon">
      <div className="moments-frame-wrap">
        {!reduced ? (
          <MomentsMotifs
            active
            stop={index}
            anchors={anchors}
            colors={kit.colors}
            shapes={kit.shapes as MotifShape[]}
            accent={theme.accent}
          />
        ) : null}

        <InstagramPostFrame username={username} caption={caption} likesLabel="2,847 likes">
          <div className="moments-ig-media">
            <Swiper
              className="moments-ig-swiper"
              modules={[Pagination, Navigation]}
              pagination={{clickable: true}}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onBeforeInit={(swiper) => {
                const nav = swiper.params.navigation;
                if (nav && typeof nav !== 'boolean') {
                  nav.prevEl = prevRef.current;
                  nav.nextEl = nextRef.current;
                }
              }}
              allowTouchMove={false}
              nested
              spaceBetween={0}
              slidesPerView={1}
              initialSlide={index}
              onSwiper={(s) => {
                swiperRef.current = s;
              }}
              onSlideChange={(s) => onIndexChange(s.activeIndex)}
            >
              {photos.map((src, i) => (
                <SwiperSlide key={src + i} className="moments-ig-slide">
                  <img className="moments-ig-photo" src={src} alt={`Moment ${i + 1}`} draggable={false} />
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              ref={prevRef}
              type="button"
              className="moments-ig-nav moments-ig-nav--prev"
              aria-label="Previous photo"
              disabled={index <= 0}
              onClick={(e) => {
                e.stopPropagation();
                if (index > 0) onIndexChange(index - 1);
              }}
            >
              ‹
            </button>
            <button
              ref={nextRef}
              type="button"
              className="moments-ig-nav moments-ig-nav--next"
              aria-label="Next photo"
              disabled={index >= n - 1}
              onClick={(e) => {
                e.stopPropagation();
                if (index < n - 1) onIndexChange(index + 1);
              }}
            >
              ›
            </button>

            {showHint ? (
              <p className="moments-ig-swipe-hint" aria-hidden="true">
                Swipe right
              </p>
            ) : null}
          </div>
        </InstagramPostFrame>
      </div>
    </div>
  );
}
