import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { SecuritySettingsService } from '../super-admin/services/security-settings.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => SecuritySettingsService))
    private securitySettingsService: SecuritySettingsService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    // Hash password if provided
    if (userData.password) {
      userData.passwordHash = await this.hashPassword(userData.password);
      delete userData.password;
    }
    
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findAll(query?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
    tenantId?: string;
  }): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    // Filter by tenant - IMPORTANT: Only show users from the same tenant
    // Super admins (no tenantId) can see all users
    if (query?.tenantId) {
      queryBuilder.andWhere('user.tenantId = :tenantId', { tenantId: query.tenantId });
    }

    // Apply filters
    if (query?.role && query.role !== 'all') {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    if (query?.status && query.status !== 'all') {
      queryBuilder.andWhere('user.status = :status', { status: query.status });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${query.search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const data = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, userData);
    return this.findOne(id);
  }

  async remove(requestingUserId: string, targetUserId: string): Promise<void> {
    const [requestingUser, targetUser] = await Promise.all([
      this.usersRepository.findOne({ where: { id: requestingUserId } }),
      this.usersRepository.findOne({ where: { id: targetUserId } }),
    ]);

    if (!requestingUser || !targetUser) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-deletion
    if (requestingUserId === targetUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Prevent owner deletion without transfer
    if (targetUser.isOwner) {
      throw new ForbiddenException(
        'Owner accounts require ownership transfer before deletion. Contact support.'
      );
    }

    // Prevent admins from deleting other admins
    if (
      requestingUser.role === 'admin' &&
      targetUser.role === 'admin'
    ) {
      throw new ForbiddenException(
        'Admins cannot delete other admins. Contact super admin for assistance.'
      );
    }

    // Only super admin can delete admins
    if (
      targetUser.role === 'admin' &&
      requestingUser.role !== 'super_admin'
    ) {
      throw new ForbiddenException('Only super admins can delete admin users');
    }

    // Soft delete
    await this.usersRepository.softDelete(targetUserId);
    
    // Revoke all sessions and tokens
    await this.revokeAllUserSessions(targetUserId);
  }

  private async revokeAllUserSessions(userId: string): Promise<void> {
    // Clear refresh token
    await this.usersRepository.update(userId, { refreshToken: null });
    
    // Note: API keys revocation would be handled by a separate service
    // For now, we just clear the user's refresh token
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const hashedToken = refreshToken ? await this.hashPassword(refreshToken) : null;
    await this.usersRepository.update(userId, { refreshToken: hashedToken });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { lastLoginAt: new Date() });
  }

  async updateProfile(userId: string, profileData: Partial<User>): Promise<User> {
    await this.usersRepository.update(userId, profileData);
    return this.findOne(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.findOne(userId);
    
    const isPasswordValid = await this.comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return false;
    }

    // Validate new password against security policy
    const passwordValidation = await this.securitySettingsService.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new BadRequestException(passwordValidation.errors.join(', '));
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.usersRepository.update(userId, { passwordHash: hashedPassword });
    
    return true;
  }

  async updateSettings(userId: string, settings: any): Promise<User> {
    const user = await this.findOne(userId);
    const updatedSettings = { ...user.settings, ...settings };
    await this.usersRepository.update(userId, { settings: updatedSettings });
    return this.findOne(userId);
  }
}
