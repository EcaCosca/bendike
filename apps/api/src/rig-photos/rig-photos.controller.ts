import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RIG_PHOTO_MAX_BYTES, type RigCovers, type RigPhotoView } from '@bendike/shared';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { AddRigPhotoDto, RigCoversQueryDto, RigPhotosQueryDto } from './dto/rig-photo.dto';
import { RigPhotosService } from './rig-photos.service';
import type { UploadedPhoto } from './uploaded-photo';

const IMMUTABLE = 'private, max-age=31536000, immutable';

@ApiTags('rig-photos')
@ApiBearerAuth()
@Controller('rig-photos')
@UseGuards(JwtAuthGuard)
export class RigPhotosController {
  constructor(private readonly photos: RigPhotosService) {}

  @Post()
  @ApiOperation({ summary: 'Add a photo (JPEG, PNG or WebP, up to 8 MB) to a rig you can see' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: RIG_PHOTO_MAX_BYTES } }))
  add(
    @CurrentUser() actor: User,
    @UploadedFile() file: UploadedPhoto | undefined,
    @Body() body: AddRigPhotoDto,
  ): Promise<RigPhotoView> {
    return this.photos.add(actor, body.rigId, file, { caption: body.caption, entryId: body.entryId });
  }

  @Get()
  @ApiOperation({ summary: "A rig's photos, newest first" })
  list(@CurrentUser() actor: User, @Query() query: RigPhotosQueryDto): Promise<RigPhotoView[]> {
    return this.photos.list(actor, query.rigId);
  }

  @Get('covers')
  @ApiOperation({ summary: "The newest photo id of each of an owner's rigs (your own when no owner is given)" })
  covers(@CurrentUser() actor: User, @Query() query: RigCoversQueryDto): Promise<RigCovers> {
    return this.photos.covers(actor, query.ownerId ?? actor.id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'The photo, through the API only; it never changes, so it may be cached privately' })
  async file(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Pick<Response, 'setHeader'>,
  ): Promise<StreamableFile> {
    const { bytes, mimeType, fileName } = await this.photos.file(actor, id);
    res.setHeader('Cache-Control', IMMUTABLE);
    return new StreamableFile(bytes, {
      type: mimeType,
      disposition: `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a photo from every list; the stored file is kept' })
  remove(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.photos.remove(actor, id);
  }
}
