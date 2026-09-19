import type { DueKind } from './gear';
import type { Locale } from './locale';
import { whatsappDigits } from './phone';

export interface ContactMessageInput {
  locale: Locale;
  ownerName: string;
  riggerName: string;
  rigName: string | null;
  componentLabel: string;
  dueKind: DueKind;
  dueOn: string | null;
  daysLeft: number | null;
}

interface Words {
  greeting: (owner: string, rigger: string) => string;
  subject: Record<DueKind, string>;
  upcoming: (subject: string, component: string, rig: string, date: string) => string;
  overdue: (subject: string, component: string, rig: string, date: string) => string;
  noDate: (subject: string, component: string, rig: string) => string;
  closing: Record<DueKind, string>;
  rigPhrase: (rig: string) => string;
}

const WORDS: Record<Locale, Words> = {
  es: {
    greeting: (owner, rigger) => `Hola ${owner}, soy ${rigger} de Bendike.`,
    subject: {
      repack: 'el plegado de la reserva',
      battery: 'el cambio de batería del AAD',
      service: 'el service del AAD',
      expiry: 'el vencimiento del AAD',
    },
    upcoming: (s, c, r, d) => `Te escribo por ${s} ${c}${r}: vence el ${d}.`,
    overdue: (s, c, r, d) => `Te escribo por ${s} ${c}${r}: venció el ${d}.`,
    noDate: (s, c, r) => `Te escribo por ${s} ${c}${r}: no tengo la fecha registrada.`,
    closing: {
      repack: '¿Coordinamos el plegado?',
      battery: '¿Coordinamos el cambio?',
      service: '¿Coordinamos el envío a service?',
      expiry: '¿Coordinamos el recambio?',
    },
    rigPhrase: (rig) => ` del equipo ${rig}`,
  },
  en: {
    greeting: (owner, rigger) => `Hi ${owner}, this is ${rigger} from Bendike.`,
    subject: {
      repack: 'the reserve repack',
      battery: 'the AAD battery',
      service: 'the AAD service',
      expiry: 'the AAD end of life',
    },
    upcoming: (s, c, r, d) => `I am writing about ${s} for ${c}${r}, which is due on ${d}.`,
    overdue: (s, c, r, d) => `I am writing about ${s} for ${c}${r}, which was due on ${d}.`,
    noDate: (s, c, r) => `I am writing about ${s} for ${c}${r}: there is no date on record.`,
    closing: {
      repack: 'Shall we arrange the repack?',
      battery: 'Shall we arrange the change?',
      service: 'Shall we arrange sending it in?',
      expiry: 'Shall we arrange the replacement?',
    },
    rigPhrase: (rig) => ` on rig ${rig}`,
  },
  pt: {
    greeting: (owner, rigger) => `Olá ${owner}, aqui é ${rigger} da Bendike.`,
    subject: {
      repack: 'a dobragem da reserva',
      battery: 'a troca da bateria do AAD',
      service: 'o serviço do AAD',
      expiry: 'o vencimento do AAD',
    },
    upcoming: (s, c, r, d) => `Escrevo sobre ${s} ${c}${r}: vence em ${d}.`,
    overdue: (s, c, r, d) => `Escrevo sobre ${s} ${c}${r}: venceu em ${d}.`,
    noDate: (s, c, r) => `Escrevo sobre ${s} ${c}${r}: não tenho a data registrada.`,
    closing: {
      repack: 'Combinamos a dobragem?',
      battery: 'Combinamos a troca?',
      service: 'Combinamos o envio para serviço?',
      expiry: 'Combinamos a substituição?',
    },
    rigPhrase: (rig) => ` do equipamento ${rig}`,
  },
};

export function contactMessage(input: ContactMessageInput): string {
  const words = WORDS[input.locale];
  const rig = input.rigName ? words.rigPhrase(input.rigName) : '';
  const subject = words.subject[input.dueKind];
  const body =
    input.dueOn === null
      ? words.noDate(subject, input.componentLabel, rig)
      : (input.daysLeft ?? 0) < 0
        ? words.overdue(subject, input.componentLabel, rig, input.dueOn)
        : words.upcoming(subject, input.componentLabel, rig, input.dueOn);
  return [words.greeting(input.ownerName, input.riggerName), body, words.closing[input.dueKind]].join(' ');
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${whatsappDigits(phone)}?text=${encodeURIComponent(text)}`;
}

export function contactLink(owner: { phone: string | null; email: string }, input: ContactMessageInput): string {
  const message = contactMessage(input);
  if (owner.phone) {
    return whatsappLink(owner.phone, message);
  }
  const subject = `${input.rigName ?? input.componentLabel}: ${WORDS[input.locale].subject[input.dueKind]}`;
  return `mailto:${encodeURIComponent(owner.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
