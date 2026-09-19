import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app.config.module';
import { HttpDeepLClient } from './deepl-client';
import { TranslationService } from './translation.service';

@Module({
  imports: [AppConfigModule],
  providers: [HttpDeepLClient, TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
