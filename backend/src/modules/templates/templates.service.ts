import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template, TemplateStatus } from './entities/template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
  ) {}

  async create(tenantId: string, createTemplateDto: CreateTemplateDto): Promise<Template> {
    // Validate template variables
    this.validateTemplateVariables(createTemplateDto.content, createTemplateDto.variables);

    const template = this.templatesRepository.create({
      ...createTemplateDto,
      tenantId,
      category: createTemplateDto.category as any,
      language: createTemplateDto.language as any,
      status: TemplateStatus.DRAFT,
    });

    return this.templatesRepository.save(template);
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    category?: string,
    search?: string,
  ): Promise<{ data: Template[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    
    const query = this.templatesRepository.createQueryBuilder('template')
      .where('template.tenantId = :tenantId', { tenantId });

    if (status) {
      query.andWhere('template.status = :status', { status });
    }

    if (category) {
      query.andWhere('template.category = :category', { category });
    }

    if (search) {
      query.andWhere('(template.name ILIKE :search OR template.content ILIKE :search)', { 
        search: `%${search}%` 
      });
    }

    const [data, total] = await query
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy('template.createdAt', 'DESC')
      .getManyAndCount();

    const hasMore = pageNum * limitNum < total;

    return { data, total, page: pageNum, limit: limitNum, hasMore };
  }

  async findOne(tenantId: string, id: string): Promise<Template> {
    const template = await this.templatesRepository.findOne({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async update(tenantId: string, id: string, updateData: Partial<CreateTemplateDto>): Promise<Template> {
    const template = await this.findOne(tenantId, id);

    if (template.status === TemplateStatus.APPROVED) {
      throw new BadRequestException('Cannot update approved template');
    }

    if (updateData.content && updateData.variables) {
      this.validateTemplateVariables(updateData.content, updateData.variables);
    }

    Object.assign(template, updateData);
    return this.templatesRepository.save(template);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const template = await this.findOne(tenantId, id);

    if (template.status === TemplateStatus.APPROVED) {
      throw new BadRequestException('Cannot delete approved template');
    }

    await this.templatesRepository.delete({ id, tenantId });
  }

  async submit(tenantId: string, id: string): Promise<Template> {
    const template = await this.findOne(tenantId, id);

    if (template.status !== TemplateStatus.DRAFT) {
      throw new BadRequestException('Only draft templates can be submitted');
    }

    // In production, this would submit to Meta API
    template.status = TemplateStatus.PENDING;
    template.submittedAt = new Date();

    return this.templatesRepository.save(template);
  }

  async approve(tenantId: string, id: string, externalId?: string): Promise<Template> {
    const template = await this.findOne(tenantId, id);

    template.status = TemplateStatus.APPROVED;
    template.approvedAt = new Date();
    if (externalId) {
      template.externalId = externalId;
    }

    return this.templatesRepository.save(template);
  }

  async reject(tenantId: string, id: string, reason: string): Promise<Template> {
    const template = await this.findOne(tenantId, id);

    template.status = TemplateStatus.REJECTED;
    template.rejectionReason = reason;

    return this.templatesRepository.save(template);
  }

  async preview(tenantId: string, id: string, variables: Record<string, string>): Promise<string> {
    const template = await this.findOne(tenantId, id);

    let preview = template.content;

    // Replace variables with provided values
    if (template.variables) {
      template.variables.forEach((variable, index) => {
        const value = variables[variable.name] || variable.example;
        preview = preview.replace(`{{${index + 1}}}`, value);
      });
    }

    return preview;
  }

  private validateTemplateVariables(content: string, variables?: Array<{ name: string; example: string }>): void {
    // Extract variable placeholders from content
    const placeholders = content.match(/\{\{\d+\}\}/g) || [];
    const variableCount = placeholders.length;

    if (variables && variables.length !== variableCount) {
      throw new BadRequestException(
        `Template has ${variableCount} placeholders but ${variables.length} variables provided`,
      );
    }

    // Validate placeholder numbering
    for (let i = 1; i <= variableCount; i++) {
      if (!content.includes(`{{${i}}}`)) {
        throw new BadRequestException(`Missing placeholder {{${i}}} in template`);
      }
    }
  }

  async sendTemplate(
    tenantId: string,
    templateId: string,
    contactId: string,
    variables: Record<string, string>,
  ): Promise<any> {
    const template = await this.findOne(tenantId, templateId);

    if (template.status !== TemplateStatus.APPROVED) {
      throw new BadRequestException('Only approved templates can be sent');
    }

    // Generate message content from template
    const content = await this.preview(tenantId, templateId, variables);

    // In production, this would send via WhatsApp API
    return {
      templateId: template.id,
      contactId,
      content,
      status: 'sent',
      sentAt: new Date(),
    };
  }
}
