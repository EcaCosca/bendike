import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleSignIn1758200000000 implements MigrationInterface {
  name = 'AddGoogleSignIn1758200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "google_sub" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "uq_users_google_sub" UNIQUE ("google_sub")`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "chk_users_has_credential"
        CHECK ("password_hash" IS NOT NULL OR "google_sub" IS NOT NULL)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "password_hash" IS NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "chk_users_has_credential"`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "uq_users_google_sub"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_sub"`);
  }
}
