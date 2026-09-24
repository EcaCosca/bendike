import { useRef } from 'react';
import { SiteNav } from '../../../components/site/SiteNav';
import { WhatsAppFab } from '../../../components/site/WhatsAppFab';
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
import { FlightSequence } from './FlightSequence';
import { useScrollcraft } from './use-scrollcraft';

export function AboutStoryPage() {
  const rootRef = useRef<HTMLElement | null>(null);
  useScrollcraft(rootRef);

  return (
    <div className="as-root">
      <div className="sc-grain" aria-hidden="true" />
      <SiteNav />
      <main ref={rootRef} className="as-main">
        <TitlePage />
        <FlightChapter />
        <PreparationChapter />
        <LoftChapter />
        <FlightSequence />
        <AirAndCodeChapter />
        <SonsChapter />
        <Colophon />
      </main>
      <WhatsAppFab />
    </div>
  );
}
