import { useMemo, useState, type RefObject } from 'react';
import { CHAPTERS, LOGBOOK, LOGBOOK_TITLE } from './about-story-content';
import { useChapterProgress, type ChapterId } from './use-chapter-progress';

const TITLE_LABEL = 'Title page';

function chapterLabel(chapter: ChapterId): string {
  if (chapter === 'title') {
    return TITLE_LABEL;
  }
  const meta = CHAPTERS[chapter];
  return `${meta.number} ${meta.title}`;
}

export function LogbookFolio({ root }: { root: RefObject<HTMLElement | null> }) {
  const { current, passed } = useChapterProgress(root);
  const [open, setOpen] = useState(false);

  const stamped = useMemo(() => LOGBOOK.filter((entry) => passed.has(entry.chapter)), [passed]);

  const jump = (chapter: ChapterId) => {
    const target = root.current?.querySelector<HTMLElement>(`[data-chapter="${chapter}"]`);
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setOpen(false);
  };

  return (
    <aside
      className={`as-log${open ? ' as-log--open' : ''}`}
      aria-label={LOGBOOK_TITLE}
      data-sc-verify-state={`${current}:${stamped.length}`}
    >
      <button
        type="button"
        className="as-log__toggle"
        aria-expanded={open}
        aria-controls="as-log-list"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="as-log__title">{LOGBOOK_TITLE}</span>
        <span className="as-log__count">
          {stamped.length} / {LOGBOOK.length}
        </span>
      </button>
      <p className="as-log__chapter" aria-live="polite">
        {chapterLabel(current)}
      </p>
      <ol id="as-log-list" className="as-log__list">
        {LOGBOOK.map((entry) => {
          const isStamped = passed.has(entry.chapter);
          return (
            <li
              key={`${entry.chapter}-${entry.text}`}
              className={`as-log__entry${isStamped ? ' as-log__entry--stamped' : ''}`}
              aria-hidden={!isStamped}
            >
              <button
                type="button"
                className="as-log__jump"
                onClick={() => jump(entry.chapter)}
                tabIndex={isStamped ? 0 : -1}
              >
                <span className="as-log__date">{entry.date}</span>
                <span className="as-log__text">{entry.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
