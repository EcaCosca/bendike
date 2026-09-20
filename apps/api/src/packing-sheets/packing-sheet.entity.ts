import type { PackingElements, SheetProblem } from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('packing_sheets')
export class PackingSheet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rig_id', type: 'uuid' })
  rigId!: string;

  @Column({ name: 'reserve_item_id', type: 'uuid' })
  reserveItemId!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ name: 'rigger_id', type: 'uuid' })
  riggerId!: string;

  @Column({ type: 'varchar', length: 10, default: 'draft' })
  status!: 'draft' | 'signed';

  @Column({ name: 'sheet_no', type: 'int', nullable: true })
  sheetNo!: number | null;

  @Column({ name: 'performed_on', type: 'date' })
  performedOn!: string;

  @Column({ name: 'checklist_version', length: 40 })
  checklistVersion!: string;

  @Column({ name: 'checked_ids', type: 'text', array: true, default: () => "'{}'" })
  checkedIds!: string[];

  @Column({ name: 'bulletins_checked', type: 'boolean', nullable: true })
  bulletinsChecked!: boolean | null;

  @Column({ name: 'mard_connected', type: 'boolean', nullable: true })
  mardConnected!: boolean | null;

  @Column({ name: 'owner_name', length: 200, default: '' })
  ownerName!: string;

  @Column({ name: 'owner_address', length: 300, default: '' })
  ownerAddress!: string;

  @Column({ name: 'owner_phone', length: 60, default: '' })
  ownerPhone!: string;

  @Column({ name: 'owner_email', length: 200, default: '' })
  ownerEmail!: string;

  @Column({ name: 'manual_document_id', type: 'uuid', nullable: true })
  manualDocumentId!: string | null;

  @Column({ name: 'manual_label', type: 'varchar', length: 300, nullable: true })
  manualLabel!: string | null;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'jsonb', nullable: true })
  elements!: PackingElements | null;

  @Column({ type: 'jsonb', nullable: true })
  missing!: SheetProblem[] | null;

  @Column({ name: 'rigger_name', length: 200 })
  riggerName!: string;

  @Column({ name: 'rigger_licence', type: 'varchar', length: 120, nullable: true })
  riggerLicence!: string | null;

  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt!: Date | null;

  @Column({ name: 'entry_id', type: 'uuid', nullable: true })
  entryId!: string | null;

  @Column({ name: 'owner_notified_at', type: 'timestamptz', nullable: true })
  ownerNotifiedAt!: Date | null;

  @Column({ name: 'owner_notified_to', type: 'varchar', length: 200, nullable: true })
  ownerNotifiedTo!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
