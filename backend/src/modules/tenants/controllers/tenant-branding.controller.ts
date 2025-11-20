import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TenantBrandingService, TenantBranding } from '../services/tenant-branding.service';
import { UpdateTenantBrandingDto } from '../dto/update-tenant-branding.dto';

@ApiTags('Tenant Branding')
@Controller('tenants/settings/branding')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantBrandingController {
  constructor(private readonly brandingService: TenantBrandingService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get tenant branding settings' })
  @ApiResponse({ status: 200, description: 'Branding settings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getBranding(@Request() req): Promise<TenantBranding> {
    return this.brandingService.getBranding(req.user.tenantId);
  }

  @Put()
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update tenant branding settings' })
  @ApiResponse({ status: 200, description: 'Branding settings updated successfully' })
  @ApiResponse({ status: 403, description: 'White-label not enabled' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateBranding(
    @Request() req,
    @Body() updateDto: UpdateTenantBrandingDto,
  ): Promise<TenantBranding> {
    return this.brandingService.updateBranding(
      req.user.tenantId,
      updateDto,
      req.user.id,
    );
  }

  @Get('css')
  @ApiOperation({ summary: 'Get generated CSS from branding settings' })
  @ApiResponse({ status: 200, description: 'CSS generated successfully' })
  async getCss(@Request() req): Promise<{ css: string }> {
    const branding = await this.brandingService.getBranding(req.user.tenantId);
    const css = this.brandingService.generateCss(branding);
    return { css };
  }

  @Get('white-label-status')
  @Roles('admin')
  @ApiOperation({ summary: 'Check if white-label is enabled for tenant' })
  @ApiResponse({ status: 200, description: 'White-label status retrieved' })
  async getWhiteLabelStatus(@Request() req): Promise<{ enabled: boolean }> {
    const enabled = await this.brandingService.isWhiteLabelEnabled(req.user.tenantId);
    return { enabled };
  }
}
