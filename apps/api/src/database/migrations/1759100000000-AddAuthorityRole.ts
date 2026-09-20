import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthorityRole1759100000000 implements MigrationInterface {
  name = 'AddAuthorityRole1759100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'authority' BEFORE 'admin'`);
  }

  async down(): Promise<void> {
    // A value cannot be removed from a Postgres enum; accounts with the role would have to be changed first.
  }
}
