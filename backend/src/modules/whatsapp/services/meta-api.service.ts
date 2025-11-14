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
}
