import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';

class HealthResponseDto {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status!: 'ok';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): HealthResponseDto {
    return { status: 'ok' };
  }
}
