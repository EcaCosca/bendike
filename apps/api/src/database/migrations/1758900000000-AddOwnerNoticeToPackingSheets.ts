import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnerNoticeToPackingSheets1758900000000 implements MigrationInterface {
  name = 'AddOwnerNoticeToPackingSheets1758900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "packing_sheets" ADD COLUMN "owner_notified_at" timestamptz`);
    await queryRunner.query(`ALTER TABLE "packing_sheets" ADD COLUMN "owner_notified_to" character varying(200)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "packing_sheets" DROP COLUMN "owner_notified_to"`);
    await queryRunner.query(`ALTER TABLE "packing_sheets" DROP COLUMN "owner_notified_at"`);
  }
}
