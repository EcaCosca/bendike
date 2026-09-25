import { useEffect, useState } from 'react';
import { FILM_BACKDROPS } from './landing-content';

const VIG = '/about/vig';

export interface FilmBackdrop {
  src: string;
  srcMobile: string;
  poster: string;
}

/** Picked once per mount, so a reload gives a different clip but a re-render does not. */
function pick(): string {
  return FILM_BACKDROPS[Math.floor(Math.random() * FILM_BACKDROPS.length)] ?? FILM_BACKDROPS[0];
}

export function useFilmBackdrop(): FilmBackdrop {
  const [id] = useState(pick);
  return { src: `${VIG}/${id}.mp4`, srcMobile: `${VIG}/${id}-m.mp4`, poster: `${VIG}/${id}.webp` };
}

/**
 * These hooks take the element through a state-backed callback ref rather than a
 * `useRef`, because the section does not exist on the first render — the carousel
 * returns null until the films arrive. A ref object cannot tell an effect that it
 * has been filled in, so the effects would run once against null and never again.
 */
export type NodeRef<T extends HTMLElement> = (node: T | null) => void;

/** True once the element has been on screen, so nothing decodes above a fold it never reaches. */
export function useInView<T extends HTMLElement>(): [NodeRef<T>, boolean] {
  const [node, setNode] = useState<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!node) {
      return;
    }
    // No observer means no way to know: show everything rather than hide it forever.
    if (typeof IntersectionObserver !== 'function') {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [setNode, seen];
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * How far the element has travelled through the viewport, -1 to 1, updated on a
 * frame. Drives the backdrop drift; stays 0 when motion is unwelcome, so the
 * caller needs no second branch.
 */
export function useScrollProgress(node: HTMLElement | null, enabled: boolean): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!node || !enabled) {
      setProgress(0);
      return;
    }
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const centre = box.top + box.height / 2;
      setProgress(Math.max(-1, Math.min(1, (viewport / 2 - centre) / viewport)));
    };
    const onScroll = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(measure);
      }
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [node, enabled]);

  return progress;
}
