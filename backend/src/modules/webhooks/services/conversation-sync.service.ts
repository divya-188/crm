import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { Message } from '../../conversations/entities/message.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { IncomingMessage } from '../entities/incoming-message.entity';

/**
 * Service to sync incoming webhook messages to conversations
 */
@Injectable()
export class ConversationSyncService {
  private readonly logger = new Logger(ConversationSyncService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  /**
   * Create or update conversation from incoming message
   */
  async syncIncomingMessage(incomingMessage: IncomingMessage): Promise<void> {
    this.logger.log(`🔄 Syncing incoming message to conversation: ${incomingMessage.from}`);

    try {
      // Find or create contact
      const contact = await this.findOrCreateContact(
        incomingMessage.tenantId,
        incomingMessage.from,
        incomingMessage.fromName,
      );

      // Find or create conversation
      const conversation = await this.findOrCreateConversation(
        incomingMessage.tenantId,
        contact.id,
      );

      // Create message in conversation
      await this.createConversationMessage(conversation.id, incomingMessage);

      // Update conversation metadata
      await this.updateConversation(conversation, incomingMessage);

      this.logger.log(`✅ Conversation synced: ${conversation.id}`);
    } catch (error) {
      this.logger.error(`Failed to sync conversation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find or create contact
   */
  private async findOrCreateContact(
    tenantId: string,
    phoneNumber: string,
    name?: string,
  ): Promise<Contact> {
    let contact = await this.contactRepository.findOne({
      where: { tenantId, phone: phoneNumber },
    });

    if (!contact) {
      this.logger.log(`Creating new contact: ${phoneNumber}`);
      contact = this.contactRepository.create({
        tenantId,
        phone: phoneNumber,
        firstName: name || phoneNumber,
      });
      contact = await this.contactRepository.save(contact);
    } else if (name && !contact.firstName) {
      // Update contact name if we have it
      contact.firstName = name;
      contact = await this.contactRepository.save(contact);
    }

    return contact;
  }

  /**
   * Find or create conversation
   */
  private async findOrCreateConversation(
    tenantId: string,
    contactId: string,
  ): Promise<Conversation> {
    let conversation = await this.conversationRepository.findOne({
      where: { tenantId, contactId },
    });

    if (!conversation) {
      this.logger.log(`Creating new conversation for contact: ${contactId}`);
      conversation = this.conversationRepository.create({
        tenantId,
        contactId,
        status: 'open',
        unreadCount: 0,
        lastMessageAt: new Date(),
      });
      conversation = await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  /**
   * Create message in conversation
   */
  private async createConversationMessage(
    conversationId: string,
    incomingMessage: IncomingMessage,
  ): Promise<Message> {
    // Check if message already exists
    const existing = await this.messageRepository.findOne({
      where: { externalId: incomingMessage.metaMessageId },
    });

    if (existing) {
      this.logger.log(`Message already exists in conversation: ${incomingMessage.metaMessageId}`);
      return existing;
    }

    // Build metadata object properly
    const metadata: any = {};
    if (incomingMessage.media) {
      Object.assign(metadata, incomingMessage.media);
    }
    if (incomingMessage.context) {
      metadata.context = incomingMessage.context;
    }

    const message = this.messageRepository.create({
      conversationId,
      type: this.mapMessageType(incomingMessage.type) as any,
      direction: 'inbound' as any,
      content: incomingMessage.text || '',
      externalId: incomingMessage.metaMessageId,
      status: 'delivered' as any,
      metadata,
      createdAt: incomingMessage.timestamp,
    });

    return this.messageRepository.save(message);
  }

  /**
   * Update conversation with latest message info and 24-hour window
   */
  private async updateConversation(
    conversation: Conversation,
    incomingMessage: IncomingMessage,
  ): Promise<void> {
    const now = incomingMessage.timestamp;
    
    conversation.lastMessageAt = now;
    conversation.unreadCount += 1;
    conversation.status = 'open';
    
    // Update 24-hour messaging window
    conversation.lastInboundMessageAt = now;
    conversation.windowExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    conversation.isWindowOpen = true;

    await this.conversationRepository.save(conversation);
    
    this.logger.log(`✅ 24-hour window opened until ${conversation.windowExpiresAt.toISOString()}`);
  }

  /**
   * Map incoming message type to conversation message type
   */
  private mapMessageType(type: string): 'text' | 'image' | 'video' | 'document' | 'audio' {
    const typeMap: Record<string, any> = {
      text: 'text',
      image: 'image',
      video: 'video',
      document: 'document',
      audio: 'audio',
    };

    return typeMap[type.toLowerCase()] || 'text';
  }
}
