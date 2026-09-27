import type { Locale } from '@bendike/shared';
import { isLocale } from '@bendike/shared';
import { useParams } from 'react-router-dom';
import { detectLocaleFromEnvironment } from '../../i18n/detect-locale';

/**
 * The landing page in the three languages the site speaks.
 *
 * Kept in TypeScript beside the components rather than in the i18n JSON, for the
 * same reason as the About story: `Record<Locale, LandingCopy>` makes the compiler
 * reject a locale that is missing a line, where a JSON bundle would quietly serve
 * English instead.
 */

export interface LandingCopy {
  hero: {
    eyebrow: string;
    headline: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    highlights: string[];
  };
  servicesHeading: string;
  services: { title: string; body: string }[];
  audiencesHeading: string;
  audiences: { role: string; body: string }[];
  aboutTeaser: { eyebrow: string; title: string; location: string; body: string; cta: string };
  brandsHeading: string;
  filmsHeading: string;
  filmsIntro: string;
}

const EN: LandingCopy = {
  hero: {
    eyebrow: 'Rigging services and software for skydivers',
    headline: 'Every jump starts with gear you can trust.',
    body: 'Bendike is a rigging loft in Argentina and the software that keeps skydivers, riggers and dropzones on top of reserve repacks, AAD service and manufacturer service bulletins. Safety first, always.',
    primaryCta: 'Create an account',
    secondaryCta: 'See what we do',
    highlights: ['Reserve repacks', 'AAD service', 'Service bulletins'],
  },
  servicesHeading: 'What Bendike does',
  services: [
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
  ],
  audiencesHeading: 'Built for everyone on the load',
  audiences: [
    { role: 'Skydivers', body: 'Know exactly when your reserve, AAD and rig are due, and book a rigger you trust.' },
    { role: 'Riggers', body: 'Offer your services, log every pack job, and keep your customers current.' },
    {
      role: 'Dropzones',
      body: 'See the status of the gear jumping at your DZ and work with the riggers who keep it safe.',
    },
  ],
  aboutTeaser: {
    eyebrow: 'Who is behind Bendike',
    title: 'Rigger, programmer, founder',
    location: 'Argentina',
    body: 'I am Enrique “Eca” Coscarelli, from Argentina: a rigger with my own loft and a programmer who builds software around the work I do there. Safety is my main priority, and Bendike exists so repacks, AADs and service bulletins never slip.',
    cta: 'More about Eca and the loft',
  },
  brandsHeading: 'Authorized dealer for',
  filmsHeading: 'From the air',
  filmsIntro:
    'Films from Squirrel’s pilots: season reels, trips, and the odd jump worth watching twice. Opens on YouTube.',
};

const ES: LandingCopy = {
  hero: {
    eyebrow: 'Servicios de plegado y software para paracaidistas',
    headline: 'Todo salto empieza con equipo en el que podés confiar.',
    body: 'Bendike es un taller de plegado en Argentina y el software que mantiene a paracaidistas, riggers y dropzones al día con los replegados de reserva, el servicio de AAD y los boletines de servicio de los fabricantes. La seguridad primero, siempre.',
    primaryCta: 'Crear una cuenta',
    secondaryCta: 'Mirá lo que hacemos',
    highlights: ['Replegados de reserva', 'Servicio de AAD', 'Boletines de servicio'],
  },
  servicesHeading: 'Qué hace Bendike',
  services: [
    {
      title: 'Servicios de plegado',
      body: 'Replegados de reserva, inspecciones, reparaciones y chequeos completos de equipo, en el taller o en tu dropzone, por un rigger certificado.',
    },
    {
      title: 'Seguimiento de replegados y AAD',
      body: 'Fechas de replegado de reserva, servicio de AAD y ciclos de batería de cada equipo en un solo lugar, con avisos antes de que algo se venza.',
    },
    {
      title: 'Alertas de boletines de servicio',
      body: 'Boletines de servicio del fabricante cruzados con el equipo que realmente tenés, para que no se le escape nada ni a vos ni a tu rigger.',
    },
    {
      title: 'Software para el deporte',
      body: 'Herramientas hechas por un rigger que además programa, pensadas en el piso del taller alrededor del trabajo que mantiene a la gente segura.',
    },
  ],
  audiencesHeading: 'Hecho para todos los que suben a la tanda',
  audiences: [
    {
      role: 'Paracaidistas',
      body: 'Sabé exactamente cuándo vencen tu reserva, tu AAD y tu equipo, y reservá con un rigger de confianza.',
    },
    { role: 'Riggers', body: 'Ofrecé tus servicios, registrá cada plegado y mantené a tus clientes al día.' },
    {
      role: 'Dropzones',
      body: 'Mirá el estado del equipo que salta en tu DZ y trabajá con los riggers que lo mantienen seguro.',
    },
  ],
  aboutTeaser: {
    eyebrow: 'Quién está detrás de Bendike',
    title: 'Rigger, programador, fundador',
    location: 'Argentina',
    body: 'Soy Enrique “Eca” Coscarelli, de Argentina: rigger con taller propio y programador que construye software alrededor del trabajo que hago ahí. La seguridad es mi prioridad principal, y Bendike existe para que los replegados, los AAD y los boletines de servicio no se pasen nunca.',
    cta: 'Más sobre Eca y el taller',
  },
  brandsHeading: 'Distribuidor oficial de',
  filmsHeading: 'Desde el aire',
  filmsIntro:
    'Películas de los pilotos de Squirrel: resúmenes de temporada, viajes y algún salto que vale la pena ver dos veces. Se abre en YouTube.',
};

const PT: LandingCopy = {
  hero: {
    eyebrow: 'Serviços de dobragem e software para paraquedistas',
    headline: 'Todo salto começa com equipamento em que dá para confiar.',
    body: 'O Bendike é uma oficina de dobragem na Argentina e o software que mantém paraquedistas, riggers e dropzones em dia com as redobras de reserva, o serviço de AAD e os boletins de serviço dos fabricantes. Segurança em primeiro lugar, sempre.',
    primaryCta: 'Criar uma conta',
    secondaryCta: 'Veja o que fazemos',
    highlights: ['Redobras de reserva', 'Serviço de AAD', 'Boletins de serviço'],
  },
  servicesHeading: 'O que o Bendike faz',
  services: [
    {
      title: 'Serviços de dobragem',
      body: 'Redobras de reserva, inspeções, reparos e checagens completas de equipamento, na oficina ou na sua dropzone, por um rigger certificado.',
    },
    {
      title: 'Controle de redobras e AAD',
      body: 'Datas de redobra de reserva, serviço de AAD e ciclos de bateria de cada equipamento em um só lugar, com avisos antes de qualquer vencimento.',
    },
    {
      title: 'Alertas de boletins de serviço',
      body: 'Boletins de serviço do fabricante cruzados com o equipamento que você realmente tem, para que nada passe despercebido por você ou pelo seu rigger.',
    },
    {
      title: 'Software para o esporte',
      body: 'Ferramentas feitas por um rigger que também programa, pensadas no chão da oficina em torno do trabalho que mantém as pessoas seguras.',
    },
  ],
  audiencesHeading: 'Feito para todo mundo que sobe no voo',
  audiences: [
    {
      role: 'Paraquedistas',
      body: 'Saiba exatamente quando vencem a sua reserva, o seu AAD e o seu equipamento, e reserve com um rigger de confiança.',
    },
    { role: 'Riggers', body: 'Ofereça os seus serviços, registre cada dobragem e mantenha os seus clientes em dia.' },
    {
      role: 'Dropzones',
      body: 'Veja o estado do equipamento que salta na sua DZ e trabalhe com os riggers que o mantêm seguro.',
    },
  ],
  aboutTeaser: {
    eyebrow: 'Quem está por trás do Bendike',
    title: 'Rigger, programador, fundador',
    location: 'Argentina',
    body: 'Sou Enrique “Eca” Coscarelli, da Argentina: rigger com oficina própria e programador que constrói software em torno do trabalho que faço ali. Segurança é a minha prioridade principal, e o Bendike existe para que redobras, AADs e boletins de serviço nunca passem batido.',
    cta: 'Mais sobre o Eca e a oficina',
  },
  brandsHeading: 'Distribuidor oficial de',
  filmsHeading: 'Do ar',
  filmsIntro:
    'Filmes dos pilotos da Squirrel: resumos de temporada, viagens e algum salto que vale a pena ver duas vezes. Abre no YouTube.',
};

/** Exported for tests, which assert against the English the page was written in. */
export const EN_LANDING_COPY = EN;

const COPY: Record<Locale, LandingCopy> = { en: EN, es: ES, pt: PT };

export function useLandingCopy(): LandingCopy {
  const { locale } = useParams<{ locale: string }>();
  return COPY[isLocale(locale) ? locale : detectLocaleFromEnvironment()];
}
