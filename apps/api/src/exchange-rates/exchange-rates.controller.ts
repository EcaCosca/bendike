import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ExchangeRates } from '@bendike/shared';
import { Role } from '@bendike/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SetExchangeRateDto } from './dto/set-exchange-rate.dto';
import { ExchangeRatesService } from './exchange-rates.service';

function assertCurrency(value: string): 'ARS' | 'BRL' {
  if (value !== 'ARS' && value !== 'BRL') {
    throw new BadRequestException(`Unsupported currency: ${value}`);
  }
  return value;
}

@ApiTags('exchange-rates')
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRates: ExchangeRatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current USD-based exchange rates' })
  getRates(): Promise<ExchangeRates> {
    return this.exchangeRates.getRates();
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(204)
  @ApiOperation({ summary: 'Refresh non-overridden rates from the provider (admin only)' })
  refresh(): Promise<void> {
    return this.exchangeRates.refresh();
  }

  @Put(':currency')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Set a manual override rate for a currency (admin only)' })
  setOverride(@Param('currency') currency: string, @Body() body: SetExchangeRateDto) {
    return this.exchangeRates.setOverride(assertCurrency(currency), body.usdRate);
  }

  @Delete(':currency')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(204)
  @ApiOperation({ summary: 'Clear a manual override so the next refresh updates it again (admin only)' })
  clearOverride(@Param('currency') currency: string): Promise<void> {
    return this.exchangeRates.clearOverride(assertCurrency(currency));
  }
}
