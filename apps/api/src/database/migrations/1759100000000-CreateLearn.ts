import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLearn1759100000000 implements MigrationInterface {
  name = 'CreateLearn1759100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "learn_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(160) NOT NULL,
        "format" character varying(20) NOT NULL,
        "title" jsonb NOT NULL,
        "summary" jsonb NOT NULL,
        "translation_overrides" jsonb NOT NULL DEFAULT '{}',
        "author" character varying(160),
        "source_name" character varying(160) NOT NULL,
        "url" character varying(2000) NOT NULL,
        "embed_provider" character varying(20),
        "embed_id" character varying(120),
        "embed_kind" character varying(20),
        "thumbnail_url" character varying(2000),
        "content_language" character varying(5) NOT NULL,
        "topics" text[] NOT NULL DEFAULT '{}',
        "level" character varying(20) NOT NULL,
        "duration_minutes" integer,
        "published_at" date,
        "buy_url" character varying(2000),
        "affiliate" boolean NOT NULL DEFAULT false,
        "position" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "created_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_learn_items" PRIMARY KEY ("id"),
        CONSTRAINT "uq_learn_items_slug" UNIQUE ("slug"),
        CONSTRAINT "fk_learn_items_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id")
      )`,
    );
    await queryRunner.query(`CREATE INDEX "idx_learn_items_active" ON "learn_items" ("active", "position")`);
    await queryRunner.query(`CREATE INDEX "idx_learn_items_topics" ON "learn_items" USING GIN ("topics")`);

    await queryRunner.query(
      `CREATE TABLE "learn_item_links" (
        "item_id" uuid NOT NULL,
        "target_kind" character varying(12) NOT NULL,
        "target_id" uuid NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_learn_item_links" PRIMARY KEY ("item_id", "target_kind", "target_id"),
        CONSTRAINT "fk_learn_item_links_item" FOREIGN KEY ("item_id") REFERENCES "learn_items" ("id") ON DELETE CASCADE,
        CONSTRAINT "chk_learn_item_links_kind" CHECK ("target_kind" IN ('product', 'brand', 'gear_model'))
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_learn_item_links_target" ON "learn_item_links" ("target_kind", "target_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "learn_collections" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(160) NOT NULL,
        "title" jsonb NOT NULL,
        "intro" jsonb NOT NULL,
        "topic" character varying(40) NOT NULL,
        "start_here" boolean NOT NULL DEFAULT false,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_learn_collections" PRIMARY KEY ("id"),
        CONSTRAINT "uq_learn_collections_slug" UNIQUE ("slug")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_learn_collections_start_here" ON "learn_collections" ("topic") WHERE "start_here"`,
    );

    await queryRunner.query(
      `CREATE TABLE "learn_collection_items" (
        "collection_id" uuid NOT NULL,
        "item_id" uuid NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_learn_collection_items" PRIMARY KEY ("collection_id", "item_id"),
        CONSTRAINT "fk_learn_collection_items_collection" FOREIGN KEY ("collection_id") REFERENCES "learn_collections" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_learn_collection_items_item" FOREIGN KEY ("item_id") REFERENCES "learn_items" ("id") ON DELETE CASCADE
      )`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "learn_collection_items"`);
    await queryRunner.query(`DROP TABLE "learn_collections"`);
    await queryRunner.query(`DROP TABLE "learn_item_links"`);
    await queryRunner.query(`DROP TABLE "learn_items"`);
  }
}
