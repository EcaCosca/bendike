import { PART_KINDS, type PartKind } from '@bendike/shared';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('component_parts')
export class ComponentPart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'gear_item_id', type: 'uuid' })
  gearItemId!: string;

  @Column({ type: 'enum', enum: PART_KINDS, enumName: 'part_kind' })
  kind!: PartKind;

  @Column({ length: 200 })
  description!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  serial!: string | null;

  @Column({ name: 'manufactured_on', type: 'date', nullable: true })
  manufacturedOn!: string | null;

  @Column({ type: 'text', default: '' })
  notes!: string;
}
