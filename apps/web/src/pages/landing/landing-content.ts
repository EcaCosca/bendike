export const HERO = {
  eyebrow: 'Rigging services and software for skydivers',
  headline: 'Every jump starts with gear you can trust.',
  body: 'Bendike is a rigging loft in Argentina and the software that keeps skydivers, riggers and dropzones on top of reserve repacks, AAD service and manufacturer service bulletins. Safety first, always.',
  primaryCta: { label: 'Create an account', to: '/register' },
  secondaryCta: { label: 'See what we do', href: '#services' },
  highlights: ['Reserve repacks', 'AAD service', 'Service bulletins'],
};

export const SERVICES_HEADING = 'What Bendike does';

export const SERVICES = [
  {
    title: 'Rigging services',
    body: 'Reserve repacks, inspections, repairs and full gear checks, at the loft or at your dropzone, by a certified rigger.',
  },
  {
    title: 'Repack and AAD tracking',
    body: 'Reserve repack dates, AAD service and battery cycles for every rig in one place, with reminders before anything lapses.',
  },
  {
    title: 'Service bulletin alerts',
    body: 'Manufacturer service bulletins matched to the gear you actually own, so nothing slips past you or your rigger.',
  },
  {
    title: 'Software for the sport',
    body: 'Tools built by a rigger who is also a programmer, shaped on the loft floor around the work that keeps people safe.',
  },
] as const;

export const AUDIENCES_HEADING = 'Built for everyone on the load';

export const AUDIENCES = [
  {
    role: 'Skydivers',
    body: 'Know exactly when your reserve, AAD and rig are due, and book a rigger you trust.',
  },
  {
    role: 'Riggers',
    body: 'Offer your services, log every pack job, and keep your customers current.',
  },
  {
    role: 'Dropzones',
    body: 'See the status of the gear jumping at your DZ and work with the riggers who keep it safe.',
  },
] as const;

export const ABOUT_TEASER = {
  eyebrow: 'Who is behind Bendike',
  displayName: 'Enrique “Eca” Coscarelli',
  initials: 'EC',
  title: 'Rigger, programmer, founder',
  location: 'Argentina',
  body: 'I am Enrique “Eca” Coscarelli, from Argentina: a rigger with my own loft and a programmer who builds software around the work I do there. Safety is my main priority, and Bendike exists so repacks, AADs and service bulletins never slip.',
  cta: { label: 'More about Eca and the loft', to: '/about' },
};

export const BRANDS_HEADING = 'Authorized dealer for';

export const DEALER_BRANDS = [
  { slug: 'squirrel', name: 'Squirrel', file: 'squirrel.svg', height: 48 },
  { slug: 'vigil', name: 'Vigil', file: 'vigil.png', height: 64 },
  { slug: 'flysight', name: 'FlySight', file: 'flysight.png', height: 40 },
] as const;
