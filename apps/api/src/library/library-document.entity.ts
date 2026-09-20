import { LIBRARY_DOCUMENT_KINDS, type LibraryDocumentKind } from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('library_documents')
export class LibraryDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'enum', enum: LIBRARY_DOCUMENT_KINDS, enumName: 'library_document_kind' })
  kind!: LibraryDocumentKind;

  @Column({ length: 120 })
  manufacturer!: string;

  @Column({ name: 'model_id', type: 'uuid', nullable: true })
  modelId!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  revision!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  language!: string | null;

  @Column({ name: 'source_url', type: 'varchar', length: 2000, nullable: true })
  sourceUrl!: string | null;

  @Column({ name: 'file_name', length: 200 })
  fileName!: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number;

  @Column({ length: 64, unique: true })
  sha256!: string;

  @Column({ name: 'storage_key', length: 200 })
  storageKey!: string;

  @Column({ name: 'added_by', type: 'uuid' })
  addedById!: string;

  @Column({ name: 'added_by_name', length: 200 })
  addedByName!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @Column({ name: 'archived_by', type: 'uuid', nullable: true })
  archivedById!: string | null;

  @Column({ name: 'archive_reason', type: 'text', nullable: true })
  archiveReason!: string | null;
}
