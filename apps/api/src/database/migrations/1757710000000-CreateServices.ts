import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServices1757710000000 implements MigrationInterface {
  name = 'CreateServices1757710000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(120) NOT NULL,
        "category" character varying(20) NOT NULL,
        "name" jsonb NOT NULL,
        "summary" jsonb NOT NULL,
        "description_md" jsonb NOT NULL,
        "turnaround_note" jsonb,
        "translation_overrides" jsonb NOT NULL DEFAULT '{}',
        "price_amount" numeric(12,2),
        "price_currency" character varying(3),
        "position" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_services" PRIMARY KEY ("id"),
        CONSTRAINT "uq_services_slug" UNIQUE ("slug"),
        CONSTRAINT "chk_services_category" CHECK ("category" IN ('repack', 'aad_service', 'repair', 'reline', 'other')),
        CONSTRAINT "chk_services_price_currency" CHECK ("price_currency" IS NULL OR "price_currency" IN ('ARS', 'USD')),
        CONSTRAINT "chk_services_price_pair" CHECK (("price_amount" IS NULL) = ("price_currency" IS NULL))
      )`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "services"`);
  }
}
