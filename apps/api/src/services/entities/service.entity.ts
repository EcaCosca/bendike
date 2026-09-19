import type { LocalizedText, PriceCurrency, ServiceCategory, TranslationOverrides } from '@bendike/shared';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 20 })
  category!: ServiceCategory;

  @Column({ type: 'jsonb' })
  name!: LocalizedText;

  @Column({ type: 'jsonb' })
  summary!: LocalizedText;

  @Column({ name: 'description_md', type: 'jsonb' })
  descriptionMd!: LocalizedText;

  @Column({ name: 'turnaround_note', type: 'jsonb', nullable: true })
  turnaroundNote!: LocalizedText | null;

  @Column({ name: 'translation_overrides', type: 'jsonb', default: () => "'{}'" })
  translationOverrides!: TranslationOverrides;

  @Column({ name: 'price_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  priceAmount!: string | null;

  @Column({ name: 'price_currency', type: 'varchar', length: 3, nullable: true })
  priceCurrency!: PriceCurrency | null;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
