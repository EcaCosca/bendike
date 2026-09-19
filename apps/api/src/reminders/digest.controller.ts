import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Role } from '@bendike/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../users/user.entity';
import { CronSecretGuard } from './cron-secret.guard';
import { RunDigestQuery, UpdateRiggerSettingsDto } from './dto/digest.dto';
import { DigestJobService, type DigestJobReport } from './digest-job.service';
import { RiggerSettingsService, type RiggerSettingsView } from './rigger-settings.service';

@ApiTags('reminders')
@ApiSecurity('cron-secret')
@Controller('internal/jobs')
@UseGuards(CronSecretGuard)
export class DigestJobController {
  constructor(private readonly job: DigestJobService) {}

  @Post('repack-digest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Send today's digest emails to riggers; called by the scheduler with the x-cron-secret header",
  })
  run(): Promise<DigestJobReport> {
    return this.job.run({ dryRun: false });
  }
}

@ApiTags('reminders')
@ApiBearerAuth()
@Controller('admin/repack-digest')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminDigestController {
  constructor(private readonly job: DigestJobService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview the digests (default) or send them now with dryRun=false (admin only)' })
  run(@Query() query: RunDigestQuery): Promise<DigestJobReport> {
    return this.job.run({ dryRun: query.dryRun !== 'false', ...(query.riggerId ? { riggerId: query.riggerId } : {}) });
  }
}

@ApiTags('reminders')
@ApiBearerAuth()
@Controller('rigger-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Rigger)
export class RiggerSettingsController {
  constructor(private readonly settings: RiggerSettingsService) {}

  @Get()
  @ApiOperation({ summary: "The rigger's own settings" })
  get(@CurrentUser() actor: User): Promise<RiggerSettingsView> {
    return this.settings.get(actor.id);
  }

  @Put()
  @ApiOperation({ summary: 'Turn the daily digest email on or off' })
  update(@CurrentUser() actor: User, @Body() dto: UpdateRiggerSettingsDto): Promise<RiggerSettingsView> {
    return this.settings.update(actor.id, dto);
  }
}
