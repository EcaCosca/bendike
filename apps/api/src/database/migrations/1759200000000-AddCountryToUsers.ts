import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCountryToUsers1759200000000 implements MigrationInterface {
  name = 'AddCountryToUsers1759200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "country" character varying(2)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "country"`);
  }
}
