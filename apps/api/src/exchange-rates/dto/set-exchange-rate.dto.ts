import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class SetExchangeRateDto {
  @ApiProperty({ example: 1500.5 })
  @IsNumber()
  @IsPositive()
  usdRate!: number;
}
