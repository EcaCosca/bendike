import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsedGearToProducts1757720000000 implements MigrationInterface {
  name = 'AddUsedGearToProducts1757720000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products"
        ADD COLUMN "condition" character varying(10) NOT NULL DEFAULT 'new',
        ADD COLUMN "price_amount" numeric(12,2),
        ADD COLUMN "price_currency" character varying(3),
        ADD COLUMN "sold_at" timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "products"
        ADD CONSTRAINT "chk_products_condition" CHECK ("condition" IN ('new', 'used')),
        ADD CONSTRAINT "chk_products_price_currency" CHECK ("price_currency" IS NULL OR "price_currency" IN ('ARS', 'USD')),
        ADD CONSTRAINT "chk_products_price_pair" CHECK (("price_amount" IS NULL) = ("price_currency" IS NULL))`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "chk_products_active_needs_price"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "chk_products_active_needs_price"
        CHECK (NOT "active" OR "list_price_usd" IS NOT NULL OR "price_amount" IS NOT NULL)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "chk_products_active_needs_price"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "chk_products_active_needs_price"
        CHECK (NOT "active" OR "list_price_usd" IS NOT NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products"
        DROP CONSTRAINT "chk_products_price_pair",
        DROP CONSTRAINT "chk_products_price_currency",
        DROP CONSTRAINT "chk_products_condition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "sold_at", DROP COLUMN "price_currency", DROP COLUMN "price_amount", DROP COLUMN "condition"`,
    );
  }
}
