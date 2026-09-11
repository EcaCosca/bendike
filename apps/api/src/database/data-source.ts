import 'reflect-metadata';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  migrations: [join(__dirname, 'migrations', '*.ts')],
});
