import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRiggerLinks1758300000000 implements MigrationInterface {
  name = 'CreateRiggerLinks1758300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rigger_links" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "rigger_id" uuid NOT NULL,
        "status" character varying(10) NOT NULL DEFAULT 'pending',
        "initiated_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "confirmed_at" timestamptz,
        "ended_at" timestamptz,
        CONSTRAINT "pk_rigger_links" PRIMARY KEY ("id"),
        CONSTRAINT "fk_rigger_links_owner" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_rigger_links_rigger" FOREIGN KEY ("rigger_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_rigger_links_initiator" FOREIGN KEY ("initiated_by") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "chk_rigger_links_status" CHECK ("status" IN ('pending', 'active', 'declined', 'ended')),
        CONSTRAINT "chk_rigger_links_distinct" CHECK ("owner_id" <> "rigger_id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_rigger_links_open_pair" ON "rigger_links" ("owner_id", "rigger_id")
        WHERE "status" IN ('pending', 'active')`,
    );
    await queryRunner.query(`CREATE INDEX "idx_rigger_links_rigger_active" ON "rigger_links" ("rigger_id", "status")`);
    await queryRunner.query(`CREATE INDEX "idx_rigger_links_owner_active" ON "rigger_links" ("owner_id", "status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rigger_links"`);
  }
}
