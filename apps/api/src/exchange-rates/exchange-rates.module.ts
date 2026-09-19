import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../config/app.config.module';
import { ExchangeRateProviderClient } from './exchange-rate-provider.client';
import { ExchangeRate } from './exchange-rate.entity';
import { ExchangeRatesController } from './exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates.service';

@Module({
  imports: [AppConfigModule, TypeOrmModule.forFeature([ExchangeRate])],
  controllers: [ExchangeRatesController],
  providers: [ExchangeRateProviderClient, ExchangeRatesService],
  exports: [ExchangeRatesService],
})
export class ExchangeRatesModule {}
