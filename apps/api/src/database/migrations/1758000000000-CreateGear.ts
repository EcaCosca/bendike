import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGear1758000000000 implements MigrationInterface {
  name = 'CreateGear1758000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "gear_kind" AS ENUM ('container', 'main', 'reserve', 'aad')`);
    await queryRunner.query(
      `CREATE TYPE "part_kind" AS ENUM ('bridle', 'pilot_chute', 'risers', 'toggles', 'handles', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "maintenance_kind" AS ENUM
        ('repack', 'reline', 'kill_line', 'inspection', 'repair', 'battery', 'aad_service', 'assembly', 'other')`,
    );
    await queryRunner.query(`CREATE TYPE "inspection_result" AS ENUM ('passed', 'needs_work', 'grounded')`);

    await queryRunner.query(
      `CREATE TABLE "rigs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "notes" text NOT NULL DEFAULT '',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_rigs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_rigs_owner" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(`CREATE INDEX "idx_rigs_owner" ON "rigs" ("owner_id")`);

    await queryRunner.query(
      `CREATE TABLE "gear_models" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "kind" "gear_kind" NOT NULL,
        "manufacturer" character varying(120) NOT NULL,
        "model" character varying(120) NOT NULL,
        "repack_cycle_days" integer,
        "service_interval_months" integer,
        "battery_cycle_months" integer,
        "life_years" integer,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "pk_gear_models" PRIMARY KEY ("id"),
        CONSTRAINT "chk_gear_models_positive" CHECK (
          COALESCE("repack_cycle_days", 1) > 0 AND COALESCE("service_interval_months", 1) > 0
          AND COALESCE("battery_cycle_months", 1) > 0 AND COALESCE("life_years", 1) > 0)
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_gear_models_identity" ON "gear_models" ("kind", lower("manufacturer"), lower("model"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "gear_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "rig_id" uuid,
        "model_id" uuid,
        "kind" "gear_kind" NOT NULL,
        "manufacturer" character varying(120) NOT NULL,
        "model" character varying(120) NOT NULL,
        "serial" character varying(120),
        "manufactured_on" date,
        "notes" text NOT NULL DEFAULT '',
        "retired_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_gear_items" PRIMARY KEY ("id"),
        CONSTRAINT "fk_gear_items_owner" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_gear_items_rig" FOREIGN KEY ("rig_id") REFERENCES "rigs" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_gear_items_model" FOREIGN KEY ("model_id") REFERENCES "gear_models" ("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(`CREATE INDEX "idx_gear_items_owner" ON "gear_items" ("owner_id")`);
    await queryRunner.query(`CREATE INDEX "idx_gear_items_rig" ON "gear_items" ("rig_id")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_gear_items_rig_kind" ON "gear_items" ("rig_id", "kind") WHERE "rig_id" IS NOT NULL`,
    );

    await queryRunner.query(
      `CREATE TABLE "container_details" (
        "gear_item_id" uuid NOT NULL,
        "harness_size" character varying(40),
        "tso" character varying(60),
        CONSTRAINT "pk_container_details" PRIMARY KEY ("gear_item_id"),
        CONSTRAINT "fk_container_details_item" FOREIGN KEY ("gear_item_id") REFERENCES "gear_items" ("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "main_details" (
        "gear_item_id" uuid NOT NULL,
        "size_sqft" integer,
        "line_type" character varying(60),
        CONSTRAINT "pk_main_details" PRIMARY KEY ("gear_item_id"),
        CONSTRAINT "fk_main_details_item" FOREIGN KEY ("gear_item_id") REFERENCES "gear_items" ("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "reserve_details" (
        "gear_item_id" uuid NOT NULL,
        "size_sqft" integer,
        "repack_cycle_days" integer,
        "deployments" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_reserve_details" PRIMARY KEY ("gear_item_id"),
        CONSTRAINT "fk_reserve_details_item" FOREIGN KEY ("gear_item_id") REFERENCES "gear_items" ("id") ON DELETE CASCADE,
        CONSTRAINT "chk_reserve_details_cycle" CHECK ("repack_cycle_days" IS NULL OR "repack_cycle_days" > 0)
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "aad_details" (
        "gear_item_id" uuid NOT NULL,
        "mode" character varying(60),
        "battery_installed_on" date,
        "battery_cycle_months" integer,
        "service_due_on" date,
        "expires_on" date,
        CONSTRAINT "pk_aad_details" PRIMARY KEY ("gear_item_id"),
        CONSTRAINT "fk_aad_details_item" FOREIGN KEY ("gear_item_id") REFERENCES "gear_items" ("id") ON DELETE CASCADE
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "component_parts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "gear_item_id" uuid NOT NULL,
        "kind" "part_kind" NOT NULL,
        "description" character varying(200) NOT NULL,
        "serial" character varying(120),
        "manufactured_on" date,
        "notes" text NOT NULL DEFAULT '',
        CONSTRAINT "pk_component_parts" PRIMARY KEY ("id"),
        CONSTRAINT "fk_component_parts_item" FOREIGN KEY ("gear_item_id") REFERENCES "gear_items" ("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(`CREATE INDEX "idx_component_parts_item" ON "component_parts" ("gear_item_id")`);

    await queryRunner.query(
      `CREATE TABLE "maintenance_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "gear_item_id" uuid NOT NULL,
        "kind" "maintenance_kind" NOT NULL,
        "result" "inspection_result",
        "performed_on" date NOT NULL,
        "description" text NOT NULL,
        "performed_by" uuid,
        "performed_by_name" character varying(200) NOT NULL DEFAULT '',
        "performed_by_licence" character varying(120),
        "performed_by_contact" character varying(200),
        "owner_reported" boolean NOT NULL DEFAULT false,
        "verified_by" uuid,
        "verified_at" timestamptz,
        "voided_by" uuid,
        "voided_at" timestamptz,
        "void_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_maintenance_entries" PRIMARY KEY ("id"),
        CONSTRAINT "fk_maintenance_item" FOREIGN KEY ("gear_item_id") REFERENCES "gear_items" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_maintenance_performed_by" FOREIGN KEY ("performed_by") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_maintenance_verified_by" FOREIGN KEY ("verified_by") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_maintenance_voided_by" FOREIGN KEY ("voided_by") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "chk_maintenance_result_kind" CHECK ("result" IS NULL OR "kind" = 'inspection'),
        CONSTRAINT "chk_maintenance_void_reason" CHECK (("voided_at" IS NULL) = ("void_reason" IS NULL))
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maintenance_item_date" ON "maintenance_entries" ("gear_item_id", "performed_on" DESC)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "maintenance_entries"`);
    await queryRunner.query(`DROP TABLE "component_parts"`);
    await queryRunner.query(`DROP TABLE "aad_details"`);
    await queryRunner.query(`DROP TABLE "reserve_details"`);
    await queryRunner.query(`DROP TABLE "main_details"`);
    await queryRunner.query(`DROP TABLE "container_details"`);
    await queryRunner.query(`DROP TABLE "gear_items"`);
    await queryRunner.query(`DROP TABLE "gear_models"`);
    await queryRunner.query(`DROP TABLE "rigs"`);
    await queryRunner.query(`DROP TYPE "inspection_result"`);
    await queryRunner.query(`DROP TYPE "maintenance_kind"`);
    await queryRunner.query(`DROP TYPE "part_kind"`);
    await queryRunner.query(`DROP TYPE "gear_kind"`);
  }
}
