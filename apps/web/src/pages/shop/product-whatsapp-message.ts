import type { Locale } from '@bendike/shared';
import { WHATSAPP_NUMBER } from '../../components/site/site-content';
import i18n from '../../i18n/i18n';

export function buildProductWhatsappUrl(itemName: string, locale: Locale): string {
  const message = i18n.getFixedT(locale)('product.whatsappMessage', { item: itemName });
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
