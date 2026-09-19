import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsDateOnly } from './is-date-only';

class Sample {
  @IsDateOnly()
  day!: string;
}

async function errorsFor(day: unknown) {
  return validate(plainToInstance(Sample, { day }));
}

describe('IsDateOnly', () => {
  test.each(['2026-09-19', '2028-02-29', '1997-01-01'])('accepts %s', async (day) => {
    expect(await errorsFor(day)).toHaveLength(0);
  });

  test.each(['2026-13-01', '2026-02-30', '2026-9-19', '19/09/2026', '2026-09-19T10:00:00Z', '', 20260919, null])(
    'rejects %p',
    async (day) => {
      expect(await errorsFor(day)).not.toHaveLength(0);
    },
  );
});
