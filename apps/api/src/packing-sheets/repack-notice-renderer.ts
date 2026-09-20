import { GEAR_TIME_ZONE, whatsappLink, type Locale } from '@bendike/shared';

export interface RepackNoticeInput {
  locale: Locale;
  ownerName: string;
  rigName: string;
  reserve: { manufacturer: string; model: string; serial: string | null } | null;
  rigger: { name: string; licence: string; phone: string | null; email: string };
  performedOn: string;
  signedAt: Date;
  sheetNo: number;
  nextDueOn: string | null;
  notes: string;
  rigUrl: string;
}

interface Words {
  dateLocale: string;
  subject: (rig: string) => string;
  tag: string;
  title: string;
  intro: (owner: string, reserve: string | null, rig: string, rigger: string) => string;
  serial: string;
  contactLead: (rigger: string) => string;
  whatsappButton: (rigger: string) => string;
  emailButton: (rigger: string) => string;
  ownerMessage: (owner: string, rigger: string, rig: string) => string;
  mailSubject: (rig: string) => string;
  labels: {
    rig: string;
    reserve: string;
    repackDate: string;
    recorded: string;
    sheet: string;
    rigger: string;
    licence: string;
    nextDue: string;
    notes: string;
  };
  timeZone: string;
  viewRig: string;
  footer: (rigger: string) => string;
}

const WORDS: Record<Locale, Words> = {
  en: {
    dateLocale: 'en-GB',
    subject: (rig) => `Your reserve has been repacked: ${rig}`,
    tag: 'REPACK COMPLETE',
    title: 'Your reserve has been repacked',
    intro: (owner, reserve, rig, rigger) =>
      `Hello ${owner}, your reserve${reserve ? ` (${reserve})` : ''} on rig ${rig} has been repacked by ${rigger}.`,
    serial: 'serial',
    contactLead: (rigger) => `To arrange a pick-up, or anything else you need, get in touch with ${rigger} directly.`,
    whatsappButton: (rigger) => `Message ${rigger} on WhatsApp`,
    emailButton: (rigger) => `Send an email to ${rigger}`,
    ownerMessage: (owner, rigger, rig) =>
      `Hi ${rigger}, this is ${owner}. I saw that my reserve on rig ${rig} has been repacked. Can we arrange the pick-up?`,
    mailSubject: (rig) => `${rig}: reserve pick-up`,
    labels: {
      rig: 'Rig',
      reserve: 'Reserve',
      repackDate: 'Repack date',
      recorded: 'Recorded',
      sheet: 'Packing sheet',
      rigger: 'Rigger',
      licence: 'Licence',
      nextDue: 'Next repack due',
      notes: 'Notes from your rigger',
    },
    timeZone: 'Argentina time',
    viewRig: 'View your rig on Bendike',
    footer: (rigger) =>
      `Sent by Bendike on behalf of ${rigger}. You are receiving this because your rigger recorded a repack of your reserve.`,
  },
  es: {
    dateLocale: 'es-AR',
    subject: (rig) => `Tu reserva fue plegada: ${rig}`,
    tag: 'PLEGADO COMPLETADO',
    title: 'Tu reserva fue plegada',
    intro: (owner, reserve, rig, rigger) =>
      `Hola ${owner}, tu reserva${reserve ? ` (${reserve})` : ''} del equipo ${rig} fue plegada por ${rigger}.`,
    serial: 'serie',
    contactLead: (rigger) => `Para coordinar el retiro, o lo que necesites, escribile directamente a ${rigger}.`,
    whatsappButton: (rigger) => `Escribir a ${rigger} por WhatsApp`,
    emailButton: (rigger) => `Escribir un email a ${rigger}`,
    ownerMessage: (owner, rigger, rig) =>
      `Hola ${rigger}, soy ${owner}. Vi que mi reserva del equipo ${rig} ya está plegada. ¿Coordinamos el retiro?`,
    mailSubject: (rig) => `${rig}: retiro de la reserva`,
    labels: {
      rig: 'Equipo',
      reserve: 'Reserva',
      repackDate: 'Fecha de plegado',
      recorded: 'Registrado',
      sheet: 'Planilla de plegado',
      rigger: 'Rigger',
      licence: 'Licencia',
      nextDue: 'Próximo plegado',
      notes: 'Notas de tu rigger',
    },
    timeZone: 'hora de Argentina',
    viewRig: 'Ver tu equipo en Bendike',
    footer: (rigger) =>
      `Enviado por Bendike de parte de ${rigger}. Recibís este email porque tu rigger registró el plegado de tu reserva.`,
  },
  pt: {
    dateLocale: 'pt-BR',
    subject: (rig) => `Sua reserva foi dobrada: ${rig}`,
    tag: 'DOBRAGEM CONCLUÍDA',
    title: 'Sua reserva foi dobrada',
    intro: (owner, reserve, rig, rigger) =>
      `Olá ${owner}, sua reserva${reserve ? ` (${reserve})` : ''} do equipamento ${rig} foi dobrada por ${rigger}.`,
    serial: 'série',
    contactLead: (rigger) => `Para combinar a retirada, ou o que precisar, fale diretamente com ${rigger}.`,
    whatsappButton: (rigger) => `Escrever para ${rigger} no WhatsApp`,
    emailButton: (rigger) => `Enviar um email para ${rigger}`,
    ownerMessage: (owner, rigger, rig) =>
      `Olá ${rigger}, aqui é ${owner}. Vi que minha reserva do equipamento ${rig} já está dobrada. Combinamos a retirada?`,
    mailSubject: (rig) => `${rig}: retirada da reserva`,
    labels: {
      rig: 'Equipamento',
      reserve: 'Reserva',
      repackDate: 'Data da dobragem',
      recorded: 'Registrado',
      sheet: 'Ficha de dobragem',
      rigger: 'Rigger',
      licence: 'Licença',
      nextDue: 'Próxima dobragem',
      notes: 'Notas do seu rigger',
    },
    timeZone: 'horário da Argentina',
    viewRig: 'Ver seu equipamento na Bendike',
    footer: (rigger) =>
      `Enviado pela Bendike em nome de ${rigger}. Você recebe este email porque seu rigger registrou a dobragem da sua reserva.`,
  },
};

const NAVY = '#0B2545';
const GOLD = '#E0A406';
const FONT = 'Arial, Helvetica, sans-serif';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function dateOnly(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

function stamp(value: Date, words: Words): string {
  const date = new Intl.DateTimeFormat(words.dateLocale, { dateStyle: 'long', timeZone: GEAR_TIME_ZONE }).format(value);
  const time = new Intl.DateTimeFormat(words.dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: GEAR_TIME_ZONE,
  }).format(value);
  return `${date}, ${time} (${words.timeZone})`;
}

function contactTarget(input: RepackNoticeInput, words: Words): { url: string; label: string } {
  const message = words.ownerMessage(input.ownerName, input.rigger.name, input.rigName);
  if (input.rigger.phone) {
    return { url: whatsappLink(input.rigger.phone, message), label: words.whatsappButton(input.rigger.name) };
  }
  const url = `mailto:${encodeURIComponent(input.rigger.email)}?subject=${encodeURIComponent(words.mailSubject(input.rigName))}&body=${encodeURIComponent(message)}`;
  return { url, label: words.emailButton(input.rigger.name) };
}

export function renderRepackNotice(input: RepackNoticeInput): { subject: string; text: string; html: string } {
  const words = WORDS[input.locale];
  const reserveDesc = input.reserve ? `${input.reserve.manufacturer} ${input.reserve.model}`.trim() : null;
  const reserveWithSerial =
    input.reserve === null
      ? null
      : `${reserveDesc}${input.reserve.serial ? `, ${words.serial} ${input.reserve.serial}` : ''}`;
  const intro = words.intro(input.ownerName, reserveWithSerial, input.rigName, input.rigger.name);
  const contact = contactTarget(input, words);
  const { labels } = words;

  const rows: [string, string][] = [
    [labels.rig, input.rigName],
    ...(reserveWithSerial ? ([[labels.reserve, reserveWithSerial]] as [string, string][]) : []),
    [labels.repackDate, dateOnly(input.performedOn, words.dateLocale)],
    [labels.recorded, stamp(input.signedAt, words)],
    [labels.sheet, `#${input.sheetNo}`],
    [labels.rigger, input.rigger.name],
    [labels.licence, input.rigger.licence],
    ...(input.nextDueOn ? ([[labels.nextDue, dateOnly(input.nextDueOn, words.dateLocale)]] as [string, string][]) : []),
  ];
  const notes = input.notes.trim();

  const text = [
    'BENDIKE',
    words.tag,
    '',
    intro,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(notes ? ['', `${labels.notes}:`, notes] : []),
    '',
    words.contactLead(input.rigger.name),
    `${contact.label}: ${contact.url}`,
    '',
    `${words.viewRig}: ${input.rigUrl}`,
    '',
    words.footer(input.rigger.name),
  ].join('\n');

  const detailRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:9px 0;border-bottom:1px solid #E6EAF0;color:#5B6B7F;font-size:13px;width:38%;vertical-align:top">${escapeHtml(label)}</td><td style="padding:9px 0;border-bottom:1px solid #E6EAF0;color:${NAVY};font-size:14px;font-weight:600;vertical-align:top">${escapeHtml(value)}</td></tr>`,
    )
    .join('');
  const notesBlock = notes
    ? `<div style="margin:22px 0 0;padding:14px 16px;background:#F4F6FA;border-left:4px solid ${GOLD};border-radius:4px"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#5B6B7F;margin-bottom:6px">${escapeHtml(labels.notes)}</div><div style="font-size:14px;color:${NAVY};white-space:pre-wrap">${escapeHtml(notes)}</div></div>`
    : '';

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#EEF1F6"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F6;padding:24px 12px"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:10px;overflow:hidden;font-family:${FONT}"><tr><td style="background:${NAVY};padding:26px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:${FONT};font-size:26px;font-weight:700;letter-spacing:7px;color:#FFFFFF">BENDIKE</td><td align="right" style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:2px;color:${GOLD}">${escapeHtml(words.tag)}</td></tr></table></td></tr><tr><td style="background:${GOLD};height:4px;line-height:4px;font-size:0">&nbsp;</td></tr><tr><td style="padding:32px 32px 8px;font-family:${FONT}"><h1 style="margin:0 0 14px;font-size:22px;color:${NAVY}">${escapeHtml(words.title)}</h1><p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#22303F">${escapeHtml(intro)}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table>${notesBlock}<p style="margin:26px 0 16px;font-size:15px;line-height:1.55;color:#22303F">${escapeHtml(words.contactLead(input.rigger.name))}</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${GOLD};border-radius:6px"><a href="${escapeHtml(contact.url)}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:700;color:${NAVY};text-decoration:none">${escapeHtml(contact.label)}</a></td></tr></table><p style="margin:22px 0 0;font-size:14px"><a href="${escapeHtml(input.rigUrl)}" style="color:#1F4E8C">${escapeHtml(words.viewRig)}</a></p></td></tr><tr><td style="padding:26px 32px 30px;font-family:${FONT}"><div style="border-top:1px solid #E6EAF0;padding-top:16px;font-size:12px;line-height:1.5;color:#7A8899">${escapeHtml(words.footer(input.rigger.name))}</div></td></tr></table></td></tr></table></body></html>`;

  return { subject: words.subject(input.rigName), text, html };
}
