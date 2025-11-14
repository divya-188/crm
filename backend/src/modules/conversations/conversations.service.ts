import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationStatus } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
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

    if (status) {
      query.andWhere('conversation.status = :status', { status });
    }

    if (assignedToId) {
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
    if (createMessageDto.direction === 'inbound') {
      conversation.unreadCount += 1;
    }
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

    const message = this.messagesRepository.create({
      conversationId,
      type: messageData.type as any,
      direction: 'outbound',
      content: messageData.content,
      metadata: messageData.mediaUrl ? { mediaUrl: messageData.mediaUrl } : {},
      status: 'sent',
    });

    const savedMessage = await this.messagesRepository.save(message);

    // Update conversation last message time
    conversation.lastMessageAt = new Date();
    await this.conversationsRepository.save(conversation);

    return savedMessage;
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
