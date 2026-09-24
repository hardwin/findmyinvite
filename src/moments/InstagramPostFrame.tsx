import type {ReactNode} from 'react';

type Props = {
  username?: string;
  likesLabel?: string;
  caption?: string;
  children: ReactNode;
};

/**
 * Instagram post chrome adapted from NUKnightLab/InstagramMock (MIT).
 * https://github.com/NUKnightLab/InstagramMock
 * Header + square media well + action row + likes/caption — not invented.
 */
export default function InstagramPostFrame({
  username = 'our.moments',
  likesLabel = '2,847 likes',
  caption,
  children,
}: Props) {
  return (
    <article className="ig-post" aria-label="Moments photo post">
      <header className="ig-post-header">
        <div className="ig-post-user">
          <span className="ig-post-avatar" aria-hidden="true" />
          <div className="ig-post-meta">
            <strong className="ig-post-username">{username}</strong>
            <span className="ig-post-location">Our Moments</span>
          </div>
        </div>
        <button type="button" className="ig-post-more" aria-label="More options" tabIndex={-1}>
          ···
        </button>
      </header>

      <div className="ig-post-media">{children}</div>

      <div className="ig-post-actions" aria-hidden="true">
        <div className="ig-post-actions-left">
          <svg className="ig-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
          <svg className="ig-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4H5.2L3 22l1.5-3.6A8.4 8.4 0 1 1 21 11.5z"
            />
          </svg>
          <svg className="ig-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"
            />
          </svg>
        </div>
        <svg className="ig-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
          />
        </svg>
      </div>

      <p className="ig-post-likes">{likesLabel}</p>
      {caption ? (
        <p className="ig-post-caption">
          <strong>{username}</strong> {caption}
        </p>
      ) : null}
    </article>
  );
}
