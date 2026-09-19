import type { LocalizedText } from '@bendike/shared';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120, unique: true })
  slug!: string;

  @Column({ type: 'jsonb' })
  name!: LocalizedText;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category | null;

  @Column({ default: 0 })
  position!: number;
}
