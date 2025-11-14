import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FlowExecution } from '../entities/flow-execution.entity';
import { ContactsService } from '../../contacts/contacts.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { NodeExecutionResult } from './node-handler.service';

@Injectable()
export class AdvancedNodeHandlerService {
  private readonly logger = new Logger(AdvancedNodeHandlerService.name);

  constructor(
    private httpService: HttpService,
    private contactsService: ContactsService,
    private conversationsService: ConversationsService,
  ) {}

  async handleApiRequestNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { url, method, headers, body, responseVariable } = node.data;

    try {
      // Replace variables in URL and body
      const processedUrl = this.replaceVariables(url, execution.context);
      const processedBody = body
        ? JSON.parse(this.replaceVariables(JSON.stringify(body), execution.context))
        : undefined;

      // Make API request
      const response: any = await firstValueFrom(
        this.httpService.request({
          url: processedUrl,
          method: method || 'GET',
          headers: headers || {},
          data: processedBody,
        }),
      );

      // Store response in context
      const context = {
        [responseVariable || 'apiResponse']: response.data,
      };

      // Find next node
      const nextEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id && edge.sourceHandle === 'success',
      );

      return {
        nextNodeId: nextEdge?.target,
        context,
      };
    } catch (error) {
      this.logger.error(`API request failed: ${error.message}`);

      // Find error path
      const errorEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id && edge.sourceHandle === 'error',
      );

      return {
        nextNodeId: errorEdge?.target,
        context: {
          apiError: error.message,
        },
      };
    }
  }

  async handleGoogleSheetsNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { action, spreadsheetId, sheetName, range, values } = node.data;

    try {
      // This is a placeholder - you would integrate with Google Sheets API
      // For now, we'll just log the action
      this.logger.log(`Google Sheets action: ${action} on ${spreadsheetId}`);

      // Find next node
      const nextEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id,
      );

      return {
        nextNodeId: nextEdge?.target,
        context: {
          sheetsActionCompleted: true,
        },
      };
    } catch (error) {
      this.logger.error(`Google Sheets action failed: ${error.message}`);

      const errorEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id && edge.sourceHandle === 'error',
      );

      return {
        nextNodeId: errorEdge?.target,
        context: {
          sheetsError: error.message,
        },
      };
    }
  }

  async handleWebhookNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { webhookUrl, method, headers, body } = node.data;

    try {
      // Replace variables
      const processedUrl = this.replaceVariables(webhookUrl, execution.context);
      const processedBody = body
        ? JSON.parse(this.replaceVariables(JSON.stringify(body), execution.context))
        : undefined;

      // Send webhook
      await firstValueFrom(
        this.httpService.request({
          url: processedUrl,
          method: method || 'POST',
          headers: headers || { 'Content-Type': 'application/json' },
          data: processedBody,
        }),
      );

      // Find next node
      const nextEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id,
      );

      return {
        nextNodeId: nextEdge?.target,
        context: {},
      };
    } catch (error) {
      this.logger.error(`Webhook failed: ${error.message}`);

      const errorEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id && edge.sourceHandle === 'error',
      );

      return {
        nextNodeId: errorEdge?.target,
        context: {
          webhookError: error.message,
        },
      };
    }
  }

  async handleUpdateContactNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { fields } = node.data;

    try {
      // Process field values with variable replacement
      const processedFields: any = {};
      for (const [key, value] of Object.entries(fields)) {
        processedFields[key] = this.replaceVariables(
          String(value),
          execution.context,
        );
      }

      // Update contact
      await this.contactsService.update(execution.flow.tenantId, execution.contactId, processedFields);

      // Find next node
      const nextEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id,
      );

      return {
        nextNodeId: nextEdge?.target,
        context: {},
      };
    } catch (error) {
      this.logger.error(`Update contact failed: ${error.message}`);

      const errorEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id && edge.sourceHandle === 'error',
      );

      return {
        nextNodeId: errorEdge?.target,
        context: {
          updateError: error.message,
        },
      };
    }
  }

  async handleAssignConversationNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { agentId, teamId } = node.data;

    try {
      // Assign conversation
      await this.conversationsService.assignTo(
        execution.flow.tenantId,
        execution.conversationId,
        agentId,
      );

      // Find next node
      const nextEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id,
      );

      return {
        nextNodeId: nextEdge?.target,
        context: {},
      };
    } catch (error) {
      this.logger.error(`Assign conversation failed: ${error.message}`);

      const errorEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id && edge.sourceHandle === 'error',
      );

      return {
        nextNodeId: errorEdge?.target,
        context: {
          assignError: error.message,
        },
      };
    }
  }

  async handleTagManagementNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { action, tags } = node.data;

    try {
      if (action === 'add') {
        for (const tag of tags) {
          await this.conversationsService.addTag(
            execution.flow.tenantId,
            execution.conversationId,
            tag,
          );
        }
      } else if (action === 'remove') {
        // Remove tag functionality - would need to be added to conversations service
        this.logger.warn('Remove tag functionality not yet implemented');
      }

      // Find next node
      const nextEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id,
      );

      return {
        nextNodeId: nextEdge?.target,
        context: {},
      };
    } catch (error) {
      this.logger.error(`Tag management failed: ${error.message}`);

      const errorEdge = execution.flow.flowData.edges.find(
        (edge) => edge.source === node.id && edge.sourceHandle === 'error',
      );

      return {
        nextNodeId: errorEdge?.target,
        context: {
          tagError: error.message,
        },
      };
    }
  }

  private replaceVariables(
    text: string,
    context: Record<string, any>,
  ): string {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
