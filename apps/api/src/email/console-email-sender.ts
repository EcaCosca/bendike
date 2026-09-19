import { Injectable, Logger } from '@nestjs/common';
import { EmailSender, type EmailMessage } from './email-sender';

@Injectable()
export class ConsoleEmailSender extends EmailSender {
  private readonly logger = new Logger('Email');

  send(message: EmailMessage): Promise<void> {
    this.logger.log(`To: ${message.to} | Subject: ${message.subject}`);
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`\n${message.text}`);
    }
    return Promise.resolve();
  }
}
