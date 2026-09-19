import { INSPECTION_RESULTS, MAINTENANCE_KINDS, type InspectionResult, type MaintenanceKind } from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('maintenance_entries')
export class MaintenanceEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'gear_item_id', type: 'uuid' })
  gearItemId!: string;

  @Column({ type: 'enum', enum: MAINTENANCE_KINDS, enumName: 'maintenance_kind' })
  kind!: MaintenanceKind;

  @Column({ type: 'enum', enum: INSPECTION_RESULTS, enumName: 'inspection_result', nullable: true })
  result!: InspectionResult | null;

  @Column({ name: 'performed_on', type: 'date' })
  performedOn!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedById!: string | null;

  @Column({ name: 'performed_by_name', length: 200, default: '' })
  performedByName!: string;

  @Column({ name: 'performed_by_licence', type: 'varchar', length: 120, nullable: true })
  performedByLicence!: string | null;

  @Column({ name: 'performed_by_contact', type: 'varchar', length: 200, nullable: true })
  performedByContact!: string | null;

  @Column({ name: 'owner_reported', default: false })
  ownerReported!: boolean;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedById!: string | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'voided_by', type: 'uuid', nullable: true })
  voidedById!: string | null;

  @Column({ name: 'voided_at', type: 'timestamptz', nullable: true })
  voidedAt!: Date | null;

  @Column({ name: 'void_reason', type: 'text', nullable: true })
  voidReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
