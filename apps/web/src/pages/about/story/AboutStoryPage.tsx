import { useRef } from 'react';
import './about-story.css';
import {
  AirAndCodeChapter,
  Colophon,
  FlightChapter,
  LoftChapter,
  PreparationChapter,
  SonsChapter,
  TitlePage,
} from './chapters';
import { useScrollcraft } from './use-scrollcraft';

export function AboutStoryPage() {
  const rootRef = useRef<HTMLElement | null>(null);
  useScrollcraft(rootRef);

  return (
    <div className="as-root">
      <div className="sc-grain" aria-hidden="true" />
      <main ref={rootRef} className="as-main">
        <TitlePage />
        <FlightChapter />
        <PreparationChapter />
        <LoftChapter />
        <AirAndCodeChapter />
        <SonsChapter />
        <Colophon />
      </main>
    </div>
  );
}
