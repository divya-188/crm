import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flow, FlowStatus } from './entities/flow.entity';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(Flow)
    private flowRepository: Repository<Flow>,
  ) {}

  async create(tenantId: string, createFlowDto: CreateFlowDto): Promise<Flow> {
    const flow = this.flowRepository.create({
      name: createFlowDto.name,
      description: createFlowDto.description,
      flowData: createFlowDto.flowData,
      triggerConfig: createFlowDto.triggerConfig,
      status: createFlowDto.status as any,
      tenantId,
    });

    return this.flowRepository.save(flow);
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

    const [data, total] = await this.flowRepository.findAndCount({
      where,
      skip,
      take: limitNum,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findOne(id: string, tenantId: string): Promise<Flow> {
    const flow = await this.flowRepository.findOne({
      where: { id, tenantId },
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  async update(
    id: string,
    tenantId: string,
    updateFlowDto: UpdateFlowDto,
  ): Promise<Flow> {
    const flow = await this.findOne(id, tenantId);

    Object.assign(flow, updateFlowDto);

    return this.flowRepository.save(flow);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const flow = await this.findOne(id, tenantId);
    await this.flowRepository.remove(flow);
  }

  async duplicate(id: string, tenantId: string): Promise<Flow> {
    const originalFlow = await this.findOne(id, tenantId);

    const duplicatedFlow = this.flowRepository.create({
      ...originalFlow,
      id: undefined,
      name: `${originalFlow.name} (Copy)`,
      status: FlowStatus.DRAFT,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      parentFlowId: originalFlow.id,
      version: 1,
    });

    return this.flowRepository.save(duplicatedFlow);
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: string,
  ): Promise<Flow> {
    const flow = await this.findOne(id, tenantId);
    flow.status = status as any;
    return this.flowRepository.save(flow);
  }

  async findActiveFlowsByTrigger(
    tenantId: string,
    triggerType: string,
  ): Promise<Flow[]> {
    return this.flowRepository.find({
      where: {
        tenantId,
        status: FlowStatus.ACTIVE,
      },
    });
  }
}
