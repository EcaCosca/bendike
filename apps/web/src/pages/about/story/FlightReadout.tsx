import { useEffect, useState, type RefObject } from 'react';
import { ABOUT_ASSETS, useAboutCopy } from './about-story-content';
import { glideRatio, sampleAt, type FlightTrack, type TrackSample } from './flight-track';

const formatInt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function FlightReadout({ video }: { video: RefObject<HTMLVideoElement | null> }) {
  const [track, setTrack] = useState<FlightTrack | null>(null);
  const [sample, setSample] = useState<TrackSample | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(ABOUT_ASSETS.flightTrack, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
          return null;
        }
        return (await response.json()) as FlightTrack;
      })
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.samples) && data.samples.length > 1) {
          setTrack(data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!track) {
      return;
    }
    let frame = 0;
    const tick = () => {
      const element = video.current;
      if (element && element.duration > 0) {
        const seconds = (element.currentTime / element.duration) * track.durationS;
        setSample(sampleAt(track, seconds));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [track, video]);

  // Above the early return: a hook after a conditional return is a Rules of Hooks
  // violation and breaks the moment the track loads and the component re-renders.
  const { chapters } = useAboutCopy();

  if (!track || !sample) {
    return null;
  }

  const labels = chapters.air.readout.labels;
  const glide = glideRatio(sample);

  return (
    <dl
      className="as-readout"
      aria-label={chapters.air.readout.title}
      data-sc-verify-state={`${Math.round(sample.alt)}:${Math.round(sample.hs)}`}
    >
      <div className="as-readout__cell">
        <dt>{labels.altitude}</dt>
        <dd>
          <span className="sc-nums">{formatInt.format(sample.alt)}</span> m
        </dd>
      </div>
      <div className="as-readout__cell">
        <dt>{labels.speed}</dt>
        <dd>
          <span className="sc-nums">{formatInt.format(sample.hs)}</span> km/h
        </dd>
      </div>
      <div className="as-readout__cell">
        <dt>{labels.descent}</dt>
        <dd>
          <span className="sc-nums">{formatInt.format(sample.vs)}</span> m/s
        </dd>
      </div>
      <div className="as-readout__cell">
        <dt>{labels.glide}</dt>
        <dd>
          <span className="sc-nums">{glide.toFixed(1)}</span>
        </dd>
      </div>
    </dl>
  );
}
