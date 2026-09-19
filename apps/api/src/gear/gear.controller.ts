import {
  Body,
  Controller,
  Delete,
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
import type {
  ComponentPartView,
  GearItemDetailView,
  GearItemView,
  GearOverview,
  MaintenanceEntryView,
  RigDetailView,
  RigView,
} from '@bendike/shared';
import { IsOptional, IsUUID } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { CreateGearItemDto, CreatePartDto, UpdateGearItemDto, UpdatePartDto } from './dto/gear-item.dto';
import { CreateMaintenanceEntryDto, VoidMaintenanceEntryDto } from './dto/maintenance.dto';
import { CreateRigDto, UpdateRigDto } from './dto/rig.dto';
import { GearReadService } from './gear-read.service';
import { GearService } from './gear.service';
import { MaintenanceService } from './maintenance.service';

class OverviewQuery {
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

@ApiTags('gear')
@ApiBearerAuth()
@Controller('gear')
@UseGuards(JwtAuthGuard)
export class GearController {
  constructor(
    private readonly read: GearReadService,
    private readonly gear: GearService,
    private readonly maintenance: MaintenanceService,
  ) {}

  @Get()
  @ApiOperation({ summary: "The signed-in account's rigs and spare gear with due dates and status" })
  overview(@CurrentUser() actor: User, @Query() query: OverviewQuery): Promise<GearOverview> {
    return this.read.overview(actor, query.ownerId);
  }

  @Get('rigs/:id')
  @ApiOperation({ summary: 'A rig with its components and the combined maintenance history' })
  rig(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<RigDetailView> {
    return this.read.rigDetail(actor, id);
  }

  @Post('rigs')
  @ApiOperation({ summary: 'Create a rig' })
  createRig(@CurrentUser() actor: User, @Body() dto: CreateRigDto): Promise<RigView> {
    return this.gear.createRig(actor, dto);
  }

  @Patch('rigs/:id')
  @ApiOperation({ summary: 'Rename a rig, change its notes, or mark it inactive or active' })
  updateRig(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRigDto,
  ): Promise<RigView> {
    return this.gear.updateRig(actor, id, dto);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'A component with its details, parts, due dates and history' })
  item(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<GearItemDetailView> {
    return this.read.itemDetail(actor, id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create a container, main, reserve or AAD, optionally assigned to a rig' })
  createItem(@CurrentUser() actor: User, @Body() dto: CreateGearItemDto): Promise<GearItemView> {
    return this.gear.createItem(actor, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Edit a component, move it between rigs, retire it, or change its details' })
  updateItem(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGearItemDto,
  ): Promise<GearItemView> {
    return this.gear.updateItem(actor, id, dto);
  }

  @Post('items/:id/parts')
  @ApiOperation({ summary: 'Add a part (bridle, pilot chute, risers, toggles, handles) to a component' })
  addPart(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePartDto,
  ): Promise<ComponentPartView> {
    return this.gear.addPart(actor, id, dto);
  }

  @Patch('parts/:id')
  @ApiOperation({ summary: 'Edit a part' })
  updatePart(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartDto,
  ): Promise<ComponentPartView> {
    return this.gear.updatePart(actor, id, dto);
  }

  @Delete('parts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a part' })
  deletePart(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.gear.deletePart(actor, id);
  }

  @Post('items/:id/maintenance')
  @ApiOperation({ summary: 'Log work done to a component; owners record it as unverified' })
  addEntry(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMaintenanceEntryDto,
  ): Promise<MaintenanceEntryView> {
    return this.maintenance.addEntry(actor, id, dto);
  }

  @Post('maintenance/:id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void an entry with a reason; entries are never edited or deleted' })
  voidEntry(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidMaintenanceEntryDto,
  ): Promise<MaintenanceEntryView> {
    return this.maintenance.voidEntry(actor, id, dto.reason);
  }

  @Post('maintenance/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an owner-reported entry (admin, or a linked rigger)' })
  verifyEntry(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<MaintenanceEntryView> {
    return this.maintenance.verifyEntry(actor, id);
  }
}
