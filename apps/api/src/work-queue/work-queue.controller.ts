import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, type CustomerSummary, type WorkQueueResponse } from '@bendike/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../users/user.entity';
import { WorkQueueQueryDto } from './dto/work-queue-query.dto';
import { WorkQueueService } from './work-queue.service';

@ApiTags('work-queue')
@ApiBearerAuth()
@Controller('work-queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Rigger, Role.Admin)
export class WorkQueueController {
  constructor(private readonly queue: WorkQueueService) {}

  @Get()
  @ApiOperation({ summary: 'Reserves and AAD dates across the owners you look after, sorted and filtered' })
  list(@CurrentUser() actor: User, @Query() query: WorkQueueQueryDto): Promise<WorkQueueResponse> {
    return this.queue.queue(actor, query);
  }

  @Get('customers')
  @ApiOperation({ summary: 'The dropzones and customers you look after, with how many rigs need attention' })
  customers(@CurrentUser() actor: User): Promise<CustomerSummary[]> {
    return this.queue.customers(actor);
  }
}
