import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * Generate a new API key
   */
  async create(
    tenantId: string,
    userId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    // Generate a random API key
    const plainKey = this.generateApiKey();
    const keyHash = await bcrypt.hash(plainKey, 10);
    const keyPrefix = plainKey.substring(0, 8);

    const apiKey = this.apiKeyRepository.create({
      tenantId,
      createdByUserId: userId,
      name: createApiKeyDto.name,
      keyHash,
      keyPrefix,
      permissions: createApiKeyDto.permissions || {},
      rateLimit: createApiKeyDto.rateLimit || 100,
      rateLimitWindow: createApiKeyDto.rateLimitWindow || 60,
      expiresAt: createApiKeyDto.expiresAt,
      isActive: true,
    });

    await this.apiKeyRepository.save(apiKey);

    return { apiKey, plainKey };
  }

  /**
   * Find all API keys for a tenant with pagination
   */
  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<{ data: ApiKey[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    
    const query = this.apiKeyRepository.createQueryBuilder('apiKey')
      .leftJoinAndSelect('apiKey.createdBy', 'createdBy')
      .where('apiKey.tenantId = :tenantId', { tenantId });

    if (status === 'active') {
      query.andWhere('apiKey.isActive = :isActive', { isActive: true });
    } else if (status === 'inactive') {
      query.andWhere('apiKey.isActive = :isActive', { isActive: false });
    }

    // Optimize query with proper indexing and ordering
    const [data, total] = await query
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy('apiKey.createdAt', 'DESC')
      .addOrderBy('apiKey.id', 'DESC') // Secondary sort for consistency
      .getManyAndCount();

    // Calculate if there are more pages
    const hasMore = pageNum * limitNum < total;

    return { data, total, page: pageNum, limit: limitNum, hasMore };
  }

  /**
   * Find one API key by ID
   */
  async findOne(tenantId: string, id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id, tenantId },
      relations: ['createdBy'],
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  /**
   * Update an API key
   */
  async update(
    tenantId: string,
    id: string,
    updateApiKeyDto: UpdateApiKeyDto,
  ): Promise<ApiKey> {
    const apiKey = await this.findOne(tenantId, id);

    Object.assign(apiKey, updateApiKeyDto);

    return this.apiKeyRepository.save(apiKey);
  }

  /**
   * Delete an API key
   */
  async remove(tenantId: string, id: string): Promise<void> {
    const apiKey = await this.findOne(tenantId, id);
    await this.apiKeyRepository.remove(apiKey);
  }

  /**
   * Validate an API key and return the associated tenant
   */
  async validateApiKey(plainKey: string): Promise<ApiKey | null> {
    if (!plainKey || plainKey.length < 32) {
      return null;
    }

    const keyPrefix = plainKey.substring(0, 8);

    // Find all keys with matching prefix
    const apiKeys = await this.apiKeyRepository.find({
      where: { keyPrefix, isActive: true },
    });

    // Check each key's hash
    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(plainKey, apiKey.keyHash);
      
      if (isValid) {
        // Check if expired
        if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
          return null;
        }

        // Update last used timestamp
        await this.updateLastUsed(apiKey.id);

        return apiKey;
      }
    }

    return null;
  }

  /**
   * Update last used timestamp and increment request count
   */
  async updateLastUsed(apiKeyId: string): Promise<void> {
    await this.apiKeyRepository.update(apiKeyId, {
      lastUsedAt: new Date(),
      lastRequestAt: new Date(),
      totalRequests: () => 'total_requests + 1',
    });
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(tenantId: string, id: string): Promise<any> {
    const apiKey = await this.findOne(tenantId, id);

    return {
      totalRequests: apiKey.totalRequests,
      lastUsedAt: apiKey.lastUsedAt,
      lastRequestAt: apiKey.lastRequestAt,
      rateLimit: apiKey.rateLimit,
      rateLimitWindow: apiKey.rateLimitWindow,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
    };
  }

  /**
   * Generate a random API key
   */
  private generateApiKey(): string {
    // Generate a 32-byte random key and encode as base64
    const buffer = crypto.randomBytes(32);
    return buffer.toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 48);
  }

  /**
   * Check if API key has permission
   */
  hasPermission(apiKey: ApiKey, resource: string, action: string): boolean {
    if (!apiKey.permissions || Object.keys(apiKey.permissions).length === 0) {
      // If no permissions set, allow all
      return true;
    }

    const resourcePermissions = apiKey.permissions[resource];
    if (!resourcePermissions) {
      return false;
    }

    if (Array.isArray(resourcePermissions)) {
      return resourcePermissions.includes(action) || resourcePermissions.includes('*');
    }

    return resourcePermissions === '*' || resourcePermissions === action;
  }
}
