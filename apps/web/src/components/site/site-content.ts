export const SITE_NAME = 'BENDIKE';

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
] as const;

export const SOCIAL_LINKS = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/ecacoscarelli/' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/enrique-coscarelli/' },
] as const;

export const CONTACT_EMAIL = 'enriquecoscarelli@gmail.com';

export const FOOTER_TAGLINE = 'Rigging loft and software, Argentina.';

export const WHATSAPP_NUMBER = '5493413955408';
export const WHATSAPP_LABEL = 'Chat with Eca on WhatsApp';
export const WHATSAPP_GREETING = 'Hola Eca, te escribo desde bendike.';
export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_GREETING)}`;
