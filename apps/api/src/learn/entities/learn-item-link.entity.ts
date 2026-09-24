import type { LearnLinkKind } from '@bendike/shared';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('learn_item_links')
export class LearnItemLink {
  @PrimaryColumn({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @PrimaryColumn({ name: 'target_kind', type: 'varchar', length: 12 })
  targetKind!: LearnLinkKind;

  @PrimaryColumn({ name: 'target_id', type: 'uuid' })
  targetId!: string;

  @Column({ default: 0 })
  position!: number;
}
