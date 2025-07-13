import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const createDataSource = (configService: ConfigService) => {
  return new DataSource({
    type: 'postgres',
    host: configService.get('database.host'),
    port: configService.get('database.port'),
    username: configService.get('database.username'),
    password: configService.get('database.password'),
    database: configService.get('database.database'),
    entities:  [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: ['src/common/database/migrations/*.ts'],
    synchronize: configService.get('database.synchronize'),
    logging: configService.get('database.logging'),
  });
}; 