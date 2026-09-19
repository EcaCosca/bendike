import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('container_details')
export class ContainerDetail {
  @PrimaryColumn({ name: 'gear_item_id', type: 'uuid' })
  gearItemId!: string;

  @Column({ name: 'harness_size', type: 'varchar', length: 40, nullable: true })
  harnessSize!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  tso!: string | null;
}

@Entity('main_details')
export class MainDetail {
  @PrimaryColumn({ name: 'gear_item_id', type: 'uuid' })
  gearItemId!: string;

  @Column({ name: 'size_sqft', type: 'int', nullable: true })
  sizeSqft!: number | null;

  @Column({ name: 'line_type', type: 'varchar', length: 60, nullable: true })
  lineType!: string | null;
}

@Entity('reserve_details')
export class ReserveDetail {
  @PrimaryColumn({ name: 'gear_item_id', type: 'uuid' })
  gearItemId!: string;

  @Column({ name: 'size_sqft', type: 'int', nullable: true })
  sizeSqft!: number | null;

  @Column({ name: 'repack_cycle_days', type: 'int', nullable: true })
  repackCycleDays!: number | null;

  @Column({ type: 'int', default: 0 })
  deployments!: number;
}

@Entity('aad_details')
export class AadDetail {
  @PrimaryColumn({ name: 'gear_item_id', type: 'uuid' })
  gearItemId!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  mode!: string | null;

  @Column({ name: 'battery_installed_on', type: 'date', nullable: true })
  batteryInstalledOn!: string | null;

  @Column({ name: 'battery_cycle_months', type: 'int', nullable: true })
  batteryCycleMonths!: number | null;

  @Column({ name: 'service_due_on', type: 'date', nullable: true })
  serviceDueOn!: string | null;

  @Column({ name: 'expires_on', type: 'date', nullable: true })
  expiresOn!: string | null;
}
