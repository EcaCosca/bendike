import type { LocalizedText, PriceCurrency, ProductCondition, TranslationOverrides } from '@bendike/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';

export type ProductSource = 'manual' | 'squirrel';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 160, unique: true })
  slug!: string;

  @Column({ name: 'brand_id', type: 'uuid' })
  brandId!: string;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: 'brand_id' })
  brand?: Brand;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({ type: 'jsonb' })
  name!: LocalizedText;

  @Column({ type: 'jsonb' })
  summary!: LocalizedText;

  @Column({ name: 'description_md', type: 'jsonb' })
  descriptionMd!: LocalizedText;

  @Column({ name: 'translation_overrides', type: 'jsonb', default: () => "'{}'" })
  translationOverrides!: TranslationOverrides;

  @Column({ name: 'list_price_usd', type: 'numeric', precision: 12, scale: 2, nullable: true })
  listPriceUsd!: string | null;

  @Column({ name: 'markup_percent', type: 'numeric', precision: 5, scale: 2, default: 20 })
  markupPercent!: string;

  @Column({ type: 'varchar', length: 10, default: 'new' })
  condition!: ProductCondition;

  @Column({ name: 'price_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  priceAmount!: string | null;

  @Column({ name: 'price_currency', type: 'varchar', length: 3, nullable: true })
  priceCurrency!: PriceCurrency | null;

  @Column({ name: 'sold_at', type: 'timestamptz', nullable: true })
  soldAt!: Date | null;

  @Column({ name: 'made_to_order', default: false })
  madeToOrder!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'manual' })
  source!: ProductSource;

  @Column({ name: 'source_ref', type: 'varchar', length: 255, unique: true, nullable: true })
  sourceRef!: string | null;

  @Column({ name: 'source_url', type: 'varchar', length: 255, nullable: true })
  sourceUrl!: string | null;

  @Column({ name: 'manual_url', type: 'varchar', length: 255, nullable: true })
  manualUrl!: string | null;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants!: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product)
  images!: ProductImage[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
