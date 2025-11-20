import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

export interface UploadedFile {
  filename: string;
  path: string;
  url: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = {
    logo: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
    favicon: ['image/x-icon', 'image/png', 'image/jpeg', 'image/jpg'],
  };

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'branding');
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async uploadLogo(file: Express.Multer.File): Promise<UploadedFile> {
    return this.uploadFile(file, 'logo');
  }

  async uploadFavicon(file: Express.Multer.File): Promise<UploadedFile> {
    return this.uploadFile(file, 'favicon');
  }

  private async uploadFile(
    file: Express.Multer.File,
    type: 'logo' | 'favicon',
  ): Promise<UploadedFile> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Validate mime type
    if (!this.allowedMimeTypes[type].includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes[type].join(', ')}`,
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${type}-${timestamp}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Save file
    await writeFile(filePath, file.buffer);

    // Generate URL
    const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    const url = `${baseUrl}/uploads/branding/${filename}`;

    return {
      filename,
      path: filePath,
      url,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);
    try {
      await unlink(filePath);
    } catch (error) {
      // File doesn't exist or already deleted
    }
  }

  extractFilenameFromUrl(url: string): string | null {
    const match = url.match(/\/uploads\/branding\/(.+)$/);
    return match ? match[1] : null;
  }
}
