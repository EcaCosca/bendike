import {
  type BulletinSeverity,
  type BulletinStatus,
  type GroundingSource,
  type MatchConfidence,
  type MatchStatus,
} from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('service_bulletins')
export class ServiceBulletin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  manufacturer!: string;

  @Column({ length: 120 })
  reference!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ name: 'required_action', type: 'text' })
  requiredAction!: string;

  @Column({ name: 'source_url', type: 'varchar', length: 500, nullable: true })
  sourceUrl!: string | null;

  @Column({ name: 'issued_on', type: 'date' })
  issuedOn!: string;

  @Column({ type: 'varchar', length: 10 })
  severity!: BulletinSeverity;

  @Column({ type: 'varchar', length: 10, default: 'draft' })
  status!: BulletinStatus;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('bulletin_targets')
export class BulletinTarget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bulletin_id', type: 'uuid' })
  bulletinId!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  model!: string | null;

  @Column({ name: 'serial_from', type: 'varchar', length: 60, nullable: true })
  serialFrom!: string | null;

  @Column({ name: 'serial_to', type: 'varchar', length: 60, nullable: true })
  serialTo!: string | null;

  @Column({ name: 'manufactured_from', type: 'date', nullable: true })
  manufacturedFrom!: string | null;

  @Column({ name: 'manufactured_to', type: 'date', nullable: true })
  manufacturedTo!: string | null;
}

@Entity('bulletin_matches')
export class BulletinMatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bulletin_id', type: 'uuid' })
  bulletinId!: string;

  @Column({ name: 'gear_item_id', type: 'uuid' })
  gearItemId!: string;

  @Column({ type: 'varchar', length: 12 })
  confidence!: MatchConfidence;

  @Column({ type: 'varchar', length: 16, default: 'open' })
  status!: MatchStatus;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote!: string | null;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy!: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;
}

@Entity('groundings')
export class Grounding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rig_id', type: 'uuid', nullable: true })
  rigId!: string | null;

  @Column({ name: 'gear_item_id', type: 'uuid', nullable: true })
  gearItemId!: string | null;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', length: 10 })
  source!: GroundingSource;

  @Column({ name: 'bulletin_match_id', type: 'uuid', nullable: true })
  bulletinMatchId!: string | null;

  @Column({ name: 'opened_by', type: 'uuid' })
  openedBy!: string;

  @Column({ name: 'opened_at', type: 'timestamptz', default: () => 'now()' })
  openedAt!: Date;

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy!: string | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ name: 'close_note', type: 'text', nullable: true })
  closeNote!: string | null;
}
