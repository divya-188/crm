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
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { CreateCustomFieldDefinitionDto } from './dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from './dto/update-custom-field-definition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuotaGuard } from '../subscriptions/guards/quota.guard';
import { QuotaResource } from '../subscriptions/decorators/quota.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @UseGuards(QuotaGuard)
  @QuotaResource('contacts')
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created' })
  @ApiResponse({ status: 403, description: 'Quota limit exceeded' })
  create(@TenantId() tenantId: string, @Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(tenantId, createContactDto);
  }

  // Import endpoint - must come before :id route
  @Post('import')
  @ApiOperation({ summary: 'Import multiple contacts' })
  @ApiResponse({ status: 201, description: 'Contacts imported' })
  importContacts(
    @TenantId() tenantId: string,
    @Body() contacts: CreateContactDto[],
  ) {
    return this.contactsService.importContacts(tenantId, contacts);
  }

  // Search endpoint - must come before :id route
  @Post('search/segment')
  @ApiOperation({ summary: 'Search contacts by segment filters' })
  @ApiResponse({ status: 200, description: 'Contacts retrieved' })
  searchBySegment(
    @TenantId() tenantId: string,
    @Body() filters: Record<string, any>,
  ) {
    return this.contactsService.searchBySegment(tenantId, filters);
  }

  // Export endpoint - must come before :id route
  @Get('export')
  @ApiOperation({ summary: 'Export contacts to CSV' })
  @ApiResponse({ status: 200, description: 'Contacts exported' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="contacts.csv"')
  async exportContacts(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string[],
    @Res() res?: Response,
  ) {
    const csv = await this.contactsService.exportContacts(tenantId, search, tags);
    res.send(csv);
  }

  // Segment Management Endpoints - MUST come before :id route
  @Post('segments')
  @ApiOperation({ summary: 'Create a new segment' })
  @ApiResponse({ status: 201, description: 'Segment created' })
  createSegment(
    @TenantId() tenantId: string,
    @Body() createSegmentDto: CreateSegmentDto,
  ) {
    return this.contactsService.createSegment(tenantId, createSegmentDto);
  }

  @Post('segments/preview')
  @ApiOperation({ summary: 'Preview segment with criteria' })
  @ApiResponse({ status: 200, description: 'Segment preview retrieved' })
  previewSegment(
    @TenantId() tenantId: string,
    @Body() criteria: any,
  ) {
    return this.contactsService.previewSegment(tenantId, criteria);
  }

  @Get('segments')
  @ApiOperation({ summary: 'Get all segments' })
  @ApiResponse({ status: 200, description: 'List of segments retrieved' })
  findAllSegments(@TenantId() tenantId: string) {
    return this.contactsService.findAllSegments(tenantId);
  }

  @Get('segments/:id')
  @ApiOperation({ summary: 'Get segment by ID' })
  @ApiResponse({ status: 200, description: 'Segment retrieved' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  findOneSegment(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.findOneSegment(tenantId, id);
  }

  @Get('segments/:id/contacts')
  @ApiOperation({ summary: 'Get contacts in a segment' })
  @ApiResponse({ status: 200, description: 'Segment contacts retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSegmentContacts(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contactsService.getSegmentContacts(tenantId, id, page, limit);
  }

  @Patch('segments/:id')
  @ApiOperation({ summary: 'Update segment' })
  @ApiResponse({ status: 200, description: 'Segment updated' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  updateSegment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateSegmentDto: UpdateSegmentDto,
  ) {
    return this.contactsService.updateSegment(tenantId, id, updateSegmentDto);
  }

  @Delete('segments/:id')
  @ApiOperation({ summary: 'Delete segment' })
  @ApiResponse({ status: 200, description: 'Segment deleted' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  removeSegment(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.removeSegment(tenantId, id);
  }

  // Custom Field Definition Management Endpoints - MUST come before :id route
  @Post('custom-fields')
  @ApiOperation({ summary: 'Create a new custom field definition' })
  @ApiResponse({ status: 201, description: 'Custom field definition created' })
  createCustomFieldDefinition(
    @TenantId() tenantId: string,
    @Body() createCustomFieldDefinitionDto: CreateCustomFieldDefinitionDto,
  ) {
    return this.contactsService.createCustomFieldDefinition(tenantId, createCustomFieldDefinitionDto);
  }

  @Get('custom-fields')
  @ApiOperation({ summary: 'Get all custom field definitions' })
  @ApiResponse({ status: 200, description: 'List of custom field definitions retrieved' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAllCustomFieldDefinitions(
    @TenantId() tenantId: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.contactsService.findAllCustomFieldDefinitions(tenantId, includeInactive);
  }

  @Get('custom-fields/:id')
  @ApiOperation({ summary: 'Get custom field definition by ID' })
  @ApiResponse({ status: 200, description: 'Custom field definition retrieved' })
  @ApiResponse({ status: 404, description: 'Custom field definition not found' })
  findOneCustomFieldDefinition(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.findOneCustomFieldDefinition(tenantId, id);
  }

  @Patch('custom-fields/:id')
  @ApiOperation({ summary: 'Update custom field definition' })
  @ApiResponse({ status: 200, description: 'Custom field definition updated' })
  @ApiResponse({ status: 404, description: 'Custom field definition not found' })
  updateCustomFieldDefinition(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateCustomFieldDefinitionDto: UpdateCustomFieldDefinitionDto,
  ) {
    return this.contactsService.updateCustomFieldDefinition(tenantId, id, updateCustomFieldDefinitionDto);
  }

  @Patch('custom-fields/:id/reorder')
  @ApiOperation({ summary: 'Reorder custom field definition' })
  @ApiResponse({ status: 200, description: 'Custom field definition reordered' })
  reorderCustomFieldDefinition(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('sortOrder') sortOrder: number,
  ) {
    return this.contactsService.reorderCustomFieldDefinition(tenantId, id, sortOrder);
  }

  @Delete('custom-fields/:id')
  @ApiOperation({ summary: 'Delete custom field definition' })
  @ApiResponse({ status: 200, description: 'Custom field definition deleted' })
  @ApiResponse({ status: 404, description: 'Custom field definition not found' })
  removeCustomFieldDefinition(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.removeCustomFieldDefinition(tenantId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contacts with pagination' })
  @ApiResponse({ status: 200, description: 'List of contacts retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('tags') tags?: string[],
  ) {
    return this.contactsService.findAll(tenantId, page, limit, search, tags);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiResponse({ status: 200, description: 'Contact retrieved' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact' })
  @ApiResponse({ status: 200, description: 'Contact updated' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(tenantId, id, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.remove(tenantId, id);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add tag to contact' })
  @ApiResponse({ status: 200, description: 'Tag added' })
  addTag(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('tag') tag: string,
  ) {
    return this.contactsService.addTag(tenantId, id, tag);
  }

  @Delete(':id/tags/:tag')
  @ApiOperation({ summary: 'Remove tag from contact' })
  @ApiResponse({ status: 200, description: 'Tag removed' })
  removeTag(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('tag') tag: string,
  ) {
    return this.contactsService.removeTag(tenantId, id, tag);
  }

}
