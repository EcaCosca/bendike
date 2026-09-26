/**
 * Skydiving and BASE terms that machine translation gets wrong, and the readings a
 * jumper actually uses. Applied to DeepL's output, not instead of it.
 *
 * Two kinds of entry:
 *
 * - A word with a real translation nobody would guess from a dictionary. DeepL renders
 *   "flare" as "bengala" — a distress flare — where a canopy pilot means the flare at
 *   the end of the approach.
 * - A word the sport keeps in English. Spanish and Portuguese jumpers say "slider",
 *   "pro pack" and "pull-up cord"; translating those produces something correct and
 *   unreadable. These entries exist to put the English back after DeepL has helpfully
 *   removed it.
 *
 * Spanish is Rioplatense, because the loft is in Argentina. Portuguese is Brazilian,
 * matching `PT-BR` in the DeepL client.
 *
 * KNOWN LIMIT: this is word-for-word replacement, so it cannot fix agreement around
 * the word it changes. "los elevadores" becomes "los bandas" where a person would
 * write "las bandas", because the machine's noun was masculine and ours is feminine.
 * Fixing that properly needs a parser, not a lookup table. The backfill therefore
 * reports every field it touched so a native speaker can read them, and the point of
 * the table is to get the vocabulary right rather than to produce final copy.
 */

export interface GlossaryTerm {
  /** The English term, as it appears in our own copy. */
  en: string;
  /** What DeepL tends to produce, and what should be replaced. Matched case-insensitively. */
  wrong: string[];
  es: string;
  pt: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  // Canopy flight
  { en: 'flare', wrong: ['bengala', 'bengalas', 'sinalizador', 'llamarada', 'chama'], es: 'flare', pt: 'flare' },
  { en: 'canopy', wrong: ['dosel', 'copa', 'toldo', 'dossel'], es: 'campana', pt: 'vela' },
  { en: 'risers', wrong: ['elevadores', 'montantes', 'elevadoras'], es: 'bandas', pt: 'bandas' },
  { en: 'toggles', wrong: ['palancas', 'interruptores', 'alternâncias'], es: 'comandos', pt: 'comandos' },
  { en: 'brake', wrong: ['freno de mano', 'travão'], es: 'freno', pt: 'freio' },
  { en: 'line twist', wrong: ['giro de línea', 'torção de linha'], es: 'torcida de líneas', pt: 'torção de linhas' },
  { en: 'slider', wrong: ['deslizador', 'control deslizante', 'cursor'], es: 'slider', pt: 'slider' },
  { en: 'glide', wrong: ['planeo suave', 'deslizamiento'], es: 'planeo', pt: 'planeio' },

  // The rig
  { en: 'rig', wrong: ['aparejo', 'plataforma', 'equipamento de perfuração'], es: 'equipo', pt: 'equipamento' },
  { en: 'container', wrong: ['recipiente'], es: 'contenedor', pt: 'container' },
  // Eca, 2026-09-25: do not calque the English compound. "harness container system" is just
  // "contenedor" to anyone who owns one, and "beginner suit" is a traje de principiantes.
  {
    en: 'harness container system',
    wrong: ['sistema arnés-contenedor', 'sistema de arnés y contenedor', 'sistema arnés contenedor'],
    es: 'contenedor',
    pt: 'container',
  },
  {
    en: 'beginner suit',
    wrong: ['traje de iniciación', 'trajes de iniciación'],
    es: 'traje de principiantes',
    pt: 'roupa de iniciante',
  },
  { en: 'harness', wrong: ['arnés de seguridad', 'cablagem', 'chicote'], es: 'arnés', pt: 'arnês' },
  { en: 'pilot chute', wrong: ['paracaídas piloto', 'paraquedas piloto', 'pilotillo'], es: 'pilotín', pt: 'pilotinho' },
  { en: 'deployment bag', wrong: ['bolsa de despliegue', 'saco de implantação'], es: 'd-bag', pt: 'd-bag' },
  { en: 'bridle', wrong: ['brida', 'rédea', 'freio'], es: 'bridle', pt: 'bridle' },
  { en: 'reserve', wrong: ['reservar', 'reserva natural'], es: 'reserva', pt: 'reserva' },
  { en: 'main', wrong: ['principal red', 'rede principal'], es: 'principal', pt: 'principal' },
  { en: 'grommet', wrong: ['ojal', 'ilhó'], es: 'ojalillo', pt: 'ilhós' },
  {
    en: 'closing loop',
    wrong: ['bucle de cierre', 'laço de fechamento'],
    es: 'loop de cierre',
    pt: 'loop de fechamento',
  },
  { en: 'pull-up cord', wrong: ['cuerda de tracción', 'cordão de tração'], es: 'pull-up', pt: 'pull-up' },
  { en: 'hook knife', wrong: ['cuchillo de gancho', 'faca de gancho'], es: 'cuchillo gancho', pt: 'faca gancho' },

  // Packing
  { en: 'pack', wrong: ['empaquetar', 'embalar', 'empacotar'], es: 'plegar', pt: 'dobrar' },
  { en: 'repack', wrong: ['reempaquetar', 'reembalar'], es: 'replegado', pt: 'redobra' },
  { en: 'pro pack', wrong: ['paquete profesional', 'pacote profissional'], es: 'pro pack', pt: 'pro pack' },
  { en: 'flat pack', wrong: ['paquete plano', 'pacote plano', 'embalagem plana'], es: 'flat pack', pt: 'flat pack' },
  { en: 'stow', wrong: ['guardar', 'arrumar'], es: 'amarre', pt: 'elástico' },

  // Flying
  { en: 'wingsuit', wrong: ['traje de alas', 'traje aéreo', 'roupa de voo'], es: 'wingsuit', pt: 'wingsuit' },
  // Eca's calls, 2026-09-25: skydiving translates, mesh does not.
  {
    en: 'skydiving',
    wrong: ['skydive', 'salto en caída libre', 'paraquedismo esportivo'],
    es: 'paracaidismo',
    pt: 'paraquedismo',
  },
  { en: 'mesh', wrong: ['malla', 'todo malla', 'rede', 'tela'], es: 'mesh', pt: 'mesh' },
  {
    en: 'tracking suit',
    wrong: ['traje de seguimiento', 'roupa de rastreamento'],
    es: 'tracking suit',
    pt: 'tracking suit',
  },
  { en: 'exit', wrong: ['salida de emergencia', 'saída de emergência'], es: 'salida', pt: 'saída' },
  { en: 'start arc', wrong: ['arco de inicio', 'arco de partida'], es: 'start arc', pt: 'start arc' },
  { en: 'freefall', wrong: ['caída libre de', 'queda livre de'], es: 'caída libre', pt: 'queda livre' },
  { en: 'jump run', wrong: ['carrera de salto', 'corrida de salto'], es: 'pasada', pt: 'passagem' },
  { en: 'dropzone', wrong: ['zona de caída', 'zona de lançamento', 'zona de largada'], es: 'dropzone', pt: 'dropzone' },
  { en: 'load', wrong: ['carga útil'], es: 'tanda', pt: 'voo' },
  { en: 'slider up', wrong: ['deslizador arriba', 'deslizador para cima'], es: 'slider up', pt: 'slider up' },
  { en: 'slider off', wrong: ['deslizador apagado', 'deslizador desligado'], es: 'slider off', pt: 'slider off' },
  { en: 'static line', wrong: ['línea estática', 'linha estática'], es: 'static line', pt: 'static line' },
  { en: 'PCA', wrong: ['APC'], es: 'PCA', pt: 'PCA' },

  // Equipment we sell by name, which must never be translated
  { en: 'AAD', wrong: ['DAA', 'dispositivo de activación automática'], es: 'AAD', pt: 'AAD' },
  { en: 'rigger', wrong: ['aparejador', 'montador', 'perfurador'], es: 'rigger', pt: 'rigger' },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces the machine's readings with the sport's, in one locale's text.
 *
 * Whole words only, case-insensitive, and the replacement keeps the case pattern of
 * what it replaces so a term at the start of a sentence stays capitalised.
 */
export function applyGlossary(text: string, locale: 'es' | 'pt'): string {
  let result = text;
  for (const term of GLOSSARY) {
    const right = term[locale];
    // Longest first, so "todo malla" is replaced whole rather than leaving "todo mesh"
    // behind after the shorter "malla" matched inside it.
    for (const wrong of [...term.wrong].sort((a, b) => b.length - a.length)) {
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(wrong)}(?![\\p{L}\\p{N}])`, 'giu');
      result = result.replace(pattern, (match) => matchCase(match, right));
    }
  }
  return result;
}

function matchCase(source: string, replacement: string): string {
  if (source === source.toUpperCase() && source !== source.toLowerCase()) {
    return replacement.toUpperCase();
  }
  if (source[0] === source[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Terms present in the English whose translation never made it into the output.
 * Not an error — a sentence can be recast so a term legitimately disappears — but
 * worth a human eye, so the backfill reports them instead of silently accepting.
 */
export function missingTerms(english: string, translated: string, locale: 'es' | 'pt'): string[] {
  const lowerEnglish = english.toLowerCase();
  const lowerTranslated = translated.toLowerCase();
  return GLOSSARY.filter(
    (term) => lowerEnglish.includes(term.en.toLowerCase()) && !lowerTranslated.includes(term[locale].toLowerCase()),
  ).map((term) => term.en);
}
