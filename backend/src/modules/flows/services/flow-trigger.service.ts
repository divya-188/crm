import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flow, FlowStatus } from '../entities/flow.entity';
import { FlowExecutionService } from './flow-execution.service';

@Injectable()
export class FlowTriggerService {
  private readonly logger = new Logger(FlowTriggerService.name);

  constructor(
    @InjectRepository(Flow)
    private flowRepository: Repository<Flow>,
    private flowExecutionService: FlowExecutionService,
  ) {}

  async handleIncomingMessage(
    tenantId: string,
    conversationId: string,
    contactId: string,
    message: string,
  ): Promise<void> {
    // Find active flows with keyword triggers
    const flows = await this.flowRepository.find({
      where: {
        tenantId,
        status: FlowStatus.ACTIVE,
      },
    });

    for (const flow of flows) {
      if (!flow.triggerConfig) continue;

      const shouldTrigger = await this.checkTrigger(
        flow,
        message,
        conversationId,
        contactId,
      );

      if (shouldTrigger) {
        this.logger.log(`Triggering flow ${flow.id} for conversation ${conversationId}`);
        await this.flowExecutionService.startExecution(
          flow.id,
          conversationId,
          contactId,
          { triggerMessage: message },
        );
        break; // Only trigger one flow per message
      }
    }
  }

  async handleWelcomeMessage(
    tenantId: string,
    conversationId: string,
    contactId: string,
  ): Promise<void> {
    const flows = await this.flowRepository.find({
      where: {
        tenantId,
        status: FlowStatus.ACTIVE,
      },
    });

    for (const flow of flows) {
      if (flow.triggerConfig?.type === 'welcome') {
        this.logger.log(`Triggering welcome flow ${flow.id} for conversation ${conversationId}`);
        await this.flowExecutionService.startExecution(
          flow.id,
          conversationId,
          contactId,
          { isWelcome: true },
        );
        break;
      }
    }
  }

  async triggerManualFlow(
    flowId: string,
    conversationId: string,
    contactId: string,
    context: Record<string, any> = {},
  ): Promise<void> {
    this.logger.log(`Manually triggering flow ${flowId} for conversation ${conversationId}`);
    await this.flowExecutionService.startExecution(
      flowId,
      conversationId,
      contactId,
      context,
    );
  }

  async handleWebhookTrigger(
    tenantId: string,
    webhookData: any,
  ): Promise<void> {
    const flows = await this.flowRepository.find({
      where: {
        tenantId,
        status: FlowStatus.ACTIVE,
      },
    });

    for (const flow of flows) {
      if (flow.triggerConfig?.type === 'webhook') {
        const matches = this.matchWebhookConditions(
          flow.triggerConfig.conditions,
          webhookData,
        );

        if (matches) {
          this.logger.log(`Triggering webhook flow ${flow.id}`);
          // For webhook triggers, we might not have a conversation yet
          // This would need to be handled based on your business logic
        }
      }
    }
  }

  private async checkTrigger(
    flow: Flow,
    message: string,
    conversationId: string,
    contactId: string,
  ): Promise<boolean> {
    const { type, keywords, conditions } = flow.triggerConfig;

    switch (type) {
      case 'keyword':
        return this.matchKeywords(keywords, message);
      case 'manual':
        return false; // Manual triggers are handled separately
      case 'welcome':
        return false; // Welcome triggers are handled separately
      case 'webhook':
        return false; // Webhook triggers are handled separately
      default:
        return false;
    }
  }

  private matchKeywords(keywords: string[], message: string): boolean {
    if (!keywords || keywords.length === 0) return false;

    const lowerMessage = message.toLowerCase().trim();

    return keywords.some((keyword) => {
      const lowerKeyword = keyword.toLowerCase().trim();

      // Exact match
      if (lowerMessage === lowerKeyword) return true;

      // Word boundary match
      const regex = new RegExp(`\\b${this.escapeRegex(lowerKeyword)}\\b`, 'i');
      return regex.test(message);
    });
  }

  private matchWebhookConditions(
    conditions: Record<string, any>,
    data: any,
  ): boolean {
    if (!conditions) return true;

    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) {
        return false;
      }
    }

    return true;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async getFlowAnalytics(flowId: string): Promise<any> {
    const flow = await this.flowRepository.findOne({ where: { id: flowId } });

    if (!flow) {
      throw new Error('Flow not found');
    }

    return {
      flowId: flow.id,
      name: flow.name,
      status: flow.status,
      totalExecutions: flow.executionCount,
      successfulExecutions: flow.successCount,
      failedExecutions: flow.failureCount,
      successRate:
        flow.executionCount > 0
          ? (flow.successCount / flow.executionCount) * 100
          : 0,
    };
  }
}
