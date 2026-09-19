import { EmailSender, type EmailMessage } from './email-sender';

export class OverridingEmailSender extends EmailSender {
  constructor(
    private readonly inner: EmailSender,
    private readonly overrideTo: string,
  ) {
    super();
  }

  send(message: EmailMessage): Promise<void> {
    return this.inner.send({ ...message, to: this.overrideTo, subject: `[for ${message.to}] ${message.subject}` });
  }
}
