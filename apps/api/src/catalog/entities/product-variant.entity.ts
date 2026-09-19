import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ length: 120 })
  sku!: string;

  @Column({ name: 'option_names', type: 'text', array: true })
  optionNames!: string[];

  @Column({ name: 'option_values', type: 'text', array: true })
  optionValues!: string[];

  @Column({ name: 'list_price_usd', type: 'numeric', precision: 12, scale: 2, nullable: true })
  listPriceUsd!: string | null;

  @Column({ default: true })
  active!: boolean;
}
