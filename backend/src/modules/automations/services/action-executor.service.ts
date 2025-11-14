import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConversationsService } from '../../conversations/conversations.service';
import { ContactsService } from '../../contacts/contacts.service';
import { FlowExecutionService } from '../../flows/services/flow-execution.service';

@Injectable()
export class ActionExecutorService {
  private readonly logger = new Logger(ActionExecutorService.name);

  constructor(
    private conversationsService: ConversationsService,
    private contactsService: ContactsService,
    private flowExecutionService: FlowExecutionService,
    private httpService: HttpService,
  ) {}

  async executeActions(
    actions: Array<{ type: string; config: Record<string, any> }>,
    triggerData: Record<string, any>,
    tenantId: string,
  ): Promise<Array<{ actionType: string; success: boolean; error?: string }>> {
    const results = [];

    for (const action of actions) {
      try {
        await this.executeAction(action, triggerData, tenantId);
        results.push({ actionType: action.type, success: true });
      } catch (error) {
        this.logger.error(
          `Action execution failed: ${action.type}`,
          error.stack,
        );
        results.push({
          actionType: action.type,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private async executeAction(
    action: { type: string; config: Record<string, any> },
    triggerData: Record<string, any>,
    tenantId: string,
  ): Promise<void> {
    switch (action.type) {
      case 'send_message':
        await this.executeSendMessage(action.config, triggerData, tenantId);
        break;
      case 'assign_conversation':
        await this.executeAssignConversation(action.config, triggerData, tenantId);
        break;
      case 'add_tag':
        await this.executeAddTag(action.config, triggerData, tenantId);
        break;
      case 'remove_tag':
        await this.executeRemoveTag(action.config, triggerData, tenantId);
        break;
      case 'update_contact':
        await this.executeUpdateContact(action.config, triggerData, tenantId);
        break;
      case 'trigger_flow':
        await this.executeTriggerFlow(action.config, triggerData);
        break;
      case 'webhook':
        await this.executeWebhook(action.config, triggerData);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeSendMessage(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string,
  ): Promise<void> {
    const conversationId = triggerData.conversationId || config.conversationId;
    const message = this.replaceVariables(config.message, triggerData);

    await this.conversationsService.createMessage(tenantId, conversationId, {
      type: 'text',
      content: message,
      direction: 'outbound',
    });
  }

  private async executeAssignConversation(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string,
  ): Promise<void> {
    const conversationId = triggerData.conversationId || config.conversationId;
    await this.conversationsService.assignTo(
      tenantId,
      conversationId,
      config.agentId,
    );
  }

  private async executeAddTag(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string,
  ): Promise<void> {
    const conversationId = triggerData.conversationId || config.conversationId;
    await this.conversationsService.addTag(
      tenantId,
      conversationId,
      config.tag,
    );
  }

  private async executeRemoveTag(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string,
  ): Promise<void> {
    const conversationId = triggerData.conversationId || config.conversationId;
    // Remove tag functionality would need to be added to conversations service
    this.logger.warn('Remove tag not yet implemented');
  }

  private async executeUpdateContact(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string,
  ): Promise<void> {
    const contactId = triggerData.contactId || config.contactId;
    const updates = this.replaceVariablesInObject(config.updates, triggerData);
    await this.contactsService.update(tenantId, contactId, updates);
  }

  private async executeTriggerFlow(
    config: Record<string, any>,
    triggerData: Record<string, any>,
  ): Promise<void> {
    await this.flowExecutionService.startExecution(
      config.flowId,
      triggerData.conversationId,
      triggerData.contactId,
      triggerData,
    );
  }

  private async executeWebhook(
    config: Record<string, any>,
    triggerData: Record<string, any>,
  ): Promise<void> {
    const url = this.replaceVariables(config.url, triggerData);
    const payload = this.replaceVariablesInObject(config.payload || {}, triggerData);

    await firstValueFrom(
      this.httpService.request({
        url,
        method: config.method || 'POST',
        headers: config.headers || { 'Content-Type': 'application/json' },
        data: payload,
      }),
    );
  }

  private replaceVariables(text: string, data: Record<string, any>): string {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  private replaceVariablesInObject(
    obj: Record<string, any>,
    data: Record<string, any>,
  ): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.replaceVariables(value, data);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
