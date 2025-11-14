import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowExecution, ExecutionStatus } from '../entities/flow-execution.entity';
import { Flow } from '../entities/flow.entity';
import { NodeHandlerService } from './node-handler.service';

@Injectable()
export class FlowExecutionService {
  private readonly logger = new Logger(FlowExecutionService.name);

  constructor(
    @InjectRepository(FlowExecution)
    private flowExecutionRepository: Repository<FlowExecution>,
    @InjectRepository(Flow)
    private flowRepository: Repository<Flow>,
    private nodeHandlerService: NodeHandlerService,
  ) {}

  async startExecution(
    flowId: string,
    conversationId: string,
    contactId: string,
    initialContext: Record<string, any> = {},
  ): Promise<FlowExecution> {
    const flow = await this.flowRepository.findOne({ where: { id: flowId } });
    if (!flow) {
      throw new Error('Flow not found');
    }

    // Find the start node
    const startNode = flow.flowData.nodes.find(
      (node) => node.type === 'start',
    );
    if (!startNode) {
      throw new Error('Flow has no start node');
    }

    const execution = this.flowExecutionRepository.create({
      flowId,
      conversationId,
      contactId,
      status: ExecutionStatus.RUNNING,
      currentNodeId: startNode.id,
      context: initialContext,
      executionPath: [startNode.id],
    });

    await this.flowExecutionRepository.save(execution);

    // Start execution asynchronously
    this.executeFlow(execution.id).catch((error) => {
      this.logger.error(`Flow execution failed: ${error.message}`, error.stack);
    });

    return execution;
  }

  async executeFlow(executionId: string): Promise<void> {
    const execution = await this.flowExecutionRepository.findOne({
      where: { id: executionId },
      relations: ['flow'],
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    try {
      while (execution.status === ExecutionStatus.RUNNING) {
        const currentNode = execution.flow.flowData.nodes.find(
          (node) => node.id === execution.currentNodeId,
        );

        if (!currentNode) {
          throw new Error(`Node ${execution.currentNodeId} not found`);
        }

        // Execute the current node
        const result = await this.nodeHandlerService.executeNode(
          currentNode,
          execution,
        );

        // Update context with node result
        execution.context = {
          ...execution.context,
          ...result.context,
        };

        // Handle node result
        if (result.nextNodeId) {
          execution.currentNodeId = result.nextNodeId;
          execution.executionPath.push(result.nextNodeId);
        } else if (result.waitForInput) {
          // Pause execution waiting for user input
          execution.status = ExecutionStatus.PAUSED;
        } else {
          // No next node, execution completed
          execution.status = ExecutionStatus.COMPLETED;
          execution.completedAt = new Date();
        }

        await this.flowExecutionRepository.save(execution);

        // If paused or completed, break the loop
        if (execution.status !== ExecutionStatus.RUNNING) {
          break;
        }
      }
    } catch (error) {
      this.logger.error(
        `Flow execution error: ${error.message}`,
        error.stack,
      );
      execution.status = ExecutionStatus.FAILED;
      execution.errorMessage = error.message;
      await this.flowExecutionRepository.save(execution);
    }
  }

  async resumeExecution(
    executionId: string,
    userInput: any,
  ): Promise<FlowExecution> {
    const execution = await this.flowExecutionRepository.findOne({
      where: { id: executionId },
      relations: ['flow'],
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    if (execution.status !== ExecutionStatus.PAUSED) {
      throw new Error('Execution is not paused');
    }

    // Store user input in context
    execution.context = {
      ...execution.context,
      lastUserInput: userInput,
    };

    execution.status = ExecutionStatus.RUNNING;
    await this.flowExecutionRepository.save(execution);

    // Continue execution
    this.executeFlow(execution.id).catch((error) => {
      this.logger.error(`Flow execution failed: ${error.message}`, error.stack);
    });

    return execution;
  }

  async getExecution(executionId: string): Promise<FlowExecution> {
    return this.flowExecutionRepository.findOne({
      where: { id: executionId },
      relations: ['flow', 'conversation', 'contact'],
    });
  }

  async getExecutionsByConversation(
    conversationId: string,
  ): Promise<FlowExecution[]> {
    return this.flowExecutionRepository.find({
      where: { conversationId },
      relations: ['flow'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = await this.flowExecutionRepository.findOne({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.status = ExecutionStatus.FAILED;
    execution.errorMessage = 'Cancelled by user';
    await this.flowExecutionRepository.save(execution);
  }

  async testFlowExecution(
    flowId: string,
    tenantId: string,
    testData: Record<string, any> = {},
  ): Promise<{
    success: boolean;
    executionPath: string[];
    logs: Array<{
      timestamp: string;
      nodeId: string;
      nodeName: string;
      nodeType: string;
      action: string;
      data: any;
      duration: number;
    }>;
    finalContext: Record<string, any>;
    error?: string;
  }> {
    const flow = await this.flowRepository.findOne({
      where: { id: flowId, tenantId },
    });

    if (!flow) {
      throw new Error('Flow not found');
    }

    const logs: Array<{
      timestamp: string;
      nodeId: string;
      nodeName: string;
      nodeType: string;
      action: string;
      data: any;
      duration: number;
    }> = [];

    const executionPath: string[] = [];
    let context = { ...testData };
    let currentNodeId: string | null = null;

    // Find start node
    const startNode = flow.flowData.nodes.find((node) => node.type === 'start');
    if (!startNode) {
      return {
        success: false,
        executionPath: [],
        logs: [],
        finalContext: context,
        error: 'Flow has no start node',
      };
    }

    currentNodeId = startNode.id;
    executionPath.push(currentNodeId);

    try {
      let iterationCount = 0;
      const maxIterations = 100; // Prevent infinite loops

      while (currentNodeId && iterationCount < maxIterations) {
        iterationCount++;
        const startTime = Date.now();

        const currentNode = flow.flowData.nodes.find(
          (node) => node.id === currentNodeId,
        );

        if (!currentNode) {
          throw new Error(`Node ${currentNodeId} not found in flow`);
        }

        // Log node entry
        logs.push({
          timestamp: new Date().toISOString(),
          nodeId: currentNode.id,
          nodeName: currentNode.data.label || currentNode.type,
          nodeType: currentNode.type,
          action: 'enter',
          data: { nodeData: currentNode.data },
          duration: 0,
        });

        // Simulate node execution
        let nextNodeId: string | null = null;

        switch (currentNode.type) {
          case 'start':
            // Start node just passes through
            logs.push({
              timestamp: new Date().toISOString(),
              nodeId: currentNode.id,
              nodeName: currentNode.data.label || 'Start',
              nodeType: 'start',
              action: 'execute',
              data: { message: 'Flow started' },
              duration: Date.now() - startTime,
            });
            break;

          case 'message':
            // Message node sends a message
            logs.push({
              timestamp: new Date().toISOString(),
              nodeId: currentNode.id,
              nodeName: currentNode.data.label || 'Send Message',
              nodeType: 'message',
              action: 'execute',
              data: {
                message: currentNode.data.message || 'No message configured',
                variables: this.extractVariables(
                  currentNode.data.message || '',
                  context,
                ),
              },
              duration: Date.now() - startTime,
            });
            break;

          case 'condition':
            // Condition node evaluates conditions
            const conditionResult = this.evaluateCondition(
              currentNode.data,
              context,
            );
            logs.push({
              timestamp: new Date().toISOString(),
              nodeId: currentNode.id,
              nodeName: currentNode.data.label || 'Condition',
              nodeType: 'condition',
              action: 'execute',
              data: {
                conditions: currentNode.data.rules || [],
                result: conditionResult,
                context,
              },
              duration: Date.now() - startTime,
            });
            break;

          case 'input':
            // Input node waits for user input (simulated in test mode)
            const simulatedInput = testData[currentNode.data.variableName] || 'test-input';
            context[currentNode.data.variableName] = simulatedInput;
            logs.push({
              timestamp: new Date().toISOString(),
              nodeId: currentNode.id,
              nodeName: currentNode.data.label || 'Get Input',
              nodeType: 'input',
              action: 'execute',
              data: {
                variableName: currentNode.data.variableName,
                inputType: currentNode.data.inputType,
                value: simulatedInput,
              },
              duration: Date.now() - startTime,
            });
            break;

          case 'delay':
            // Delay node (simulated - no actual delay in test mode)
            logs.push({
              timestamp: new Date().toISOString(),
              nodeId: currentNode.id,
              nodeName: currentNode.data.label || 'Delay',
              nodeType: 'delay',
              action: 'execute',
              data: {
                duration: currentNode.data.duration,
                unit: currentNode.data.unit,
                message: `Delay of ${currentNode.data.duration} ${currentNode.data.unit} (simulated)`,
              },
              duration: Date.now() - startTime,
            });
            break;

          case 'api':
            // API node (simulated - no actual API call in test mode)
            const mockResponse = { status: 200, data: { success: true } };
            if (currentNode.data.responseVariable) {
              context[currentNode.data.responseVariable] = mockResponse;
            }
            logs.push({
              timestamp: new Date().toISOString(),
              nodeId: currentNode.id,
              nodeName: currentNode.data.label || 'API Request',
              nodeType: 'api',
              action: 'execute',
              data: {
                method: currentNode.data.method,
                url: currentNode.data.url,
                response: mockResponse,
                message: 'API call simulated in test mode',
              },
              duration: Date.now() - startTime,
            });
            break;

          case 'end':
            logs.push({
              timestamp: new Date().toISOString(),
              nodeId: currentNode.id,
              nodeName: currentNode.data.label || 'End',
              nodeType: 'end',
              action: 'execute',
              data: { message: 'Flow completed' },
              duration: Date.now() - startTime,
            });
            currentNodeId = null;
            continue;

          default:
            logs.push({
              timestamp: new Date().toISOString(),
              nodeId: currentNode.id,
              nodeName: currentNode.data.label || currentNode.type,
              nodeType: currentNode.type,
              action: 'execute',
              data: { message: `Node type ${currentNode.type} executed` },
              duration: Date.now() - startTime,
            });
        }

        // Find next node
        const outgoingEdges = flow.flowData.edges.filter(
          (edge) => edge.source === currentNodeId,
        );

        if (outgoingEdges.length === 0) {
          // No outgoing edges, flow ends
          logs.push({
            timestamp: new Date().toISOString(),
            nodeId: currentNode.id,
            nodeName: currentNode.data.label || currentNode.type,
            nodeType: currentNode.type,
            action: 'exit',
            data: { message: 'No outgoing connections, flow ends' },
            duration: 0,
          });
          break;
        } else if (outgoingEdges.length === 1) {
          // Single outgoing edge
          nextNodeId = outgoingEdges[0].target;
        } else {
          // Multiple outgoing edges (condition node)
          // For test mode, take the first edge
          nextNodeId = outgoingEdges[0].target;
          logs.push({
            timestamp: new Date().toISOString(),
            nodeId: currentNode.id,
            nodeName: currentNode.data.label || currentNode.type,
            nodeType: currentNode.type,
            action: 'branch',
            data: {
              message: 'Multiple paths available, taking first path in test mode',
              selectedPath: nextNodeId,
            },
            duration: 0,
          });
        }

        if (nextNodeId) {
          executionPath.push(nextNodeId);
          currentNodeId = nextNodeId;
        } else {
          break;
        }
      }

      if (iterationCount >= maxIterations) {
        throw new Error('Maximum iteration limit reached - possible infinite loop');
      }

      return {
        success: true,
        executionPath,
        logs,
        finalContext: context,
      };
    } catch (error) {
      this.logger.error(`Test execution error: ${error.message}`, error.stack);
      return {
        success: false,
        executionPath,
        logs,
        finalContext: context,
        error: error.message,
      };
    }
  }

  private extractVariables(
    text: string,
    context: Record<string, any>,
  ): Record<string, any> {
    const variables: Record<string, any> = {};
    const regex = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const varName = match[1];
      variables[varName] = context[varName] || `{{${varName}}}`;
    }

    return variables;
  }

  private evaluateCondition(
    nodeData: any,
    context: Record<string, any>,
  ): boolean {
    // Simple condition evaluation for test mode
    if (!nodeData.rules || nodeData.rules.length === 0) {
      return true;
    }

    const logic = nodeData.logic || 'AND';
    const results = nodeData.rules.map((rule: any) => {
      const fieldValue = context[rule.field];
      const compareValue = rule.value;

      switch (rule.operator) {
        case 'equals':
          return fieldValue === compareValue;
        case 'not_equals':
          return fieldValue !== compareValue;
        case 'contains':
          return String(fieldValue).includes(String(compareValue));
        case 'greater_than':
          return Number(fieldValue) > Number(compareValue);
        case 'less_than':
          return Number(fieldValue) < Number(compareValue);
        default:
          return false;
      }
    });

    return logic === 'AND' ? results.every((r) => r) : results.some((r) => r);
  }

  async getExecutionLogs(executionId: string): Promise<any> {
    const execution = await this.flowExecutionRepository.findOne({
      where: { id: executionId },
      relations: ['flow'],
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    // Return execution details with path and context
    return {
      executionId: execution.id,
      flowId: execution.flowId,
      flowName: execution.flow.name,
      status: execution.status,
      executionPath: execution.executionPath || [],
      context: execution.context || {},
      currentNodeId: execution.currentNodeId,
      errorMessage: execution.errorMessage,
      startedAt: execution.createdAt,
      completedAt: execution.completedAt,
      duration: execution.completedAt
        ? new Date(execution.completedAt).getTime() -
          new Date(execution.createdAt).getTime()
        : null,
    };
  }

  async getExecutionReplay(executionId: string): Promise<any> {
    const execution = await this.flowExecutionRepository.findOne({
      where: { id: executionId },
      relations: ['flow', 'contact'],
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    // Build replay data with step-by-step information
    const replaySteps = execution.executionPath.map((nodeId, index) => {
      const node = execution.flow.flowData.nodes.find((n) => n.id === nodeId);
      return {
        step: index + 1,
        nodeId,
        nodeName: node?.data.label || node?.type || 'Unknown',
        nodeType: node?.type || 'unknown',
        timestamp: execution.createdAt, // In real implementation, track individual timestamps
        context: execution.context,
      };
    });

    return {
      executionId: execution.id,
      flowId: execution.flowId,
      flowName: execution.flow.name,
      flowData: execution.flow.flowData,
      status: execution.status,
      contact: execution.contact
        ? {
            id: execution.contact.id,
            name: `${execution.contact.firstName || ''} ${execution.contact.lastName || ''}`.trim() || 'Unknown',
            phoneNumber: execution.contact.phone || 'N/A',
          }
        : null,
      replaySteps,
      finalContext: execution.context,
      errorMessage: execution.errorMessage,
      startedAt: execution.createdAt,
      completedAt: execution.completedAt,
    };
  }
}
