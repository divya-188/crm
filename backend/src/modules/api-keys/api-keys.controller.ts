import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(@Request() req, @Body() createApiKeyDto: CreateApiKeyDto) {
    const { apiKey, plainKey } = await this.apiKeysService.create(
      req.user.tenantId,
      req.user.id,
      createApiKeyDto,
    );

    return {
      message: 'API key created successfully. Save this key securely as it will not be shown again.',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: plainKey,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        rateLimitWindow: apiKey.rateLimitWindow,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys with pagination' })
  @ApiResponse({ status: 200, description: 'List of API keys' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.apiKeysService.findAll(req.user.tenantId, page, limit, status);

    return {
      data: result.data.map((key) => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        permissions: key.permissions,
        rateLimit: key.rateLimit,
        rateLimitWindow: key.rateLimitWindow,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        totalRequests: key.totalRequests,
        createdBy: key.createdBy ? {
          id: key.createdBy.id,
          email: key.createdBy.email,
          firstName: key.createdBy.firstName,
          lastName: key.createdBy.lastName,
        } : null,
        createdAt: key.createdAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key details' })
  @ApiResponse({ status: 200, description: 'API key details' })
  async findOne(@Request() req, @Param('id') id: string) {
    const apiKey = await this.apiKeysService.findOne(req.user.tenantId, id);

    return {
      data: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        rateLimitWindow: apiKey.rateLimitWindow,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
        totalRequests: apiKey.totalRequests,
        createdBy: apiKey.createdBy ? {
          id: apiKey.createdBy.id,
          email: apiKey.createdBy.email,
          firstName: apiKey.createdBy.firstName,
          lastName: apiKey.createdBy.lastName,
        } : null,
        createdAt: apiKey.createdAt,
      },
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update API key' })
  @ApiResponse({ status: 200, description: 'API key updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ) {
    const apiKey = await this.apiKeysService.update(
      req.user.tenantId,
      id,
      updateApiKeyDto,
    );

    return {
      message: 'API key updated successfully',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        rateLimitWindow: apiKey.rateLimitWindow,
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt,
      },
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete API key' })
  @ApiResponse({ status: 200, description: 'API key deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.apiKeysService.remove(req.user.tenantId, id);

    return {
      message: 'API key deleted successfully',
    };
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get API key usage statistics' })
  @ApiResponse({ status: 200, description: 'API key usage statistics' })
  async getUsage(@Request() req, @Param('id') id: string) {
    const stats = await this.apiKeysService.getUsageStats(req.user.tenantId, id);

    return {
      data: stats,
    };
  }
}
