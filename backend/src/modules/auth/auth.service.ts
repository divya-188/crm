import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserStatus } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { SecuritySettingsService } from '../super-admin/services/security-settings.service';
import { SessionService } from '../../common/services/session.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tenantsService: TenantsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
    private securitySettingsService: SecuritySettingsService,
    private sessionService: SessionService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; tokens: any; tenant: Tenant }> {
    // Check if email exists first (outside transaction for performance)
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Validate password against security policy
    const passwordValidation = await this.securitySettingsService.validatePassword(registerDto.password);
    if (!passwordValidation.valid) {
      throw new BadRequestException(passwordValidation.errors.join(', '));
    }

    // Use transaction for tenant + user creation (atomic operation)
    return await this.dataSource.transaction(async (manager) => {
      // Create tenant
      const tenantName = `${registerDto.firstName} ${registerDto.lastName}'s Workspace`;
      const tenant = manager.create(Tenant, { 
        name: tenantName,
        slug: this.generateSlug(registerDto.email),
        status: 'active'
      });
      const savedTenant = await manager.save(tenant);

      // Create admin user (first admin is owner)
      const hashedPassword = await this.usersService.hashPassword(registerDto.password);
      const user = manager.create(User, {
        ...registerDto,
        password: hashedPassword,
        tenantId: savedTenant.id,
        role: 'admin',
        isOwner: true,  // First admin is owner
      });
      const savedUser = await manager.save(user);

      // Generate tokens
      const tokens = await this.generateTokens(savedUser);
      await this.usersService.updateRefreshToken(savedUser.id, tokens.refreshToken);

      const { password, refreshToken, ...userWithoutSensitive } = savedUser;
      return { user: userWithoutSensitive, tokens, tenant: savedTenant };
    });
  }

  private generateSlug(email: string): string {
    return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  async login(loginDto: LoginDto): Promise<{ user: Partial<User>; tokens: any }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    // Check session limits
    const securityConfig = await this.securitySettingsService.getSettings();
    const userSessions = await this.sessionService.getUserSessions(user.id);
    
    if (userSessions.length >= securityConfig.sessionManagement.maxSessions) {
      // Remove oldest session
      await this.sessionService.deleteSession(userSessions[0]);
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    await this.usersService.updateLastLogin(user.id);

    // Create session
    await this.sessionService.createSession(user.id, {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    const { password, refreshToken, ...userWithoutSensitive } = user;
    return { user: userWithoutSensitive, tokens };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Use passwordHash for comparison (password field is null after our fix)
    const hashToCompare = user.passwordHash || user.password;
    if (!hashToCompare) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.comparePassword(password, hashToCompare);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<any> {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isRefreshTokenValid = await this.usersService.comparePassword(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    // Get session timeout from security settings
    const securityConfig = await this.securitySettingsService.getSettings();
    const sessionTimeout = securityConfig.sessionManagement.sessionTimeout;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: `${sessionTimeout}s`,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
