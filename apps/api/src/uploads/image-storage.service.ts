import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app.config.service';
import type { ImageType } from './image-type';

const PUBLIC_PREFIX = '/uploads/';
const EXTENSIONS: Record<ImageType, string> = { jpeg: 'jpg', png: 'png', webp: 'webp' };

@Injectable()
export class ImageStorageService {
  constructor(private readonly config: AppConfigService) {}

  private get root(): string {
    return resolve(this.config.uploadsDir);
  }

  async save(subdirectory: string, bytes: Buffer, type: ImageType): Promise<string> {
    const fileName = `${randomUUID()}.${EXTENSIONS[type]}`;
    const directory = join(this.root, subdirectory);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, fileName), bytes);
    return `${PUBLIC_PREFIX}${subdirectory}/${fileName}`;
  }

  async remove(publicUrl: string): Promise<void> {
    if (!publicUrl.startsWith(PUBLIC_PREFIX)) {
      return;
    }
    const target = resolve(this.root, publicUrl.slice(PUBLIC_PREFIX.length));
    if (!target.startsWith(this.root + sep)) {
      return;
    }
    await rm(target, { force: true });
  }
}
