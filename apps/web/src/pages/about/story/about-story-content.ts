export const ABOUT_ASSET_BASE = '/about';

export const ABOUT_ASSETS = {
  flight: `${ABOUT_ASSET_BASE}/flight.mp4`,
  flightMobile: `${ABOUT_ASSET_BASE}/flight-m.mp4`,
  flightPoster: `${ABOUT_ASSET_BASE}/flight-poster.webp`,
  flightPosterMobile: `${ABOUT_ASSET_BASE}/flight-poster-m.webp`,
  flightTrack: `${ABOUT_ASSET_BASE}/flight-track.json`,
  prep: Array.from({ length: 8 }, (_, i) => `${ABOUT_ASSET_BASE}/prep-0${i + 1}`),
  loft: [`${ABOUT_ASSET_BASE}/loft-01`, `${ABOUT_ASSET_BASE}/loft-02`],
  pilot: `${ABOUT_ASSET_BASE}/pilot-01`,
  teach: `${ABOUT_ASSET_BASE}/teach-01`,
  kids: `${ABOUT_ASSET_BASE}/kids`,
  portrait: `${ABOUT_ASSET_BASE}/eca`,
} as const;

export function imageSources(base: string) {
  return {
    src: `${base}-1600.webp`,
    srcSet: `${base}-800.webp 800w, ${base}-1600.webp 1600w`,
  };
}

export const CTA_LABEL = 'Create an account';

export const TITLE = {
  name: 'Enrique Coscarelli',
  nickname: 'Eca',
  words: ['Rigger.', 'Pilot.', 'Programmer.', 'Father.'],
  place: 'Rosario, Santa Fe, Argentina',
} as const;

export const CHAPTERS = {
  air: {
    number: '01',
    title: 'Air',
    lines: ['Locked in.', 'The flight is the part that gets filmed.'],
    caption: 'Wingsuit flight. Eca on camera.',
    readout: {
      title: 'FlySight track',
      labels: { altitude: 'Altitude', speed: 'Speed', descent: 'Descent', glide: 'Glide' },
    },
  },
  preparation: {
    number: '02',
    title: 'Preparation',
    heading: 'Luck is where opportunity meets preparation.',
    paragraphs: [
      'Every flight that looks effortless was packed, inspected and briefed on the ground. That is the part nobody films, and it is where the sport is actually won.',
      'Every major accident I have read about is an addition. A detail someone overlooked. A step someone skipped because they had pulled it off before, or thought they could. None of them alone is fatal. Together they leave no margin for error. Safety is the habit of not adding to that sum.',
    ],
    labels: [
      'Gear check.',
      'Pin check.',
      'Pack job.',
      'The aircraft.',
      'Winds and weather.',
      'Exit order.',
      'Canopy.',
      'Geared up.',
    ],
  },
  loft: {
    number: '03',
    title: 'The loft',
    heading: 'Hands on the gear.',
    paragraphs: [
      'I own a rigging loft in Rosario. Reserve repacks, inspections, repairs and AAD service are the services I provide, but the cornerstone of the job is being a reliable source of information. The equipment I pack is the equipment my friends jump, so there is no version of this work I take lightly.',
      'I have been a pilot and a licensed skydiver since 2015. I hold a USPA D-licence and coach and tandem ratings since 2017, and wingsuits have been a passion since then. The parachute rigger certification from ANAC came in 2025, after a long-standing interest in safety and gear. I have always believed a rigger should be based at a dropzone to do the role well: not a qualification you carry from place to place, but a responsibility you hold as part of a community.',
    ],
    credentials: [
      { year: '2015', text: 'Private Aircraft Pilot, ANAC' },
      { year: '2015', text: 'Paracaidista, ANAC' },
      { year: '2017', text: 'Skydive D-License, USPA' },
      { year: '2017', text: 'Coach Rating, USPA' },
      { year: '2017', text: 'Tandem Instructor, USPA' },
      { year: '2017', text: 'Sigma Tandem Instructor, United Parachute Technologies' },
      { year: '2017', text: 'Wingsuit Pilot, Next Level' },
      { year: '2025', text: 'Plegador de Paracaídas, Parachute Rigger, ANAC' },
    ],
    captions: ['The loft, Rosario.', 'Reserve repack in progress.'],
  },
  airAndCode: {
    number: '04',
    title: 'Air and code',
    heading: 'Everything measured in jump tickets.',
    paragraphs: [
      'I have always had an interest in flight. Like many of us in this sport, for the longest time every penny I made was meant for skydiving or for flying in some shape or form: the wind tunnel, a course, gear. For a few years I measured absolutely everything in jump tickets, food included. The obsession only grew.',
      'In parallel I trained as a software engineer, building solutions to problems. It has let me travel and live in different places: a winter speedriding in Switzerland, a summer BASE jumping in Italy, a stretch based in Barcelona flying to the wingsuit tunnel one weekend and to Bovec for mountain swooping the next. I consider myself very lucky.',
      'As an engineer I take complex problems and find systems that solve them. The hardest part is understanding a business inside out: its suppliers, the history of the tools around it, how trends shift and what that does to everyone, and how a missed service bulletin can become a fatal mistake. I stand in the crossover: something I have been obsessed with for the longest time, something I do for a living, and a need I can meet with a method I believe to be sound.',
    ],
    figures: [
      { value: '350', suffix: '+', label: 'students taught in Saudi Arabia' },
      { value: '14', suffix: '', label: 'cities the bootcamp ran in' },
      { value: '100', suffix: '%', label: 'of those graduates employed' },
    ],
    captions: ['In the air.', 'At the desk.'],
  },
  sons: {
    number: '05',
    title: 'Ben and Ike',
    heading: 'Ben and Ike.',
    paragraphs: [
      'Bendike is where all of this meets. I want air sports to be safer, and information to be delivered faster and turned into something you can act on, so anyone can grow in this sport with safety as a habit.',
      'I have two sons so far, Benjamin and Enrique. At home they are Benja and Ike. Ben and Ike: Bendike. I do not know if they will follow my footsteps. If they do, I want them to be safe, and the only way I can do that is by improving the safety of the community as a whole.',
    ],
    attribution: 'Eca',
    caption: 'Benjamin and Enrique.',
  },
  colophon: {
    number: '06',
    title: 'Bendike',
    heading: 'Safety as a habit.',
    body: 'A rigging loft in Rosario, and the software that keeps skydivers, riggers and dropzones current on reserve repacks, AAD service and service bulletins. Information delivered faster, and turned into something you can act on.',
    ctaLead: 'Start where the gear starts.',
  },
} as const;

export const CAREER = [
  { date: '2011 to 2016', text: 'Ski Instructor, PSIA-AASI, Children Specialist' },
  { date: 'Sep 2021', text: 'Lead Web Developer Instructor, SAFCSP, Saudi Arabia' },
  { date: 'Dec 2021', text: 'Lead Web Developer Instructor, WBS Coding School, Berlin' },
  { date: 'Jan 2024', text: 'Senior Software Engineer, Bayer' },
  { date: 'Dec 2024', text: 'Staff Software Engineer, John Deere' },
] as const;
