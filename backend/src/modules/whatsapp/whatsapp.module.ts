import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppConnection } from './entities/whatsapp-connection.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../conversations/entities/message.entity';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { MetaApiService } from './services/meta-api.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { FlowsModule } from '../flows/flows.module';
import { AutomationsModule } from '../automations/automations.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsAppConnection, Contact, Conversation, Message]),
    WebSocketModule,
    forwardRef(() => FlowsModule),
    forwardRef(() => AutomationsModule),
    SubscriptionsModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, MetaApiService],
  exports: [WhatsAppService, MetaApiService],
})
export class WhatsAppModule {}
