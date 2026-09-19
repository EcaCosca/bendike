import { Logger } from '@nestjs/common';
import type { AppConfigService } from '../config/app.config.service';
import { ConsoleEmailSender } from './console-email-sender';
import type { EmailMessage, EmailSender } from './email-sender';
import { OverridingEmailSender } from './overriding-email-sender';
import { ResendEmailSender } from './resend-email-sender';

const message: EmailMessage = {
  to: 'rigger@bendike.example',
  subject: 'Three repacks coming up',
  text: 'Plain text body',
  html: '<p>HTML body</p>',
};

describe('ConsoleEmailSender', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
  });

  test('writes the message to the log instead of sending it', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    await new ConsoleEmailSender().send(message);

    expect(log).toHaveBeenCalledWith(expect.stringContaining('rigger@bendike.example'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Plain text body'));
  });

  test('never writes the body in production, only who and what subject', async () => {
    process.env.NODE_ENV = 'production';
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    await new ConsoleEmailSender().send(message);

    const logged = log.mock.calls.map((call) => String(call[0])).join('\n');
    expect(logged).toContain('rigger@bendike.example');
    expect(logged).not.toContain('Plain text body');
  });
});

describe('ResendEmailSender', () => {
  const config = { resendApiKey: 're_key', emailFrom: 'Bendike <hola@bendike.example>' } as AppConfigService;

  afterEach(() => jest.restoreAllMocks());

  test('posts the message to Resend with the key and the sender address', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"id":"1"}', { status: 200 }));

    await new ResendEmailSender(config).send(message);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_key');
    expect(JSON.parse(init.body as string)).toEqual({
      from: 'Bendike <hola@bendike.example>',
      to: ['rigger@bendike.example'],
      subject: 'Three repacks coming up',
      text: 'Plain text body',
      html: '<p>HTML body</p>',
    });
  });

  test('fails with the provider reason when Resend refuses, without leaking the key', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"message":"domain is not verified"}', { status: 403 }));

    const attempt = new ResendEmailSender(config).send(message);

    await expect(attempt).rejects.toThrow(/403.*domain is not verified/);
    await expect(attempt).rejects.not.toThrow(/re_key/);
  });

  test('fails when the network fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('socket hang up'));

    await expect(new ResendEmailSender(config).send(message)).rejects.toThrow('socket hang up');
  });
});

describe('OverridingEmailSender', () => {
  test('sends every message to the override address and says who it was meant for', async () => {
    const inner: EmailSender = { send: jest.fn().mockResolvedValue(undefined) };

    await new OverridingEmailSender(inner, 'eca@bendike.example').send(message);

    expect(inner.send).toHaveBeenCalledWith({
      ...message,
      to: 'eca@bendike.example',
      subject: '[for rigger@bendike.example] Three repacks coming up',
    });
  });
});
