import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactToUsers1758250000000 implements MigrationInterface {
  name = 'AddContactToUsers1758250000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users"
        ADD COLUMN "phone" character varying(32),
        ADD COLUMN "locale" character varying(2) NOT NULL DEFAULT 'es'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "chk_users_locale" CHECK ("locale" IN ('en', 'es', 'pt'))`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "chk_users_locale"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locale", DROP COLUMN "phone"`);
  }
}
