import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplatePreviewService } from '../template-preview.service';
import { Template, TemplateStatus, TemplateCategory, TemplateLanguage } from '../../entities/template.entity';
import { BadRequestException } from '@nestjs/common';

describe('TemplatePreviewService', () => {
  let service: TemplatePreviewService;
  let repository: Repository<Template>;

  const mockTemplate: Partial<Template> = {
    id: 'test-template-id',
    tenantId: 'test-tenant-id',
    name: 'order_confirmation',
    displayName: 'Order Confirmation',
    category: TemplateCategory.TRANSACTIONAL,
    language: TemplateLanguage.EN_US,
    status: TemplateStatus.APPROVED,
    components: {
      header: {
        type: 'TEXT',
        text: 'Order Update for {{1}}',
      },
      body: {
        text: 'Hello {{1}}, your order {{2}} has been confirmed and will be delivered by {{3}}.',
        placeholders: [
          { index: 1, example: 'John' },
          { index: 2, example: '#12345' },
          { index: 3, example: 'Dec 25' },
        ],
      },
      footer: {
        text: 'Reply STOP to unsubscribe',
      },
      buttons: [
        {
          type: 'QUICK_REPLY',
          text: 'Track Order',
        },
        {
          type: 'QUICK_REPLY',
          text: 'Contact Support',
        },
      ],
    },
    sampleValues: {
      '1': 'John',
      '2': '#12345',
      '3': 'Dec 25',
    },
  };

  const mockRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatePreviewService,
        {
          provide: getRepositoryToken(Template),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TemplatePreviewService>(TemplatePreviewService);
    repository = module.get<Repository<Template>>(getRepositoryToken(Template));

    // Clear cache before each test
    service.clearCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePreview', () => {
    it('should generate a complete preview with all components', async () => {
      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const preview = await service.generatePreview('test-template-id');

      expect(preview).toBeDefined();
      expect(preview.header).toEqual({
        type: 'TEXT',
        content: 'Order Update for John',
      });
      expect(preview.body).toBe(
        'Hello John, your order #12345 has been confirmed and will be delivered by Dec 25.',
      );
      expect(preview.footer).toBe('Reply STOP to unsubscribe');
      expect(preview.buttons).toHaveLength(2);
      expect(preview.buttons[0].text).toBe('Track Order');
      expect(preview.metadata.templateName).toBe('Order Confirmation');
    });

    it('should replace placeholders with provided sample values', async () => {
      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const customSampleValues = {
        '1': 'Jane',
        '2': '#67890',
        '3': 'Jan 15',
      };

      const preview = await service.generatePreview('test-template-id', customSampleValues);

      expect(preview.header.content).toBe('Order Update for Jane');
      expect(preview.body).toBe(
        'Hello Jane, your order #67890 has been confirmed and will be delivered by Jan 15.',
      );
    });

    it('should handle templates without header', async () => {
      const templateWithoutHeader = {
        ...mockTemplate,
        components: {
          ...mockTemplate.components,
          header: undefined,
        },
      };
      mockRepository.findOne.mockResolvedValue(templateWithoutHeader);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.header).toBeUndefined();
      expect(preview.body).toBeDefined();
    });

    it('should handle templates without footer', async () => {
      const templateWithoutFooter = {
        ...mockTemplate,
        components: {
          ...mockTemplate.components,
          footer: undefined,
        },
      };
      mockRepository.findOne.mockResolvedValue(templateWithoutFooter);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.footer).toBeUndefined();
      expect(preview.body).toBeDefined();
    });

    it('should handle templates without buttons', async () => {
      const templateWithoutButtons = {
        ...mockTemplate,
        components: {
          ...mockTemplate.components,
          buttons: undefined,
        },
      };
      mockRepository.findOne.mockResolvedValue(templateWithoutButtons);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.buttons).toBeUndefined();
      expect(preview.body).toBeDefined();
    });

    it('should handle media header types', async () => {
      const templateWithImageHeader = {
        ...mockTemplate,
        components: {
          ...mockTemplate.components,
          header: {
            type: 'IMAGE' as const,
            mediaUrl: 'https://example.com/image.jpg',
          },
        },
      };
      mockRepository.findOne.mockResolvedValue(templateWithImageHeader);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.header).toEqual({
        type: 'IMAGE',
        content: '[IMAGE]',
        mediaUrl: 'https://example.com/image.jpg',
      });
    });

    it('should throw error if template not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.generatePreview('non-existent-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should keep placeholders visible if no sample value provided', async () => {
      const templateWithPlaceholders = {
        ...mockTemplate,
        components: {
          body: {
            text: 'Hello {{1}}, your order {{2}} is ready',
            placeholders: [],
          },
        },
        sampleValues: {},
      };
      mockRepository.findOne.mockResolvedValue(templateWithPlaceholders);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.body).toBe('Hello {{1}}, your order {{2}} is ready');
    });
  });

  describe('generatePreviewFromData', () => {
    it('should generate preview from template data without database', async () => {
      const templateData = {
        name: 'test_template',
        displayName: 'Test Template',
        category: 'TRANSACTIONAL',
        language: 'en_US',
        components: {
          body: {
            text: 'Hello {{1}}, welcome!',
            placeholders: [{ index: 1, example: 'User' }],
          },
        },
        sampleValues: {
          '1': 'User',
        },
      };

      const preview = await service.generatePreviewFromData(templateData);

      expect(preview.body).toBe('Hello User, welcome!');
      expect(preview.metadata.templateName).toBe('Test Template');
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should use provided sample values over template sample values', async () => {
      const templateData = {
        name: 'test_template',
        category: 'TRANSACTIONAL',
        language: 'en_US',
        components: {
          body: {
            text: 'Hello {{1}}',
            placeholders: [{ index: 1, example: 'Default' }],
          },
        },
        sampleValues: {
          '1': 'Default',
        },
      };

      const customValues = {
        '1': 'Custom',
      };

      const preview = await service.generatePreviewFromData(templateData, customValues);

      expect(preview.body).toBe('Hello Custom');
    });
  });

  describe('generateWhatsAppBubblePreview', () => {
    it('should generate HTML and plain text preview', async () => {
      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const bubble = await service.generateWhatsAppBubblePreview('test-template-id');

      expect(bubble.html).toContain('whatsapp-message-bubble');
      expect(bubble.html).toContain('Order Update for John');
      expect(bubble.html).toContain('message-buttons');
      expect(bubble.plainText).toContain('**Order Update for John**');
      expect(bubble.plainText).toContain('[Track Order]');
    });

    it('should escape HTML in content', async () => {
      const templateWithHtml = {
        ...mockTemplate,
        components: {
          body: {
            text: 'Hello <script>alert("xss")</script> {{1}}',
            placeholders: [{ index: 1, example: 'User' }],
          },
        },
        sampleValues: {
          '1': 'User',
        },
      };
      mockRepository.findOne.mockResolvedValue(templateWithHtml);

      const bubble = await service.generateWhatsAppBubblePreview('test-template-id');

      expect(bubble.html).not.toContain('<script>');
      expect(bubble.html).toContain('&lt;script&gt;');
    });

    it('should handle media headers in HTML preview', async () => {
      const templateWithMedia = {
        ...mockTemplate,
        components: {
          ...mockTemplate.components,
          header: {
            type: 'IMAGE' as const,
            mediaUrl: 'https://example.com/image.jpg',
          },
        },
      };
      mockRepository.findOne.mockResolvedValue(templateWithMedia);

      const bubble = await service.generateWhatsAppBubblePreview('test-template-id');

      expect(bubble.html).toContain('message-media');
      expect(bubble.html).toContain('https://example.com/image.jpg');
    });
  });

  describe('caching', () => {
    it('should cache preview results', async () => {
      mockRepository.findOne.mockResolvedValue(mockTemplate);

      // First call - should hit database
      await service.generatePreview('test-template-id');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await service.generatePreview('test-template-id');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should use different cache keys for different sample values', async () => {
      mockRepository.findOne.mockResolvedValue(mockTemplate);

      await service.generatePreview('test-template-id', { '1': 'Value1' });
      await service.generatePreview('test-template-id', { '1': 'Value2' });

      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache for specific template', async () => {
      mockRepository.findOne.mockResolvedValue(mockTemplate);

      await service.generatePreview('test-template-id');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);

      service.invalidateCache('test-template-id');

      await service.generatePreview('test-template-id');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      mockRepository.findOne.mockResolvedValue(mockTemplate);

      await service.generatePreview('test-template-id');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);

      service.clearCache();

      await service.generatePreview('test-template-id');
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should return cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('ttl');
      expect(stats.maxSize).toBe(1000);
    });
  });

  describe('button rendering', () => {
    it('should render quick reply buttons', async () => {
      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.buttons).toHaveLength(2);
      expect(preview.buttons[0]).toEqual({
        type: 'QUICK_REPLY',
        text: 'Track Order',
        url: undefined,
        phoneNumber: undefined,
      });
    });

    it('should render URL buttons with URLs', async () => {
      const templateWithUrlButton = {
        ...mockTemplate,
        components: {
          ...mockTemplate.components,
          buttons: [
            {
              type: 'URL',
              text: 'Visit Website',
              url: 'https://example.com',
            },
          ],
        },
      };
      mockRepository.findOne.mockResolvedValue(templateWithUrlButton);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.buttons[0]).toEqual({
        type: 'URL',
        text: 'Visit Website',
        url: 'https://example.com',
        phoneNumber: undefined,
      });
    });

    it('should render phone number buttons', async () => {
      const templateWithPhoneButton = {
        ...mockTemplate,
        components: {
          ...mockTemplate.components,
          buttons: [
            {
              type: 'PHONE_NUMBER',
              text: 'Call Support',
              phoneNumber: '+1234567890',
            },
          ],
        },
      };
      mockRepository.findOne.mockResolvedValue(templateWithPhoneButton);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.buttons[0]).toEqual({
        type: 'PHONE_NUMBER',
        text: 'Call Support',
        url: undefined,
        phoneNumber: '+1234567890',
      });
    });
  });

  describe('legacy template support', () => {
    it('should handle templates with legacy content field', async () => {
      const legacyTemplate = {
        ...mockTemplate,
        content: 'Hello {{1}}, your order {{2}} is ready',
        components: {},
        sampleValues: {
          '1': 'John',
          '2': '#12345',
        },
      };
      mockRepository.findOne.mockResolvedValue(legacyTemplate);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.body).toBe('Hello John, your order #12345 is ready');
    });

    it('should handle templates with legacy footer field', async () => {
      const legacyTemplate = {
        ...mockTemplate,
        footer: 'Legacy footer text',
        components: {
          body: {
            text: 'Body text',
            placeholders: [],
          },
        },
      };
      mockRepository.findOne.mockResolvedValue(legacyTemplate);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.footer).toBe('Legacy footer text');
    });

    it('should handle templates with legacy buttons field', async () => {
      const legacyTemplate = {
        ...mockTemplate,
        buttons: [
          {
            type: 'QUICK_REPLY',
            text: 'Legacy Button',
          },
        ],
        components: {
          body: {
            text: 'Body text',
            placeholders: [],
          },
        },
      };
      mockRepository.findOne.mockResolvedValue(legacyTemplate);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.buttons).toHaveLength(1);
      expect(preview.buttons[0].text).toBe('Legacy Button');
    });
  });

  describe('edge cases', () => {
    it('should handle empty body text', async () => {
      const templateWithEmptyBody = {
        ...mockTemplate,
        components: {
          body: {
            text: '',
            placeholders: [],
          },
        },
      };
      mockRepository.findOne.mockResolvedValue(templateWithEmptyBody);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.body).toBe('');
    });

    it('should handle templates with no components', async () => {
      const templateWithNoComponents = {
        ...mockTemplate,
        components: {},
        content: 'Fallback content',
      };
      mockRepository.findOne.mockResolvedValue(templateWithNoComponents);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.body).toBe('Fallback content');
    });

    it('should handle multiple placeholders in sequence', async () => {
      const template = {
        ...mockTemplate,
        components: {
          body: {
            text: '{{1}}{{2}}{{3}}',
            placeholders: [],
          },
        },
        sampleValues: {
          '1': 'A',
          '2': 'B',
          '3': 'C',
        },
      };
      mockRepository.findOne.mockResolvedValue(template);

      const preview = await service.generatePreview('test-template-id');

      expect(preview.body).toBe('ABC');
    });

    it('should handle special characters in sample values', async () => {
      const template = {
        ...mockTemplate,
        components: {
          body: {
            text: 'Hello {{1}}',
            placeholders: [],
          },
        },
        sampleValues: {
          '1': '<script>alert("xss")</script>',
        },
      };
      mockRepository.findOne.mockResolvedValue(template);

      const preview = await service.generatePreview('test-template-id');

      // Preview should contain the raw value (escaping happens in HTML rendering)
      expect(preview.body).toContain('<script>');
    });
  });
});
