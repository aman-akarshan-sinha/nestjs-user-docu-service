import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'user_docu_service',
  synchronize: process.env.DB_SYNCHRONIZE === 'false',
  logging: process.env.DB_LOGGING === 'true',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
}));

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  nodeEnv: process.env.NODE_ENV || 'development',
}));

export const uploadConfig = registerAs('upload', () => ({
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
  uploadDest: process.env.UPLOAD_DEST || './uploads',
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'pdf',
    'doc',
    'docx',
    'txt',
    'jpg',
    'jpeg',
    'png',
  ],
}));

export const pythonBackendConfig = registerAs('pythonBackend', () => ({
  url: process.env.PYTHON_BACKEND_URL || 'http://localhost:8000',
  timeout: parseInt(process.env.PYTHON_BACKEND_TIMEOUT, 10) || 30000,
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB, 10) || 0,
}));

export const securityConfig = registerAs('security', () => ({
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
})); 