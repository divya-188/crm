import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';
import { FlowExecutionService } from './services/flow-execution.service';
import { NodeHandlerService } from './services/node-handler.service';
import { AdvancedNodeHandlerService } from './services/advanced-node-handler.service';
import { FlowTriggerService } from './services/flow-trigger.service';
import { Flow } from './entities/flow.entity';
import { FlowExecution } from './entities/flow-execution.entity';
import { ConversationsModule } from '../conversations/conversations.module';
import { ContactsModule } from '../contacts/contacts.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Flow, FlowExecution]),
    HttpModule,
    ConversationsModule,
    ContactsModule,
    SubscriptionsModule,
  ],
  controllers: [FlowsController],
  providers: [
    FlowsService,
    FlowExecutionService,
    NodeHandlerService,
    AdvancedNodeHandlerService,
    FlowTriggerService,
  ],
  exports: [FlowsService, FlowExecutionService, FlowTriggerService],
})
export class FlowsModule {}
