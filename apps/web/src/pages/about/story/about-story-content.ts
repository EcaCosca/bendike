export const ABOUT_ASSET_BASE = '/about';

export const ABOUT_ASSETS = {
  flight: `${ABOUT_ASSET_BASE}/flight.mp4`,
  flightMobile: `${ABOUT_ASSET_BASE}/flight-m.mp4`,
  flightPoster: `${ABOUT_ASSET_BASE}/flight-poster.webp`,
  flightPosterMobile: `${ABOUT_ASSET_BASE}/flight-poster-m.webp`,
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
    lines: ['Locked in.', 'The terrain comes up to meet you, and everything else goes quiet.'],
    caption: 'Wingsuit flight. Eca on camera.',
  },
  preparation: {
    number: '02',
    title: 'Preparation',
    heading: 'None of it is luck.',
    body: 'Every flight that looks effortless was packed, inspected and briefed on the ground. That is where the sport is actually won, and it is the part nobody films.',
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
      'I own a rigging loft in Rosario. Reserve repacks, inspections, repairs, AAD service. The rigs I pack are the ones my friends jump, so there is no version of this work I take lightly.',
      'I have been a licensed skydiver since 2015, a USPA D-licence holder, coach and tandem instructor since 2017, and a wingsuit pilot since the same year. The parachute rigger certification from ANAC came in 2025, after a decade of being the person other people trusted with their gear anyway.',
    ],
    credentials: [
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
    heading: 'I love flying.',
    paragraphs: [
      'Private aircraft pilot since 2015, licensed by ANAC. The aircraft, the drone, the wingsuit: different machines, the same air. It is the one place where I am completely present.',
      'I am also an engineer. I taught web development to more than 350 students across 14 cities in Saudi Arabia, every one of whom found a job, then led a thirteen-week bootcamp in Berlin for two years. I spent 2024 at Bayer and I build software at John Deere today. Before any of that I taught children to ski.',
      'Bendike is where those two lives meet: software shaped by the loft floor, built by someone who has to trust it with his own reserve.',
    ],
    figures: [
      { value: '350', suffix: '+', label: 'students taught in Saudi Arabia' },
      { value: '14', suffix: '', label: 'cities the bootcamp ran in' },
      { value: '100', suffix: '%', label: 'of those graduates employed' },
    ],
    captions: ['In the air.', 'In the classroom.'],
  },
  sons: {
    number: '05',
    title: 'Ben and Ike',
    heading: 'Ben and Ike.',
    paragraphs: [
      'Bendike is my two sons. Benjamin, and Enrique, who we call Ike. Ben and Ike.',
      'I am a father before I am any of the rest. I do not want my children to follow in my footsteps. But if they do, I want them to be received into a safer sport than the one that received me, with the information they need available to them, from me and from any other responsible, proven person.',
    ],
    attribution: 'Eca',
    caption: 'Benjamin and Enrique.',
  },
  colophon: {
    number: '06',
    title: 'Bendike',
    heading: 'Bendike is that environment.',
    body: 'A rigging loft in Argentina, and the software that keeps every skydiver, rigger and dropzone current on reserve repacks, AAD service and service bulletins. Safety first, always.',
    ctaLead: 'Start where the gear starts.',
  },
} as const;

export interface LogbookEntry {
  chapter: keyof typeof CHAPTERS | 'title';
  date: string;
  text: string;
}

export const LOGBOOK: readonly LogbookEntry[] = [
  { chapter: 'title', date: '2005', text: 'ECPE, University of Michigan' },
  { chapter: 'air', date: 'Jul 2015', text: 'Private Aircraft Pilot, ANAC' },
  { chapter: 'air', date: 'Aug 2017', text: 'Skydive Wingsuit Pilot, Next Level' },
  { chapter: 'preparation', date: 'Jul 2015', text: 'Paracaidista, ANAC' },
  { chapter: 'preparation', date: 'Jun 2017', text: 'Skydive D-License, USPA' },
  { chapter: 'loft', date: 'Jun 2017', text: 'Skydive Coach Rating, USPA' },
  { chapter: 'loft', date: 'Jun 2017', text: 'Tandem Skydive Instructor, USPA' },
  { chapter: 'loft', date: 'Jun 2017', text: 'Sigma Tandem Instructor, United Parachute Technologies' },
  { chapter: 'loft', date: 'Aug 2025', text: 'Parachute Rigger, ANAC' },
  { chapter: 'airAndCode', date: '2011 to 2016', text: 'Ski Instructor, PSIA-AASI, Children Specialist' },
  { chapter: 'airAndCode', date: 'Sep 2021', text: 'Lead Web Developer Instructor, SAFCSP, Saudi Arabia' },
  { chapter: 'airAndCode', date: 'Dec 2021', text: 'Lead Web Developer Instructor, WBS Coding School, Berlin' },
  { chapter: 'airAndCode', date: 'Jan 2024', text: 'Senior Software Engineer, Bayer' },
  { chapter: 'airAndCode', date: 'Sep 2024', text: 'DJI Drone Photo Academy' },
  { chapter: 'airAndCode', date: 'Dec 2024', text: 'Staff Software Engineer, John Deere' },
  { chapter: 'sons', date: 'Always', text: 'Father of Ben and Ike' },
];

export const LOGBOOK_TITLE = 'Logbook';
