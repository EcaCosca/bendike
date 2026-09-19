import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, type BulletinMatchView, type BulletinView, type GroundingView } from '@bendike/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../users/user.entity';
import { BulletinsService } from './bulletins.service';
import {
  CloseGroundingDto,
  CreateBulletinDto,
  MatchesQueryDto,
  OpenGroundingDto,
  ResolveMatchDto,
  UpdateBulletinDto,
} from './dto/bulletin.dto';
import { GroundingService } from './grounding.service';
import { MatchesService } from './matches.service';

@ApiTags('bulletins')
@ApiBearerAuth()
@Controller('bulletins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BulletinsController {
  constructor(
    private readonly bulletins: BulletinsService,
    private readonly matches: MatchesService,
  ) {}

  @Get()
  @Roles(Role.Rigger, Role.Admin)
  @ApiOperation({ summary: 'Published bulletins with the open matches in your scope (admins also see drafts)' })
  list(@CurrentUser() actor: User): Promise<BulletinView[]> {
    return this.bulletins.list(actor);
  }

  @Get('matches')
  @Roles(Role.Rigger, Role.Admin)
  @ApiOperation({ summary: 'Bulletin matches on the gear of the owners you look after' })
  listMatches(@CurrentUser() actor: User, @Query() query: MatchesQueryDto): Promise<BulletinMatchView[]> {
    return this.matches.list(actor, query);
  }

  @Post('matches/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Rigger, Role.Admin)
  @ApiOperation({ summary: 'Resolve a match as complied or not applicable; clears the grounding it opened' })
  resolve(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveMatchDto,
  ): Promise<BulletinMatchView> {
    return this.matches.resolve(actor, id, dto);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a bulletin as a draft (admin only)' })
  create(@CurrentUser() actor: User, @Body() dto: CreateBulletinDto): Promise<BulletinView> {
    return this.bulletins.create(actor, dto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Edit a bulletin; new targets on a published one add matches, never remove them' })
  update(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBulletinDto,
  ): Promise<BulletinView> {
    return this.bulletins.update(actor, id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Publish: find every affected component and open groundings for grounding bulletins' })
  publish(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<BulletinView> {
    return this.bulletins.publish(actor, id);
  }

  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Withdraw a published bulletin; the groundings it opened are closed' })
  withdraw(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<BulletinView> {
    return this.bulletins.withdraw(actor, id);
  }
}

@ApiTags('groundings')
@ApiBearerAuth()
@Controller('groundings')
@UseGuards(JwtAuthGuard)
export class GroundingsController {
  constructor(private readonly groundings: GroundingService) {}

  @Post()
  @ApiOperation({ summary: 'Ground a rig or a component (rigger with a link, or admin)' })
  open(@CurrentUser() actor: User, @Body() dto: OpenGroundingDto): Promise<GroundingView> {
    return this.groundings.open(actor, dto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Give the green light: clear a grounding with a note' })
  close(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseGroundingDto,
  ): Promise<GroundingView> {
    return this.groundings.close(actor, id, dto.note);
  }
}
