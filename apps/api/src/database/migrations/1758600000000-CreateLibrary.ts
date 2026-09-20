import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLibrary1758600000000 implements MigrationInterface {
  name = 'CreateLibrary1758600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "library_document_kind" AS ENUM ('manual', 'service_bulletin', 'other')`);
    await queryRunner.query(
      `CREATE TABLE "library_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(200) NOT NULL,
        "kind" "library_document_kind" NOT NULL,
        "manufacturer" character varying(120) NOT NULL,
        "model_id" uuid,
        "revision" character varying(60),
        "language" character varying(20),
        "source_url" character varying(2000),
        "file_name" character varying(200) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "size_bytes" integer NOT NULL,
        "sha256" character varying(64) NOT NULL,
        "storage_key" character varying(200) NOT NULL,
        "added_by" uuid NOT NULL,
        "added_by_name" character varying(200) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "archived_at" timestamptz,
        "archived_by" uuid,
        "archive_reason" text,
        CONSTRAINT "pk_library_documents" PRIMARY KEY ("id"),
        CONSTRAINT "uq_library_documents_sha256" UNIQUE ("sha256"),
        CONSTRAINT "fk_library_documents_model" FOREIGN KEY ("model_id") REFERENCES "gear_models" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_library_documents_added_by" FOREIGN KEY ("added_by") REFERENCES "users" ("id"),
        CONSTRAINT "fk_library_documents_archived_by" FOREIGN KEY ("archived_by") REFERENCES "users" ("id"),
        CONSTRAINT "chk_library_documents_archive" CHECK (
          ("archived_at" IS NULL AND "archive_reason" IS NULL) OR ("archived_at" IS NOT NULL AND "archive_reason" IS NOT NULL)
        )
      )`,
    );
    await queryRunner.query(`CREATE INDEX "idx_library_documents_model" ON "library_documents" ("model_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "library_documents"`);
    await queryRunner.query(`DROP TYPE "library_document_kind"`);
  }
}
