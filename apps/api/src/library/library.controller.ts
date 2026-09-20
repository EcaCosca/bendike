import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LIBRARY_MAX_BYTES, Role, type LibraryDocumentView, type LibraryListResponse } from '@bendike/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../users/user.entity';
import { AddLibraryDocumentDto, ArchiveLibraryDocumentDto, ListLibraryQueryDto } from './dto/library.dto';
import { LibraryService } from './library.service';
import type { UploadedDocument } from './uploaded-document';

@ApiTags('library')
@ApiBearerAuth()
@Controller('library')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Rigger, Role.Admin)
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  @ApiOperation({ summary: 'Search the manual library (riggers and admins)' })
  list(@CurrentUser() actor: User, @Query() query: ListLibraryQueryDto): Promise<LibraryListResponse> {
    return this.library.list(actor, query);
  }

  @Post()
  @ApiOperation({ summary: 'Add a PDF (up to 25 MB) to the library' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: LIBRARY_MAX_BYTES } }))
  add(
    @CurrentUser() actor: User,
    @UploadedFile() file: UploadedDocument | undefined,
    @Body() body: AddLibraryDocumentDto,
  ): Promise<LibraryDocumentView> {
    return this.library.add(actor, file, body);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Download the stored file through the API; there is no public link' })
  async file(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const { bytes, fileName, mimeType } = await this.library.download(actor, id);
    return new StreamableFile(bytes, {
      type: mimeType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    });
  }

  @Post(':id/archive')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Archive a document with a reason; the stored file is kept (admin only)' })
  archive(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ArchiveLibraryDocumentDto,
  ): Promise<LibraryDocumentView> {
    return this.library.archive(actor, id, body.reason);
  }
}
