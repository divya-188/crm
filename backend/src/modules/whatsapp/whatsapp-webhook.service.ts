import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Contact } from '../contacts/entities/contact.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message, MessageDirection, MessageStatus } from '../conversations/entities/message.entity';
import { WhatsAppConnection } from './entities/whatsapp-connection.entity';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import { FlowTriggerService } from '../flows/services/flow-trigger.service';
import { AutomationsService } from '../automations/automations.service';

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(WhatsAppConnection)
    private connectionsRepository: Repository<WhatsAppConnection>,
    private configService: ConfigService,
    private websocketGateway: WebSocketGatewayService,
    @Inject(forwardRef(() => FlowTriggerService))
    private flowTriggerService: FlowTriggerService,
    @Inject(forwardRef(() => AutomationsService))
    private automationsService: AutomationsService,
  ) {}

  verifySignature(payload: string, signature: string): boolean {
    const appSecret = this.configService.get<string>('META_APP_SECRET');
    if (!appSecret) {
      this.logger.warn('META_APP_SECRET not configured');
      return true; // Skip verification if not configured
    }

    const expectedSignature = 'sha256=' + createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  async processWebhook(body: any): Promise<void> {
    if (body.object !== 'whatsapp_business_account') {
      this.logger.warn(`Unknown webhook object type: ${body.object}`);
      return;
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          await this.handleMessageChange(change.value);
        }
      }
    }
  }

  private async handleMessageChange(value: any): Promise<void> {
    const phoneNumberId = value.metadata?.phone_number_id;
    
    // Find connection by phone number ID
    const connection = await this.connectionsRepository.findOne({
      where: { phoneNumberId },
    });

    if (!connection) {
      this.logger.warn(`No connection found for phone number ID: ${phoneNumberId}`);
      return;
    }

    // Handle incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await this.handleIncomingMessage(connection.tenantId, message, value.contacts?.[0]);
      }
    }

    // Handle message status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.handleMessageStatus(connection.tenantId, status);
      }
    }
  }

  private async handleIncomingMessage(
    tenantId: string,
    message: any,
    contactInfo: any,
  ): Promise<void> {
    this.logger.log(`Processing incoming message: ${message.id}`);

    // Get or create contact
    const contact = await this.getOrCreateContact(tenantId, message.from, contactInfo);

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(tenantId, contact.id);

    // Create message
    const messageType = message.type || 'text';
    let content = '';
    let metadata: any = {};

    switch (messageType) {
      case 'text':
        content = message.text?.body || '';
        break;
      case 'image':
        content = message.image?.caption || 'Image';
        metadata = {
          mediaUrl: message.image?.id,
          mimeType: message.image?.mime_type,
        };
        break;
      case 'video':
        content = message.video?.caption || 'Video';
        metadata = {
          mediaUrl: message.video?.id,
          mimeType: message.video?.mime_type,
        };
        break;
      case 'audio':
        content = 'Audio message';
        metadata = {
          mediaUrl: message.audio?.id,
          mimeType: message.audio?.mime_type,
        };
        break;
      case 'document':
        content = message.document?.filename || 'Document';
        metadata = {
          mediaUrl: message.document?.id,
          mimeType: message.document?.mime_type,
          fileName: message.document?.filename,
        };
        break;
      case 'location':
        content = 'Location';
        metadata = {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
        };
        break;
      default:
        content = `Unsupported message type: ${messageType}`;
    }

    const newMessage = this.messagesRepository.create({
      conversationId: conversation.id,
      type: messageType as any,
      direction: MessageDirection.INBOUND,
      content,
      metadata,
      externalId: message.id,
      status: MessageStatus.DELIVERED,
    });

    const savedMessage = await this.messagesRepository.save(newMessage);

    // Update conversation
    conversation.lastMessageAt = new Date();
    conversation.unreadCount += 1;
    await this.conversationsRepository.save(conversation);

    // Emit real-time events
    this.websocketGateway.emitNewMessage(conversation.id, savedMessage);
    this.websocketGateway.emitConversationUpdate(tenantId, conversation);

    // Trigger flows based on message content
    if (messageType === 'text' && content) {
      await this.flowTriggerService.handleIncomingMessage(
        tenantId,
        conversation.id,
        contact.id,
        content,
      );
    }

    // Trigger automations for message received
    await this.automationsService.triggerAutomations(tenantId, 'message_received', {
      conversationId: conversation.id,
      contactId: contact.id,
      messageId: savedMessage.id,
      messageContent: content,
      messageType,
    });

    this.logger.log(`Message processed successfully: ${message.id}`);
  }

  private async handleMessageStatus(tenantId: string, status: any): Promise<void> {
    const message = await this.messagesRepository.findOne({
      where: { externalId: status.id },
    });

    if (!message) {
      this.logger.warn(`Message not found for status update: ${status.id}`);
      return;
    }

    const statusMap: Record<string, any> = {
      sent: MessageStatus.SENT,
      delivered: MessageStatus.DELIVERED,
      read: MessageStatus.READ,
      failed: MessageStatus.FAILED,
    };

    message.status = statusMap[status.status] || message.status;
    await this.messagesRepository.save(message);

    // Emit status update
    this.websocketGateway.emitMessageStatus(message.conversationId, message.id, message.status);

    this.logger.log(`Message status updated: ${status.id} -> ${status.status}`);
  }

  private async getOrCreateContact(
    tenantId: string,
    phone: string,
    contactInfo: any,
  ): Promise<Contact> {
    let contact = await this.contactsRepository.findOne({
      where: { tenantId, phone },
    });

    if (!contact) {
      contact = this.contactsRepository.create({
        tenantId,
        phone,
        firstName: contactInfo?.profile?.name || phone,
        isActive: true,
      });
      contact = await this.contactsRepository.save(contact);
      this.logger.log(`Created new contact: ${phone}`);
    }

    return contact;
  }

  private async getOrCreateConversation(
    tenantId: string,
    contactId: string,
  ): Promise<Conversation> {
    let conversation = await this.conversationsRepository.findOne({
      where: { tenantId, contactId, status: 'open' },
    });

    if (!conversation) {
      conversation = this.conversationsRepository.create({
        tenantId,
        contactId,
        status: 'open',
        unreadCount: 0,
      });
      conversation = await this.conversationsRepository.save(conversation);
      
      // Emit new conversation event
      this.websocketGateway.emitNewConversation(tenantId, conversation);
      
      // Trigger welcome flow for new conversations
      await this.flowTriggerService.handleWelcomeMessage(
        tenantId,
        conversation.id,
        contactId,
      );

      // Trigger automations for conversation created
      await this.automationsService.triggerAutomations(tenantId, 'conversation_created', {
        conversationId: conversation.id,
        contactId,
      });
      
      this.logger.log(`Created new conversation for contact: ${contactId}`);
    }

    return conversation;
  }
}
