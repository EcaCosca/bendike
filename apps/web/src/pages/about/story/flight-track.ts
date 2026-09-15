export interface TrackSample {
  t: number;
  alt: number;
  hs: number;
  vs: number;
}

export interface FlightTrack {
  source: string;
  durationS: number;
  samples: TrackSample[];
}

export function sampleAt(track: FlightTrack, seconds: number): TrackSample | null {
  const { samples } = track;
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (!first || !last) {
    return null;
  }
  if (seconds <= first.t) {
    return first;
  }
  if (seconds >= last.t) {
    return last;
  }
  let low = 0;
  let high = samples.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    const midSample = samples[mid];
    if (midSample && midSample.t <= seconds) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const a = samples[low];
  const b = samples[high];
  if (!a || !b) {
    return null;
  }
  const span = b.t - a.t || 1;
  const k = (seconds - a.t) / span;
  return { t: seconds, alt: a.alt + (b.alt - a.alt) * k, hs: a.hs + (b.hs - a.hs) * k, vs: a.vs + (b.vs - a.vs) * k };
}

export function glideRatio(sample: TrackSample): number {
  return sample.vs > 0.5 ? sample.hs / 3.6 / sample.vs : 0;
}
