import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DocumentModule } from './modules/document/document.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import {
  databaseConfig,
  jwtConfig,
  appConfig,
  uploadConfig,
  pythonBackendConfig,
  redisConfig,
  securityConfig,
} from './common/config/configuration';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        jwtConfig,
        appConfig,
        uploadConfig,
        pythonBackendConfig,
        redisConfig,
        securityConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities:  [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true ,
        // logging: configService.get('database.logging'),  // Uncomment if you want to enable logging for TypeORM
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    DocumentModule,
    IngestionModule,
  ],
  controllers: [AppController],
  providers: [
  ],
})
export class AppModule {}
