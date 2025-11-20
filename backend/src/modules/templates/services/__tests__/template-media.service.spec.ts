import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemplateMediaService } from '../template-media.service';
import { MetaApiClientService } from '../meta-api-client.service';
import { promises as fsPromises } from 'fs';

// Mock fs promises module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('TemplateMediaService', () => {
  let service: TemplateMediaService;
  let metaApiClient: MetaApiClientService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        APP_URL: 'http://localhost:3000',
        WHATSAPP_PHONE_NUMBER_ID: 'test-phone-id',
        META_ACCESS_TOKEN: 'test-token',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockMetaApiClient = {
    uploadMedia: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateMediaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MetaApiClientService,
          useValue: mockMetaApiClient,
        },
      ],
    }).compile();

    service = module.get<TemplateMediaService>(TemplateMediaService);
    metaApiClient = module.get<MetaApiClientService>(MetaApiClientService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadMedia', () => {
    const tenantId = 'tenant-123';

    describe('Image Upload', () => {
      it('should upload valid JPEG image', async () => {
        // Create valid JPEG buffer (starts with FF D8 FF)
        const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Array(100).fill(0)]);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        mockMetaApiClient.uploadMedia.mockResolvedValue('meta-handle-123');

        const result = await service.uploadMedia(tenantId, file, 'image');

        expect(result).toHaveProperty('mediaHandle', 'meta-handle-123');
        expect(result).toHaveProperty('type', 'image');
        expect(result).toHaveProperty('size', buffer.length);
        expect(result).toHaveProperty('mimetype', 'image/jpeg');
        expect(mockMetaApiClient.uploadMedia).toHaveBeenCalledWith(
          buffer,
          'image',
          'test-phone-id',
          'test-token',
        );
      });

      it('should upload valid PNG image', async () => {
        // Create valid PNG buffer (starts with 89 50 4E 47)
        const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, ...Array(100).fill(0)]);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.png',
          encoding: '7bit',
          mimetype: 'image/png',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        mockMetaApiClient.uploadMedia.mockResolvedValue('meta-handle-456');

        const result = await service.uploadMedia(tenantId, file, 'image');

        expect(result).toHaveProperty('mediaHandle', 'meta-handle-456');
        expect(result).toHaveProperty('mimetype', 'image/png');
      });

      it('should reject image exceeding 5MB', async () => {
        const buffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'large.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(service.uploadMedia(tenantId, file, 'image')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadMedia(tenantId, file, 'image')).rejects.toThrow(
          /exceeds maximum allowed size/,
        );
      });

      it('should reject invalid image MIME type', async () => {
        const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.gif',
          encoding: '7bit',
          mimetype: 'image/gif',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(service.uploadMedia(tenantId, file, 'image')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadMedia(tenantId, file, 'image')).rejects.toThrow(
          /Invalid file type/,
        );
      });

      it('should reject image with invalid signature', async () => {
        // Invalid image signature
        const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, ...Array(100).fill(0)]);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'fake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(service.uploadMedia(tenantId, file, 'image')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadMedia(tenantId, file, 'image')).rejects.toThrow(
          /Invalid image file/,
        );
      });
    });

    describe('Video Upload', () => {
      it('should upload valid MP4 video', async () => {
        // Create buffer with ftyp box (MP4 signature)
        const buffer = Buffer.concat([
          Buffer.from([0x00, 0x00, 0x00, 0x20]),
          Buffer.from('ftyp'),
          Buffer.alloc(100),
        ]);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.mp4',
          encoding: '7bit',
          mimetype: 'video/mp4',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        mockMetaApiClient.uploadMedia.mockResolvedValue('meta-video-123');

        const result = await service.uploadMedia(tenantId, file, 'video');

        expect(result).toHaveProperty('mediaHandle', 'meta-video-123');
        expect(result).toHaveProperty('type', 'video');
        expect(result).toHaveProperty('mimetype', 'video/mp4');
      });

      it('should reject video exceeding 16MB', async () => {
        const buffer = Buffer.alloc(17 * 1024 * 1024); // 17MB
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'large.mp4',
          encoding: '7bit',
          mimetype: 'video/mp4',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(service.uploadMedia(tenantId, file, 'video')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadMedia(tenantId, file, 'video')).rejects.toThrow(
          /exceeds maximum allowed size/,
        );
      });

      it('should reject invalid video MIME type', async () => {
        const buffer = Buffer.from('ftyp');
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.avi',
          encoding: '7bit',
          mimetype: 'video/avi',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(service.uploadMedia(tenantId, file, 'video')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadMedia(tenantId, file, 'video')).rejects.toThrow(
          /Invalid file type/,
        );
      });
    });

    describe('Document Upload', () => {
      it('should upload valid PDF document', async () => {
        // Create valid PDF buffer (starts with %PDF)
        const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, ...Array(100).fill(0)]);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        mockMetaApiClient.uploadMedia.mockResolvedValue('meta-doc-123');

        const result = await service.uploadMedia(tenantId, file, 'document');

        expect(result).toHaveProperty('mediaHandle', 'meta-doc-123');
        expect(result).toHaveProperty('type', 'document');
        expect(result).toHaveProperty('mimetype', 'application/pdf');
      });

      it('should reject document exceeding 100MB', async () => {
        const buffer = Buffer.alloc(101 * 1024 * 1024); // 101MB
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'large.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(service.uploadMedia(tenantId, file, 'document')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadMedia(tenantId, file, 'document')).rejects.toThrow(
          /exceeds maximum allowed size/,
        );
      });

      it('should reject invalid PDF signature', async () => {
        // Invalid PDF signature
        const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, ...Array(100).fill(0)]);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'fake.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(service.uploadMedia(tenantId, file, 'document')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadMedia(tenantId, file, 'document')).rejects.toThrow(
          /Invalid PDF file format/,
        );
      });
    });

    describe('General Validation', () => {
      it('should reject missing file', async () => {
        await expect(service.uploadMedia(tenantId, null as any, 'image')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle Meta API upload failure', async () => {
        const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Array(100).fill(0)]);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        mockMetaApiClient.uploadMedia.mockRejectedValue(new Error('Meta API error'));

        await expect(service.uploadMedia(tenantId, file, 'image')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should work without Meta API credentials (local only)', async () => {
        // Mock config to return no credentials
        mockConfigService.get.mockImplementation((key: string) => {
          if (key === 'APP_URL') return 'http://localhost:3000';
          return undefined;
        });

        const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Array(100).fill(0)]);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: buffer.length,
          buffer,
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        const result = await service.uploadMedia(tenantId, file, 'image');

        expect(result).toHaveProperty('mediaHandle');
        expect(result).toHaveProperty('mediaUrl');
        expect(mockMetaApiClient.uploadMedia).not.toHaveBeenCalled();
      });
    });
  });

  describe('getMediaPreview', () => {
    it('should return preview for existing local file', async () => {
      const mediaHandle = 'tenant-123-image-1234567890.jpg';
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);

      const result = await service.getMediaPreview('tenant-123', mediaHandle);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('type', 'image');
      expect(result.url).toContain(mediaHandle);
    });

    it('should throw NotFoundException for non-existent file', async () => {
      const mediaHandle = 'non-existent.jpg';
      (fsPromises.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(service.getMediaPreview('tenant-123', mediaHandle)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should detect video type from extension', async () => {
      const mediaHandle = 'tenant-123-video-1234567890.mp4';
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);

      const result = await service.getMediaPreview('tenant-123', mediaHandle);

      expect(result.type).toBe('video');
    });

    it('should detect document type from extension', async () => {
      const mediaHandle = 'tenant-123-document-1234567890.pdf';
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);

      const result = await service.getMediaPreview('tenant-123', mediaHandle);

      expect(result.type).toBe('document');
    });
  });
});
