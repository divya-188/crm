import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { FlowExecution } from '../entities/flow-execution.entity';
import { ConversationsService } from '../../conversations/conversations.service';
import { ContactsService } from '../../contacts/contacts.service';
import { AdvancedNodeHandlerService } from './advanced-node-handler.service';

export interface NodeExecutionResult {
  nextNodeId?: string;
  waitForInput?: boolean;
  context?: Record<string, any>;
}

@Injectable()
export class NodeHandlerService {
  private readonly logger = new Logger(NodeHandlerService.name);

  constructor(
    private conversationsService: ConversationsService,
    private contactsService: ContactsService,
    @Inject(forwardRef(() => AdvancedNodeHandlerService))
    private advancedNodeHandler: AdvancedNodeHandlerService,
  ) {}

  async executeNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    this.logger.log(`Executing node ${node.id} of type ${node.type}`);

    switch (node.type) {
      case 'start':
        return this.handleStartNode(node, execution);
      case 'message':
        return this.handleMessageNode(node, execution);
      case 'input':
        return this.handleInputNode(node, execution);
      case 'condition':
        return this.handleConditionNode(node, execution);
      case 'delay':
        return this.handleDelayNode(node, execution);
      case 'action':
        return this.handleActionNode(node, execution);
      case 'apiRequest':
        return this.advancedNodeHandler.handleApiRequestNode(node, execution);
      case 'googleSheets':
        return this.advancedNodeHandler.handleGoogleSheetsNode(node, execution);
      case 'webhook':
        return this.advancedNodeHandler.handleWebhookNode(node, execution);
      case 'updateContact':
        return this.advancedNodeHandler.handleUpdateContactNode(node, execution);
      case 'assignConversation':
        return this.advancedNodeHandler.handleAssignConversationNode(node, execution);
      case 'tagManagement':
        return this.advancedNodeHandler.handleTagManagementNode(node, execution);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private async handleStartNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    // Find the next node connected to start
    const nextEdge = execution.flow.flowData.edges.find(
      (edge) => edge.source === node.id,
    );

    return {
      nextNodeId: nextEdge?.target,
      context: {},
    };
  }

  private async handleMessageNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { message } = node.data;

    // Replace variables in message
    const processedMessage = this.replaceVariables(message, execution.context);

    // Send message
    await this.conversationsService.createMessage(
      execution.flow.tenantId,
      execution.conversationId,
      {
        type: 'text',
        content: processedMessage,
        direction: 'outbound',
      },
    );

    // Find next node
    const nextEdge = execution.flow.flowData.edges.find(
      (edge) => edge.source === node.id,
    );

    return {
      nextNodeId: nextEdge?.target,
      context: {},
    };
  }

  private async handleInputNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { variableName, validationType } = node.data;

    // Check if we have user input
    if (!execution.context.lastUserInput) {
      // Wait for user input
      return {
        waitForInput: true,
        context: {},
      };
    }

    const userInput = execution.context.lastUserInput;

    // Validate input if needed
    if (validationType) {
      const isValid = this.validateInput(userInput, validationType);
      if (!isValid) {
        // Send error message and wait again
        await this.conversationsService.createMessage(
          execution.flow.tenantId,
          execution.conversationId,
          {
            type: 'text',
            content: node.data.errorMessage || 'Invalid input. Please try again.',
            direction: 'outbound',
          },
        );
        return {
          waitForInput: true,
          context: {},
        };
      }
    }

    // Store input in context
    const context = {
      [variableName]: userInput,
      lastUserInput: null, // Clear last input
    };

    // Find next node
    const nextEdge = execution.flow.flowData.edges.find(
      (edge) => edge.source === node.id,
    );

    return {
      nextNodeId: nextEdge?.target,
      context,
    };
  }

  private async handleConditionNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { conditions } = node.data;

    // Evaluate conditions
    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, execution.context);
      if (result) {
        // Find edge with matching sourceHandle
        const nextEdge = execution.flow.flowData.edges.find(
          (edge) =>
            edge.source === node.id && edge.sourceHandle === condition.id,
        );
        return {
          nextNodeId: nextEdge?.target,
          context: {},
        };
      }
    }

    // No condition matched, use default path
    const defaultEdge = execution.flow.flowData.edges.find(
      (edge) => edge.source === node.id && edge.sourceHandle === 'default',
    );

    return {
      nextNodeId: defaultEdge?.target,
      context: {},
    };
  }

  private async handleDelayNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { delaySeconds } = node.data;

    // Wait for specified delay
    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

    // Find next node
    const nextEdge = execution.flow.flowData.edges.find(
      (edge) => edge.source === node.id,
    );

    return {
      nextNodeId: nextEdge?.target,
      context: {},
    };
  }

  private async handleActionNode(
    node: any,
    execution: FlowExecution,
  ): Promise<NodeExecutionResult> {
    const { actionType, actionData } = node.data;

    switch (actionType) {
      case 'updateContact':
        await this.contactsService.update(
          execution.flow.tenantId,
          execution.contactId,
          actionData,
        );
        break;
      case 'addTag':
        await this.conversationsService.addTag(
          execution.flow.tenantId,
          execution.conversationId,
          actionData.tag,
        );
        break;
      case 'assignAgent':
        await this.conversationsService.assignTo(
          execution.flow.tenantId,
          execution.conversationId,
          actionData.agentId,
        );
        break;
      default:
        this.logger.warn(`Unknown action type: ${actionType}`);
    }

    // Find next node
    const nextEdge = execution.flow.flowData.edges.find(
      (edge) => edge.source === node.id,
    );

    return {
      nextNodeId: nextEdge?.target,
      context: {},
    };
  }

  private replaceVariables(
    text: string,
    context: Record<string, any>,
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return context[variable] || match;
    });
  }

  private validateInput(input: string, validationType: string): boolean {
    switch (validationType) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      case 'phone':
        return /^\+?[\d\s-()]+$/.test(input);
      case 'number':
        return !isNaN(Number(input));
      case 'url':
        try {
          new URL(input);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  private evaluateCondition(
    condition: any,
    context: Record<string, any>,
  ): boolean {
    const { variable, operator, value } = condition;
    const contextValue = context[variable];

    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'notEquals':
        return contextValue !== value;
      case 'contains':
        return String(contextValue).includes(value);
      case 'greaterThan':
        return Number(contextValue) > Number(value);
      case 'lessThan':
        return Number(contextValue) < Number(value);
      case 'exists':
        return contextValue !== undefined && contextValue !== null;
      case 'notExists':
        return contextValue === undefined || contextValue === null;
      default:
        return false;
    }
  }
}
