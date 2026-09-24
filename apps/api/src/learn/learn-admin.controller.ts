import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { LearnCollectionSummary, LearnItemAdminDetail } from '@bendike/shared';
import { Role } from '@bendike/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../users/user.entity';
import {
  CreateLearnCollectionDto,
  CreateLearnItemDto,
  ReplaceLearnLinksDto,
  UpdateLearnCollectionDto,
  UpdateLearnCopyDto,
  UpdateLearnItemDto,
} from './dto/learn.dto';
import { LearnAdminService } from './learn-admin.service';

@ApiTags('learn-admin')
@ApiBearerAuth()
@Controller('admin/learn')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class LearnAdminController {
  constructor(private readonly admin: LearnAdminService) {}

  @Get('items')
  @ApiOperation({ summary: 'Every learning item, active or not, with its links (admin only)' })
  findAll(): Promise<LearnItemAdminDetail[]> {
    return this.admin.findAll();
  }

  @Post('items')
  @ApiOperation({ summary: 'Add an item from its https link; the embed is recognised from the URL (admin only)' })
  create(@CurrentUser() actor: User, @Body() dto: CreateLearnItemDto): Promise<LearnItemAdminDetail> {
    return this.admin.create(actor, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Edit an item; deactivating keeps it and hides it everywhere (admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLearnItemDto): Promise<LearnItemAdminDetail> {
    return this.admin.update(id, dto);
  }

  @Patch('items/:id/copy')
  @ApiOperation({ summary: 'Edit one locale of the title or summary and record the override (admin only)' })
  updateCopy(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLearnCopyDto): Promise<LearnItemAdminDetail> {
    return this.admin.updateCopy(id, dto);
  }

  @Put('items/:id/links')
  @ApiOperation({ summary: 'Replace the products, brands and gear models an item points at (admin only)' })
  replaceLinks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceLearnLinksDto,
  ): Promise<LearnItemAdminDetail> {
    return this.admin.replaceLinks(id, dto);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Every collection, active or not (admin only)' })
  collections(): Promise<LearnCollectionSummary[]> {
    return this.admin.findAllCollections();
  }

  @Post('collections')
  @ApiOperation({ summary: 'Create a collection; one start-here collection per topic (admin only)' })
  createCollection(@Body() dto: CreateLearnCollectionDto): Promise<LearnCollectionSummary> {
    return this.admin.createCollection(dto);
  }

  @Patch('collections/:id')
  @ApiOperation({ summary: 'Edit a collection, its members and its start-here flag (admin only)' })
  updateCollection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearnCollectionDto,
  ): Promise<LearnCollectionSummary> {
    return this.admin.updateCollection(id, dto);
  }
}
