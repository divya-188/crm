import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Services
import { RedisService } from './services/redis.service';
import { SessionService } from './services/session.service';
import { EncryptionService } from './services/encryption.service';
import { SettingsCacheService } from './services/settings-cache.service';
import { SettingsAuditService } from './services/settings-audit.service';
import { FileUploadService } from './services/file-upload.service';

// Entities
import { SettingsAuditLog } from './entities/settings-audit-log.entity';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SettingsAuditLog]),
  ],
  providers: [
    RedisService,
    SessionService,
    EncryptionService,
    SettingsCacheService,
    SettingsAuditService,
    FileUploadService,
  ],
  exports: [
    RedisService,
    SessionService,
    EncryptionService,
    SettingsCacheService,
    SettingsAuditService,
    FileUploadService,
  ],
})
export class CommonModule {}
