import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBulletinsAndGroundings1758500000000 implements MigrationInterface {
  name = 'CreateBulletinsAndGroundings1758500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "service_bulletins" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "manufacturer" character varying(120) NOT NULL,
        "reference" character varying(120) NOT NULL,
        "title" character varying(200) NOT NULL,
        "summary" text NOT NULL,
        "required_action" text NOT NULL,
        "source_url" character varying(500),
        "issued_on" date NOT NULL,
        "severity" character varying(10) NOT NULL,
        "status" character varying(10) NOT NULL DEFAULT 'draft',
        "created_by" uuid NOT NULL,
        "published_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_service_bulletins" PRIMARY KEY ("id"),
        CONSTRAINT "fk_service_bulletins_creator" FOREIGN KEY ("created_by") REFERENCES "users" ("id"),
        CONSTRAINT "chk_service_bulletins_severity" CHECK ("severity" IN ('advisory', 'mandatory', 'grounding')),
        CONSTRAINT "chk_service_bulletins_status" CHECK ("status" IN ('draft', 'published', 'withdrawn'))
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "bulletin_targets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "bulletin_id" uuid NOT NULL,
        "model" character varying(120),
        "serial_from" character varying(60),
        "serial_to" character varying(60),
        "manufactured_from" date,
        "manufactured_to" date,
        CONSTRAINT "pk_bulletin_targets" PRIMARY KEY ("id"),
        CONSTRAINT "fk_bulletin_targets_bulletin" FOREIGN KEY ("bulletin_id") REFERENCES "service_bulletins" ("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "bulletin_matches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "bulletin_id" uuid NOT NULL,
        "gear_item_id" uuid NOT NULL,
        "confidence" character varying(12) NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'open',
        "resolution_note" text,
        "resolved_by" uuid,
        "resolved_at" timestamptz,
        CONSTRAINT "pk_bulletin_matches" PRIMARY KEY ("id"),
        CONSTRAINT "fk_bulletin_matches_bulletin" FOREIGN KEY ("bulletin_id") REFERENCES "service_bulletins" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_bulletin_matches_item" FOREIGN KEY ("gear_item_id") REFERENCES "gear_items" ("id") ON DELETE CASCADE,
        CONSTRAINT "uq_bulletin_matches_pair" UNIQUE ("bulletin_id", "gear_item_id"),
        CONSTRAINT "chk_bulletin_matches_confidence" CHECK ("confidence" IN ('exact', 'needs_review')),
        CONSTRAINT "chk_bulletin_matches_status" CHECK ("status" IN ('open', 'complied', 'not_applicable'))
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "groundings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rig_id" uuid,
        "gear_item_id" uuid,
        "reason" text NOT NULL,
        "source" character varying(10) NOT NULL,
        "bulletin_match_id" uuid,
        "opened_by" uuid NOT NULL,
        "opened_at" timestamptz NOT NULL DEFAULT now(),
        "closed_by" uuid,
        "closed_at" timestamptz,
        "close_note" text,
        CONSTRAINT "pk_groundings" PRIMARY KEY ("id"),
        CONSTRAINT "fk_groundings_rig" FOREIGN KEY ("rig_id") REFERENCES "rigs" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_groundings_item" FOREIGN KEY ("gear_item_id") REFERENCES "gear_items" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_groundings_match" FOREIGN KEY ("bulletin_match_id") REFERENCES "bulletin_matches" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_groundings_opener" FOREIGN KEY ("opened_by") REFERENCES "users" ("id"),
        CONSTRAINT "fk_groundings_closer" FOREIGN KEY ("closed_by") REFERENCES "users" ("id"),
        CONSTRAINT "chk_groundings_target" CHECK (("rig_id" IS NULL) <> ("gear_item_id" IS NULL)),
        CONSTRAINT "chk_groundings_source" CHECK ("source" IN ('manual', 'bulletin')),
        CONSTRAINT "chk_groundings_bulletin" CHECK ("source" <> 'bulletin' OR "bulletin_match_id" IS NOT NULL),
        CONSTRAINT "chk_groundings_closed" CHECK (("closed_at" IS NULL) = ("closed_by" IS NULL))
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_groundings_open_rig" ON "groundings" ("rig_id") WHERE "closed_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_groundings_open_item" ON "groundings" ("gear_item_id") WHERE "closed_at" IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX "idx_bulletin_matches_item" ON "bulletin_matches" ("gear_item_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "groundings"`);
    await queryRunner.query(`DROP TABLE "bulletin_matches"`);
    await queryRunner.query(`DROP TABLE "bulletin_targets"`);
    await queryRunner.query(`DROP TABLE "service_bulletins"`);
  }
}
