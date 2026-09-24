import type {
  ContentLanguage,
  EmbedProvider,
  LearnFormat,
  LearnLevel,
  LearnTopic,
  LocalizedText,
  TranslationOverrides,
} from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('learn_items')
export class LearnItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 160, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 20 })
  format!: LearnFormat;

  @Column({ type: 'jsonb' })
  title!: LocalizedText;

  @Column({ type: 'jsonb' })
  summary!: LocalizedText;

  @Column({ name: 'translation_overrides', type: 'jsonb', default: () => "'{}'" })
  translationOverrides!: TranslationOverrides;

  @Column({ type: 'varchar', length: 160, nullable: true })
  author!: string | null;

  @Column({ name: 'source_name', length: 160 })
  sourceName!: string;

  @Column({ length: 2000 })
  url!: string;

  @Column({ name: 'embed_provider', type: 'varchar', length: 20, nullable: true })
  embedProvider!: EmbedProvider | null;

  @Column({ name: 'embed_id', type: 'varchar', length: 120, nullable: true })
  embedId!: string | null;

  @Column({ name: 'embed_kind', type: 'varchar', length: 20, nullable: true })
  embedKind!: 'video' | 'show' | 'episode' | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 2000, nullable: true })
  thumbnailUrl!: string | null;

  @Column({ name: 'content_language', type: 'varchar', length: 5 })
  contentLanguage!: ContentLanguage;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  topics!: LearnTopic[];

  @Column({ type: 'varchar', length: 20 })
  level!: LearnLevel;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes!: number | null;

  @Column({ name: 'published_at', type: 'date', nullable: true })
  publishedAt!: string | null;

  @Column({ name: 'buy_url', type: 'varchar', length: 2000, nullable: true })
  buyUrl!: string | null;

  @Column({ default: false })
  affiliate!: boolean;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
