import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Automation, AutomationStatus } from './entities/automation.entity';
import { AutomationExecution, ExecutionStatus } from './entities/automation-execution.entity';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { ConditionEvaluatorService } from './services/condition-evaluator.service';
import { ActionExecutorService } from './services/action-executor.service';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    @InjectRepository(Automation)
    private automationRepository: Repository<Automation>,
    @InjectRepository(AutomationExecution)
    private executionRepository: Repository<AutomationExecution>,
    private conditionEvaluator: ConditionEvaluatorService,
    private actionExecutor: ActionExecutorService,
  ) {}

  async create(
    tenantId: string,
    createAutomationDto: CreateAutomationDto,
  ): Promise<Automation> {
    const automation = this.automationRepository.create({
      name: createAutomationDto.name,
      description: createAutomationDto.description,
      triggerType: createAutomationDto.triggerType as any,
      triggerConfig: createAutomationDto.triggerConfig,
      conditions: createAutomationDto.conditions as any,
      actions: createAutomationDto.actions as any,
      status: (createAutomationDto.status as any) || AutomationStatus.DRAFT,
      tenantId,
    } as any);

    const saved = await this.automationRepository.save(automation);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(
    tenantId: string,
    options: { page: number; limit: number; status?: string },
  ) {
    const { page, limit, status } = options;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.automationRepository.findAndCount({
      where,
      skip,
      take: limitNum,
      order: { createdAt: 'DESC' },
    });

    const hasMore = pageNum * limitNum < total;

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore,
    };
  }

  async findOne(id: string, tenantId: string): Promise<Automation> {
    const automation = await this.automationRepository.findOne({
      where: { id, tenantId },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    return automation;
  }

  async update(
    id: string,
    tenantId: string,
    updateAutomationDto: UpdateAutomationDto,
  ): Promise<Automation> {
    const automation = await this.findOne(id, tenantId);

    Object.assign(automation, updateAutomationDto);

    return this.automationRepository.save(automation);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const automation = await this.findOne(id, tenantId);
    await this.automationRepository.remove(automation);
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: string,
  ): Promise<Automation> {
    const automation = await this.findOne(id, tenantId);
    automation.status = status as any;
    return this.automationRepository.save(automation);
  }

  async triggerAutomations(
    tenantId: string,
    triggerType: string,
    triggerData: Record<string, any>,
  ): Promise<void> {
    const automations = await this.automationRepository.find({
      where: {
        tenantId,
        triggerType: triggerType as any,
        status: AutomationStatus.ACTIVE,
      },
    });

    for (const automation of automations) {
      await this.executeAutomation(automation, triggerData);
    }
  }

  async executeAutomation(
    automation: Automation,
    triggerData: Record<string, any>,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Evaluate conditions
      const conditionsMet = this.conditionEvaluator.evaluateConditions(
        automation.conditions,
        triggerData,
      );

      if (!conditionsMet) {
        this.logger.log(
          `Automation ${automation.id} conditions not met, skipping`,
        );
        return;
      }

      // Execute actions
      const results = await this.actionExecutor.executeActions(
        automation.actions,
        triggerData,
        automation.tenantId,
      );

      const executionTimeMs = Date.now() - startTime;
      const allSuccess = results.every((r) => r.success);
      const status = allSuccess
        ? ExecutionStatus.SUCCESS
        : results.some((r) => r.success)
        ? ExecutionStatus.PARTIAL
        : ExecutionStatus.FAILED;

      // Log execution
      await this.executionRepository.save({
        automationId: automation.id,
        status,
        triggerData,
        executionResults: results,
        executionTimeMs,
      });

      // Update automation stats
      automation.executionCount++;
      if (allSuccess) {
        automation.successCount++;
      } else {
        automation.failureCount++;
      }
      automation.lastExecutedAt = new Date();
      await this.automationRepository.save(automation);

      this.logger.log(
        `Automation ${automation.id} executed in ${executionTimeMs}ms with status ${status}`,
      );
    } catch (error) {
      this.logger.error(
        `Automation ${automation.id} execution failed: ${error.message}`,
        error.stack,
      );

      await this.executionRepository.save({
        automationId: automation.id,
        status: ExecutionStatus.FAILED,
        triggerData,
        errorMessage: error.message,
        executionTimeMs: Date.now() - startTime,
        executionResults: [],
      });

      automation.executionCount++;
      automation.failureCount++;
      automation.lastExecutedAt = new Date();
      await this.automationRepository.save(automation);
    }
  }

  async getExecutions(
    automationId: string,
    tenantId: string,
    options: { page: number; limit: number },
  ) {
    const automation = await this.findOne(automationId, tenantId);

    const { page, limit } = options;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await this.executionRepository.findAndCount({
      where: { automationId: automation.id },
      skip,
      take: limitNum,
      order: { createdAt: 'DESC' },
    });

    const hasMore = pageNum * limitNum < total;

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore,
    };
  }

  async duplicate(id: string, tenantId: string): Promise<Automation> {
    const automation = await this.findOne(id, tenantId);

    const duplicated = this.automationRepository.create({
      name: `${automation.name} (Copy)`,
      description: automation.description,
      triggerType: automation.triggerType,
      triggerConfig: automation.triggerConfig,
      conditions: automation.conditions,
      actions: automation.actions,
      status: AutomationStatus.DRAFT,
      tenantId,
    } as any);

    const saved = await this.automationRepository.save(duplicated);
    const result = Array.isArray(saved) ? saved[0] : saved;
    this.logger.log(`Automation ${id} duplicated as ${result.id}`);
    return result;
  }
}
