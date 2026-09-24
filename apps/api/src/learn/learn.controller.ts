import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  LearnCollectionDetail,
  LearnItemDetail,
  LearnItemSummary,
  LearnRigSection,
  LearnTopic,
  Page,
} from '@bendike/shared';
import { LEARN_TOPICS } from '@bendike/shared';
import { IsIn, IsOptional } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { LearnQueryDto } from './dto/learn.dto';
import { LearnService } from './learn.service';

class CollectionsQuery {
  @IsOptional()
  @IsIn(LEARN_TOPICS)
  topic?: LearnTopic;
}

@ApiTags('learn')
@Controller('learn')
export class LearnController {
  constructor(private readonly learn: LearnService) {}

  @Get('items')
  @ApiOperation({ summary: 'Search the learning material (public, active items only)' })
  search(@Query() query: LearnQueryDto): Promise<Page<LearnItemSummary>> {
    return this.learn.search(query);
  }

  @Get('items/:slug')
  @ApiOperation({ summary: 'One learning item by slug, with its links' })
  bySlug(@Param('slug') slug: string): Promise<LearnItemDetail> {
    return this.learn.findBySlug(slug);
  }

  @Get('items/:slug/related')
  @ApiOperation({ summary: 'Up to six other items sharing a topic' })
  related(@Param('slug') slug: string): Promise<LearnItemSummary[]> {
    return this.learn.related(slug);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Curated collections, the start-here one first, optionally for one topic' })
  collections(@Query() query: CollectionsQuery): Promise<LearnCollectionDetail[]> {
    return this.learn.collections(query.topic);
  }

  @Get('collections/:slug')
  @ApiOperation({ summary: 'One collection with its items in order' })
  collection(@Param('slug') slug: string): Promise<LearnCollectionDetail> {
    return this.learn.collectionBySlug(slug);
  }

  @Get('for-product/:productId')
  @ApiOperation({ summary: 'Items linked to a product, or to its brand when the product has none' })
  forProduct(@Param('productId', ParseUUIDPipe) productId: string): Promise<LearnItemSummary[]> {
    return this.learn.forProduct(productId);
  }

  @Get('for-rig/:rigId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Items for the gear models of a rig the caller may read, grouped by component' })
  forRig(@CurrentUser() actor: User, @Param('rigId', ParseUUIDPipe) rigId: string): Promise<LearnRigSection[]> {
    return this.learn.forRig(actor, rigId);
  }

  @Get('for-gear-item/:gearItemId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Items for the gear model of one component the caller may read' })
  forGearItem(
    @CurrentUser() actor: User,
    @Param('gearItemId', ParseUUIDPipe) gearItemId: string,
  ): Promise<LearnItemSummary[]> {
    return this.learn.forGearItem(actor, gearItemId);
  }
}
