import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('digest_deliveries')
export class DigestDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rigger_id', type: 'uuid' })
  riggerId!: string;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId!: string;

  @Column({ type: 'varchar', length: 20 })
  kind!: string;

  @Column({ name: 'due_key', type: 'varchar', length: 10 })
  dueKey!: string;

  @Column({ name: 'last_status', type: 'varchar', length: 10 })
  lastStatus!: string;

  @Column({ name: 'sent_on', type: 'date' })
  sentOn!: string;

  @Column({ name: 'times_sent', type: 'int', default: 1 })
  timesSent!: number;
}
