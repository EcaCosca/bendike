import type { Locale } from '@bendike/shared';
import i18n from '../../i18n/i18n';
import { WHATSAPP_NUMBER } from '../../components/site/site-content';

export function buildServiceWhatsappUrl(serviceName: string, locale: Locale): string {
  const message = i18n.getFixedT(locale)('services.whatsappMessage', { service: serviceName });
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
