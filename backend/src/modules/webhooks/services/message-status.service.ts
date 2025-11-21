import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignMessage, MessageStatus } from '../../campaigns/entities/campaign-message.entity';

@Injectable()
export class MessageStatusService {
  private readonly logger = new Logger(MessageStatusService.name);

  constructor(
    @InjectRepository(CampaignMessage)
    private campaignMessageRepository: Repository<CampaignMessage>,
  ) {}

  /**
   * Update message status from webhook
   */
  async updateMessageStatus(
    metaMessageId: string,
    status: string,
    timestamp: number,
    errorInfo?: { code: string; message: string },
  ): Promise<void> {
    this.logger.log(`📨 Updating message status: ${metaMessageId} -> ${status}`);

    try {
      const message = await this.campaignMessageRepository.findOne({
        where: { metaMessageId },
      });

      if (!message) {
        this.logger.warn(`Message not found: ${metaMessageId}`);
        return;
      }

      const statusDate = new Date(timestamp * 1000);

      switch (status.toLowerCase()) {
        case 'sent':
          message.status = MessageStatus.SENT;
          message.sentAt = statusDate;
          break;

        case 'delivered':
          message.status = MessageStatus.DELIVERED;
          message.deliveredAt = statusDate;
          break;

        case 'read':
          message.status = MessageStatus.READ;
          message.readAt = statusDate;
          break;

        case 'failed':
          message.status = MessageStatus.FAILED;
          message.failedAt = statusDate;
          if (errorInfo) {
            message.errorCode = errorInfo.code;
            message.errorMessage = errorInfo.message;
          }
          break;

        default:
          this.logger.warn(`Unknown message status: ${status}`);
          return;
      }

      await this.campaignMessageRepository.save(message);
      this.logger.log(`✅ Message status updated: ${metaMessageId} -> ${status}`);
    } catch (error) {
      this.logger.error(`Failed to update message status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get message delivery statistics for a campaign
   */
  async getCampaignStats(campaignId: string): Promise<{
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    pending: number;
  }> {
    const messages = await this.campaignMessageRepository.find({
      where: { campaignId },
    });

    return {
      total: messages.length,
      sent: messages.filter((m) => m.status === MessageStatus.SENT).length,
      delivered: messages.filter((m) => m.status === MessageStatus.DELIVERED).length,
      read: messages.filter((m) => m.status === MessageStatus.READ).length,
      failed: messages.filter((m) => m.status === MessageStatus.FAILED).length,
      pending: messages.filter((m) => m.status === MessageStatus.PENDING).length,
    };
  }
}
