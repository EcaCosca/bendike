import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, type GearModelView } from '@bendike/shared';
import { IsBooleanString, IsOptional } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../users/user.entity';
import { CreateGearModelDto, SetBulletinsLinkDto, UpdateGearModelDto } from './dto/gear-model.dto';
import { GearModelsService } from './gear-models.service';

class ListModelsQuery {
  @IsOptional()
  @IsBooleanString()
  all?: string;
}

@ApiTags('gear-models')
@ApiBearerAuth()
@Controller('gear/models')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GearModelsController {
  constructor(private readonly models: GearModelsService) {}

  @Get()
  @ApiOperation({ summary: 'The model catalogue; admins can ask for inactive models too with all=true' })
  list(@CurrentUser() actor: User, @Query() query: ListModelsQuery): Promise<GearModelView[]> {
    return this.models.list(actor.role === Role.Admin && query.all === 'true');
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Add a model with its repack, service, battery and life rules (admin only)' })
  create(@Body() dto: CreateGearModelDto): Promise<GearModelView> {
    return this.models.create(dto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Change a model or its rules, or deactivate it (admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGearModelDto): Promise<GearModelView> {
    return this.models.update(id, dto);
  }

  @Put(':id/bulletins-link')
  @Roles(Role.Rigger, Role.Admin)
  @ApiOperation({ summary: "Save the manufacturer's service bulletins page for a model (riggers and admins)" })
  setBulletinsLink(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetBulletinsLinkDto): Promise<GearModelView> {
    return this.models.setBulletinsUrl(id, dto.url);
  }
}
