import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  create(@TenantId() tenantId: string, @Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(tenantId, createTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates with pagination' })
  @ApiResponse({ status: 200, description: 'List of templates retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.templatesService.findAll(tenantId, page, limit, status, category, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateTemplateDto>,
  ) {
    return this.templatesService.update(tenantId, id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.remove(tenantId, id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit template for approval' })
  @ApiResponse({ status: 200, description: 'Template submitted' })
  submit(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.templatesService.submit(tenantId, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve template' })
  @ApiResponse({ status: 200, description: 'Template approved' })
  approve(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('externalId') externalId?: string,
  ) {
    return this.templatesService.approve(tenantId, id, externalId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject template' })
  @ApiResponse({ status: 200, description: 'Template rejected' })
  reject(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.templatesService.reject(tenantId, id, reason);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview template with variables' })
  @ApiResponse({ status: 200, description: 'Template preview generated' })
  preview(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('variables') variables: Record<string, string>,
  ) {
    return this.templatesService.preview(tenantId, id, variables);
  }
}
