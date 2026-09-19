const PLAUSIBLE = /^\+[1-9]\d{7,14}$/;

export type PhoneResult = { valid: true; phone: string | null } | { valid: false };

export function normalizePhone(input: string): PhoneResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { valid: true, phone: null };
  }
  const compact = trimmed.replace(/[\s().-]/g, '');
  return PLAUSIBLE.test(compact) ? { valid: true, phone: compact } : { valid: false };
}

export function whatsappDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}
