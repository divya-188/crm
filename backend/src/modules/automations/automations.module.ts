import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { ConditionEvaluatorService } from './services/condition-evaluator.service';
import { ActionExecutorService } from './services/action-executor.service';
import { Automation } from './entities/automation.entity';
import { AutomationExecution } from './entities/automation-execution.entity';
import { ConversationsModule } from '../conversations/conversations.module';
import { ContactsModule } from '../contacts/contacts.module';
import { FlowsModule } from '../flows/flows.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Automation, AutomationExecution]),
    HttpModule,
    ConversationsModule,
    ContactsModule,
    forwardRef(() => FlowsModule),
    SubscriptionsModule,
  ],
  controllers: [AutomationsController],
  providers: [
    AutomationsService,
    ConditionEvaluatorService,
    ActionExecutorService,
  ],
  exports: [AutomationsService],
})
export class AutomationsModule {}
