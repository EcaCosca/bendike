import type { DueKind, Locale, MaintenanceKind } from '@bendike/shared';
import type { Digest, DigestItem, DigestSection } from './digest';

interface Strings {
  subject: (total: number, overdue: number) => string;
  intro: (name: string) => string;
  sections: Record<DigestSection, string>;
  dueKinds: Record<DueKind, string>;
  workKinds: Partial<Record<MaintenanceKind, string>>;
  today: string;
  tomorrow: string;
  inDays: (n: number) => string;
  daysOverdue: (n: number) => string;
  contact: string;
  contactEmail: string;
  packedBy: string;
  on: string;
  verifyHint: string;
  openQueue: string;
  footer: string;
}

const STRINGS: Record<Locale, Strings> = {
  en: {
    subject: (n, o) => `Bendike: ${n} items need your attention (${o} overdue)`,
    intro: (name) => `Hi ${name}, here is what needs you today.`,
    sections: {
      overdue: 'Overdue',
      due_soon: 'Due soon',
      grounded: 'Grounded rigs',
      bulletin: 'Open service bulletins',
      verification: 'Awaiting your verification',
    },
    dueKinds: { repack: 'Repack', battery: 'Battery', service: 'Service', expiry: 'End of life' },
    workKinds: { repack: 'Repack', aad_service: 'AAD service', repair: 'Repair' },
    today: 'due today',
    tomorrow: 'due tomorrow',
    inDays: (n) => `in ${n} days`,
    daysOverdue: (n) => `${n} days overdue`,
    contact: 'Message on WhatsApp',
    contactEmail: 'Send an email',
    packedBy: 'packed by',
    on: 'on',
    verifyHint: 'Verify it in the work queue.',
    openQueue: 'Open your work queue',
    footer: 'You get this email once a day when something needs you. You can turn it off in your work queue.',
  },
  es: {
    subject: (n, o) => `Bendike: ${n} pendientes que requieren tu atención (${o} vencidos)`,
    intro: (name) => `Hola ${name}, esto es lo que necesita tu atención hoy.`,
    sections: {
      overdue: 'Vencidos',
      due_soon: 'Por vencer',
      grounded: 'Equipos en tierra',
      bulletin: 'Boletines de servicio abiertos',
      verification: 'Esperando tu verificación',
    },
    dueKinds: { repack: 'Plegado', battery: 'Batería', service: 'Service', expiry: 'Vencimiento' },
    workKinds: { repack: 'Plegado', aad_service: 'Service de AAD', repair: 'Reparación' },
    today: 'vence hoy',
    tomorrow: 'vence mañana',
    inDays: (n) => `en ${n} días`,
    daysOverdue: (n) => `vencido hace ${n} días`,
    contact: 'Escribir por WhatsApp',
    contactEmail: 'Escribir por email',
    packedBy: 'plegado por',
    on: 'el',
    verifyHint: 'Verificalo en tu lista de trabajo.',
    openQueue: 'Abrir tu lista de trabajo',
    footer: 'Recibís este email una vez por día cuando algo te necesita. Podés desactivarlo en tu lista de trabajo.',
  },
  pt: {
    subject: (n, o) => `Bendike: ${n} pendências que precisam da sua atenção (${o} vencidos)`,
    intro: (name) => `Olá ${name}, aqui está o que precisa de você hoje.`,
    sections: {
      overdue: 'Vencidos',
      due_soon: 'A vencer',
      grounded: 'Equipamentos em solo',
      bulletin: 'Boletins de serviço abertos',
      verification: 'Aguardando sua verificação',
    },
    dueKinds: { repack: 'Dobragem', battery: 'Bateria', service: 'Serviço', expiry: 'Fim de vida' },
    workKinds: { repack: 'Dobragem', aad_service: 'Serviço de AAD', repair: 'Reparo' },
    today: 'vence hoje',
    tomorrow: 'vence amanhã',
    inDays: (n) => `em ${n} dias`,
    daysOverdue: (n) => `vencido há ${n} dias`,
    contact: 'Escrever no WhatsApp',
    contactEmail: 'Escrever por email',
    packedBy: 'dobrado por',
    on: 'em',
    verifyHint: 'Verifique na sua lista de trabalho.',
    openQueue: 'Abrir sua lista de trabalho',
    footer:
      'Você recebe este email uma vez por dia quando algo precisa de você. Você pode desativar na sua lista de trabalho.',
  },
};

const SECTIONS: DigestSection[] = ['overdue', 'due_soon', 'grounded', 'bulletin', 'verification'];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function contactLabel(url: string, words: Strings): string {
  return url.startsWith('mailto:') ? words.contactEmail : words.contact;
}

function timing(item: DigestItem, words: Strings): string {
  if (item.daysLeft === null) return '';
  if (item.daysLeft < 0) return words.daysOverdue(-item.daysLeft);
  if (item.daysLeft === 0) return words.today;
  if (item.daysLeft === 1) return words.tomorrow;
  return words.inDays(item.daysLeft);
}

function lines(item: DigestItem, words: Strings): string[] {
  const where = [item.ownerName, item.rigName].filter(Boolean).join(' · ');
  if (item.note) {
    return [[where, item.componentLabel].filter(Boolean).join(' · '), item.note];
  }
  if (item.verification) {
    const v = item.verification;
    const contact = v.performedByContact ? ` (${v.performedByContact})` : '';
    return [
      `${where} · ${item.componentLabel}`,
      `${words.workKinds[v.kind] ?? v.kind} ${words.on} ${v.performedOn}, ${words.packedBy} ${v.performedByName}${contact}. ${words.verifyHint}`,
    ];
  }
  const due = item.dueKind ? `${words.dueKinds[item.dueKind]} ${item.dueOn ?? ''}` : '';
  const result = [`${where} · ${item.componentLabel}`, `${due.trim()} · ${timing(item, words)}`];
  if (item.contactUrl) result.push(`${contactLabel(item.contactUrl, words)}: ${item.contactUrl}`);
  return result;
}

export function renderDigest(digest: Digest, webBaseUrl: string): { subject: string; text: string; html: string } {
  const words = STRINGS[digest.rigger.locale];
  const overdue = digest.items.filter((i) => i.section === 'overdue').length;
  const queueUrl = `${webBaseUrl}/app/work`;
  const textParts: string[] = [words.intro(digest.rigger.displayName), ''];
  const htmlParts: string[] = [`<p>${escapeHtml(words.intro(digest.rigger.displayName))}</p>`];

  for (const section of SECTIONS) {
    const items = digest.items.filter((i) => i.section === section);
    if (items.length === 0) continue;
    textParts.push(words.sections[section].toUpperCase(), '');
    htmlParts.push(`<h3>${escapeHtml(words.sections[section])}</h3><ul>`);
    for (const item of items) {
      const itemLines = lines(item, words);
      textParts.push(...itemLines, '');
      const link = item.contactUrl
        ? ` <a href="${escapeHtml(item.contactUrl)}">${escapeHtml(contactLabel(item.contactUrl, words))}</a>`
        : '';
      htmlParts.push(`<li>${itemLines.slice(0, 2).map(escapeHtml).join('<br>')}${link}</li>`);
    }
    htmlParts.push('</ul>');
  }
  textParts.push(`${words.openQueue}: ${queueUrl}`, '', words.footer);
  htmlParts.push(
    `<p><a href="${escapeHtml(queueUrl)}">${escapeHtml(words.openQueue)}</a></p><p style="color:#666;font-size:12px">${escapeHtml(words.footer)}</p>`,
  );

  return { subject: words.subject(digest.items.length, overdue), text: textParts.join('\n'), html: htmlParts.join('') };
}
