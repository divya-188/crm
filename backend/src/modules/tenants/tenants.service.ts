import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Tenant, TenantStatus, TenantStatusType } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Generate slug if not provided
    let slug = createTenantDto.slug;
    if (!slug && createTenantDto.name) {
      slug = this.generateSlug(createTenantDto.name);
      
      // Ensure slug is unique
      let counter = 1;
      let uniqueSlug = slug;
      while (await this.findBySlug(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }

    // Check if slug already exists
    if (slug) {
      const existing = await this.findBySlug(slug);
      if (existing) {
        throw new ConflictException('Tenant slug already exists');
      }
    }

    // Set trial period (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const tenant = this.tenantsRepository.create({
      ...createTenantDto,
      slug,
      status: TenantStatus.TRIAL,
      trialEndsAt,
    });

    return this.tenantsRepository.save(tenant);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  async findAll(query?: TenantQueryDto): Promise<{ data: Tenant[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, search } = query || {};
    
    const queryBuilder = this.tenantsRepository.createQueryBuilder('tenant');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('tenant.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(tenant.name ILIKE :search OR tenant.slug ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('tenant.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantsRepository.findOne({ where: { slug } });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // If slug is being updated, check uniqueness
    if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
      const existing = await this.findBySlug(updateTenantDto.slug);
      if (existing) {
        throw new ConflictException('Tenant slug already exists');
      }
    }

    await this.tenantsRepository.update(id, updateTenantDto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: string): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // Validate status transition
    if (!Object.values(TenantStatus).includes(status as any)) {
      throw new BadRequestException('Invalid tenant status');
    }

    await this.tenantsRepository.update(id, { status: status as TenantStatusType });
    return this.findOne(id);
  }

  async updateSettings(id: string, settings: Record<string, any>): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    const updatedSettings = {
      ...tenant.settings,
      ...settings,
    };

    await this.tenantsRepository.update(id, { settings: updatedSettings });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    
    // Soft delete by setting status to expired
    await this.tenantsRepository.update(id, { status: TenantStatus.EXPIRED });
    
    // For hard delete, uncomment:
    // const result = await this.tenantsRepository.delete(id);
    // if (result.affected === 0) {
    //   throw new NotFoundException(`Tenant with ID ${id} not found`);
    // }
  }

  async getStats(id: string): Promise<any> {
    const tenant = await this.findOne(id);
    
    // This would aggregate stats from related entities
    // For now, return basic info
    return {
      tenantId: tenant.id,
      name: tenant.name,
      status: tenant.status,
      createdAt: tenant.createdAt,
      trialEndsAt: tenant.trialEndsAt,
      subscriptionEndsAt: tenant.subscriptionEndsAt,
      limits: tenant.limits,
      // Add more stats as needed:
      // totalUsers: await this.usersRepository.count({ where: { tenantId: id } }),
      // totalContacts: await this.contactsRepository.count({ where: { tenantId: id } }),
      // etc.
    };
  }

  async checkLimits(tenantId: string, limitType: string): Promise<boolean> {
    const tenant = await this.findOne(tenantId);
    if (!tenant.limits || !tenant.limits[limitType]) {
      return true; // No limit set
    }
    // This would need to check actual usage against limits
    // Implementation depends on specific limit type
    return true;
  }

  async isActive(tenantId: string): Promise<boolean> {
    const tenant = await this.findOne(tenantId);
    return tenant.status === TenantStatus.ACTIVE || tenant.status === TenantStatus.TRIAL;
  }

  async updateBusinessProfile(tenantId: string, businessProfile: any): Promise<Tenant> {
    const tenant = await this.findOne(tenantId);
    const updatedSettings = {
      ...tenant.settings,
      businessProfile: {
        ...tenant.settings?.businessProfile,
        ...businessProfile,
      },
    };
    await this.tenantsRepository.update(tenantId, { settings: updatedSettings });
    return this.findOne(tenantId);
  }

  async updateBranding(tenantId: string, branding: any): Promise<Tenant> {
    const tenant = await this.findOne(tenantId);
    const updatedSettings = {
      ...tenant.settings,
      branding: {
        ...tenant.settings?.branding,
        ...branding,
      },
    };
    await this.tenantsRepository.update(tenantId, { settings: updatedSettings });
    return this.findOne(tenantId);
  }
}
