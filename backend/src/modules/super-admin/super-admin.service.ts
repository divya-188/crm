import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getPlatformStats() {
    const [totalTenants, activeTenants, totalUsers, activeUsers] =
      await Promise.all([
        this.tenantRepository.count(),
        this.tenantRepository.count({ where: { status: 'active' } }),
        this.userRepository.count(),
        this.userRepository.count({ where: { status: 'active' } }),
      ]);

    // Calculate trial tenants
    const trialTenants = await this.tenantRepository.count({
      where: { status: 'trial' },
    });

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      totalUsers,
      activeUsers,
      conversionRate:
        totalTenants > 0
          ? ((activeTenants / totalTenants) * 100).toFixed(2)
          : 0,
    };
  }

  async getAllTenants(options: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const where: any = status ? { status } : {};

    const [tenants, total] = await this.tenantRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: tenants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTenantDetails(id: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get tenant users count
    const usersCount = await this.userRepository.count({
      where: { tenantId: id },
    });

    return {
      ...tenant,
      usersCount,
    };
  }

  async updateTenantStatus(id: string, status: string) {
    await this.tenantRepository.update(id, { status: status as any });
    return this.getTenantDetails(id);
  }

  async getAllUsers(options: { page: number; limit: number; role?: string }) {
    const { page, limit, role } = options;
    const skip = (page - 1) * limit;

    const where: any = role ? { role } : {};

    const [users, total] = await this.userRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'status',
        'tenantId',
        'createdAt',
        'lastLoginAt',
      ],
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAnalyticsOverview() {
    // Get counts by role
    const [adminCount, agentCount, userCount] = await Promise.all([
      this.userRepository.count({ where: { role: 'admin' } }),
      this.userRepository.count({ where: { role: 'agent' } }),
      this.userRepository.count({ where: { role: 'user' } }),
    ]);

    // Get tenant status breakdown
    const [activeCount, trialCount, suspendedCount] = await Promise.all([
      this.tenantRepository.count({ where: { status: 'active' } }),
      this.tenantRepository.count({ where: { status: 'trial' } }),
      this.tenantRepository.count({ where: { status: 'suspended' } }),
    ]);

    return {
      usersByRole: {
        admin: adminCount,
        agent: agentCount,
        user: userCount,
      },
      tenantsByStatus: {
        active: activeCount,
        trial: trialCount,
        suspended: suspendedCount,
      },
    };
  }

  async getRevenueAnalytics(period: string) {
    // Placeholder for revenue analytics
    // This would integrate with your payment/subscription system
    return {
      period,
      totalRevenue: 0,
      mrr: 0, // Monthly Recurring Revenue
      arr: 0, // Annual Recurring Revenue
      churnRate: 0,
      message: 'Revenue analytics integration pending',
    };
  }

  async impersonateTenant(tenantId: string) {
    // Find tenant admin
    const admin = await this.userRepository.findOne({
      where: { tenantId, role: 'admin' },
    });

    if (!admin) {
      throw new Error('Tenant admin not found');
    }

    // In a real implementation, you would generate a special impersonation token
    // For now, return tenant and admin info
    return {
      tenantId,
      adminId: admin.id,
      adminEmail: admin.email,
      message:
        'Impersonation feature requires additional JWT token generation logic',
    };
  }
}
