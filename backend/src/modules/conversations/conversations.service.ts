import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationStatus } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @Inject(forwardRef(() => WhatsAppService))
    private whatsAppService: WhatsAppService,
  ) {}

  async create(tenantId: string, createConversationDto: CreateConversationDto): Promise<Conversation> {
    const conversation = this.conversationsRepository.create({
      ...createConversationDto,
      tenantId,
    });
    return this.conversationsRepository.save(conversation);
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    assignedToId?: string,
  ): Promise<{ data: Conversation[]; total: number; page: number; limit: number }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    
    const query = this.conversationsRepository.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.contact', 'contact')
      .leftJoinAndSelect('conversation.assignedTo', 'assignedTo')
      .where('conversation.tenantId = :tenantId', { tenantId });

    if (status && status !== 'all') {
      query.andWhere('conversation.status = :status', { status });
    }

    if (assignedToId && assignedToId !== 'all') {
      query.andWhere('conversation.assignedToId = :assignedToId', { assignedToId });
    }

    const [data, total] = await query
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy('conversation.lastMessageAt', 'DESC')
      .getManyAndCount();

    return { data, total, page: pageNum, limit: limitNum };
  }

  async findOne(tenantId: string, id: string): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id, tenantId },
      relations: ['contact', 'assignedTo'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async update(tenantId: string, id: string, updateData: Partial<Conversation>): Promise<Conversation> {
    const conversation = await this.findOne(tenantId, id);
    Object.assign(conversation, updateData);
    return this.conversationsRepository.save(conversation);
  }

  async assignTo(tenantId: string, id: string, assignedToId: string): Promise<Conversation> {
    return this.update(tenantId, id, { assignedToId });
  }

  async updateStatus(tenantId: string, id: string, status: string): Promise<Conversation> {
    return this.update(tenantId, id, { status: status as any });
  }

  async addTag(tenantId: string, id: string, tag: string): Promise<Conversation> {
    const conversation = await this.findOne(tenantId, id);
    if (!conversation.tags) {
      conversation.tags = [];
    }
    if (!conversation.tags.includes(tag)) {
      conversation.tags.push(tag);
    }
    return this.conversationsRepository.save(conversation);
  }

  async createMessage(tenantId: string, conversationId: string, createMessageDto: CreateMessageDto): Promise<Message> {
    const conversation = await this.findOne(tenantId, conversationId);
    
    // If outbound message, send via WhatsApp API
    if (createMessageDto.direction === 'outbound') {
      return this.sendMessage(tenantId, conversationId, {
        content: createMessageDto.content,
        type: createMessageDto.type,
        mediaUrl: createMessageDto.metadata?.mediaUrl,
      });
    }
    
    // For inbound messages, just save to database
    const message = this.messagesRepository.create({
      conversationId,
      type: createMessageDto.type as any,
      direction: createMessageDto.direction as any,
      content: createMessageDto.content,
      metadata: createMessageDto.metadata,
    });
    
    const savedMessage = await this.messagesRepository.save(message);

    // Update conversation last message time
    conversation.lastMessageAt = new Date();
    conversation.unreadCount += 1;
    await this.conversationsRepository.save(conversation);

    return savedMessage;
  }

  async getMessages(
    tenantId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: Message[]; total: number; page: number; limit: number }> {
    await this.findOne(tenantId, conversationId);

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;

    const [data, total] = await this.messagesRepository.findAndCount({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return { data, total, page: pageNum, limit: limitNum };
  }

  async markAsRead(tenantId: string, conversationId: string): Promise<Conversation> {
    const conversation = await this.findOne(tenantId, conversationId);
    conversation.unreadCount = 0;
    return this.conversationsRepository.save(conversation);
  }

  async findByContact(tenantId: string, contactId: string): Promise<Conversation | null> {
    return this.conversationsRepository.findOne({
      where: { tenantId, contactId },
      relations: ['contact'],
    });
  }

  async sendMessage(
    tenantId: string,
    conversationId: string,
    messageData: { content: string; type: string; mediaUrl?: string },
  ): Promise<Message> {
    const conversation = await this.findOne(tenantId, conversationId);

    // Check 24-hour window status
    const isWindowOpen = this.isWindowOpen(conversation);
    
    if (!isWindowOpen) {
      throw new BadRequestException(
        'Cannot send free-form message: 24-hour messaging window is closed. ' +
        'Please use an approved template message instead.'
      );
    }

    // Get contact phone number
    const conversationWithContact = await this.conversationsRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.contact', 'contact')
      .where('conversation.id = :conversationId', { conversationId })
      .getOne();

    if (!conversationWithContact || !conversationWithContact.contact) {
      throw new BadRequestException('Contact not found for conversation');
    }

    const recipientPhone = conversationWithContact.contact.phone;
    if (!recipientPhone) {
      throw new BadRequestException('Contact phone number not found');
    }

    // Get first active WhatsApp connection for this tenant
    // TODO: In future, link conversations to specific WhatsApp connections
    const whatsappConnections = await this.whatsAppService.findAll(tenantId, 1, 1, 'connected');
    
    if (!whatsappConnections.data || whatsappConnections.data.length === 0) {
      throw new BadRequestException('No active WhatsApp connection found for tenant');
    }

    const whatsappConnection = whatsappConnections.data[0];

    // Send message via WhatsApp API
    let externalId: string;
    try {
      const response = await this.whatsAppService.sendMessage(
        tenantId,
        whatsappConnection.id,
        recipientPhone,
        messageData.content,
      );
      externalId = response.messages?.[0]?.id;
    } catch (error) {
      throw new BadRequestException(`Failed to send WhatsApp message: ${error.message}`);
    }

    // Save message to database
    const message = this.messagesRepository.create({
      conversationId,
      type: messageData.type as any,
      direction: 'outbound',
      content: messageData.content,
      metadata: messageData.mediaUrl ? { mediaUrl: messageData.mediaUrl } : {},
      status: 'sent',
      externalId,
    });

    const savedMessage = await this.messagesRepository.save(message);

    // Update conversation last message time
    conversation.lastMessageAt = new Date();
    await this.conversationsRepository.save(conversation);

    return savedMessage;
  }

  /**
   * Check if the 24-hour messaging window is open for a conversation
   */
  private isWindowOpen(conversation: Conversation): boolean {
    if (!conversation.lastInboundMessageAt) {
      return false; // No inbound message yet, window is closed
    }

    const now = new Date();
    const windowExpiresAt = conversation.windowExpiresAt || 
      new Date(conversation.lastInboundMessageAt.getTime() + 24 * 60 * 60 * 1000);

    return now < windowExpiresAt;
  }

  /**
   * Update window status when an inbound message is received
   */
  async updateWindowStatus(conversationId: string): Promise<void> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      return;
    }

    const now = new Date();
    conversation.lastInboundMessageAt = now;
    conversation.windowExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    conversation.isWindowOpen = true;

    await this.conversationsRepository.save(conversation);
  }

  /**
   * Get window status for a conversation
   */
  async getWindowStatus(tenantId: string, conversationId: string): Promise<{
    isOpen: boolean;
    expiresAt: Date | null;
    hoursRemaining: number | null;
  }> {
    const conversation = await this.findOne(tenantId, conversationId);
    const isOpen = this.isWindowOpen(conversation);

    if (!isOpen || !conversation.windowExpiresAt) {
      return {
        isOpen: false,
        expiresAt: null,
        hoursRemaining: null,
      };
    }

    const now = new Date();
    const hoursRemaining = Math.max(
      0,
      (conversation.windowExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    return {
      isOpen: true,
      expiresAt: conversation.windowExpiresAt,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10, // Round to 1 decimal
    };
  }

  async getMessageStatus(tenantId: string, messageId: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Verify tenant access
    if (message.conversation.tenantId !== tenantId) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    return message;
  }
}
