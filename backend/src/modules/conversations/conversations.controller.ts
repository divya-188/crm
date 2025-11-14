import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  create(@TenantId() tenantId: string, @Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(tenantId, createConversationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations with pagination' })
  @ApiResponse({ status: 200, description: 'List of conversations retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'assignedToId', required: false, type: String })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.conversationsService.findAll(tenantId, page, limit, status, assignedToId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.conversationsService.findOne(tenantId, id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign conversation to user' })
  @ApiResponse({ status: 200, description: 'Conversation assigned' })
  assignTo(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string,
  ) {
    return this.conversationsService.assignTo(tenantId, id, assignedToId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update conversation status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.conversationsService.updateStatus(tenantId, id, status);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add tag to conversation' })
  @ApiResponse({ status: 200, description: 'Tag added' })
  addTag(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('tag') tag: string,
  ) {
    return this.conversationsService.addTag(tenantId, id, tag);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in conversation' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  createMessage(
    @TenantId() tenantId: string,
    @Param('id') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.conversationsService.createMessage(tenantId, conversationId, createMessageDto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in conversation' })
  @ApiResponse({ status: 200, description: 'Messages retrieved' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMessages(
    @TenantId() tenantId: string,
    @Param('id') conversationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationsService.getMessages(tenantId, conversationId, page, limit);
  }

  @Post(':id/mark-read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  @ApiResponse({ status: 200, description: 'Conversation marked as read' })
  markAsRead(@TenantId() tenantId: string, @Param('id') conversationId: string) {
    return this.conversationsService.markAsRead(tenantId, conversationId);
  }
}
