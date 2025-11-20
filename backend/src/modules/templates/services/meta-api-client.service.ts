import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as FormData from 'form-data';

// Meta API Response Types
export interface MetaTemplateResponse {
  id: string;
  status: string;
  category?: string;
}

export interface MetaTemplateStatus {
  id: string;
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
  category: string;
  language: string;
  rejected_reason?: string;
  quality_score?: {
    score: string;
    date: number;
  };
}

export interface MetaMediaUploadResponse {
  id: string; // Media handle
}

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
}

// Template submission payload types
export interface MetaTemplateSubmission {
  name: string;
  language: string;
  category: string;
  components: any[];
  wabaId?: string;
}

// Component types for Meta API
export interface MetaHeaderComponent {
  type: 'HEADER';
  format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
  text?: string;
  example?: {
    header_text?: string[];
    header_handle?: string[];
  };
}

export interface MetaBodyComponent {
  type: 'BODY';
  text: string;
  example?: {
    body_text: string[][];
  };
}

export interface MetaFooterComponent {
  type: 'FOOTER';
  text: string;
}

export interface MetaButtonComponent {
  type: 'BUTTONS';
  buttons: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
    example?: string[];
  }>;
}

/**
 * Meta API Client Service for WhatsApp Template Management
 * 
 * This service handles all interactions with Meta's WhatsApp Business Management API
 * for template operations including submission, status polling, and media uploads.
 */
@Injectable()
export class MetaApiClientService {
  private readonly logger = new Logger(MetaApiClientService.name);
  private axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiVersion: string;

  constructor(private configService: ConfigService) {
    this.apiVersion = this.configService.get<string>('META_API_VERSION') || 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(`Meta API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Meta API Request Error:', error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(`Meta API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error('Meta API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Submit a template to Meta for approval
   * 
   * @param data - Template submission data
   * @param accessToken - WhatsApp Business Account access token
   * @returns Meta template response with ID and status
   */
  async submitTemplate(
    data: MetaTemplateSubmission,
    accessToken: string,
  ): Promise<MetaTemplateResponse> {
    const wabaId = data.wabaId || this.configService.get<string>('WABA_ID');
    
    if (!wabaId) {
      throw new HttpException(
        'WhatsApp Business Account ID (WABA_ID) is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!accessToken) {
      throw new HttpException(
        'Access token is required for template submission',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const payload = {
        name: data.name,
        language: data.language,
        category: data.category,
        components: this.formatComponents(data.components),
      };

      this.logger.log(`Submitting template "${data.name}" to Meta API`);
      this.logger.debug('Template payload:', JSON.stringify(payload, null, 2));

      const response = await this.axiosInstance.post(
        `/${wabaId}/message_templates`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log(`Template "${data.name}" submitted successfully. ID: ${response.data.id}`);

      return {
        id: response.data.id,
        status: response.data.status || 'PENDING',
        category: response.data.category,
      };
    } catch (error) {
      throw this.handleMetaApiError(error, 'Failed to submit template');
    }
  }

  /**
   * Get template status from Meta API
   * 
   * @param templateId - Meta template ID
   * @param accessToken - WhatsApp Business Account access token
   * @returns Template status information
   */
  async getTemplateStatus(
    templateId: string,
    accessToken: string,
  ): Promise<MetaTemplateStatus> {
    if (!templateId) {
      throw new HttpException(
        'Template ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!accessToken) {
      throw new HttpException(
        'Access token is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      this.logger.debug(`Fetching status for template ID: ${templateId}`);

      const response = await this.axiosInstance.get(
        `/${templateId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            fields: 'id,name,status,category,language,rejected_reason,quality_score',
          },
        },
      );

      this.logger.debug(`Template status: ${response.data.status}`);

      return {
        id: response.data.id,
        name: response.data.name,
        status: response.data.status,
        category: response.data.category,
        language: response.data.language,
        rejected_reason: response.data.rejected_reason,
        quality_score: response.data.quality_score,
      };
    } catch (error) {
      throw this.handleMetaApiError(error, 'Failed to get template status');
    }
  }

  /**
   * Upload media file to Meta for use in template headers
   * 
   * @param file - File buffer to upload
   * @param type - Media type (image, video, document)
   * @param phoneNumberId - WhatsApp phone number ID
   * @param accessToken - WhatsApp Business Account access token
   * @returns Media handle (ID) for use in template
   */
  async uploadMedia(
    file: Buffer,
    type: 'image' | 'video' | 'document',
    phoneNumberId: string,
    accessToken: string,
  ): Promise<string> {
    if (!file || file.length === 0) {
      throw new HttpException(
        'File is required for media upload',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!phoneNumberId) {
      throw new HttpException(
        'Phone number ID is required for media upload',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!accessToken) {
      throw new HttpException(
        'Access token is required for media upload',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const formData = new FormData();
      formData.append('file', file, {
        filename: `template_media.${this.getFileExtension(type)}`,
        contentType: this.getContentType(type),
      });
      formData.append('type', type);
      formData.append('messaging_product', 'whatsapp');

      this.logger.log(`Uploading ${type} media to Meta API`);

      const response = await this.axiosInstance.post(
        `/${phoneNumberId}/media`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...formData.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      const mediaHandle = response.data.id;
      this.logger.log(`Media uploaded successfully. Handle: ${mediaHandle}`);

      return mediaHandle;
    } catch (error) {
      throw this.handleMetaApiError(error, 'Failed to upload media');
    }
  }

  /**
   * Format template components for Meta API submission
   * 
   * @param components - Raw template components
   * @returns Formatted components array for Meta API
   */
  formatComponents(components: any): any[] {
    const formatted: any[] = [];

    // Format Header Component
    if (components.header) {
      formatted.push(this.formatHeaderComponent(components.header));
    }

    // Format Body Component (required)
    if (components.body) {
      formatted.push(this.formatBodyComponent(components.body));
    }

    // Format Footer Component
    if (components.footer) {
      formatted.push(this.formatFooterComponent(components.footer));
    }

    // Format Buttons Component
    if (components.buttons && components.buttons.length > 0) {
      formatted.push(this.formatButtonsComponent(components.buttons));
    }

    return formatted;
  }

  /**
   * Format header component for Meta API
   */
  private formatHeaderComponent(header: any): MetaHeaderComponent {
    const component: MetaHeaderComponent = {
      type: 'HEADER',
      format: header.type,
    };

    if (header.type === 'TEXT') {
      component.text = header.text;
      
      // Add example if header has placeholder
      if (header.text && header.text.includes('{{1}}')) {
        const placeholders = header.placeholders || [];
        if (placeholders.length > 0) {
          component.example = {
            header_text: placeholders.map((p: any) => p.example),
          };
        }
      }
    } else {
      // For media headers (IMAGE, VIDEO, DOCUMENT)
      if (header.mediaHandle) {
        component.example = {
          header_handle: [header.mediaHandle],
        };
      }
    }

    return component;
  }

  /**
   * Format body component for Meta API
   */
  private formatBodyComponent(body: any): MetaBodyComponent {
    const component: MetaBodyComponent = {
      type: 'BODY',
      text: body.text,
    };

    // Add examples for placeholders
    if (body.placeholders && body.placeholders.length > 0) {
      const examples = body.placeholders
        .sort((a: any, b: any) => a.index - b.index)
        .map((p: any) => p.example);
      
      component.example = {
        body_text: [examples],
      };
    }

    return component;
  }

  /**
   * Format footer component for Meta API
   */
  private formatFooterComponent(footer: any): MetaFooterComponent {
    return {
      type: 'FOOTER',
      text: footer.text,
    };
  }

  /**
   * Format buttons component for Meta API
   */
  private formatButtonsComponent(buttons: any[]): MetaButtonComponent {
    return {
      type: 'BUTTONS',
      buttons: buttons.map((button) => this.formatButton(button)),
    };
  }

  /**
   * Format individual button for Meta API
   * 
   * @param button - Button configuration
   * @returns Formatted button object
   */
  formatButton(button: any): any {
    const formatted: any = {
      type: button.type,
      text: button.text,
    };

    switch (button.type) {
      case 'QUICK_REPLY':
        // Quick reply buttons don't need additional fields
        break;

      case 'URL':
        formatted.url = button.url;
        
        // Add example if URL has dynamic parameter
        if (button.url && button.url.includes('{{1}}')) {
          formatted.example = ['https://example.com/order/12345'];
        }
        break;

      case 'PHONE_NUMBER':
        formatted.phone_number = button.phoneNumber;
        break;

      default:
        this.logger.warn(`Unknown button type: ${button.type}`);
    }

    return formatted;
  }

  /**
   * Handle Meta API errors and convert to user-friendly exceptions
   * 
   * @param error - Axios error or generic error
   * @param defaultMessage - Default error message if specific error cannot be extracted
   * @returns HttpException with appropriate status and message
   */
  handleMetaApiError(error: any, defaultMessage: string): HttpException {
    // Check if it's an Axios error with response
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error: MetaApiError }>;
      
      if (axiosError.response?.data?.error) {
        const metaError = axiosError.response.data.error;
        
        // Build detailed error message
        let errorMessage = metaError.message || metaError.error_user_msg || defaultMessage;
        
        // Add error code if available
        if (metaError.code) {
          errorMessage = `[Meta Error ${metaError.code}] ${errorMessage}`;
        }
        
        // Add subcode if available
        if (metaError.error_subcode) {
          errorMessage += ` (Subcode: ${metaError.error_subcode})`;
        }
        
        // Add trace ID for debugging
        if (metaError.fbtrace_id) {
          this.logger.error(`Meta API Error - Trace ID: ${metaError.fbtrace_id}`);
        }
        
        // Map Meta error codes to HTTP status codes
        const statusCode = this.mapMetaErrorToHttpStatus(metaError.code);
        
        // Add helpful hints for common errors
        errorMessage = this.addErrorHints(metaError.code, errorMessage);
        
        this.logger.error(`Meta API Error: ${errorMessage}`);
        
        return new HttpException(
          {
            statusCode,
            message: errorMessage,
            error: 'Meta API Error',
            metaErrorCode: metaError.code,
            metaErrorType: metaError.type,
            traceId: metaError.fbtrace_id,
          },
          statusCode,
        );
      }
      
      // Handle network errors
      if (axiosError.code === 'ECONNABORTED') {
        return new HttpException(
          'Request to Meta API timed out. Please try again.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }
      
      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
        return new HttpException(
          'Unable to connect to Meta API. Please check your network connection.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }
    
    // Generic error handling
    const errorMessage = error.message || defaultMessage;
    this.logger.error(`Unexpected error: ${errorMessage}`);
    
    return new HttpException(
      errorMessage,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Map Meta API error codes to HTTP status codes
   */
  private mapMetaErrorToHttpStatus(metaErrorCode: number): number {
    const errorCodeMap: Record<number, number> = {
      100: HttpStatus.BAD_REQUEST, // Invalid parameter
      190: HttpStatus.UNAUTHORIZED, // Invalid access token
      200: HttpStatus.FORBIDDEN, // Permission denied
      368: HttpStatus.TOO_MANY_REQUESTS, // Temporarily blocked for policies violations
      4: HttpStatus.TOO_MANY_REQUESTS, // Rate limit exceeded
      80007: HttpStatus.BAD_REQUEST, // Invalid template format
      131031: HttpStatus.BAD_REQUEST, // Template name already exists
      131030: HttpStatus.BAD_REQUEST, // Template parameter count mismatch
      131026: HttpStatus.BAD_REQUEST, // Template format invalid
    };

    return errorCodeMap[metaErrorCode] || HttpStatus.BAD_REQUEST;
  }

  /**
   * Add helpful hints for common Meta API errors
   */
  private addErrorHints(metaErrorCode: number, message: string): string {
    const hints: Record<number, string> = {
      190: 'Please verify your access token is valid and has not expired.',
      100: 'Please check that all required fields are provided and correctly formatted.',
      131031: 'A template with this name already exists. Please use a different name.',
      131030: 'The number of placeholder examples does not match the placeholders in the template.',
      131026: 'The template format is invalid. Please check component structure and placeholder formatting.',
      368: 'Your account has been temporarily blocked. Please review Meta\'s policies and try again later.',
      4: 'Rate limit exceeded. Please wait a few minutes before trying again.',
    };

    const hint = hints[metaErrorCode];
    return hint ? `${message}\n\nHint: ${hint}` : message;
  }

  /**
   * Get file extension based on media type
   */
  private getFileExtension(type: string): string {
    const extensions: Record<string, string> = {
      image: 'jpg',
      video: 'mp4',
      document: 'pdf',
    };
    return extensions[type] || 'bin';
  }

  /**
   * Get content type based on media type
   */
  private getContentType(type: string): string {
    const contentTypes: Record<string, string> = {
      image: 'image/jpeg',
      video: 'video/mp4',
      document: 'application/pdf',
    };
    return contentTypes[type] || 'application/octet-stream';
  }

  /**
   * Send test template message
   * Requirement 12.3: Implement test send via Meta API
   * 
   * @param data - Test template data
   * @returns Message ID and status
   */
  async sendTestTemplate(data: {
    templateName: string;
    templateId?: string;
    language: string;
    to: string;
    components: any[];
  }): Promise<{ messageId: string; status: string }> {
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId) {
      throw new HttpException(
        'WhatsApp Phone Number ID is required for sending messages',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!accessToken) {
      throw new HttpException(
        'Access token is required for sending messages',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: data.to,
        type: 'template',
        template: {
          name: data.templateName,
          language: {
            code: data.language,
          },
          components: data.components,
        },
      };

      this.logger.log(`Sending test template "${data.templateName}" to ${data.to}`);
      this.logger.debug('Test message payload:', JSON.stringify(payload, null, 2));

      const response = await this.axiosInstance.post(
        `/${phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const messageId = response.data.messages?.[0]?.id;
      
      if (!messageId) {
        throw new HttpException(
          'Failed to get message ID from Meta API response',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(`Test template sent successfully. Message ID: ${messageId}`);

      return {
        messageId,
        status: 'sent',
      };
    } catch (error) {
      throw this.handleMetaApiError(error, 'Failed to send test template');
    }
  }
}
