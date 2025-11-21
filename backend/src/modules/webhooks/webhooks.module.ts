import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WebhookLog } from './entities/webhook-log.entity';
import { IncomingMessage } from './entities/incoming-message.entity';
import { CampaignMessage } from '../campaigns/entities/campaign-message.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../conversations/entities/message.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { WebhookSignatureService } from './services/webhook-signature.service';
import { MessageStatusService } from './services/message-status.service';
import { IncomingMessageService } from './services/incoming-message.service';
import { ConversationSyncService } from './services/conversation-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookLog,
      IncomingMessage,
      CampaignMessage,
      Conversation,
      Message,
      Contact,
    ]),
    ConfigModule,
  ],
  providers: [
    WebhookSignatureService,
    MessageStatusService,
    IncomingMessageService,
    ConversationSyncService,
  ],
  exports: [
    WebhookSignatureService,
    MessageStatusService,
    IncomingMessageService,
    ConversationSyncService,
  ],
})
export class WebhooksModule {}
