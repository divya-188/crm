# Webhook Integration Examples

This document shows how to integrate webhook triggers into your services.

## Basic Integration Pattern

### 1. Import the WebhooksService

```typescript
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class YourService {
  constructor(
    private webhooksService: WebhooksService,
  ) {}
}
```

### 2. Trigger Webhooks on Events

```typescript
// After creating/updating a resource
await this.webhooksService.triggerEvent(
  tenantId,
  'event.type',
  payload
);
```

## Example Integrations

### Messages Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private webhooksService: WebhooksService,
  ) {}

  async createMessage(tenantId: string, messageData: any): Promise<Message> {
    const message = this.messagesRepository.create({
      ...messageData,
      tenantId,
    });
    
    const savedMessage = await this.messagesRepository.save(message);

    // Trigger webhook for new message
    await this.webhooksService.triggerEvent(
      tenantId,
      'message.new',
      {
        messageId: savedMessage.id,
        conversationId: savedMessage.conversationId,
        contactId: savedMessage.contactId,
        direction: savedMessage.direction,
        type: savedMessage.type,
        content: savedMessage.content,
        timestamp: savedMessage.createdAt,
      }
    );

    return savedMessage;
  }

  async updateMessageStatus(
    tenantId: string,
    messageId: string,
    status: string
  ): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId, tenantId },
    });

    message.status = status;
    const updatedMessage = await this.messagesRepository.save(message);

    // Trigger webhook based on status
    const eventMap = {
      'sent': 'message.sent',
      'delivered': 'message.delivered',
      'read': 'message.read',
      'failed': 'message.failed',
    };

    const eventType = eventMap[status];
    if (eventType) {
      await this.webhooksService.triggerEvent(
        tenantId,
        eventType,
        {
          messageId: updatedMessage.id,
          conversationId: updatedMessage.conversationId,
          status: updatedMessage.status,
          timestamp: new Date(),
        }
      );
    }

    return updatedMessage;
  }
}
```

### Conversations Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    private webhooksService: WebhooksService,
  ) {}

  async create(tenantId: string, conversationData: any): Promise<Conversation> {
    const conversation = this.conversationsRepository.create({
      ...conversationData,
      tenantId,
    });
    
    const savedConversation = await this.conversationsRepository.save(conversation);

    // Trigger webhook for new conversation
    await this.webhooksService.triggerEvent(
      tenantId,
      'conversation.created',
      {
        conversationId: savedConversation.id,
        contactId: savedConversation.contactId,
        status: savedConversation.status,
        timestamp: savedConversation.createdAt,
      }
    );

    return savedConversation;
  }

  async assignTo(
    tenantId: string,
    conversationId: string,
    agentId: string
  ): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId, tenantId },
    });

    conversation.assignedToId = agentId;
    const updatedConversation = await this.conversationsRepository.save(conversation);

    // Trigger webhook for assignment
    await this.webhooksService.triggerEvent(
      tenantId,
      'conversation.assigned',
      {
        conversationId: updatedConversation.id,
        agentId: agentId,
        timestamp: new Date(),
      }
    );

    return updatedConversation;
  }

  async updateStatus(
    tenantId: string,
    conversationId: string,
    status: string
  ): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId, tenantId },
    });

    const oldStatus = conversation.status;
    conversation.status = status;
    const updatedConversation = await this.conversationsRepository.save(conversation);

    // Trigger webhook based on status change
    if (status === 'resolved' && oldStatus !== 'resolved') {
      await this.webhooksService.triggerEvent(
        tenantId,
        'conversation.resolved',
        {
          conversationId: updatedConversation.id,
          previousStatus: oldStatus,
          timestamp: new Date(),
        }
      );
    } else if (status === 'closed' && oldStatus !== 'closed') {
      await this.webhooksService.triggerEvent(
        tenantId,
        'conversation.closed',
        {
          conversationId: updatedConversation.id,
          previousStatus: oldStatus,
          timestamp: new Date(),
        }
      );
    } else {
      await this.webhooksService.triggerEvent(
        tenantId,
        'conversation.updated',
        {
          conversationId: updatedConversation.id,
          status: updatedConversation.status,
          timestamp: new Date(),
        }
      );
    }

    return updatedConversation;
  }
}
```

### Campaigns Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    private webhooksService: WebhooksService,
  ) {}

  async startCampaign(tenantId: string, campaignId: string): Promise<void> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id: campaignId, tenantId },
    });

    campaign.status = 'running';
    await this.campaignsRepository.save(campaign);

    // Trigger webhook for campaign start
    await this.webhooksService.triggerEvent(
      tenantId,
      'campaign.started',
      {
        campaignId: campaign.id,
        name: campaign.name,
        totalRecipients: campaign.totalRecipients,
        timestamp: new Date(),
      }
    );
  }

  async completeCampaign(
    tenantId: string,
    campaignId: string,
    stats: any
  ): Promise<void> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id: campaignId, tenantId },
    });

    campaign.status = 'completed';
    campaign.sentCount = stats.sentCount;
    campaign.deliveredCount = stats.deliveredCount;
    campaign.failedCount = stats.failedCount;
    await this.campaignsRepository.save(campaign);

    // Trigger webhook for campaign completion
    await this.webhooksService.triggerEvent(
      tenantId,
      'campaign.completed',
      {
        campaignId: campaign.id,
        name: campaign.name,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        deliveredCount: campaign.deliveredCount,
        failedCount: campaign.failedCount,
        timestamp: new Date(),
      }
    );
  }

  async failCampaign(
    tenantId: string,
    campaignId: string,
    error: string
  ): Promise<void> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id: campaignId, tenantId },
    });

    campaign.status = 'failed';
    await this.campaignsRepository.save(campaign);

    // Trigger webhook for campaign failure
    await this.webhooksService.triggerEvent(
      tenantId,
      'campaign.failed',
      {
        campaignId: campaign.id,
        name: campaign.name,
        error: error,
        timestamp: new Date(),
      }
    );
  }
}
```

### Flows Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowExecution } from './entities/flow-execution.entity';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(FlowExecution)
    private flowExecutionsRepository: Repository<FlowExecution>,
    private webhooksService: WebhooksService,
  ) {}

  async startFlowExecution(
    tenantId: string,
    flowId: string,
    contactId: string
  ): Promise<FlowExecution> {
    const execution = this.flowExecutionsRepository.create({
      tenantId,
      flowId,
      contactId,
      status: 'running',
    });

    const savedExecution = await this.flowExecutionsRepository.save(execution);

    // Trigger webhook for flow start
    await this.webhooksService.triggerEvent(
      tenantId,
      'flow.started',
      {
        flowId: flowId,
        executionId: savedExecution.id,
        contactId: contactId,
        timestamp: savedExecution.startedAt,
      }
    );

    return savedExecution;
  }

  async completeFlowExecution(
    tenantId: string,
    executionId: string
  ): Promise<void> {
    const execution = await this.flowExecutionsRepository.findOne({
      where: { id: executionId, tenantId },
    });

    execution.status = 'completed';
    execution.completedAt = new Date();
    await this.flowExecutionsRepository.save(execution);

    // Trigger webhook for flow completion
    await this.webhooksService.triggerEvent(
      tenantId,
      'flow.completed',
      {
        flowId: execution.flowId,
        executionId: execution.id,
        contactId: execution.contactId,
        status: 'completed',
        timestamp: execution.completedAt,
      }
    );
  }

  async failFlowExecution(
    tenantId: string,
    executionId: string,
    error: string
  ): Promise<void> {
    const execution = await this.flowExecutionsRepository.findOne({
      where: { id: executionId, tenantId },
    });

    execution.status = 'failed';
    execution.completedAt = new Date();
    await this.flowExecutionsRepository.save(execution);

    // Trigger webhook for flow failure
    await this.webhooksService.triggerEvent(
      tenantId,
      'flow.failed',
      {
        flowId: execution.flowId,
        executionId: execution.id,
        contactId: execution.contactId,
        error: error,
        timestamp: execution.completedAt,
      }
    );
  }
}
```

### Contacts Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    private webhooksService: WebhooksService,
  ) {}

  async create(tenantId: string, contactData: any): Promise<Contact> {
    const contact = this.contactsRepository.create({
      ...contactData,
      tenantId,
    });
    
    const savedContact = await this.contactsRepository.save(contact);

    // Trigger webhook for new contact
    await this.webhooksService.triggerEvent(
      tenantId,
      'contact.created',
      {
        contactId: savedContact.id,
        phoneNumber: savedContact.phoneNumber,
        name: savedContact.name,
        email: savedContact.email,
        timestamp: savedContact.createdAt,
      }
    );

    return savedContact;
  }

  async update(
    tenantId: string,
    contactId: string,
    updateData: any
  ): Promise<Contact> {
    const contact = await this.contactsRepository.findOne({
      where: { id: contactId, tenantId },
    });

    Object.assign(contact, updateData);
    const updatedContact = await this.contactsRepository.save(contact);

    // Trigger webhook for contact update
    await this.webhooksService.triggerEvent(
      tenantId,
      'contact.updated',
      {
        contactId: updatedContact.id,
        phoneNumber: updatedContact.phoneNumber,
        name: updatedContact.name,
        email: updatedContact.email,
        changes: updateData,
        timestamp: updatedContact.updatedAt,
      }
    );

    return updatedContact;
  }
}
```

## Module Configuration

Don't forget to import WebhooksModule in your feature module:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YourService } from './your.service';
import { YourController } from './your.controller';
import { YourEntity } from './entities/your.entity';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([YourEntity]),
    WebhooksModule, // Import webhooks module
  ],
  controllers: [YourController],
  providers: [YourService],
  exports: [YourService],
})
export class YourModule {}
```

## Error Handling

Always wrap webhook triggers in try-catch to prevent webhook failures from breaking your main logic:

```typescript
try {
  await this.webhooksService.triggerEvent(tenantId, eventType, payload);
} catch (error) {
  // Log the error but don't throw
  console.error('Failed to trigger webhook:', error);
}
```

## Async Processing

For better performance, consider triggering webhooks asynchronously:

```typescript
// Fire and forget
this.webhooksService.triggerEvent(tenantId, eventType, payload)
  .catch(error => console.error('Webhook trigger failed:', error));

// Continue with your main logic
return result;
```

## Testing

When testing services that trigger webhooks, you can mock the WebhooksService:

```typescript
const mockWebhooksService = {
  triggerEvent: jest.fn().mockResolvedValue(undefined),
};

const module = await Test.createTestingModule({
  providers: [
    YourService,
    {
      provide: WebhooksService,
      useValue: mockWebhooksService,
    },
  ],
}).compile();
```
