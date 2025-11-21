import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomingMessage, MessageType } from '../entities/incoming-message.entity';
import { ConversationSyncService } from './conversation-sync.service';

@Injectable()
export class IncomingMessageService {
  private readonly logger = new Logger(IncomingMessageService.name);

  constructor(
    @InjectRepository(IncomingMessage)
    private incomingMessageRepository: Repository<IncomingMessage>,
    private conversationSyncService: ConversationSyncService,
  ) {}

  /**
   * Save incoming message from webhook
   */
  async saveIncomingMessage(data: {
    tenantId: string;
    metaMessageId: string;
    from: string;
    fromName?: string;
    type: string;
    text?: string;
    media?: any;
    context?: any;
    timestamp: number;
  }): Promise<IncomingMessage> {
    this.logger.log(`💬 Saving incoming message from ${data.from}`);

    try {
      // Check if message already exists
      const existing = await this.incomingMessageRepository.findOne({
        where: { metaMessageId: data.metaMessageId },
      });

      if (existing) {
        this.logger.warn(`Message already exists: ${data.metaMessageId}`);
        return existing;
      }

      const message = this.incomingMessageRepository.create({
        tenantId: data.tenantId,
        metaMessageId: data.metaMessageId,
        from: data.from,
        fromName: data.fromName,
        type: this.mapMessageType(data.type),
        text: data.text,
        media: data.media,
        context: data.context,
        timestamp: new Date(data.timestamp * 1000),
      });

      const saved = await this.incomingMessageRepository.save(message);
      this.logger.log(`✅ Incoming message saved: ${saved.id}`);

      // Sync to conversation for inbox
      try {
        await this.conversationSyncService.syncIncomingMessage(saved);
      } catch (error) {
        this.logger.error(`Failed to sync to conversation: ${error.message}`);
        // Don't throw - message is already saved
      }

      return saved;
    } catch (error) {
      this.logger.error(`Failed to save incoming message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get incoming messages for a tenant
   */
  async getMessages(
    tenantId: string,
    options?: {
      from?: string;
      isRead?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ messages: IncomingMessage[]; total: number }> {
    const query = this.incomingMessageRepository
      .createQueryBuilder('message')
      .where('message.tenantId = :tenantId', { tenantId });

    if (options?.from) {
      query.andWhere('message.from = :from', { from: options.from });
    }

    if (options?.isRead !== undefined) {
      query.andWhere('message.isRead = :isRead', { isRead: options.isRead });
    }

    query.orderBy('message.timestamp', 'DESC');

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    const [messages, total] = await query.getManyAndCount();

    return { messages, total };
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    await this.incomingMessageRepository.update(messageId, {
      isRead: true,
    });
  }

  /**
   * Mark message as replied
   */
  async markAsReplied(messageId: string): Promise<void> {
    await this.incomingMessageRepository.update(messageId, {
      isReplied: true,
      repliedAt: new Date(),
    });
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(tenantId: string): Promise<number> {
    return this.incomingMessageRepository.count({
      where: { tenantId, isRead: false },
    });
  }

  /**
   * Map Meta message type to our enum
   */
  private mapMessageType(type: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      text: MessageType.TEXT,
      image: MessageType.IMAGE,
      video: MessageType.VIDEO,
      document: MessageType.DOCUMENT,
      audio: MessageType.AUDIO,
      location: MessageType.LOCATION,
      contacts: MessageType.CONTACTS,
      interactive: MessageType.INTERACTIVE,
    };

    return typeMap[type.toLowerCase()] || MessageType.TEXT;
  }
}
