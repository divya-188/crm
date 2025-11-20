import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateStatusHistoryService } from '../template-status-history.service';
import { TemplateStatusHistory } from '../../entities/template-status-history.entity';

describe('TemplateStatusHistoryService', () => {
  let service: TemplateStatusHistoryService;
  let repository: Repository<TemplateStatusHistory>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTenantId = 'tenant-123';
  const mockTemplateId = 'template-456';
  const mockUserId = 'user-789';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateStatusHistoryService,
        {
          provide: getRepositoryToken(TemplateStatusHistory),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TemplateStatusHistoryService>(TemplateStatusHistoryService);
    repository = module.get<Repository<TemplateStatusHistory>>(
      getRepositoryToken(TemplateStatusHistory),
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logStatusChange', () => {
    it('should log a status change successfully', async () => {
      const statusChangeData = {
        templateId: mockTemplateId,
        tenantId: mockTenantId,
        fromStatus: 'draft',
        toStatus: 'pending',
        reason: 'Template submitted for approval',
        changedByUserId: mockUserId,
      };

      const mockHistoryEntry = {
        id: 'history-123',
        ...statusChangeData,
        changedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockHistoryEntry);
      mockRepository.save.mockResolvedValue(mockHistoryEntry);

      const result = await service.logStatusChange(statusChangeData);

      expect(mockRepository.create).toHaveBeenCalledWith(statusChangeData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockHistoryEntry);
      expect(result).toEqual(mockHistoryEntry);
    });

    it('should log status change with Meta API response', async () => {
      const metaResponse = {
        id: 'meta-123',
        status: 'APPROVED',
        category: 'TRANSACTIONAL',
      };

      const statusChangeData = {
        templateId: mockTemplateId,
        tenantId: mockTenantId,
        fromStatus: 'pending',
        toStatus: 'approved',
        reason: 'Template approved by Meta',
        metaResponse,
        changedByUserId: null, // System change
      };

      const mockHistoryEntry = {
        id: 'history-456',
        ...statusChangeData,
        changedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockHistoryEntry);
      mockRepository.save.mockResolvedValue(mockHistoryEntry);

      const result = await service.logStatusChange(statusChangeData);

      expect(result.metaResponse).toEqual(metaResponse);
      expect(result.changedByUserId).toBeNull();
    });
  });

  describe('getTemplateStatusHistory', () => {
    it('should retrieve status history for a template', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          templateId: mockTemplateId,
          tenantId: mockTenantId,
          fromStatus: 'draft',
          toStatus: 'pending',
          changedAt: new Date('2024-01-01'),
        },
        {
          id: 'history-2',
          templateId: mockTemplateId,
          tenantId: mockTenantId,
          fromStatus: 'pending',
          toStatus: 'approved',
          changedAt: new Date('2024-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockHistory);

      const result = await service.getTemplateStatusHistory(mockTemplateId, mockTenantId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          templateId: mockTemplateId,
          tenantId: mockTenantId,
        },
        order: {
          changedAt: 'DESC',
        },
        relations: ['changedByUser'],
      });
      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no history exists', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getTemplateStatusHistory(mockTemplateId, mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('generateStatusTimeline', () => {
    it('should generate a status timeline', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          templateId: mockTemplateId,
          tenantId: mockTenantId,
          fromStatus: null,
          toStatus: 'draft',
          reason: 'Template created',
          metaResponse: null,
          changedByUserId: mockUserId,
          changedAt: new Date('2024-01-01'),
        },
        {
          id: 'history-2',
          templateId: mockTemplateId,
          tenantId: mockTenantId,
          fromStatus: 'draft',
          toStatus: 'pending',
          reason: 'Template submitted',
          metaResponse: null,
          changedByUserId: mockUserId,
          changedAt: new Date('2024-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockHistory);

      const result = await service.generateStatusTimeline(mockTemplateId, mockTenantId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'history-1',
        fromStatus: null,
        toStatus: 'draft',
        reason: 'Template created',
      });
      expect(result[1]).toMatchObject({
        fromStatus: 'draft',
        toStatus: 'pending',
        reason: 'Template submitted',
      });
    });
  });

  describe('getLatestStatusChange', () => {
    it('should retrieve the latest status change', async () => {
      const mockLatestChange = {
        id: 'history-latest',
        templateId: mockTemplateId,
        tenantId: mockTenantId,
        fromStatus: 'pending',
        toStatus: 'approved',
        changedAt: new Date('2024-01-03'),
      };

      mockRepository.findOne.mockResolvedValue(mockLatestChange);

      const result = await service.getLatestStatusChange(mockTemplateId, mockTenantId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          templateId: mockTemplateId,
          tenantId: mockTenantId,
        },
        order: {
          changedAt: 'DESC',
        },
        relations: ['changedByUser'],
      });
      expect(result).toEqual(mockLatestChange);
    });

    it('should return null if no status changes exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getLatestStatusChange(mockTemplateId, mockTenantId);

      expect(result).toBeNull();
    });
  });

  describe('getRejectionHistory', () => {
    it('should retrieve rejection history', async () => {
      const mockRejections = [
        {
          id: 'history-1',
          templateId: 'template-1',
          tenantId: mockTenantId,
          fromStatus: 'pending',
          toStatus: 'rejected',
          reason: 'Invalid content',
          changedAt: new Date('2024-01-01'),
        },
        {
          id: 'history-2',
          templateId: 'template-2',
          tenantId: mockTenantId,
          fromStatus: 'pending',
          toStatus: 'rejected',
          reason: 'Policy violation',
          changedAt: new Date('2024-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockRejections);

      const result = await service.getRejectionHistory(mockTenantId, 50);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          toStatus: 'rejected',
        },
        order: {
          changedAt: 'DESC',
        },
        take: 50,
        relations: ['template', 'changedByUser'],
      });
      expect(result).toEqual(mockRejections);
    });
  });

  describe('getApprovalHistory', () => {
    it('should retrieve approval history', async () => {
      const mockApprovals = [
        {
          id: 'history-1',
          templateId: 'template-1',
          tenantId: mockTenantId,
          fromStatus: 'pending',
          toStatus: 'approved',
          changedAt: new Date('2024-01-01'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockApprovals);

      const result = await service.getApprovalHistory(mockTenantId, 50);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          toStatus: 'approved',
        },
        order: {
          changedAt: 'DESC',
        },
        take: 50,
        relations: ['template', 'changedByUser'],
      });
      expect(result).toEqual(mockApprovals);
    });
  });

  describe('hasBeenInStatus', () => {
    it('should return true if template has been in status', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await service.hasBeenInStatus(mockTemplateId, mockTenantId, 'approved');

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: {
          templateId: mockTemplateId,
          tenantId: mockTenantId,
          toStatus: 'approved',
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if template has never been in status', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.hasBeenInStatus(mockTemplateId, mockTenantId, 'rejected');

      expect(result).toBe(false);
    });
  });

  describe('getTimeInStatuses', () => {
    it('should calculate time spent in each status', async () => {
      const now = new Date('2024-01-10T12:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      const mockHistory = [
        {
          id: 'history-3',
          toStatus: 'approved',
          changedAt: new Date('2024-01-03T12:00:00Z'), // Most recent
        },
        {
          id: 'history-2',
          toStatus: 'pending',
          changedAt: new Date('2024-01-02T12:00:00Z'),
        },
        {
          id: 'history-1',
          toStatus: 'draft',
          changedAt: new Date('2024-01-01T12:00:00Z'), // Oldest
        },
      ];

      mockRepository.find.mockResolvedValue(mockHistory);

      const result = await service.getTimeInStatuses(mockTemplateId, mockTenantId);

      // draft: 1 day (24 hours)
      // pending: 1 day (24 hours)
      // approved: 7 days (168 hours)
      expect(result).toEqual({
        draft: 24,
        pending: 24,
        approved: 168,
      });
    });

    it('should return empty object if no history exists', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getTimeInStatuses(mockTemplateId, mockTenantId);

      expect(result).toEqual({});
    });
  });

  describe('deleteTemplateHistory', () => {
    it('should delete all history for a template', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 3 });

      await service.deleteTemplateHistory(mockTemplateId, mockTenantId);

      expect(mockRepository.delete).toHaveBeenCalledWith({
        templateId: mockTemplateId,
        tenantId: mockTenantId,
      });
    });
  });

  describe('getRecentStatusChanges', () => {
    it('should retrieve recent status changes', async () => {
      const mockChanges = [
        {
          id: 'history-1',
          tenantId: mockTenantId,
          toStatus: 'approved',
          changedAt: new Date('2024-01-03'),
        },
        {
          id: 'history-2',
          tenantId: mockTenantId,
          toStatus: 'rejected',
          changedAt: new Date('2024-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockChanges);

      const result = await service.getRecentStatusChanges(mockTenantId, 20);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
        },
        order: {
          changedAt: 'DESC',
        },
        take: 20,
        relations: ['template', 'changedByUser'],
      });
      expect(result).toEqual(mockChanges);
    });
  });

  describe('getStatusChangeStats', () => {
    it('should return status change statistics', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: 'approved', count: '5' },
          { status: 'rejected', count: '2' },
          { status: 'pending', count: '3' },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStatusChangeStats(mockTenantId);

      expect(result).toEqual({
        approved: 5,
        rejected: 2,
        pending: 3,
      });
    });

    it('should filter by date range when provided', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getStatusChangeStats(mockTenantId, startDate, endDate);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'history.changedAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    });
  });
});
