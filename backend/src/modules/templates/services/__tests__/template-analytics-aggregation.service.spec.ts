import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateAnalyticsAggregationService } from '../template-analytics-aggregation.service';
import { TemplateUsageAnalytics } from '../../entities/template-usage-analytics.entity';
import { Template } from '../../entities/template.entity';

describe('TemplateAnalyticsAggregationService', () => {
  let service: TemplateAnalyticsAggregationService;
  let analyticsRepository: Repository<TemplateUsageAnalytics>;
  let templateRepository: Repository<Template>;

  const mockAnalyticsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockTemplateRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateAnalyticsAggregationService,
        {
          provide: getRepositoryToken(TemplateUsageAnalytics),
          useValue: mockAnalyticsRepository,
        },
        {
          provide: getRepositoryToken(Template),
          useValue: mockTemplateRepository,
        },
      ],
    }).compile();

    service = module.get<TemplateAnalyticsAggregationService>(
      TemplateAnalyticsAggregationService,
    );
    analyticsRepository = module.get<Repository<TemplateUsageAnalytics>>(
      getRepositoryToken(TemplateUsageAnalytics),
    );
    templateRepository = module.get<Repository<Template>>(
      getRepositoryToken(Template),
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('aggregateTemplateMetrics', () => {
    it('should aggregate metrics for active templates', async () => {
      const testDate = new Date('2024-01-15');
      const mockTemplates = [
        {
          id: 'template-1',
          tenantId: 'tenant-1',
          name: 'test_template',
          isActive: true,
        },
        {
          id: 'template-2',
          tenantId: 'tenant-1',
          name: 'test_template_2',
          isActive: true,
        },
      ];

      mockTemplateRepository.find.mockResolvedValue(mockTemplates);
      mockAnalyticsRepository.findOne.mockResolvedValue(null);
      mockAnalyticsRepository.create.mockImplementation((data) => data);
      mockAnalyticsRepository.save.mockImplementation((data) => Promise.resolve(data));

      await service.aggregateTemplateMetrics(testDate);

      expect(mockTemplateRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(mockAnalyticsRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should skip templates with existing analytics', async () => {
      const testDate = new Date('2024-01-15');
      const mockTemplate = {
        id: 'template-1',
        tenantId: 'tenant-1',
        name: 'test_template',
        isActive: true,
      };

      mockTemplateRepository.find.mockResolvedValue([mockTemplate]);
      mockAnalyticsRepository.findOne.mockResolvedValue({
        id: 'existing-analytics',
        templateId: 'template-1',
        date: testDate,
      });

      await service.aggregateTemplateMetrics(testDate);

      expect(mockAnalyticsRepository.save).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully for individual templates', async () => {
      const testDate = new Date('2024-01-15');
      const mockTemplates = [
        {
          id: 'template-1',
          tenantId: 'tenant-1',
          name: 'test_template',
          isActive: true,
        },
        {
          id: 'template-2',
          tenantId: 'tenant-1',
          name: 'test_template_2',
          isActive: true,
        },
      ];

      mockTemplateRepository.find.mockResolvedValue(mockTemplates);
      mockAnalyticsRepository.findOne
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error('Database error'));

      // Should not throw, should continue processing
      await expect(service.aggregateTemplateMetrics(testDate)).resolves.not.toThrow();
    });
  });

  describe('updateTemplateQualityMetrics', () => {
    it('should update template with calculated metrics', async () => {
      const templateId = 'template-1';
      const mockAnalytics = [
        {
          sendCount: 100,
          deliveredCount: 95,
          readCount: 80,
          repliedCount: 20,
        },
        {
          sendCount: 50,
          deliveredCount: 48,
          readCount: 40,
          repliedCount: 10,
        },
      ];

      mockAnalyticsRepository.find.mockResolvedValue(mockAnalytics);

      await service.updateTemplateQualityMetrics(templateId);

      expect(mockTemplateRepository.update).toHaveBeenCalledWith(
        templateId,
        expect.objectContaining({
          deliveryRate: expect.any(Number),
          readRate: expect.any(Number),
          responseRate: expect.any(Number),
        }),
      );
    });

    it('should handle templates with no analytics data', async () => {
      const templateId = 'template-1';

      mockAnalyticsRepository.find.mockResolvedValue([]);

      await service.updateTemplateQualityMetrics(templateId);

      expect(mockTemplateRepository.update).not.toHaveBeenCalled();
    });

    it('should calculate correct average rates', async () => {
      const templateId = 'template-1';
      const mockAnalytics = [
        {
          sendCount: 100,
          deliveredCount: 90,
          readCount: 70,
          repliedCount: 20,
        },
      ];

      mockAnalyticsRepository.find.mockResolvedValue(mockAnalytics);

      await service.updateTemplateQualityMetrics(templateId);

      // Delivery rate: 90/100 = 90%
      // Read rate: 70/90 = 77.78%
      // Response rate: 20/90 = 22.22%
      expect(mockTemplateRepository.update).toHaveBeenCalledWith(templateId, {
        deliveryRate: 90,
        readRate: 77.78,
        responseRate: 22.22,
      });
    });
  });

  describe('calculateTrend', () => {
    it('should calculate upward trend correctly', async () => {
      const templateId = 'template-1';
      const mockAnalytics = [
        { date: new Date('2024-01-01'), sendCount: 10, deliveryRate: 80 },
        { date: new Date('2024-01-02'), sendCount: 15, deliveryRate: 82 },
        { date: new Date('2024-01-03'), sendCount: 20, deliveryRate: 85 },
        { date: new Date('2024-01-04'), sendCount: 25, deliveryRate: 88 },
      ];

      mockAnalyticsRepository.find.mockResolvedValue(mockAnalytics);

      const result = await service.calculateTrend(templateId, 'deliveryRate', 4);

      expect(result.trend).toBe('up');
      expect(result.percentChange).toBeGreaterThan(0);
      expect(result.dataPoints).toHaveLength(4);
    });

    it('should calculate downward trend correctly', async () => {
      const templateId = 'template-1';
      const mockAnalytics = [
        { date: new Date('2024-01-01'), sendCount: 25, deliveryRate: 88 },
        { date: new Date('2024-01-02'), sendCount: 20, deliveryRate: 85 },
        { date: new Date('2024-01-03'), sendCount: 15, deliveryRate: 82 },
        { date: new Date('2024-01-04'), sendCount: 10, deliveryRate: 80 },
      ];

      mockAnalyticsRepository.find.mockResolvedValue(mockAnalytics);

      const result = await service.calculateTrend(templateId, 'usage', 4);

      expect(result.trend).toBe('down');
      expect(result.percentChange).toBeLessThan(0);
    });

    it('should return stable trend for insufficient data', async () => {
      const templateId = 'template-1';
      const mockAnalytics = [
        { date: new Date('2024-01-01'), sendCount: 10, deliveryRate: 85 },
      ];

      mockAnalyticsRepository.find.mockResolvedValue(mockAnalytics);

      const result = await service.calculateTrend(templateId, 'deliveryRate', 1);

      expect(result.trend).toBe('stable');
      expect(result.percentChange).toBe(0);
      expect(result.dataPoints).toHaveLength(0);
    });

    it('should calculate trend for different metrics', async () => {
      const templateId = 'template-1';
      const mockAnalytics = [
        {
          date: new Date('2024-01-01'),
          sendCount: 10,
          deliveryRate: 80,
          readRate: 60,
          responseRate: 15,
        },
        {
          date: new Date('2024-01-02'),
          sendCount: 15,
          deliveryRate: 85,
          readRate: 65,
          responseRate: 20,
        },
      ];

      mockAnalyticsRepository.find.mockResolvedValue(mockAnalytics);

      const deliveryTrend = await service.calculateTrend(templateId, 'deliveryRate', 2);
      const readTrend = await service.calculateTrend(templateId, 'readRate', 2);
      const responseTrend = await service.calculateTrend(templateId, 'responseRate', 2);
      const usageTrend = await service.calculateTrend(templateId, 'usage', 2);

      expect(deliveryTrend.dataPoints[0].value).toBe(80);
      expect(readTrend.dataPoints[0].value).toBe(60);
      expect(responseTrend.dataPoints[0].value).toBe(15);
      expect(usageTrend.dataPoints[0].value).toBe(10);
    });
  });

  describe('backfillAnalytics', () => {
    it('should process all dates in range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');

      mockTemplateRepository.find.mockResolvedValue([]);

      await service.backfillAnalytics(startDate, endDate);

      // Should call aggregateTemplateMetrics for each day (3 days)
      expect(mockTemplateRepository.find).toHaveBeenCalledTimes(3);
    });

    it('should handle errors during backfill', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      mockTemplateRepository.find
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Database error'));

      // Should not throw, should continue processing
      await expect(
        service.backfillAnalytics(startDate, endDate),
      ).resolves.not.toThrow();
    });
  });

  describe('cleanupOldAnalytics', () => {
    it('should delete analytics older than retention period', async () => {
      const retentionDays = 365;
      const deleteResult = { affected: 150 };

      mockAnalyticsRepository.delete.mockResolvedValue(deleteResult);

      await service.cleanupOldAnalytics(retentionDays);

      expect(mockAnalyticsRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.any(Object),
        }),
      );
    });

    it('should handle cleanup with no records to delete', async () => {
      const retentionDays = 365;
      const deleteResult = { affected: 0 };

      mockAnalyticsRepository.delete.mockResolvedValue(deleteResult);

      await service.cleanupOldAnalytics(retentionDays);

      expect(mockAnalyticsRepository.delete).toHaveBeenCalled();
    });
  });

  describe('getAggregationStatus', () => {
    it('should return aggregation status with records', async () => {
      const newestRecord = {
        date: new Date('2024-01-15'),
      };
      const oldestRecord = {
        date: new Date('2024-01-01'),
      };

      mockAnalyticsRepository.find
        .mockResolvedValueOnce([newestRecord])
        .mockResolvedValueOnce([oldestRecord]);
      mockAnalyticsRepository.count.mockResolvedValue(100);

      const status = await service.getAggregationStatus();

      expect(status.lastAggregationDate).toEqual(newestRecord.date);
      expect(status.totalRecords).toBe(100);
      expect(status.oldestRecord).toEqual(oldestRecord.date);
      expect(status.newestRecord).toEqual(newestRecord.date);
    });

    it('should return null dates when no records exist', async () => {
      mockAnalyticsRepository.find.mockResolvedValue([]);
      mockAnalyticsRepository.count.mockResolvedValue(0);

      const status = await service.getAggregationStatus();

      expect(status.lastAggregationDate).toBeNull();
      expect(status.totalRecords).toBe(0);
      expect(status.oldestRecord).toBeNull();
      expect(status.newestRecord).toBeNull();
    });
  });

  describe('triggerManualAggregation', () => {
    it('should trigger aggregation for specific date', async () => {
      const testDate = new Date('2024-01-15');

      mockTemplateRepository.find.mockResolvedValue([]);

      await service.triggerManualAggregation(testDate);

      expect(mockTemplateRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });
  });
});
