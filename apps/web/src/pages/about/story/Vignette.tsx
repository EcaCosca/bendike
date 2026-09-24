import { useEffect, useRef, useState } from 'react';

const VIG_BASE = '/about/vig';

const sources = (id: string) => ({
  src: `${VIG_BASE}/${id}.mp4`,
  srcMobile: `${VIG_BASE}/${id}-m.mp4`,
  poster: `${VIG_BASE}/${id}.webp`,
});

interface VignetteProps {
  id: string;
  alt: string;
  className?: string;
}

/**
 * A short looping clip that plays on its own timeline.
 *
 * Deliberately NOT a scrollcraft scrub device: a clip whose playhead is tied to
 * scroll position stops dead whenever the reader does, which reads as a broken
 * video rather than an effect. Scroll drives the copy on this page; the footage
 * just runs.
 *
 * The file is not fetched until the tile is near the viewport, and playback is
 * paused whenever it leaves — a dozen looping videos all decoding at once is the
 * quickest way to flatten a phone battery.
 */
export function Vignette({ id, alt, className }: VignetteProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver !== 'function') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setArmed(true);
          near.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    near.observe(host);
    return () => near.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!armed || !video) return;

    const visible = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: 0.15 },
    );
    visible.observe(video);
    return () => visible.disconnect();
  }, [armed]);

  const { src, srcMobile, poster } = sources(id);

  return (
    <div ref={hostRef} className={`as-vig${className ? ` ${className}` : ''}`}>
      {armed ? (
        <video
          ref={videoRef}
          className="as-vig__media"
          poster={poster}
          muted
          loop
          playsInline
          preload="auto"
          aria-label={alt}
        >
          <source src={srcMobile} type="video/mp4" media="(max-width: 860px)" />
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <img className="as-vig__media" src={poster} alt={alt} loading="lazy" />
      )}
    </div>
  );
}
