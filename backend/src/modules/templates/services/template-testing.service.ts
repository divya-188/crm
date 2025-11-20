import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateTestSend, TestSendStatus, TestSendStatusType } from '../entities/template-test-send.entity';
import { TestPhoneNumber } from '../entities/test-phone-number.entity';
import { Template, TemplateStatus } from '../entities/template.entity';
import { SendTestTemplateDto, AddTestPhoneNumberDto, UpdateTestPhoneNumberDto } from '../dto/send-test-template.dto';
import { MetaApiClientService } from './meta-api-client.service';
import { TemplatePreviewService } from './template-preview.service';

/**
 * Service for template testing functionality
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 */
@Injectable()
export class TemplateTestingService {
  private readonly logger = new Logger(TemplateTestingService.name);
  private readonly MAX_TEST_NUMBERS_PER_WABA = 5;

  constructor(
    @InjectRepository(TemplateTestSend)
    private testSendRepository: Repository<TemplateTestSend>,
    @InjectRepository(TestPhoneNumber)
    private testPhoneNumberRepository: Repository<TestPhoneNumber>,
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    private metaApiClient: MetaApiClientService,
    private previewService: TemplatePreviewService,
  ) {}

  /**
   * Send test template to a phone number
   * Requirements: 12.1, 12.3, 12.4, 12.5
   */
  async sendTestTemplate(
    tenantId: string,
    templateId: string,
    dto: SendTestTemplateDto,
    userId?: string,
  ): Promise<TemplateTestSend> {
    this.logger.log(
      `Sending test template ${templateId} to ${dto.testPhoneNumber}`,
    );

    // 1. Find and validate template
    const template = await this.templateRepository.findOne({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // 2. Validate template status - allow testing for PENDING and APPROVED templates
    // Requirement 12.3: Support testing templates in PENDING status
    if (
      template.status !== TemplateStatus.PENDING &&
      template.status !== TemplateStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Cannot test template in ${template.status} status. Only PENDING and APPROVED templates can be tested.`,
      );
    }

    // 3. Validate test phone number format (already validated by DTO, but double-check)
    this.validatePhoneNumber(dto.testPhoneNumber);

    // 4. Validate placeholder values
    // Requirement 12.4: Validate all required placeholders are filled
    const placeholderValues = dto.placeholderValues || {};
    this.validatePlaceholderValues(template, placeholderValues);

    // 5. Create test send record
    const testSend = this.testSendRepository.create({
      templateId: template.id,
      tenantId,
      testPhoneNumber: dto.testPhoneNumber,
      placeholderValues,
      status: TestSendStatus.SENT,
      sentByUserId: userId,
    });

    try {
      // 6. Send test message via Meta API
      // Requirement 12.3: Implement test send via Meta API
      const metaResponse = await this.metaApiClient.sendTestTemplate({
        templateName: template.metaTemplateName || template.name,
        templateId: template.metaTemplateId,
        language: template.language,
        to: dto.testPhoneNumber,
        components: this.formatComponentsForTest(template, placeholderValues),
      });

      // 7. Update test send with Meta response
      testSend.metaMessageId = metaResponse.messageId;
      testSend.metaResponse = metaResponse;
      testSend.status = TestSendStatus.SENT;

      this.logger.log(
        `Test template sent successfully. Message ID: ${metaResponse.messageId}`,
      );
    } catch (error) {
      // 8. Handle test send failure
      // Requirement 12.5: Display test message delivery status and errors
      this.logger.error(
        `Failed to send test template: ${error.message}`,
        error.stack,
      );

      testSend.status = TestSendStatus.FAILED;
      testSend.errorMessage = error.message;
      testSend.metaResponse = error.response?.data || null;
    }

    // 9. Save test send record
    const savedTestSend = await this.testSendRepository.save(testSend);

    // 10. Update test phone number usage if it exists
    await this.updateTestPhoneNumberUsage(tenantId, dto.testPhoneNumber);

    this.logger.log(`Test send record created: ${savedTestSend.id}`);
    return savedTestSend;
  }

  /**
   * Get test send history for a template
   * Requirement 12.6: Implement test send history
   */
  async getTestSendHistory(
    tenantId: string,
    templateId: string,
    options: {
      page?: number;
      limit?: number;
      status?: TestSendStatusType;
    } = {},
  ): Promise<{
    data: TemplateTestSend[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, status } = options;

    this.logger.log(
      `Fetching test send history for template ${templateId}, page: ${page}`,
    );

    const query = this.testSendRepository
      .createQueryBuilder('testSend')
      .where('testSend.templateId = :templateId', { templateId })
      .andWhere('testSend.tenantId = :tenantId', { tenantId });

    if (status) {
      query.andWhere('testSend.status = :status', { status });
    }

    query
      .orderBy('testSend.sentAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a specific test send by ID
   */
  async getTestSend(
    tenantId: string,
    testSendId: string,
  ): Promise<TemplateTestSend> {
    const testSend = await this.testSendRepository.findOne({
      where: { id: testSendId, tenantId },
      relations: ['template'],
    });

    if (!testSend) {
      throw new NotFoundException(`Test send with ID ${testSendId} not found`);
    }

    return testSend;
  }

  /**
   * Update test send status (called by webhook handler)
   * Requirement 12.5: Track test send status
   */
  async updateTestSendStatus(
    testSendId: string,
    status: TestSendStatusType,
    metadata?: {
      deliveredAt?: Date;
      readAt?: Date;
      errorMessage?: string;
    },
  ): Promise<TemplateTestSend> {
    const testSend = await this.testSendRepository.findOne({
      where: { id: testSendId },
    });

    if (!testSend) {
      throw new NotFoundException(`Test send with ID ${testSendId} not found`);
    }

    testSend.status = status;

    if (metadata?.deliveredAt) {
      testSend.deliveredAt = metadata.deliveredAt;
    }

    if (metadata?.readAt) {
      testSend.readAt = metadata.readAt;
    }

    if (metadata?.errorMessage) {
      testSend.errorMessage = metadata.errorMessage;
    }

    return await this.testSendRepository.save(testSend);
  }

  /**
   * Add a test phone number
   * Requirement 12.2, 12.7: Test phone number management (max 5 per WABA)
   */
  async addTestPhoneNumber(
    tenantId: string,
    dto: AddTestPhoneNumberDto,
    userId?: string,
  ): Promise<TestPhoneNumber> {
    this.logger.log(
      `Adding test phone number ${dto.phoneNumber} for WABA ${dto.wabaId}`,
    );

    // 1. Validate phone number format
    this.validatePhoneNumber(dto.phoneNumber);

    // 2. Check if phone number already exists
    const existingNumber = await this.testPhoneNumberRepository.findOne({
      where: {
        tenantId,
        phoneNumber: dto.phoneNumber,
      },
    });

    if (existingNumber) {
      throw new BadRequestException(
        `Phone number ${dto.phoneNumber} is already registered as a test number`,
      );
    }

    // 3. Check max limit per WABA
    // Requirement 12.7: Max 5 test phone numbers per WABA
    const activeCount = await this.testPhoneNumberRepository.count({
      where: {
        tenantId,
        wabaId: dto.wabaId,
        isActive: true,
      },
    });

    if (activeCount >= this.MAX_TEST_NUMBERS_PER_WABA) {
      throw new BadRequestException(
        `Maximum ${this.MAX_TEST_NUMBERS_PER_WABA} test phone numbers allowed per WABA. Please remove an existing number first.`,
      );
    }

    // 4. Create test phone number
    const testPhoneNumber = this.testPhoneNumberRepository.create({
      tenantId,
      wabaId: dto.wabaId,
      phoneNumber: dto.phoneNumber,
      label: dto.label,
      isActive: true,
      addedByUserId: userId,
      usageCount: 0,
    });

    const saved = await this.testPhoneNumberRepository.save(testPhoneNumber);
    this.logger.log(`Test phone number added: ${saved.id}`);

    return saved;
  }

  /**
   * Get all test phone numbers for a tenant
   * Requirement 12.2: Test phone number management
   */
  async getTestPhoneNumbers(
    tenantId: string,
    wabaId?: string,
  ): Promise<TestPhoneNumber[]> {
    const query = this.testPhoneNumberRepository
      .createQueryBuilder('testNumber')
      .where('testNumber.tenantId = :tenantId', { tenantId })
      .andWhere('testNumber.isActive = :isActive', { isActive: true });

    if (wabaId) {
      query.andWhere('testNumber.wabaId = :wabaId', { wabaId });
    }

    query.orderBy('testNumber.createdAt', 'DESC');

    return await query.getMany();
  }

  /**
   * Update a test phone number
   */
  async updateTestPhoneNumber(
    tenantId: string,
    testNumberId: string,
    dto: UpdateTestPhoneNumberDto,
  ): Promise<TestPhoneNumber> {
    const testNumber = await this.testPhoneNumberRepository.findOne({
      where: { id: testNumberId, tenantId },
    });

    if (!testNumber) {
      throw new NotFoundException(
        `Test phone number with ID ${testNumberId} not found`,
      );
    }

    if (dto.label !== undefined) {
      testNumber.label = dto.label;
    }

    if (dto.isActive !== undefined) {
      testNumber.isActive = dto.isActive;
    }

    return await this.testPhoneNumberRepository.save(testNumber);
  }

  /**
   * Remove a test phone number
   * Requirement 12.7: Test phone number management
   */
  async removeTestPhoneNumber(
    tenantId: string,
    testNumberId: string,
  ): Promise<void> {
    const testNumber = await this.testPhoneNumberRepository.findOne({
      where: { id: testNumberId, tenantId },
    });

    if (!testNumber) {
      throw new NotFoundException(
        `Test phone number with ID ${testNumberId} not found`,
      );
    }

    await this.testPhoneNumberRepository.remove(testNumber);
    this.logger.log(`Test phone number removed: ${testNumberId}`);
  }

  /**
   * Validate phone number format
   * Requirement 12.1: Test phone number validation
   */
  private validatePhoneNumber(phoneNumber: string): void {
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    if (!e164Regex.test(phoneNumber)) {
      throw new BadRequestException(
        `Invalid phone number format. Must be in E.164 format (e.g., +1234567890)`,
      );
    }
  }

  /**
   * Validate placeholder values against template
   * Requirement 12.4: Validate all required placeholders are filled
   */
  private validatePlaceholderValues(
    template: Template,
    placeholderValues: Record<string, string>,
  ): void {
    // Get placeholders from template components
    const placeholders = template.components?.body?.placeholders || [];

    if (placeholders.length === 0) {
      // No placeholders required
      return;
    }

    // Check that all placeholders have values
    const missingPlaceholders: number[] = [];

    for (const placeholder of placeholders) {
      const key = String(placeholder.index);
      if (!placeholderValues[key] || placeholderValues[key].trim() === '') {
        missingPlaceholders.push(placeholder.index);
      }
    }

    if (missingPlaceholders.length > 0) {
      throw new BadRequestException(
        `Missing values for placeholders: ${missingPlaceholders.map(i => `{{${i}}}`).join(', ')}`,
      );
    }

    // Also check header placeholder if exists
    if (
      template.components?.header?.type === 'TEXT' &&
      template.components.header.text?.includes('{{1}}')
    ) {
      if (!placeholderValues['1'] || placeholderValues['1'].trim() === '') {
        throw new BadRequestException(
          'Missing value for header placeholder {{1}}',
        );
      }
    }
  }

  /**
   * Format template components for test send
   */
  private formatComponentsForTest(
    template: Template,
    placeholderValues: Record<string, string>,
  ): any[] {
    const components = [];

    // Header component
    if (template.components?.header) {
      if (template.components.header.type === 'TEXT') {
        let headerText = template.components.header.text || '';
        // Replace placeholder if exists
        if (headerText.includes('{{1}}') && placeholderValues['1']) {
          headerText = headerText.replace('{{1}}', placeholderValues['1']);
        }
        components.push({
          type: 'header',
          parameters: [
            {
              type: 'text',
              text: headerText,
            },
          ],
        });
      } else if (template.components.header.mediaHandle) {
        components.push({
          type: 'header',
          parameters: [
            {
              type: template.components.header.type.toLowerCase(),
              [template.components.header.type.toLowerCase()]: {
                id: template.components.header.mediaHandle,
              },
            },
          ],
        });
      }
    }

    // Body component with placeholders
    if (template.components?.body) {
      const bodyParameters = [];
      const placeholders = template.components.body.placeholders || [];

      for (const placeholder of placeholders) {
        const value = placeholderValues[String(placeholder.index)] || placeholder.example;
        bodyParameters.push({
          type: 'text',
          text: value,
        });
      }

      if (bodyParameters.length > 0) {
        components.push({
          type: 'body',
          parameters: bodyParameters,
        });
      }
    }

    // Buttons with dynamic URLs
    if (template.components?.buttons) {
      const buttonParameters = [];
      let buttonIndex = 0;

      for (const button of template.components.buttons) {
        if (button.type === 'URL' && button.url?.includes('{{1}}')) {
          // Dynamic URL button
          const urlValue = placeholderValues[`button_${buttonIndex}`] || 'test';
          buttonParameters.push({
            type: 'button',
            sub_type: 'url',
            index: buttonIndex,
            parameters: [
              {
                type: 'text',
                text: urlValue,
              },
            ],
          });
        }
        buttonIndex++;
      }

      if (buttonParameters.length > 0) {
        components.push(...buttonParameters);
      }
    }

    return components;
  }

  /**
   * Update test phone number usage statistics
   */
  private async updateTestPhoneNumberUsage(
    tenantId: string,
    phoneNumber: string,
  ): Promise<void> {
    try {
      const testNumber = await this.testPhoneNumberRepository.findOne({
        where: { tenantId, phoneNumber, isActive: true },
      });

      if (testNumber) {
        testNumber.lastUsedAt = new Date();
        testNumber.usageCount += 1;
        await this.testPhoneNumberRepository.save(testNumber);
      }
    } catch (error) {
      // Don't throw - usage tracking should not block test send
      this.logger.error(
        `Failed to update test phone number usage: ${error.message}`,
      );
    }
  }
}
