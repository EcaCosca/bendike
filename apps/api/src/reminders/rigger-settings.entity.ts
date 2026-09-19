import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('rigger_settings')
export class RiggerSettings {
  @PrimaryColumn({ name: 'rigger_id', type: 'uuid' })
  riggerId!: string;

  @Column({ name: 'digest_enabled', default: true })
  digestEnabled!: boolean;
}
