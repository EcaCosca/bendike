import { useEffect, useState, type RefObject } from 'react';
import type { LogbookEntry } from './about-story-content';

export type ChapterId = LogbookEntry['chapter'];

export const CHAPTER_ORDER: readonly ChapterId[] = [
  'title',
  'air',
  'preparation',
  'loft',
  'airAndCode',
  'sons',
  'colophon',
];

export function useChapterProgress(root: RefObject<HTMLElement | null>) {
  const [current, setCurrent] = useState<ChapterId>('title');
  const [passed, setPassed] = useState<Set<ChapterId>>(() => new Set(['title']));

  useEffect(() => {
    const host = root.current;
    if (!host || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const sections = Array.from(host.querySelectorAll<HTMLElement>('[data-chapter]'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const chapter = entry.target.getAttribute('data-chapter') as ChapterId | null;
          if (!chapter) {
            continue;
          }
          setCurrent(chapter);
          setPassed((previous) => {
            const next = new Set(previous);
            for (const c of CHAPTER_ORDER) {
              next.add(c);
              if (c === chapter) {
                break;
              }
            }
            return next;
          });
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [root]);

  return { current, passed };
}
