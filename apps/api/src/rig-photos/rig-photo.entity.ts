import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rig_photos')
export class RigPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rig_id', type: 'uuid' })
  rigId!: string;

  @Column({ name: 'entry_id', type: 'uuid', nullable: true })
  entryId!: string | null;

  @Column({ name: 'storage_key', length: 200 })
  storageKey!: string;

  @Column({ name: 'file_name', length: 200 })
  fileName!: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number;

  @Column({ length: 300, default: '' })
  caption!: string;

  @Column({ name: 'added_by', type: 'uuid' })
  addedById!: string;

  @Column({ name: 'added_by_name', length: 200 })
  addedByName!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'removed_at', type: 'timestamptz', nullable: true })
  removedAt!: Date | null;

  @Column({ name: 'removed_by', type: 'uuid', nullable: true })
  removedById!: string | null;
}
