import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app.config.module';
import { AppConfigService } from '../config/app.config.service';
import { ConsoleEmailSender } from './console-email-sender';
import { EmailSender } from './email-sender';
import { OverridingEmailSender } from './overriding-email-sender';
import { ResendEmailSender } from './resend-email-sender';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: EmailSender,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): EmailSender => {
        const inner = config.emailProvider === 'resend' ? new ResendEmailSender(config) : new ConsoleEmailSender();
        return config.emailOverrideTo ? new OverridingEmailSender(inner, config.emailOverrideTo) : inner;
      },
    },
  ],
  exports: [EmailSender],
})
export class EmailModule {}
