import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RiggerLinkView, RiggerSummary } from '@bendike/shared';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { CreateRiggerLinkDto } from './dto/create-rigger-link.dto';
import { RiggerLinksService } from './rigger-links.service';

class SearchQuery {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;
}

@ApiTags('rigger-links')
@ApiBearerAuth()
@Controller('rigger-links')
@UseGuards(JwtAuthGuard)
export class RiggerLinksController {
  constructor(private readonly links: RiggerLinksService) {}

  @Get()
  @ApiOperation({ summary: 'Your pending and active links, from either side' })
  list(@CurrentUser() actor: User): Promise<RiggerLinkView[]> {
    return this.links.listFor(actor);
  }

  @Post()
  @ApiOperation({ summary: 'Ask a rigger to look after your gear, or add a dropzone or customer as a rigger' })
  create(@CurrentUser() actor: User, @Body() dto: CreateRiggerLinkDto): Promise<RiggerLinkView> {
    return this.links.create(actor, dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a request made by the other side' })
  confirm(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<RiggerLinkView> {
    return this.links.confirm(actor, id);
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a request made by the other side' })
  decline(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<RiggerLinkView> {
    return this.links.decline(actor, id);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End an active link, or cancel a pending request; the rigger loses access at once' })
  end(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<RiggerLinkView> {
    return this.links.end(actor, id);
  }
}

@ApiTags('rigger-links')
@ApiBearerAuth()
@Controller('riggers')
@UseGuards(JwtAuthGuard)
export class RiggersController {
  constructor(private readonly links: RiggerLinksService) {}

  @Get()
  @ApiOperation({ summary: 'Find riggers by name; contact details are not shown until a link is active' })
  search(@CurrentUser() actor: User, @Query() query: SearchQuery): Promise<RiggerSummary[]> {
    return this.links.searchRiggers(actor, query.search ?? '');
  }
}
