import { applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';

export function IsDateOnly() {
  return applyDecorators(
    Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property must be a date in YYYY-MM-DD form' }),
    IsISO8601({ strict: true, strictSeparator: true }),
  );
}
