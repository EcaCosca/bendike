import { LINK_STATUSES, type LinkStatus } from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rigger_links')
export class RiggerLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ name: 'rigger_id', type: 'uuid' })
  riggerId!: string;

  @Column({ type: 'varchar', length: 10, default: 'pending' })
  status!: LinkStatus;

  @Column({ name: 'initiated_by', type: 'uuid' })
  initiatedBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;
}

export const RIGGER_LINK_STATUSES = LINK_STATUSES;
