import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120, unique: true })
  slug!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ name: 'website_url', length: 255 })
  websiteUrl!: string;

  @Column({ default: true })
  active!: boolean;
}
