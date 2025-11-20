import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MetaApiService {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('WHATSAPP_API_URL') || 'https://graph.facebook.com/v18.0';
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
    });
  }

  async sendMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: { type: string; text?: { body: string }; image?: any; video?: any; document?: any },
  ): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        `/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          ...message,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to send message',
        error.response?.status || 500,
      );
    }
  }

  async sendTextMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    text: string,
  ): Promise<any> {
    return this.sendMessage(phoneNumberId, accessToken, to, {
      type: 'text',
      text: { body: text },
    });
  }

  async sendMediaMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    type: 'image' | 'video' | 'document',
    mediaUrl: string,
    caption?: string,
  ): Promise<any> {
    const mediaObject: any = { link: mediaUrl };
    if (caption) {
      mediaObject.caption = caption;
    }

    return this.sendMessage(phoneNumberId, accessToken, to, {
      type,
      [type]: mediaObject,
    });
  }

  async getPhoneNumberInfo(phoneNumberId: string, accessToken: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/${phoneNumberId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          fields: 'verified_name,display_phone_number,quality_rating',
        },
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to get phone number info',
        error.response?.status || 500,
      );
    }
  }

  async markMessageAsRead(phoneNumberId: string, accessToken: string, messageId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        `/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Failed to mark message as read',
        error.response?.status || 500,
      );
    }
  }

  async testConnection(accessToken: string, phoneNumberId: string): Promise<{ success: boolean; message: string }> {
    try {
      const info = await this.getPhoneNumberInfo(phoneNumberId, accessToken);
      
      return {
        success: true,
        message: `Connected successfully to ${info.display_phone_number || 'WhatsApp Business'}`,
      };
    } catch (error) {
      // Extract detailed error information from Meta API response or HttpException
      let errorMessage = 'Connection test failed';
      
      // Check if it's an HttpException (thrown by getPhoneNumberInfo)
      if (error instanceof HttpException) {
        const response = error.getResponse();
        
        // If response is an object, try to extract error details
        if (typeof response === 'object' && response !== null) {
          const errorData = response as any;
          
          // Check for Meta API error structure
          if (errorData.error) {
            const metaError = errorData.error;
            errorMessage = metaError.message || metaError.error_user_msg || errorMessage;
            
            if (metaError.code) {
              errorMessage = `[${metaError.code}] ${errorMessage}`;
              
              // Add helpful hints for common errors
              if (metaError.code === 190) {
                errorMessage += ' (Invalid access token - please check your token)';
              } else if (metaError.code === 100) {
                errorMessage += ' (Invalid phone number ID - please verify the ID)';
              }
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (typeof response === 'string') {
          errorMessage = response;
        }
      }
      // Check for Axios error structure (if error is not wrapped in HttpException)
      else if (error.response?.data?.error) {
        const metaError = error.response.data.error;
        errorMessage = metaError.message || metaError.error_user_msg || errorMessage;
        
        if (metaError.code) {
          errorMessage = `[${metaError.code}] ${errorMessage}`;
          
          if (metaError.code === 190) {
            errorMessage += ' (Invalid access token - please check your token)';
          } else if (metaError.code === 100) {
            errorMessage += ' (Invalid phone number ID - please verify the ID)';
          }
        }
      }
      // Fallback to error message
      else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}
