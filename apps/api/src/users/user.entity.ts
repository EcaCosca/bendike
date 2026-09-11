import { Role, ROLES } from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 320, unique: true })
  email!: string;

  @Column({ name: 'display_name', length: 120 })
  displayName!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: ROLES, enumName: 'user_role', default: Role.User })
  role!: Role;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
