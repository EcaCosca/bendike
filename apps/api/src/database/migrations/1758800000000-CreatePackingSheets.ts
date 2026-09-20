import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePackingSheets1758800000000 implements MigrationInterface {
  name = 'CreatePackingSheets1758800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "packing_sheets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rig_id" uuid NOT NULL,
        "reserve_item_id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "rigger_id" uuid NOT NULL,
        "status" character varying(10) NOT NULL DEFAULT 'draft',
        "sheet_no" integer,
        "performed_on" date NOT NULL,
        "checklist_version" character varying(40) NOT NULL,
        "checked_ids" text[] NOT NULL DEFAULT '{}',
        "bulletins_checked" boolean,
        "mard_connected" boolean,
        "owner_name" character varying(200) NOT NULL DEFAULT '',
        "owner_address" character varying(300) NOT NULL DEFAULT '',
        "owner_phone" character varying(60) NOT NULL DEFAULT '',
        "owner_email" character varying(200) NOT NULL DEFAULT '',
        "manual_document_id" uuid,
        "manual_label" character varying(300),
        "notes" text NOT NULL DEFAULT '',
        "elements" jsonb,
        "missing" jsonb,
        "rigger_name" character varying(200) NOT NULL,
        "rigger_licence" character varying(120),
        "signed_at" timestamptz,
        "entry_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_packing_sheets" PRIMARY KEY ("id"),
        CONSTRAINT "fk_packing_sheets_rig" FOREIGN KEY ("rig_id") REFERENCES "rigs" ("id"),
        CONSTRAINT "fk_packing_sheets_reserve" FOREIGN KEY ("reserve_item_id") REFERENCES "gear_items" ("id"),
        CONSTRAINT "fk_packing_sheets_owner" FOREIGN KEY ("owner_id") REFERENCES "users" ("id"),
        CONSTRAINT "fk_packing_sheets_rigger" FOREIGN KEY ("rigger_id") REFERENCES "users" ("id"),
        CONSTRAINT "fk_packing_sheets_manual" FOREIGN KEY ("manual_document_id") REFERENCES "library_documents" ("id"),
        CONSTRAINT "fk_packing_sheets_entry" FOREIGN KEY ("entry_id") REFERENCES "maintenance_entries" ("id"),
        CONSTRAINT "chk_packing_sheets_status" CHECK ("status" IN ('draft', 'signed')),
        CONSTRAINT "chk_packing_sheets_signed" CHECK (
          "status" = 'draft' OR (
            "sheet_no" IS NOT NULL AND "elements" IS NOT NULL AND "missing" IS NOT NULL AND "signed_at" IS NOT NULL
            AND "entry_id" IS NOT NULL AND "rigger_licence" IS NOT NULL
            AND "bulletins_checked" IS NOT NULL AND "mard_connected" IS NOT NULL
          )
        )
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_packing_sheets_rigger_number" ON "packing_sheets" ("rigger_id", "sheet_no") WHERE "sheet_no" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_packing_sheets_open_draft" ON "packing_sheets" ("rigger_id", "rig_id") WHERE "status" = 'draft'`,
    );
    await queryRunner.query(`CREATE INDEX "idx_packing_sheets_rig" ON "packing_sheets" ("rig_id", "status")`);
    await queryRunner.query(
      `CREATE INDEX "idx_packing_sheets_reserve" ON "packing_sheets" ("reserve_item_id", "status")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "packing_sheets"`);
  }
}
