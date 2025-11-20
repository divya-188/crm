import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { CommonModule } from '../../common/common.module';
import { TwoFactorGuard } from './guards/2fa.guard';
import { SessionIdleGuard } from './guards/session-idle.guard';

@Module({
  imports: [
    UsersModule,
    TenantsModule,
    SuperAdminModule,
    CommonModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtStrategy, 
    JwtRefreshStrategy,
    TwoFactorGuard,
    SessionIdleGuard,
  ],
  exports: [AuthService, TwoFactorGuard, SessionIdleGuard],
})
export class AuthModule {}
