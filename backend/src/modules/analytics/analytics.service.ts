import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../conversations/entities/message.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Flow } from '../flows/entities/flow.entity';
import { FlowExecution } from '../flows/entities/flow-execution.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    @InjectRepository(Flow)
    private flowRepository: Repository<Flow>,
    @InjectRepository(FlowExecution)
    private flowExecutionRepository: Repository<FlowExecution>,
  ) {}

  async getDashboardMetrics(tenantId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get current period metrics
    const [
      totalConversations,
      activeConversations,
      totalMessages,
      totalContacts,
    ] = await Promise.all([
      this.conversationRepository.count({ where: { tenantId } }),
      this.conversationRepository.count({
        where: { tenantId, status: 'open' as any },
      }),
      this.messageRepository
        .createQueryBuilder('message')
        .leftJoin('message.conversation', 'conversation')
        .where('conversation.tenantId = :tenantId', { tenantId })
        .getCount(),
      this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoin('conversation.contact', 'contact')
        .where('conversation.tenantId = :tenantId', { tenantId })
        .select('COUNT(DISTINCT conversation.contactId)', 'count')
        .getRawOne()
        .then((result) => parseInt(result.count) || 0),
    ]);

    // Get previous period metrics for growth calculation
    const [
      prevConversations,
      prevMessages,
      prevContacts,
    ] = await Promise.all([
      this.conversationRepository.count({
        where: {
          tenantId,
          createdAt: Between(sixtyDaysAgo, thirtyDaysAgo),
        },
      }),
      this.messageRepository
        .createQueryBuilder('message')
        .leftJoin('message.conversation', 'conversation')
        .where('conversation.tenantId = :tenantId', { tenantId })
        .andWhere('message.createdAt BETWEEN :start AND :end', {
          start: sixtyDaysAgo,
          end: thirtyDaysAgo,
        })
        .getCount(),
      this.conversationRepository
        .createQueryBuilder('conversation')
        .where('conversation.tenantId = :tenantId', { tenantId })
        .andWhere('conversation.createdAt BETWEEN :start AND :end', {
          start: sixtyDaysAgo,
          end: thirtyDaysAgo,
        })
        .select('COUNT(DISTINCT conversation.contactId)', 'count')
        .getRawOne()
        .then((result) => parseInt(result.count) || 0),
    ]);

    // Calculate growth percentages
    const conversationGrowth = prevConversations > 0
      ? ((totalConversations - prevConversations) / prevConversations) * 100
      : 0;
    const messageGrowth = prevMessages > 0
      ? ((totalMessages - prevMessages) / prevMessages) * 100
      : 0;
    const contactGrowth = prevContacts > 0
      ? ((totalContacts - prevContacts) / prevContacts) * 100
      : 0;

    // Get conversation and message trends
    const conversationTrend = await this.getConversationTrend(
      tenantId,
      thirtyDaysAgo,
      now,
    );
    const messageTrend = await this.getMessageTrend(
      tenantId,
      thirtyDaysAgo,
      now,
    );

    // Get top agents
    const topAgents = await this.getTopAgents(tenantId, thirtyDaysAgo, now);

    // Get conversations by status
    const conversationsByStatus = await this.getConversationsByStatus(tenantId);

    // Calculate average response time
    const averageResponseTime = await this.calculateAvgResponseTime(
      tenantId,
      thirtyDaysAgo,
      now,
    );

    return {
      totalConversations,
      activeConversations,
      totalMessages,
      totalContacts,
      conversationGrowth,
      messageGrowth,
      contactGrowth,
      responseRateChange: 0, // Placeholder for now
      averageResponseTime,
      conversationTrend,
      messageTrend,
      topAgents,
      conversationsByStatus,
    };
  }

  async getConversationAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.tenantId = :tenantId', { tenantId })
      .andWhere('conversation.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    const byStatus = conversations.reduce((acc, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgResponseTime = await this.calculateAvgResponseTime(
      tenantId,
      startDate,
      endDate,
    );

    return {
      total: conversations.length,
      byStatus,
      avgResponseTime,
      trend: await this.getConversationTrend(tenantId, startDate, endDate),
    };
  }

  async getMessageVolumeAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoin('message.conversation', 'conversation')
      .where('conversation.tenantId = :tenantId', { tenantId })
      .andWhere('message.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    const byDirection = messages.reduce((acc, msg) => {
      acc[msg.direction] = (acc[msg.direction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = messages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: messages.length,
      byDirection,
      byType,
      trend: await this.getMessageTrend(tenantId, startDate, endDate),
    };
  }

  async getCampaignPerformance(tenantId: string) {
    const campaigns = await this.campaignRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      readCount: campaign.readCount,
      failedCount: campaign.failedCount,
      deliveryRate:
        campaign.totalRecipients > 0
          ? (campaign.deliveredCount / campaign.totalRecipients) * 100
          : 0,
      readRate:
        campaign.deliveredCount > 0
          ? (campaign.readCount / campaign.deliveredCount) * 100
          : 0,
    }));
  }

  async getFlowPerformance(tenantId: string) {
    const flows = await this.flowRepository.find({
      where: { tenantId },
      order: { executionCount: 'DESC' },
      take: 10,
    });

    const flowPerformance = flows.map((flow) => ({
      id: flow.id,
      name: flow.name,
      status: flow.status,
      executionCount: flow.executionCount || 0,
      successCount: flow.successCount || 0,
      failureCount: flow.failureCount || 0,
      successRate:
        flow.executionCount > 0
          ? (flow.successCount / flow.executionCount) * 100
          : 0,
    }));

    return {
      flowPerformance,
      totalFlows: flows.length,
      totalExecutions: flowPerformance.reduce((sum, f) => sum + f.executionCount, 0),
    };
  }

  async getAgentPerformance(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // This would need user/agent data
    // Simplified version for now
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.assignedTo', 'user')
      .where('conversation.tenantId = :tenantId', { tenantId })
      .andWhere('conversation.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    const agentStats = conversations.reduce((acc, conv) => {
      if (conv.assignedToId) {
        if (!acc[conv.assignedToId]) {
          acc[conv.assignedToId] = {
            agentId: conv.assignedToId,
            conversationsHandled: 0,
            avgResponseTime: 0,
          };
        }
        acc[conv.assignedToId].conversationsHandled++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agentStats);
  }

  private async calculateAvgResponseTime(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Simplified calculation
    return 300; // 5 minutes in seconds
  }

  private async getConversationTrend(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const trend = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await this.conversationRepository.count({
        where: {
          tenantId,
          createdAt: Between(dayStart, dayEnd),
        },
      });

      trend.push({
        date: dayStart.toISOString().split('T')[0],
        value: count,
      });
    }

    return trend;
  }

  private async getMessageTrend(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const trend = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await this.messageRepository
        .createQueryBuilder('message')
        .leftJoin('message.conversation', 'conversation')
        .where('conversation.tenantId = :tenantId', { tenantId })
        .andWhere('message.createdAt BETWEEN :dayStart AND :dayEnd', {
          dayStart,
          dayEnd,
        })
        .getCount();

      trend.push({
        date: dayStart.toISOString().split('T')[0],
        value: count,
      });
    }

    return trend;
  }

  private async getTopAgents(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.assignedTo', 'user')
      .where('conversation.tenantId = :tenantId', { tenantId })
      .andWhere('conversation.assignedToId IS NOT NULL')
      .andWhere('conversation.updatedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    // Group by agent
    const agentStats = conversations.reduce((acc, conv) => {
      if (conv.assignedToId && conv.assignedTo) {
        if (!acc[conv.assignedToId]) {
          acc[conv.assignedToId] = {
            agentId: conv.assignedToId,
            agentName: `${conv.assignedTo.firstName || ''} ${conv.assignedTo.lastName || ''}`.trim() || 'Unknown',
            conversationsHandled: 0,
            resolvedCount: 0,
            averageResponseTime: 300, // Default 5 minutes
          };
        }
        acc[conv.assignedToId].conversationsHandled++;
        if (conv.status === 'resolved' || conv.status === 'closed') {
          acc[conv.assignedToId].resolvedCount++;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate resolution rate and sort
    const agents = Object.values(agentStats)
      .map((agent: any) => ({
        ...agent,
        resolutionRate:
          agent.conversationsHandled > 0
            ? (agent.resolvedCount / agent.conversationsHandled) * 100
            : 0,
      }))
      .sort((a: any, b: any) => b.conversationsHandled - a.conversationsHandled)
      .slice(0, 5); // Top 5 agents

    return agents;
  }

  private async getConversationsByStatus(tenantId: string) {
    const conversations = await this.conversationRepository.find({
      where: { tenantId },
    });

    const total = conversations.length;
    const statusCounts = conversations.reduce((acc, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  async exportToCSV(data: any[]): Promise<string> {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
