import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PlatformBrandingService } from '../services/platform-branding.service';
import { UpdateBrandingDto } from '../dto/update-branding.dto';
import { FileUploadService } from '../../../common/services/file-upload.service';

@Controller('super-admin/settings/branding')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class PlatformBrandingController {
  constructor(
    private readonly brandingService: PlatformBrandingService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get()
  async getSettings() {
    return this.brandingService.getSettings();
  }

  @Put()
  async updateSettings(@Body() dto: UpdateBrandingDto, @Request() req) {
    return this.brandingService.updateSettings(dto as any, req.user.userId);
  }

  @Get('css')
  async getCSS() {
    const config = await this.brandingService.getSettings();
    const css = await this.brandingService.generateCSS(config);
    return { css };
  }

  @Post('upload/logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadedFile = await this.fileUploadService.uploadLogo(file);

    // Update branding settings with new logo URL
    const currentSettings = await this.brandingService.getSettings();

    // Delete old logo if exists
    if (currentSettings.logo) {
      const oldFilename =
        this.fileUploadService.extractFilenameFromUrl(currentSettings.logo);
      if (oldFilename) {
        await this.fileUploadService.deleteFile(oldFilename);
      }
    }

    await this.brandingService.updateSettings(
      { logo: uploadedFile.url },
      req.user.userId,
    );

    return {
      url: uploadedFile.url,
      filename: uploadedFile.filename,
      size: uploadedFile.size,
    };
  }

  @Post('upload/favicon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFavicon(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadedFile = await this.fileUploadService.uploadFavicon(file);

    // Update branding settings with new favicon URL
    const currentSettings = await this.brandingService.getSettings();

    // Delete old favicon if exists
    if (currentSettings.favicon) {
      const oldFilename = this.fileUploadService.extractFilenameFromUrl(
        currentSettings.favicon,
      );
      if (oldFilename) {
        await this.fileUploadService.deleteFile(oldFilename);
      }
    }

    await this.brandingService.updateSettings(
      { favicon: uploadedFile.url },
      req.user.userId,
    );

    return {
      url: uploadedFile.url,
      filename: uploadedFile.filename,
      size: uploadedFile.size,
    };
  }
}
