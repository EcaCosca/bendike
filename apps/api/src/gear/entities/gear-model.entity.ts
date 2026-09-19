import { GEAR_KINDS, type GearKind } from '@bendike/shared';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gear_models')
export class GearModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: GEAR_KINDS, enumName: 'gear_kind' })
  kind!: GearKind;

  @Column({ length: 120 })
  manufacturer!: string;

  @Column({ length: 120 })
  model!: string;

  @Column({ name: 'repack_cycle_days', type: 'int', nullable: true })
  repackCycleDays!: number | null;

  @Column({ name: 'service_interval_months', type: 'int', nullable: true })
  serviceIntervalMonths!: number | null;

  @Column({ name: 'battery_cycle_months', type: 'int', nullable: true })
  batteryCycleMonths!: number | null;

  @Column({ name: 'life_years', type: 'int', nullable: true })
  lifeYears!: number | null;

  @Column({ default: true })
  active!: boolean;
}
