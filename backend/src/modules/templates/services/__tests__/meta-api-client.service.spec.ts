import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MetaApiClientService } from '../meta-api-client.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MetaApiClientService', () => {
  let service: MetaApiClientService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        META_API_VERSION: 'v18.0',
        WABA_ID: 'test-waba-id',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    (mockedAxios.isAxiosError as any) = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaApiClientService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MetaApiClientService>(MetaApiClientService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitTemplate', () => {
    const mockTemplateData: any = {
      name: 'test_template',
      language: 'en_US',
      category: 'UTILITY',
      components: {
        body: {
          text: 'Hello {{1}}',
          placeholders: [{ index: 1, example: 'John' }],
        },
      },
      wabaId: 'test-waba-id',
    };

    const mockAccessToken = 'test-access-token';

    it('should successfully submit a template', async () => {
      const mockResponse = {
        data: {
          id: 'template-123',
          status: 'PENDING',
          category: 'UTILITY',
        },
      };

      const axiosInstance = (service as any).axiosInstance;
      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.submitTemplate(mockTemplateData, mockAccessToken);

      expect(result).toEqual({
        id: 'template-123',
        status: 'PENDING',
        category: 'UTILITY',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/test-waba-id/message_templates',
        expect.objectContaining({
          name: 'test_template',
          language: 'en_US',
          category: 'UTILITY',
        }),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-access-token',
          },
        }),
      );
    });

    it('should throw error if WABA ID is missing', async () => {
      const dataWithoutWaba = { ...mockTemplateData, wabaId: undefined };
      mockConfigService.get.mockReturnValue(undefined);

      await expect(
        service.submitTemplate(dataWithoutWaba, mockAccessToken),
      ).rejects.toThrow(HttpException);
    });

    it('should throw error if access token is missing', async () => {
      await expect(
        service.submitTemplate(mockTemplateData, ''),
      ).rejects.toThrow('Access token is required for template submission');
    });
  });

  describe('getTemplateStatus', () => {
    const mockTemplateId = 'template-123';
    const mockAccessToken = 'test-access-token';

    it('should successfully get template status', async () => {
      const mockResponse = {
        data: {
          id: 'template-123',
          name: 'test_template',
          status: 'APPROVED',
          category: 'UTILITY',
          language: 'en_US',
        },
      };

      const axiosInstance = (service as any).axiosInstance;
      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getTemplateStatus(mockTemplateId, mockAccessToken);

      expect(result).toEqual({
        id: 'template-123',
        name: 'test_template',
        status: 'APPROVED',
        category: 'UTILITY',
        language: 'en_US',
        rejected_reason: undefined,
        quality_score: undefined,
      });

      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/template-123',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-access-token',
          },
          params: {
            fields: 'id,name,status,category,language,rejected_reason,quality_score',
          },
        }),
      );
    });

    it('should throw error if template ID is missing', async () => {
      await expect(
        service.getTemplateStatus('', mockAccessToken),
      ).rejects.toThrow('Template ID is required');
    });

    it('should throw error if access token is missing', async () => {
      await expect(
        service.getTemplateStatus(mockTemplateId, ''),
      ).rejects.toThrow('Access token is required');
    });
  });

  describe('uploadMedia', () => {
    const mockFile = Buffer.from('test file content');
    const mockPhoneNumberId = 'phone-123';
    const mockAccessToken = 'test-access-token';

    it('should successfully upload media', async () => {
      const mockResponse = {
        data: {
          id: 'media-handle-123',
        },
      };

      const axiosInstance = (service as any).axiosInstance;
      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.uploadMedia(
        mockFile,
        'image',
        mockPhoneNumberId,
        mockAccessToken,
      );

      expect(result).toBe('media-handle-123');
      expect(axiosInstance.post).toHaveBeenCalled();
    });

    it('should throw error if file is empty', async () => {
      await expect(
        service.uploadMedia(Buffer.from(''), 'image', mockPhoneNumberId, mockAccessToken),
      ).rejects.toThrow('File is required for media upload');
    });

    it('should throw error if phone number ID is missing', async () => {
      await expect(
        service.uploadMedia(mockFile, 'image', '', mockAccessToken),
      ).rejects.toThrow('Phone number ID is required for media upload');
    });

    it('should throw error if access token is missing', async () => {
      await expect(
        service.uploadMedia(mockFile, 'image', mockPhoneNumberId, ''),
      ).rejects.toThrow('Access token is required for media upload');
    });
  });

  describe('formatComponents', () => {
    it('should format body component with placeholders', () => {
      const components = {
        body: {
          text: 'Hello {{1}}, your order {{2}} is ready',
          placeholders: [
            { index: 1, example: 'John' },
            { index: 2, example: '#12345' },
          ],
        },
      };

      const result = service.formatComponents(components);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'BODY',
        text: 'Hello {{1}}, your order {{2}} is ready',
        example: {
          body_text: [['John', '#12345']],
        },
      });
    });

    it('should format header component with text', () => {
      const components = {
        header: {
          type: 'TEXT',
          text: 'Welcome {{1}}',
          placeholders: [{ index: 1, example: 'John' }],
        },
        body: {
          text: 'Body text',
          placeholders: [],
        },
      };

      const result = service.formatComponents(components);

      expect(result[0]).toEqual({
        type: 'HEADER',
        format: 'TEXT',
        text: 'Welcome {{1}}',
        example: {
          header_text: ['John'],
        },
      });
    });

    it('should format header component with media', () => {
      const components = {
        header: {
          type: 'IMAGE',
          mediaHandle: 'media-123',
        },
        body: {
          text: 'Body text',
          placeholders: [],
        },
      };

      const result = service.formatComponents(components);

      expect(result[0]).toEqual({
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: ['media-123'],
        },
      });
    });

    it('should format footer component', () => {
      const components = {
        body: {
          text: 'Body text',
          placeholders: [],
        },
        footer: {
          text: 'Reply STOP to unsubscribe',
        },
      };

      const result = service.formatComponents(components);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: 'FOOTER',
        text: 'Reply STOP to unsubscribe',
      });
    });

    it('should format all component types together', () => {
      const components = {
        header: {
          type: 'TEXT',
          text: 'Order Update',
        },
        body: {
          text: 'Hello {{1}}',
          placeholders: [{ index: 1, example: 'John' }],
        },
        footer: {
          text: 'Thank you',
        },
        buttons: [
          {
            type: 'QUICK_REPLY',
            text: 'Confirm',
          },
        ],
      };

      const result = service.formatComponents(components);

      expect(result).toHaveLength(4);
      expect(result[0].type).toBe('HEADER');
      expect(result[1].type).toBe('BODY');
      expect(result[2].type).toBe('FOOTER');
      expect(result[3].type).toBe('BUTTONS');
    });
  });

  describe('formatButton', () => {
    it('should format quick reply button', () => {
      const button = {
        type: 'QUICK_REPLY',
        text: 'Yes',
      };

      const result = service.formatButton(button);

      expect(result).toEqual({
        type: 'QUICK_REPLY',
        text: 'Yes',
      });
    });

    it('should format URL button without dynamic parameter', () => {
      const button = {
        type: 'URL',
        text: 'Visit Website',
        url: 'https://example.com',
      };

      const result = service.formatButton(button);

      expect(result).toEqual({
        type: 'URL',
        text: 'Visit Website',
        url: 'https://example.com',
      });
    });

    it('should format URL button with dynamic parameter', () => {
      const button = {
        type: 'URL',
        text: 'View Order',
        url: 'https://example.com/order/{{1}}',
      };

      const result = service.formatButton(button);

      expect(result).toEqual({
        type: 'URL',
        text: 'View Order',
        url: 'https://example.com/order/{{1}}',
        example: ['https://example.com/order/12345'],
      });
    });

    it('should format phone number button', () => {
      const button = {
        type: 'PHONE_NUMBER',
        text: 'Call Support',
        phoneNumber: '+1234567890',
      };

      const result = service.formatButton(button);

      expect(result).toEqual({
        type: 'PHONE_NUMBER',
        text: 'Call Support',
        phone_number: '+1234567890',
      });
    });
  });

  describe('handleMetaApiError', () => {
    it('should handle Meta API error with full details', () => {
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Invalid template format',
              type: 'OAuthException',
              code: 131026,
              error_subcode: 2388001,
              fbtrace_id: 'trace-123',
            },
          },
        },
        isAxiosError: true,
      };

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = service.handleMetaApiError(mockError, 'Default message');

      expect(result).toBeInstanceOf(HttpException);
      expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(result.getResponse()).toMatchObject({
        message: expect.stringContaining('Invalid template format'),
        metaErrorCode: 131026,
      });
    });

    it('should handle timeout error', () => {
      const mockError = {
        code: 'ECONNABORTED',
        isAxiosError: true,
      };

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = service.handleMetaApiError(mockError, 'Default message');

      expect(result).toBeInstanceOf(HttpException);
      expect(result.getStatus()).toBe(HttpStatus.REQUEST_TIMEOUT);
    });

    it('should handle network connection error', () => {
      const mockError = {
        code: 'ENOTFOUND',
        isAxiosError: true,
      };

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = service.handleMetaApiError(mockError, 'Default message');

      expect(result).toBeInstanceOf(HttpException);
      expect(result.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should handle generic error', () => {
      const mockError = new Error('Generic error');

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = service.handleMetaApiError(mockError, 'Default message');

      expect(result).toBeInstanceOf(HttpException);
      expect(result.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
