import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app.config.service';
import { EmailSender, type EmailMessage } from './email-sender';

const RESEND_URL = 'https://api.resend.com/emails';

@Injectable()
export class ResendEmailSender extends EmailSender {
  constructor(private readonly config: AppConfigService) {
    super();
  }

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.config.resendApiKey ?? ''}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.config.emailFrom,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend refused the email (${response.status}): ${await response.text()}`);
    }
  }
}
