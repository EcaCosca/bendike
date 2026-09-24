import type { LearnTopic, LocalizedText } from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('learn_collections')
export class LearnCollection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 160, unique: true })
  slug!: string;

  @Column({ type: 'jsonb' })
  title!: LocalizedText;

  @Column({ type: 'jsonb' })
  intro!: LocalizedText;

  @Column({ type: 'varchar', length: 40 })
  topic!: LearnTopic;

  @Column({ name: 'start_here', default: false })
  startHere!: boolean;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('learn_collection_items')
export class LearnCollectionItem {
  @PrimaryColumn({ name: 'collection_id', type: 'uuid' })
  collectionId!: string;

  @PrimaryColumn({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @Column({ default: 0 })
  position!: number;
}
