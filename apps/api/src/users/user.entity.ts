import { Role, ROLES, type CountryCode, type Locale } from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 320, unique: true })
  email!: string;

  @Column({ name: 'display_name', length: 120 })
  displayName!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'google_sub', type: 'varchar', length: 255, nullable: true, unique: true })
  googleSub!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 2, default: 'es' })
  locale!: Locale;

  @Column({ type: 'varchar', length: 2, nullable: true })
  country!: CountryCode | null;

  @Column({ type: 'enum', enum: ROLES, enumName: 'user_role', default: Role.User })
  role!: Role;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
