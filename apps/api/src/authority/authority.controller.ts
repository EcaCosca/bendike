import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Role,
  type AuthorityGroundingRow,
  type AuthorityPage,
  type AuthorityRigRow,
  type AuthoritySheetRow,
  type AuthorityWorkRow,
  type RiggerRegistryRow,
} from '@bendike/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthorityService } from './authority.service';
import type { User } from '../users/user.entity';
import { PageQueryDto, RegistryQueryDto, RigsQueryDto } from './dto/authority.dto';

@ApiTags('authority')
@ApiBearerAuth()
@Controller('authority')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Authority, Role.Admin)
export class AuthorityController {
  constructor(private readonly authority: AuthorityService) {}

  @Get('riggers')
  @ApiOperation({ summary: 'The register of every rigger, searchable, with licence, activity and customers' })
  registry(@Query() query: RegistryQueryDto): Promise<AuthorityPage<RiggerRegistryRow>> {
    return this.authority.registry(query);
  }

  @Get('rigs')
  @ApiOperation({ summary: 'Every rig packed with a signed sheet, filtered by where its owner lives' })
  rigs(@CurrentUser() actor: User, @Query() query: RigsQueryDto): Promise<AuthorityPage<AuthorityRigRow>> {
    return this.authority.rigs(actor, query);
  }

  @Get('riggers/:id')
  @ApiOperation({ summary: 'One rigger of the register' })
  rigger(@Param('id', ParseUUIDPipe) id: string): Promise<RiggerRegistryRow> {
    return this.authority.rigger(id);
  }

  @Get('riggers/:id/sheets')
  @ApiOperation({ summary: "A rigger's signed packing sheets, newest first" })
  sheets(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PageQueryDto,
  ): Promise<AuthorityPage<AuthoritySheetRow>> {
    return this.authority.sheets(id, query.page ?? 1);
  }

  @Get('riggers/:id/work')
  @ApiOperation({ summary: 'Work a rigger recorded or verified, newest first' })
  work(@Param('id', ParseUUIDPipe) id: string, @Query() query: PageQueryDto): Promise<AuthorityPage<AuthorityWorkRow>> {
    return this.authority.work(id, query.page ?? 1);
  }

  @Get('riggers/:id/groundings')
  @ApiOperation({ summary: 'Groundings a rigger opened, newest first' })
  groundings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PageQueryDto,
  ): Promise<AuthorityPage<AuthorityGroundingRow>> {
    return this.authority.groundings(id, query.page ?? 1);
  }
}
