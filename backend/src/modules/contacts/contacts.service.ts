import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { ContactSegment } from './entities/segment.entity';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateSegmentDto, SegmentCondition } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { CreateCustomFieldDefinitionDto } from './dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from './dto/update-custom-field-definition.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    @InjectRepository(ContactSegment)
    private segmentsRepository: Repository<ContactSegment>,
    @InjectRepository(CustomFieldDefinition)
    private customFieldDefinitionsRepository: Repository<CustomFieldDefinition>,
  ) {}

  async create(tenantId: string, createContactDto: CreateContactDto): Promise<Contact> {
    // Validate custom fields if provided
    if (createContactDto.customFields) {
      await this.validateCustomFields(tenantId, createContactDto.customFields);
    }

    const contact = this.contactsRepository.create({
      ...createContactDto,
      tenantId,
    });
    return this.contactsRepository.save(contact);
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    tags?: string[],
  ): Promise<{ data: Contact[]; total: number; page: number; limit: number }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    
    const query = this.contactsRepository.createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId });

    if (search) {
      query.andWhere(
        '(contact.firstName ILIKE :search OR contact.lastName ILIKE :search OR contact.email ILIKE :search OR contact.phone ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (tags && tags.length > 0) {
      query.andWhere('contact.tags && :tags', { tags });
    }

    const [data, total] = await query
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy('contact.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total, page: pageNum, limit: limitNum };
  }

  async findOne(tenantId: string, id: string): Promise<Contact> {
    const contact = await this.contactsRepository.findOne({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(tenantId: string, id: string, updateContactDto: UpdateContactDto): Promise<Contact> {
    const contact = await this.findOne(tenantId, id);
    
    // Validate custom fields if provided
    if (updateContactDto.customFields) {
      await this.validateCustomFields(tenantId, updateContactDto.customFields);
    }
    
    Object.assign(contact, updateContactDto);
    return this.contactsRepository.save(contact);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const result = await this.contactsRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }

  async addTag(tenantId: string, id: string, tag: string): Promise<Contact> {
    const contact = await this.findOne(tenantId, id);
    if (!contact.tags) {
      contact.tags = [];
    }
    if (!contact.tags.includes(tag)) {
      contact.tags.push(tag);
    }
    return this.contactsRepository.save(contact);
  }

  async removeTag(tenantId: string, id: string, tag: string): Promise<Contact> {
    const contact = await this.findOne(tenantId, id);
    if (contact.tags) {
      contact.tags = contact.tags.filter(t => t !== tag);
    }
    return this.contactsRepository.save(contact);
  }

  async importContacts(tenantId: string, contacts: CreateContactDto[]): Promise<Contact[]> {
    const createdContacts = contacts.map(contactDto =>
      this.contactsRepository.create({
        ...contactDto,
        tenantId,
      })
    );
    return this.contactsRepository.save(createdContacts);
  }

  async searchBySegment(
    tenantId: string,
    filters: Record<string, any>,
  ): Promise<Contact[]> {
    const query = this.contactsRepository.createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId });

    // Apply dynamic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.andWhere(`contact.${key} = :${key}`, { [key]: value });
      }
    });

    return query.getMany();
  }

  async findByPhone(tenantId: string, phoneNumber: string): Promise<Contact | null> {
    return this.contactsRepository.findOne({
      where: { tenantId, phone: phoneNumber },
    });
  }

  async exportContacts(
    tenantId: string,
    search?: string,
    tags?: string[],
  ): Promise<string> {
    const query = this.contactsRepository.createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId });

    if (search) {
      query.andWhere(
        '(contact.firstName ILIKE :search OR contact.lastName ILIKE :search OR contact.email ILIKE :search OR contact.phone ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (tags && tags.length > 0) {
      query.andWhere('contact.tags && :tags', { tags });
    }

    const contacts = await query.orderBy('contact.createdAt', 'DESC').getMany();

    // Generate CSV
    const headers = ['Phone', 'First Name', 'Last Name', 'Email', 'Tags', 'Notes', 'Created At'];
    const rows = contacts.map(contact => [
      contact.phone || '',
      contact.firstName || '',
      contact.lastName || '',
      contact.email || '',
      (contact.tags || []).join(';'),
      contact.notes || '',
      contact.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  // Segment Management
  async createSegment(tenantId: string, createSegmentDto: CreateSegmentDto): Promise<ContactSegment> {
    const segment = this.segmentsRepository.create({
      ...createSegmentDto,
      tenantId,
    });

    // Calculate initial contact count
    const count = await this.calculateSegmentCount(tenantId, createSegmentDto.criteria);
    segment.contactCount = count;
    segment.lastCalculatedAt = new Date();

    return this.segmentsRepository.save(segment);
  }

  async findAllSegments(tenantId: string): Promise<ContactSegment[]> {
    return this.segmentsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneSegment(tenantId: string, id: string): Promise<ContactSegment> {
    const segment = await this.segmentsRepository.findOne({
      where: { id, tenantId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }

    return segment;
  }

  async updateSegment(tenantId: string, id: string, updateSegmentDto: UpdateSegmentDto): Promise<ContactSegment> {
    const segment = await this.findOneSegment(tenantId, id);
    Object.assign(segment, updateSegmentDto);

    // Recalculate contact count if criteria changed
    if (updateSegmentDto.criteria) {
      const count = await this.calculateSegmentCount(tenantId, updateSegmentDto.criteria);
      segment.contactCount = count;
      segment.lastCalculatedAt = new Date();
    }

    return this.segmentsRepository.save(segment);
  }

  async removeSegment(tenantId: string, id: string): Promise<void> {
    const result = await this.segmentsRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }
  }

  async previewSegment(tenantId: string, criteria: any): Promise<{ count: number; contacts: Contact[] }> {
    const query = this.buildSegmentQuery(tenantId, criteria);
    const [contacts, count] = await query.take(10).getManyAndCount();
    return { count, contacts };
  }

  async getSegmentContacts(
    tenantId: string,
    segmentId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Contact[]; total: number; page: number; limit: number }> {
    const segment = await this.findOneSegment(tenantId, segmentId);
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const query = this.buildSegmentQuery(tenantId, segment.criteria);
    const [data, total] = await query
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    return { data, total, page: pageNum, limit: limitNum };
  }

  private async calculateSegmentCount(tenantId: string, criteria: any): Promise<number> {
    const query = this.buildSegmentQuery(tenantId, criteria);
    return query.getCount();
  }

  private buildSegmentQuery(tenantId: string, criteria: any) {
    const query = this.contactsRepository.createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId });

    if (!criteria || !criteria.conditions || criteria.conditions.length === 0) {
      return query;
    }

    const logic = criteria.logic || 'AND';

    if (logic === 'AND') {
      criteria.conditions.forEach((condition: SegmentCondition, index: number) => {
        this.applyCondition(query, condition, index, 'andWhere');
      });
    } else {
      query.andWhere(new Brackets(qb => {
        criteria.conditions.forEach((condition: SegmentCondition, index: number) => {
          this.applyCondition(qb, condition, index, 'orWhere');
        });
      }));
    }

    return query;
  }

  private applyCondition(query: any, condition: SegmentCondition, index: number, method: 'andWhere' | 'orWhere') {
    const paramName = `param_${index}`;
    const { field, operator, value } = condition;

    // Handle custom fields
    const isCustomField = field.startsWith('customFields.');
    const fieldPath = isCustomField ? field : `contact.${field}`;

    switch (operator) {
      case 'equals':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`contact.customFields->>'${customFieldKey}' = :${paramName}`, { [paramName]: value });
        } else {
          query[method](`${fieldPath} = :${paramName}`, { [paramName]: value });
        }
        break;

      case 'not_equals':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`contact.customFields->>'${customFieldKey}' != :${paramName}`, { [paramName]: value });
        } else {
          query[method](`${fieldPath} != :${paramName}`, { [paramName]: value });
        }
        break;

      case 'contains':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`contact.customFields->>'${customFieldKey}' ILIKE :${paramName}`, { [paramName]: `%${value}%` });
        } else {
          query[method](`${fieldPath} ILIKE :${paramName}`, { [paramName]: `%${value}%` });
        }
        break;

      case 'not_contains':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`contact.customFields->>'${customFieldKey}' NOT ILIKE :${paramName}`, { [paramName]: `%${value}%` });
        } else {
          query[method](`${fieldPath} NOT ILIKE :${paramName}`, { [paramName]: `%${value}%` });
        }
        break;

      case 'starts_with':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`contact.customFields->>'${customFieldKey}' ILIKE :${paramName}`, { [paramName]: `${value}%` });
        } else {
          query[method](`${fieldPath} ILIKE :${paramName}`, { [paramName]: `${value}%` });
        }
        break;

      case 'ends_with':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`contact.customFields->>'${customFieldKey}' ILIKE :${paramName}`, { [paramName]: `%${value}` });
        } else {
          query[method](`${fieldPath} ILIKE :${paramName}`, { [paramName]: `%${value}` });
        }
        break;

      case 'is_empty':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`(contact.customFields->>'${customFieldKey}' IS NULL OR contact.customFields->>'${customFieldKey}' = '')`);
        } else {
          query[method](`(${fieldPath} IS NULL OR ${fieldPath} = '')`);
        }
        break;

      case 'is_not_empty':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`(contact.customFields->>'${customFieldKey}' IS NOT NULL AND contact.customFields->>'${customFieldKey}' != '')`);
        } else {
          query[method](`(${fieldPath} IS NOT NULL AND ${fieldPath} != '')`);
        }
        break;

      case 'greater_than':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`(contact.customFields->>'${customFieldKey}')::numeric > :${paramName}`, { [paramName]: value });
        } else {
          query[method](`${fieldPath} > :${paramName}`, { [paramName]: value });
        }
        break;

      case 'less_than':
        if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`(contact.customFields->>'${customFieldKey}')::numeric < :${paramName}`, { [paramName]: value });
        } else {
          query[method](`${fieldPath} < :${paramName}`, { [paramName]: value });
        }
        break;

      case 'in':
        if (field === 'tags') {
          query[method](`contact.tags && :${paramName}`, { [paramName]: Array.isArray(value) ? value : [value] });
        } else if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`contact.customFields->>'${customFieldKey}' = ANY(:${paramName})`, { [paramName]: Array.isArray(value) ? value : [value] });
        } else {
          query[method](`${fieldPath} IN (:...${paramName})`, { [paramName]: Array.isArray(value) ? value : [value] });
        }
        break;

      case 'not_in':
        if (field === 'tags') {
          query[method](`NOT (contact.tags && :${paramName})`, { [paramName]: Array.isArray(value) ? value : [value] });
        } else if (isCustomField) {
          const customFieldKey = field.replace('customFields.', '');
          query[method](`contact.customFields->>'${customFieldKey}' != ALL(:${paramName})`, { [paramName]: Array.isArray(value) ? value : [value] });
        } else {
          query[method](`${fieldPath} NOT IN (:...${paramName})`, { [paramName]: Array.isArray(value) ? value : [value] });
        }
        break;
    }
  }

  // Custom Field Definition Management
  async createCustomFieldDefinition(
    tenantId: string,
    createCustomFieldDefinitionDto: CreateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinition> {
    // Check if key already exists for this tenant
    const existing = await this.customFieldDefinitionsRepository.findOne({
      where: { tenantId, key: createCustomFieldDefinitionDto.key },
    });

    if (existing) {
      throw new ConflictException(`Custom field with key '${createCustomFieldDefinitionDto.key}' already exists`);
    }

    // Check tenant limit (50 custom fields per tenant)
    const count = await this.customFieldDefinitionsRepository.count({ where: { tenantId } });
    if (count >= 50) {
      throw new BadRequestException('Maximum of 50 custom fields per tenant reached');
    }

    // Validate dropdown options
    if (createCustomFieldDefinitionDto.type === 'dropdown' && (!createCustomFieldDefinitionDto.options || createCustomFieldDefinitionDto.options.length === 0)) {
      throw new BadRequestException('Dropdown type requires at least one option');
    }

    const customFieldDefinition = this.customFieldDefinitionsRepository.create({
      ...createCustomFieldDefinitionDto,
      tenantId,
    });

    return this.customFieldDefinitionsRepository.save(customFieldDefinition);
  }

  async findAllCustomFieldDefinitions(
    tenantId: string,
    includeInactive: boolean = false,
  ): Promise<CustomFieldDefinition[]> {
    const where: any = { tenantId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.customFieldDefinitionsRepository.find({
      where,
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOneCustomFieldDefinition(tenantId: string, id: string): Promise<CustomFieldDefinition> {
    const customFieldDefinition = await this.customFieldDefinitionsRepository.findOne({
      where: { id, tenantId },
    });

    if (!customFieldDefinition) {
      throw new NotFoundException(`Custom field definition with ID ${id} not found`);
    }

    return customFieldDefinition;
  }

  async updateCustomFieldDefinition(
    tenantId: string,
    id: string,
    updateCustomFieldDefinitionDto: UpdateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinition> {
    const customFieldDefinition = await this.findOneCustomFieldDefinition(tenantId, id);

    // Validate dropdown options if type is being changed to dropdown or options are being updated
    if (updateCustomFieldDefinitionDto.type === 'dropdown' || customFieldDefinition.type === 'dropdown') {
      const options = updateCustomFieldDefinitionDto.options || customFieldDefinition.options;
      if (!options || options.length === 0) {
        throw new BadRequestException('Dropdown type requires at least one option');
      }
    }

    Object.assign(customFieldDefinition, updateCustomFieldDefinitionDto);
    return this.customFieldDefinitionsRepository.save(customFieldDefinition);
  }

  async removeCustomFieldDefinition(tenantId: string, id: string): Promise<void> {
    const customFieldDefinition = await this.findOneCustomFieldDefinition(tenantId, id);
    
    // Optionally, you could check if any contacts are using this field
    // and either prevent deletion or clear the field values
    
    await this.customFieldDefinitionsRepository.remove(customFieldDefinition);
  }

  async reorderCustomFieldDefinition(tenantId: string, id: string, sortOrder: number): Promise<CustomFieldDefinition> {
    const customFieldDefinition = await this.findOneCustomFieldDefinition(tenantId, id);
    customFieldDefinition.sortOrder = sortOrder;
    return this.customFieldDefinitionsRepository.save(customFieldDefinition);
  }

  private async validateCustomFields(tenantId: string, customFields: Record<string, any>): Promise<void> {
    const definitions = await this.findAllCustomFieldDefinitions(tenantId, false);
    
    for (const definition of definitions) {
      const value = customFields[definition.key];

      // Check required fields
      if (definition.isRequired && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(`Custom field '${definition.label}' is required`);
      }

      // Skip validation if value is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Validate based on type
      switch (definition.type) {
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            throw new BadRequestException(`Custom field '${definition.label}' must be a number`);
          }
          break;

        case 'date':
          if (isNaN(Date.parse(value))) {
            throw new BadRequestException(`Custom field '${definition.label}' must be a valid date`);
          }
          break;

        case 'checkbox':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            throw new BadRequestException(`Custom field '${definition.label}' must be a boolean`);
          }
          break;

        case 'dropdown':
          if (definition.options && !definition.options.includes(value)) {
            throw new BadRequestException(
              `Custom field '${definition.label}' must be one of: ${definition.options.join(', ')}`
            );
          }
          break;
      }
    }
  }
}
