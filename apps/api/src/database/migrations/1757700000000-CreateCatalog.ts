import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalog1757700000000 implements MigrationInterface {
  name = 'CreateCatalog1757700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "brands" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(120) NOT NULL,
        "name" character varying(120) NOT NULL,
        "website_url" character varying(255) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "pk_brands" PRIMARY KEY ("id"),
        CONSTRAINT "uq_brands_slug" UNIQUE ("slug")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(120) NOT NULL,
        "name" jsonb NOT NULL,
        "parent_id" uuid,
        "position" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_categories" PRIMARY KEY ("id"),
        CONSTRAINT "uq_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "fk_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") ON DELETE SET NULL
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(160) NOT NULL,
        "brand_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "name" jsonb NOT NULL,
        "summary" jsonb NOT NULL,
        "description_md" jsonb NOT NULL,
        "translation_overrides" jsonb NOT NULL DEFAULT '{}',
        "list_price_usd" numeric(12,2),
        "markup_percent" numeric(5,2) NOT NULL DEFAULT 20,
        "made_to_order" boolean NOT NULL DEFAULT false,
        "source" character varying(20) NOT NULL DEFAULT 'manual',
        "source_ref" character varying(255),
        "source_url" character varying(255),
        "manual_url" character varying(255),
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_products" PRIMARY KEY ("id"),
        CONSTRAINT "uq_products_slug" UNIQUE ("slug"),
        CONSTRAINT "uq_products_source_ref" UNIQUE ("source_ref"),
        CONSTRAINT "fk_products_brand" FOREIGN KEY ("brand_id") REFERENCES "brands" ("id"),
        CONSTRAINT "fk_products_category" FOREIGN KEY ("category_id") REFERENCES "categories" ("id"),
        CONSTRAINT "chk_products_active_needs_price" CHECK (NOT "active" OR "list_price_usd" IS NOT NULL)
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "product_variants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "sku" character varying(120) NOT NULL,
        "option_names" text[] NOT NULL,
        "option_values" text[] NOT NULL,
        "list_price_usd" numeric(12,2),
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "pk_product_variants" PRIMARY KEY ("id"),
        CONSTRAINT "fk_product_variants_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "product_images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "url" character varying(500) NOT NULL,
        "alt" character varying(255) NOT NULL DEFAULT '',
        "position" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_product_images" PRIMARY KEY ("id"),
        CONSTRAINT "fk_product_images_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "exchange_rates" (
        "currency" character varying(3) NOT NULL,
        "usd_rate" numeric(14,6) NOT NULL,
        "source" character varying(120) NOT NULL,
        "fetched_at" timestamptz NOT NULL,
        "manual_override" boolean NOT NULL DEFAULT false,
        CONSTRAINT "pk_exchange_rates" PRIMARY KEY ("currency")
      )`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "exchange_rates"`);
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(`DROP TABLE "product_variants"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "brands"`);
  }
}
