import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDigestDeliveries1758400000000 implements MigrationInterface {
  name = 'CreateDigestDeliveries1758400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "digest_deliveries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rigger_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "kind" character varying(20) NOT NULL,
        "due_key" character varying(10) NOT NULL,
        "last_status" character varying(10) NOT NULL,
        "sent_on" date NOT NULL,
        "times_sent" integer NOT NULL DEFAULT 1,
        CONSTRAINT "pk_digest_deliveries" PRIMARY KEY ("id"),
        CONSTRAINT "fk_digest_deliveries_rigger" FOREIGN KEY ("rigger_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "uq_digest_deliveries_item" UNIQUE ("rigger_id", "subject_id", "kind", "due_key")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "rigger_settings" (
        "rigger_id" uuid NOT NULL,
        "digest_enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "pk_rigger_settings" PRIMARY KEY ("rigger_id"),
        CONSTRAINT "fk_rigger_settings_rigger" FOREIGN KEY ("rigger_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rigger_settings"`);
    await queryRunner.query(`DROP TABLE "digest_deliveries"`);
  }
}
