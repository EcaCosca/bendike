import { useEffect, type RefObject } from 'react';

const ENGINE_CSS_HREF = '/scrollcraft/scrollcraft.css';
const ENGINE_CSS_ATTR = 'data-scrollcraft-engine';

export function useScrollcraft(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = ENGINE_CSS_HREF;
    link.setAttribute(ENGINE_CSS_ATTR, '');
    document.head.appendChild(link);

    let cancelled = false;
    void import('../scrollcraft/scrollcraft.js').then(() => {
      if (cancelled || !rootRef.current || !window.ScrollCraft) {
        return;
      }
      window.ScrollCraft.mount(rootRef.current);
    });

    return () => {
      cancelled = true;
      link.remove();
      document.documentElement.classList.remove('sc-ready');
    };
  }, [rootRef]);
}
