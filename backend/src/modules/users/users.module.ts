import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AvailabilitySettingsService } from './services/availability-settings.service';
import { AvailabilitySettingsController } from './controllers/availability-settings.controller';
import { PreferencesSettingsService } from './services/preferences-settings.service';
import { PreferencesSettingsController } from './controllers/preferences-settings.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SubscriptionsModule,
    CommonModule,
    forwardRef(() => SuperAdminModule),
  ],
  controllers: [
    UsersController,
    AvailabilitySettingsController,
    PreferencesSettingsController,
  ],
  providers: [
    UsersService,
    AvailabilitySettingsService,
    PreferencesSettingsService,
  ],
  exports: [
    UsersService,
    AvailabilitySettingsService,
    PreferencesSettingsService,
  ],
})
export class UsersModule {}
