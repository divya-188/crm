import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<SubscriptionPlan> {
    const plan = this.planRepository.create(createPlanDto);
    return await this.planRepository.save(plan);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    includeInactive = false,
  ): Promise<{ data: SubscriptionPlan[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    
    const query = this.planRepository.createQueryBuilder('plan');
    
    if (!includeInactive) {
      query.where('plan.isActive = :isActive', { isActive: true });
    }
    
    query.orderBy('plan.sortOrder', 'ASC').addOrderBy('plan.price', 'ASC');
    
    const [data, total] = await query
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();
    
    const hasMore = pageNum * limitNum < total;
    
    return { data, total, page: pageNum, limit: limitNum, hasMore };
  }

  async findOne(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    
    return plan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findOne(id);
    
    Object.assign(plan, updatePlanDto);
    
    return await this.planRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    
    // Check if any active subscriptions are using this plan
    const activeSubscriptionsCount = await this.planRepository
      .createQueryBuilder('plan')
      .leftJoin('subscriptions', 'sub', 'sub.planId = plan.id')
      .where('plan.id = :id', { id })
      .andWhere('sub.status = :status', { status: 'active' })
      .getCount();
    
    if (activeSubscriptionsCount > 0) {
      throw new BadRequestException(
        `Cannot delete plan with active subscriptions. Please deactivate the plan instead.`
      );
    }
    
    await this.planRepository.remove(plan);
  }

  async compare(): Promise<SubscriptionPlan[]> {
    const result = await this.findAll(1, 100, false);
    return result.data;
  }

  async checkFeature(planId: string, feature: string): Promise<boolean> {
    const plan = await this.findOne(planId);
    
    if (!plan.features) {
      return false;
    }
    
    return plan.features[feature] === true;
  }

  async checkLimit(planId: string, limitKey: string): Promise<number> {
    const plan = await this.findOne(planId);
    
    if (!plan.features) {
      return 0;
    }
    
    return plan.features[limitKey] || 0;
  }

  async enforceQuota(
    planId: string,
    limitKey: string,
    currentUsage: number
  ): Promise<{ allowed: boolean; limit: number; usage: number }> {
    const limit = await this.checkLimit(planId, limitKey);
    const allowed = currentUsage < limit;
    
    return {
      allowed,
      limit,
      usage: currentUsage,
    };
  }
}
