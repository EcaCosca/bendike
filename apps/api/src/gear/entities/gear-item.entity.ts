import { GEAR_KINDS, type GearKind } from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('gear_items')
export class GearItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ name: 'rig_id', type: 'uuid', nullable: true })
  rigId!: string | null;

  @Column({ name: 'model_id', type: 'uuid', nullable: true })
  modelId!: string | null;

  @Column({ type: 'enum', enum: GEAR_KINDS, enumName: 'gear_kind' })
  kind!: GearKind;

  @Column({ length: 120 })
  manufacturer!: string;

  @Column({ length: 120 })
  model!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  serial!: string | null;

  @Column({ name: 'manufactured_on', type: 'date', nullable: true })
  manufacturedOn!: string | null;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ name: 'retired_at', type: 'timestamptz', nullable: true })
  retiredAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
