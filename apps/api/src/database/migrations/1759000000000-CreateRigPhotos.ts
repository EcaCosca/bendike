import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRigPhotos1759000000000 implements MigrationInterface {
  name = 'CreateRigPhotos1759000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rig_photos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rig_id" uuid NOT NULL,
        "entry_id" uuid,
        "storage_key" character varying(200) NOT NULL,
        "file_name" character varying(200) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "size_bytes" integer NOT NULL,
        "caption" character varying(300) NOT NULL DEFAULT '',
        "added_by" uuid NOT NULL,
        "added_by_name" character varying(200) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "removed_at" timestamptz,
        "removed_by" uuid,
        CONSTRAINT "pk_rig_photos" PRIMARY KEY ("id"),
        CONSTRAINT "fk_rig_photos_rig" FOREIGN KEY ("rig_id") REFERENCES "rigs" ("id"),
        CONSTRAINT "fk_rig_photos_entry" FOREIGN KEY ("entry_id") REFERENCES "maintenance_entries" ("id"),
        CONSTRAINT "fk_rig_photos_added_by" FOREIGN KEY ("added_by") REFERENCES "users" ("id"),
        CONSTRAINT "fk_rig_photos_removed_by" FOREIGN KEY ("removed_by") REFERENCES "users" ("id"),
        CONSTRAINT "chk_rig_photos_removed" CHECK (
          ("removed_at" IS NULL AND "removed_by" IS NULL) OR ("removed_at" IS NOT NULL AND "removed_by" IS NOT NULL)
        )
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rig_photos_rig" ON "rig_photos" ("rig_id", "created_at") WHERE "removed_at" IS NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rig_photos"`);
  }
}
