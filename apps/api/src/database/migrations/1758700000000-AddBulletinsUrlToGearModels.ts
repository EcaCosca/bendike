import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBulletinsUrlToGearModels1758700000000 implements MigrationInterface {
  name = 'AddBulletinsUrlToGearModels1758700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "gear_models" ADD COLUMN "bulletins_url" character varying(2000)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "gear_models" DROP COLUMN "bulletins_url"`);
  }
}
