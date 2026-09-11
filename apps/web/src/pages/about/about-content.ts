export const ABOUT_PAGE = {
  eyebrow: 'About',
  title: 'About Bendike',
  intro:
    'Bendike is a rigging loft in Argentina and the software built around it. It exists for one reason: that every skydiver on every load is jumping gear that is current, inspected and safe.',
  founder: {
    displayName: 'Enrique “Eca” Coscarelli',
    initials: 'EC',
    title: 'Rigger, programmer, founder',
    location: 'Argentina',
    paragraphs: [
      'I am Enrique Coscarelli. Most people call me Eca. I am from Argentina, where I own and run a rigging loft: reserve repacks, inspections, repairs and full gear checks for the skydivers around me.',
      'I am also a programmer, and I build software that lines up with my passions. Bendike is where the two meet. The tools here are shaped by the work I do every day at the loft, so the people I pack for can see where their gear stands at any moment, not just when they find the data card.',
    ],
  },
  sections: [
    {
      id: 'loft',
      heading: 'The loft',
      paragraphs: [
        'The loft is where Bendike started and where it is tested. Reserve repacks, AAD installs and service, harness and container inspections, canopy repairs: the everyday work of keeping rigs airworthy.',
        'Riggers can offer the same services through Bendike, log every pack job, and keep their customers informed of what is due next.',
      ],
    },
    {
      id: 'software',
      heading: 'The software',
      paragraphs: [
        'Every rig has dates attached to it: the reserve repack cycle, the AAD service interval and battery life, and the manufacturer service bulletins that apply to that exact make and model. Bendike keeps them in one place for the skydiver, the rigger and the dropzone, and raises a hand before anything lapses.',
      ],
    },
    {
      id: 'safety',
      heading: 'Why safety comes first',
      paragraphs: [
        'A repack date that slips. An AAD past its service. A bulletin nobody read. These are the things that hurt people, and they are all preventable with the right information in front of the right person at the right time.',
        'Safety is my main priority. Bendike exists so that these things do not slip.',
      ],
    },
  ],
  cta: {
    heading: 'Ready to keep your gear current?',
    body: 'Create an account as a skydiver. Riggers and dropzones are promoted by an admin once they are verified.',
    primary: { label: 'Create an account', to: '/register' },
    secondary: { label: 'Back to home', to: '/' },
  },
} as const;
