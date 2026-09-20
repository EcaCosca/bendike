import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, type PackingJobView, type PackingSheetSummary, type PackingSheetView } from '@bendike/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../users/user.entity';
import {
  ListPackingSheetsQueryDto,
  SavePackingDraftDto,
  SignPackingSheetDto,
  StartPackingSheetDto,
  VoidPackingSheetDto,
} from './dto/packing-sheet.dto';
import { PackingSheetsService } from './packing-sheets.service';

@ApiTags('packing-sheets')
@ApiBearerAuth()
@Controller('packing-sheets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackingSheetsController {
  constructor(private readonly sheets: PackingSheetsService) {}

  @Post()
  @Roles(Role.Rigger, Role.Admin)
  @ApiOperation({ summary: "Start a reserve packing sheet for a rig, or get the rigger's open draft" })
  start(@CurrentUser() actor: User, @Body() dto: StartPackingSheetDto): Promise<PackingJobView> {
    return this.sheets.start(actor, dto.rigId);
  }

  @Get()
  @ApiOperation({ summary: 'The signed sheets of a rig or a reserve, newest first' })
  list(@CurrentUser() actor: User, @Query() query: ListPackingSheetsQueryDto): Promise<PackingSheetSummary[]> {
    return this.sheets.list(actor, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'A sheet: the draft with its components, links and manuals, or a signed sheet' })
  job(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<PackingJobView> {
    return this.sheets.job(actor, id);
  }

  @Put(':id')
  @Roles(Role.Rigger, Role.Admin)
  @ApiOperation({ summary: 'Save a draft (ticks, answers, owner details, notes, manual)' })
  save(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SavePackingDraftDto,
  ): Promise<PackingJobView> {
    return this.sheets.saveDraft(actor, id, dto);
  }

  @Post(':id/sign')
  @Roles(Role.Rigger, Role.Admin)
  @ApiOperation({ summary: 'Sign the sheet: numbers it, snapshots the gear and writes the repack entry' })
  sign(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignPackingSheetDto,
  ): Promise<PackingSheetView> {
    return this.sheets.sign(actor, id, dto.riggerLicence);
  }

  @Post(':id/notify-owner')
  @Roles(Role.Rigger, Role.Admin)
  @ApiOperation({ summary: 'Email the owner that the repack is done, with a WhatsApp button to the rigger' })
  notifyOwner(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<PackingSheetView> {
    return this.sheets.notifyOwner(actor, id);
  }

  @Post(':id/void')
  @Roles(Role.Rigger, Role.Admin)
  @ApiOperation({ summary: 'Void a signed sheet and its repack entry, with a reason' })
  void(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidPackingSheetDto,
  ): Promise<PackingSheetView> {
    return this.sheets.voidSheet(actor, id, dto.reason);
  }
}
