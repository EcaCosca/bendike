import { useEffect, useRef, useState } from 'react';
import { FLIGHT_COPY, FLIGHT_LEGS, flightSources } from './flight-sequence-content';

interface WaypointDetail {
  index: number;
  count: number;
  label: string;
}

/**
 * The engine publishes the current leg on `sc:waypoint` and draws no route of its
 * own, on purpose: a gauge, a map and a set of dots are all the same two numbers.
 * This is Bendike's route rail.
 */
function useWaypoint(ref: React.RefObject<HTMLElement | null>) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWaypoint = (event: Event) => {
      const detail = (event as CustomEvent<WaypointDetail>).detail;
      if (detail) setIndex(detail.index);
    };
    el.addEventListener('sc:waypoint', onWaypoint);
    return () => el.removeEventListener('sc:waypoint', onWaypoint);
  }, [ref]);

  return index;
}

export function FlightSequence() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeLeg = useWaypoint(rootRef);

  return (
    <div ref={rootRef} className="as-flight" data-sc-mode="worldflight" data-sc-seam="0.14">
      <div data-sc-world>
        {FLIGHT_LEGS.map((leg) => {
          const { src, srcMobile, poster } = flightSources(leg.id);
          return (
            <div
              key={leg.id}
              data-sc-segment
              data-sc-w={leg.weight}
              data-sc-linger={leg.linger}
              data-sc-waypoint={leg.waypoint}
            >
              <img className="sc-world__poster" src={poster} alt={leg.alt} />
              {/* No src attribute: the engine fetches the leg as a blob only once it is within reach. */}
              <video data-sc-src={src} data-sc-src-mobile={srcMobile} muted playsInline aria-hidden="true" />
            </div>
          );
        })}
      </div>

      <div data-sc-world-copy>
        {/* Two full-bleed gradients rather than a panel behind each block: a shape
            with an edge reads as a box over the footage, a band reads as grading.
            Top for the hero, bottom for the two blocks anchored down there. */}
        <div className="sc-world__scrim sc-scrim" />
        <div className="sc-world__scrim sc-scrim sc-scrim--bottom" />

        <div className="as-flight__copy as-flight__copy--hero" data-sc-copy data-sc-window="hero">
          <p className="as-flight__eyebrow">{FLIGHT_COPY.hero.eyebrow}</p>
          <h2 className="as-flight__heading" data-sc-kinetic="words">
            {FLIGHT_COPY.hero.heading}
          </h2>
          <p className="as-flight__body">{FLIGHT_COPY.hero.body}</p>
        </div>

        <div className="as-flight__copy" data-sc-copy data-sc-window="0.40 0.62 0.25 0.25">
          <h2 className="as-flight__heading" data-sc-kinetic="lines">
            {FLIGHT_COPY.middle.heading}
          </h2>
          <p className="as-flight__body">{FLIGHT_COPY.middle.body}</p>
        </div>

        <div className="as-flight__copy as-flight__copy--finale" data-sc-copy data-sc-window="finale">
          <h2 className="as-flight__heading" data-sc-kinetic="words">
            {FLIGHT_COPY.finale.heading}
          </h2>
          <p className="as-flight__body">{FLIGHT_COPY.finale.body}</p>
        </div>

        <ol className="as-flight__rail" aria-label="Flight legs">
          {FLIGHT_LEGS.map((leg, i) => (
            <li
              key={leg.id}
              className={`as-flight__leg${i === activeLeg ? ' is-active' : ''}`}
              aria-current={i === activeLeg ? 'step' : undefined}
            >
              <span className="as-flight__tick" aria-hidden="true" />
              <span className="as-flight__label">{leg.waypoint}</span>
            </li>
          ))}
        </ol>
      </div>

      <div data-sc-spacer aria-hidden="true" />
    </div>
  );
}
