const FLIGHT_BASE = '/about/flight';

export interface FlightLeg {
  id: string;
  /** Viewport-heights of scroll this leg owns. Longer legs get more dwell. */
  weight: number;
  /** Dwell remap for this leg: moves fast at the edges, settles in the middle. Max 0.6. */
  linger: number;
  /** Published on --sc-seg and the sc:waypoint event; the rail below draws it. */
  waypoint: string;
  alt: string;
}

export const FLIGHT_LEGS: FlightLeg[] = [
  {
    id: 'exit',
    weight: 1.1,
    linger: 0.35,
    waypoint: 'The exit',
    alt: 'Standing on a mountain exit point at last light',
  },
  { id: 'leap', weight: 1.3, linger: 0.3, waypoint: 'The leap', alt: 'Stepping off a cliff in a wingsuit' },
  {
    id: 'fly',
    weight: 1.5,
    linger: 0.45,
    waypoint: 'The flight',
    alt: 'Wingsuit proximity flight down an alpine valley',
  },
  {
    id: 'canopy',
    weight: 1.2,
    linger: 0.3,
    waypoint: 'Under canopy',
    alt: 'An open canopy descending beneath a bridge',
  },
  { id: 'land', weight: 1.1, linger: 0.35, waypoint: 'The landing', alt: 'Canopy settling onto the ground' },
];

export const flightSources = (id: string) => ({
  src: `${FLIGHT_BASE}/${id}.mp4`,
  srcMobile: `${FLIGHT_BASE}/${id}-m.mp4`,
  poster: `${FLIGHT_BASE}/${id}-poster.webp`,
});

export const FLIGHT_COPY = {
  hero: {
    eyebrow: 'Interlude',
    heading: 'One flight, end to end.',
    body: 'Stand on the edge, step off, fly it down, open, land. Every piece of gear in these six seconds was packed by someone who checked it first.',
  },
  middle: {
    heading: 'The margin is the whole job.',
    body: 'Nothing here is improvised. The exit was walked, the suit was checked, the reserve was packed and signed for months before it was ever needed.',
  },
  finale: {
    heading: 'Then you do it again tomorrow.',
    body: 'Which is why the record has to be right.',
  },
};
