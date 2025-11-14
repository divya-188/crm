import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions | null => {
    // Skip database connection if DATABASE_HOST is not configured
    if (!process.env.DATABASE_HOST) {
      return {
        type: 'sqlite',
        database: ':memory:',
        entities: [__dirname + '/../**/*.entity.js'],
        synchronize: true,
        logging: false,
        autoLoadEntities: true,
      } as any;
    }

    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'whatscrm',
      entities: [__dirname + '/../**/*.entity.js'],
      migrations: [__dirname + '/../database/migrations/*.js'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      autoLoadEntities: true,
    };
  }
);
