import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1757600000000 implements MigrationInterface {
  name = 'CreateUsers1757600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('user', 'rigger', 'dropzone', 'admin')`);
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(320) NOT NULL,
        "display_name" character varying(120) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'user',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_role"`);
  }
}
