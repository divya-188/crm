import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../api-keys/guards/api-key-auth.guard';
import { ApiRateLimitGuard } from '../api-keys/guards/api-rate-limit.guard';
import { ApiPermissions } from '../api-keys/decorators/api-permissions.decorator';
import { ContactsService } from '../contacts/contacts.service';
import { ConversationsService } from '../conversations/conversations.service';
import { TemplatesService } from '../templates/templates.service';
import { CampaignsService } from '../campaigns/campaigns.service';

@ApiTags('Public API')
@ApiSecurity('api-key')
@Controller('public/v1')
@UseGuards(ApiKeyAuthGuard, ApiRateLimitGuard)
export class PublicApiController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly conversationsService: ConversationsService,
    private readonly templatesService: TemplatesService,
    private readonly campaignsService: CampaignsService,
  ) {}

  // ==================== Contacts ====================

  @Get('contacts')
  @ApiOperation({ summary: 'List all contacts' })
  @ApiResponse({ status: 200, description: 'List of contacts' })
  @ApiPermissions('contacts', 'read')
  async getContacts(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    const result = await this.contactsService.findAll(
      req.tenantId,
      page,
      limit,
      search,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiResponse({ status: 200, description: 'Contact details' })
  @ApiPermissions('contacts', 'read')
  async getContact(@Request() req, @Param('id') id: string) {
    const contact = await this.contactsService.findOne(req.tenantId, id);

    return {
      success: true,
      data: contact,
    };
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  @ApiPermissions('contacts', 'create')
  async createContact(@Request() req, @Body() createContactDto: any) {
    const contact = await this.contactsService.create(
      req.tenantId,
      createContactDto,
    );

    return {
      success: true,
      message: 'Contact created successfully',
      data: contact,
    };
  }

  // ==================== Messages ====================

  @Post('messages/send')
  @ApiOperation({ summary: 'Send a message to a contact' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiPermissions('messages', 'send')
  async sendMessage(@Request() req, @Body() sendMessageDto: any) {
    const { phoneNumber, message, type = 'text', mediaUrl } = sendMessageDto;

    // Find or create contact
    let contact = await this.contactsService.findByPhone(
      req.tenantId,
      phoneNumber,
    );

    if (!contact) {
      contact = await this.contactsService.create(req.tenantId, {
        phone: phoneNumber,
      });
    }

    // Find or create conversation
    let conversation = await this.conversationsService.findByContact(
      req.tenantId,
      contact.id,
    );

    if (!conversation) {
      conversation = await this.conversationsService.create(req.tenantId, {
        contactId: contact.id,
      });
    }

    // Send message
    const sentMessage = await this.conversationsService.sendMessage(
      req.tenantId,
      conversation.id,
      {
        content: message,
        type,
        mediaUrl,
      },
    );

    return {
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: sentMessage.id,
        conversationId: conversation.id,
        contactId: contact.id,
        status: sentMessage.status,
      },
    };
  }

  @Get('messages/:id/status')
  @ApiOperation({ summary: 'Get message delivery status' })
  @ApiResponse({ status: 200, description: 'Message status' })
  @ApiPermissions('messages', 'read')
  async getMessageStatus(@Request() req, @Param('id') id: string) {
    const message = await this.conversationsService.getMessageStatus(
      req.tenantId,
      id,
    );

    return {
      success: true,
      data: {
        messageId: message.id,
        status: message.status,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    };
  }

  // ==================== Conversations ====================

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  @ApiPermissions('conversations', 'read')
  async getConversations(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    const result = await this.conversationsService.findAll(
      req.tenantId,
      page,
      limit,
      status,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  @ApiPermissions('conversations', 'read')
  async getConversation(@Request() req, @Param('id') id: string) {
    const conversation = await this.conversationsService.findOne(
      req.tenantId,
      id,
    );

    return {
      success: true,
      data: conversation,
    };
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  @ApiPermissions('conversations', 'read')
  async getConversationMessages(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const messages = await this.conversationsService.getMessages(
      req.tenantId,
      id,
      page,
      limit,
    );

    return {
      success: true,
      data: messages,
    };
  }

  // ==================== Templates ====================

  @Get('templates')
  @ApiOperation({ summary: 'List all templates' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  @ApiPermissions('templates', 'read')
  async getTemplates(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    const result = await this.templatesService.findAll(
      req.tenantId,
      page,
      limit,
      status,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template details' })
  @ApiResponse({ status: 200, description: 'Template details' })
  @ApiPermissions('templates', 'read')
  async getTemplate(@Request() req, @Param('id') id: string) {
    const template = await this.templatesService.findOne(req.tenantId, id);

    return {
      success: true,
      data: template,
    };
  }

  @Post('templates/:id/send')
  @ApiOperation({ summary: 'Send a template message' })
  @ApiResponse({ status: 201, description: 'Template message sent successfully' })
  @ApiPermissions('templates', 'send')
  async sendTemplate(
    @Request() req,
    @Param('id') templateId: string,
    @Body() sendTemplateDto: any,
  ) {
    const { phoneNumber, variables } = sendTemplateDto;

    // Find or create contact
    let contact = await this.contactsService.findByPhone(
      req.tenantId,
      phoneNumber,
    );

    if (!contact) {
      contact = await this.contactsService.create(req.tenantId, {
        phone: phoneNumber,
      });
    }

    // Send template message
    const result = await this.templatesService.sendTemplate(
      req.tenantId,
      templateId,
      contact.id,
      variables,
    );

    return {
      success: true,
      message: 'Template message sent successfully',
      data: result,
    };
  }

  // ==================== Campaigns ====================

  @Get('campaigns')
  @ApiOperation({ summary: 'List all campaigns' })
  @ApiResponse({ status: 200, description: 'List of campaigns' })
  @ApiPermissions('campaigns', 'read')
  async getCampaigns(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    const result = await this.campaignsService.findAll(
      req.tenantId,
      page,
      limit,
      status,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign details' })
  @ApiResponse({ status: 200, description: 'Campaign details' })
  @ApiPermissions('campaigns', 'read')
  async getCampaign(@Request() req, @Param('id') id: string) {
    const campaign = await this.campaignsService.findOne(req.tenantId, id);

    return {
      success: true,
      data: campaign,
    };
  }

  @Get('campaigns/:id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  @ApiResponse({ status: 200, description: 'Campaign statistics' })
  @ApiPermissions('campaigns', 'read')
  async getCampaignStats(@Request() req, @Param('id') id: string) {
    const stats = await this.campaignsService.getStats(req.tenantId, id);

    return {
      success: true,
      data: stats,
    };
  }

  // ==================== Webhooks ====================

  @Post('webhooks/trigger')
  @ApiOperation({ summary: 'Trigger a webhook event' })
  @ApiResponse({ status: 200, description: 'Webhook triggered successfully' })
  @ApiPermissions('webhooks', 'trigger')
  async triggerWebhook(@Request() req, @Body() webhookDto: any) {
    // This would trigger custom webhook logic
    return {
      success: true,
      message: 'Webhook triggered successfully',
      data: webhookDto,
    };
  }
}
