import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app.config.service';

export type TranslationTargetLocale = 'es' | 'pt';

export interface DeepLClient {
  translate(text: string, targetLocale: TranslationTargetLocale): Promise<string | null>;
}

const DEEPL_TARGET_LANG: Record<TranslationTargetLocale, string> = {
  es: 'ES',
  pt: 'PT-BR',
};

interface DeepLTranslateResponse {
  translations?: Array<{ text: string }>;
}

@Injectable()
export class HttpDeepLClient implements DeepLClient {
  constructor(private readonly config: AppConfigService) {}

  async translate(text: string, targetLocale: TranslationTargetLocale): Promise<string | null> {
    if (!this.config.deeplApiKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.config.deeplApiUrl}/v2/translate`, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${this.config.deeplApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: [text], target_lang: DEEPL_TARGET_LANG[targetLocale] }),
      });

      if (!response.ok) {
        return null;
      }

      const body = (await response.json()) as DeepLTranslateResponse;
      return body.translations?.[0]?.text ?? null;
    } catch {
      return null;
    }
  }
}
