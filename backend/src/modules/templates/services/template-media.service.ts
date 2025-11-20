import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetaApiClientService } from './meta-api-client.service';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

export interface MediaUploadResult {
  mediaHandle: string;
  mediaUrl: string;
  type: 'image' | 'video' | 'document';
  size: number;
  mimetype: string;
  filename: string;
}

export interface MediaPreview {
  url: string;
  type: string;
  expiresAt?: string;
}

/**
 * Template Media Service
 * 
 * Handles media upload for template headers including:
 * - File validation (type, size limits)
 * - Local storage for preview
 * - Meta API media upload integration
 * - Media URL generation
 * - Media preview support
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */
@Injectable()
export class TemplateMediaService {
  private readonly logger = new Logger(TemplateMediaService.name);
  private readonly uploadDir: string;
  
  // File size limits (Requirements 11.2)
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_VIDEO_SIZE = 16 * 1024 * 1024; // 16MB
  private readonly MAX_DOCUMENT_SIZE = 100 * 1024 * 1024; // 100MB
  
  // Allowed MIME types (Requirements 11.3, 11.4, 11.5)
  private readonly ALLOWED_MIME_TYPES = {
    image: ['image/jpeg', 'image/jpg', 'image/png'],
    video: ['video/mp4', 'video/3gpp'],
    document: ['application/pdf'],
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly metaApiClient: MetaApiClientService,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'templates', 'media');
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fsPromises.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ensured: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  /**
   * Upload media for template header
   * 
   * @param tenantId - Tenant ID
   * @param file - Uploaded file
   * @param type - Media type (image, video, document)
   * @returns Media upload result with handle and URL
   */
  async uploadMedia(
    tenantId: string,
    file: Express.Multer.File,
    type: 'image' | 'video' | 'document',
  ): Promise<MediaUploadResult> {
    this.logger.log(`Uploading ${type} media for tenant: ${tenantId}`);

    // Validate file (Requirements 11.2, 11.3, 11.4, 11.5)
    this.validateFile(file, type);

    try {
      // Save file locally for preview (Requirement 11.6)
      const localFile = await this.saveFileLocally(file, type, tenantId);

      // Upload to Meta API (Requirement 11.7)
      const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
      const accessToken = this.configService.get<string>('META_ACCESS_TOKEN');

      if (!phoneNumberId || !accessToken) {
        this.logger.warn('Meta API credentials not configured, skipping Meta upload');
        
        // Return local file info without Meta handle
        return {
          mediaHandle: localFile.filename, // Use local filename as temporary handle
          mediaUrl: localFile.url,
          type,
          size: file.size,
          mimetype: file.mimetype,
          filename: localFile.filename,
        };
      }

      // Upload to Meta API
      const mediaHandle = await this.metaApiClient.uploadMedia(
        file.buffer,
        type,
        phoneNumberId,
        accessToken,
      );

      this.logger.log(`Media uploaded successfully. Handle: ${mediaHandle}`);

      // Return upload result (Requirement 11.4)
      return {
        mediaHandle,
        mediaUrl: localFile.url,
        type,
        size: file.size,
        mimetype: file.mimetype,
        filename: localFile.filename,
      };
    } catch (error) {
      this.logger.error(`Failed to upload media: ${error.message}`);
      throw new BadRequestException(`Failed to upload media: ${error.message}`);
    }
  }

  /**
   * Validate uploaded file
   * 
   * Requirements 11.2, 11.3, 11.4, 11.5
   */
  private validateFile(
    file: Express.Multer.File,
    type: 'image' | 'video' | 'document',
  ): void {
    // Check if file exists
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (Requirement 11.2)
    const maxSize = this.getMaxFileSize(type);
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB for ${type}`,
      );
    }

    // Validate MIME type (Requirements 11.3, 11.4, 11.5)
    const allowedTypes = this.ALLOWED_MIME_TYPES[type];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types for ${type}: ${allowedTypes.join(', ')}`,
      );
    }

    // Additional validation for images
    if (type === 'image') {
      this.validateImageFile(file);
    }

    // Additional validation for videos
    if (type === 'video') {
      this.validateVideoFile(file);
    }

    // Additional validation for documents
    if (type === 'document') {
      this.validateDocumentFile(file);
    }

    this.logger.debug(`File validation passed: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
  }

  /**
   * Get maximum file size for media type
   */
  private getMaxFileSize(type: 'image' | 'video' | 'document'): number {
    const sizes = {
      image: this.MAX_IMAGE_SIZE,
      video: this.MAX_VIDEO_SIZE,
      document: this.MAX_DOCUMENT_SIZE,
    };
    return sizes[type];
  }

  /**
   * Validate image file
   * Requirement 11.3: IMAGE format validation (JPEG, PNG)
   */
  private validateImageFile(file: Express.Multer.File): void {
    // Check file signature (magic numbers) for additional security
    const buffer = file.buffer;
    
    // JPEG signature: FF D8 FF
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    
    // PNG signature: 89 50 4E 47
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    
    if (!isJPEG && !isPNG) {
      throw new BadRequestException('Invalid image file. Only JPEG and PNG formats are supported.');
    }
  }

  /**
   * Validate video file
   * Requirement 11.4: VIDEO format validation (MP4, 3GPP)
   */
  private validateVideoFile(file: Express.Multer.File): void {
    // Basic validation - in production, you might want to use a library like ffprobe
    // to validate video codec, resolution, etc.
    
    const buffer = file.buffer;
    
    // MP4 signature check (ftyp box)
    const ftypIndex = buffer.indexOf(Buffer.from('ftyp'));
    if (ftypIndex === -1 && file.mimetype === 'video/mp4') {
      throw new BadRequestException('Invalid MP4 file format');
    }
  }

  /**
   * Validate document file
   * Requirement 11.5: DOCUMENT format validation (PDF)
   */
  private validateDocumentFile(file: Express.Multer.File): void {
    // PDF signature: %PDF
    const buffer = file.buffer;
    const isPDF = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    
    if (!isPDF) {
      throw new BadRequestException('Invalid PDF file format');
    }
  }

  /**
   * Save file locally for preview
   * Requirement 11.6: Media preview support
   */
  private async saveFileLocally(
    file: Express.Multer.File,
    type: string,
    tenantId: string,
  ): Promise<{ filename: string; path: string; url: string }> {
    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || this.getDefaultExtension(type);
    const filename = `${tenantId}-${type}-${timestamp}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Save file
    await fsPromises.writeFile(filePath, file.buffer);
    this.logger.debug(`File saved locally: ${filePath}`);

    // Generate URL (Requirement 11.4)
    const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    const url = `${baseUrl}/uploads/templates/media/${filename}`;

    return {
      filename,
      path: filePath,
      url,
    };
  }

  /**
   * Get default file extension for media type
   */
  private getDefaultExtension(type: string): string {
    const extensions: Record<string, string> = {
      image: '.jpg',
      video: '.mp4',
      document: '.pdf',
    };
    return extensions[type] || '';
  }

  /**
   * Get media preview URL
   * Requirement 11.6: Media preview support
   * 
   * @param tenantId - Tenant ID
   * @param mediaHandle - Media handle from Meta API or local filename
   * @returns Media preview information
   */
  async getMediaPreview(tenantId: string, mediaHandle: string): Promise<MediaPreview> {
    this.logger.debug(`Getting media preview for handle: ${mediaHandle}`);

    // Check if it's a local file (temporary handle)
    const localFilePath = path.join(this.uploadDir, mediaHandle);
    
    try {
      await fsPromises.access(localFilePath);
      
      // File exists locally
      const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
      const url = `${baseUrl}/uploads/templates/media/${mediaHandle}`;
      
      // Determine type from filename
      const ext = path.extname(mediaHandle).toLowerCase();
      let type = 'unknown';
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        type = 'image';
      } else if (['.mp4', '.3gp'].includes(ext)) {
        type = 'video';
      } else if (ext === '.pdf') {
        type = 'document';
      }
      
      return {
        url,
        type,
      };
    } catch (error) {
      // File doesn't exist locally, might be a Meta media handle
      // In production, you would fetch the URL from Meta API
      this.logger.warn(`Media file not found locally: ${mediaHandle}`);
      throw new NotFoundException(`Media with handle ${mediaHandle} not found`);
    }
  }

  /**
   * Delete local media file
   * 
   * @param filename - Local filename to delete
   */
  async deleteLocalMedia(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);
    
    try {
      await fsPromises.unlink(filePath);
      this.logger.log(`Deleted local media file: ${filename}`);
    } catch (error) {
      this.logger.warn(`Failed to delete local media file: ${filename}`, error.message);
    }
  }

  /**
   * Get media URL from Meta API
   * 
   * @param mediaHandle - Meta media handle
   * @param accessToken - Meta access token
   * @returns Media URL
   */
  async getMediaUrlFromMeta(mediaHandle: string, accessToken: string): Promise<string> {
    // This would call Meta API to get the media URL
    // For now, return a placeholder
    this.logger.debug(`Getting media URL from Meta for handle: ${mediaHandle}`);
    
    // In production, implement Meta API call to retrieve media URL
    // GET /{media-id}
    
    return `https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=${mediaHandle}`;
  }
}
