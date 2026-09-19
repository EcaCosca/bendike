import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryColumn({ type: 'varchar', length: 3 })
  currency!: 'ARS' | 'BRL';

  @Column({ name: 'usd_rate', type: 'numeric', precision: 14, scale: 6 })
  usdRate!: string;

  @Column({ length: 120 })
  source!: string;

  @Column({ name: 'fetched_at', type: 'timestamptz' })
  fetchedAt!: Date;

  @Column({ name: 'manual_override', default: false })
  manualOverride!: boolean;
}
