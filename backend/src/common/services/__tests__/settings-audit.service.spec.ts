import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsAuditService } from '../settings-audit.service';
import { SettingsAuditLog } from '../../entities/settings-audit-log.entity';

describe('SettingsAuditService', () => {
  let service: SettingsAuditService;
  let repository: jest.Mocked<Repository<SettingsAuditLog>>;

  beforeEach(async () => {
    const repositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsAuditService,
        {
          provide: getRepositoryToken(SettingsAuditLog),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<SettingsAuditService>(SettingsAuditService);
    repository = module.get(getRepositoryToken(SettingsAuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create audit log entry', async () => {
      const entry = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        settingsType: 'payment_gateway',
        action: 'update' as const,
        changes: { apiKey: { old: 'old-key', new: 'new-key' } },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        status: 'success' as const,
      };

      const mockAuditLog = { id: 'log-789', ...entry };
      repository.create.mockReturnValue(mockAuditLog as any);
      repository.save.mockResolvedValue(mockAuditLog as any);

      await service.log(entry);

      expect(repository.create).toHaveBeenCalledWith(entry);
      expect(repository.save).toHaveBeenCalledWith(mockAuditLog);
    });

    it('should not throw on error (graceful degradation)', async () => {
      repository.create.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        service.log({
          settingsType: 'test',
          action: 'update',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('getByType', () => {
    it('should return audit logs for settings type', async () => {
      const mockLogs = [
        { id: '1', settingsType: 'payment_gateway', action: 'update' },
        { id: '2', settingsType: 'payment_gateway', action: 'test' },
      ];
      repository.find.mockResolvedValue(mockLogs as any);

      const result = await service.getByType('payment_gateway', 10);

      expect(repository.find).toHaveBeenCalledWith({
        where: { settingsType: 'payment_gateway' },
        order: { createdAt: 'DESC' },
        take: 10,
        relations: ['user'],
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('calculateDiff', () => {
    it('should calculate diff between old and new values', () => {
      const oldValue = {
        apiKey: 'old-key',
        enabled: true,
        timeout: 30,
      };

      const newValue = {
        apiKey: 'new-key',
        enabled: false,
        timeout: 30,
        newField: 'value',
      };

      const diff = service.calculateDiff(oldValue, newValue);

      expect(diff).toEqual({
        apiKey: { old: 'old-key', new: 'new-key' },
        enabled: { old: true, new: false },
        newField: { old: undefined, new: 'value' },
      });
    });

    it('should detect removed fields', () => {
      const oldValue = {
        apiKey: 'key',
        removedField: 'value',
      };

      const newValue = {
        apiKey: 'key',
      };

      const diff = service.calculateDiff(oldValue, newValue);

      expect(diff).toEqual({
        removedField: { old: 'value', new: null },
      });
    });
  });

  describe('sanitize', () => {
    it('should redact sensitive fields', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        apiKey: 'sk_test_123',
        token: 'bearer_token',
        publicField: 'visible',
      };

      const sanitized = service.sanitize(data);

      expect(sanitized).toEqual({
        username: 'john',
        password: '***REDACTED***',
        apiKey: '***REDACTED***',
        token: '***REDACTED***',
        publicField: 'visible',
      });
    });

    it('should sanitize nested objects', () => {
      const data = {
        config: {
          apiKey: 'secret',
          timeout: 30,
        },
        credentials: {
          accessToken: 'token123',
          refreshToken: 'refresh456',
        },
      };

      const sanitized = service.sanitize(data);

      expect(sanitized.config.apiKey).toBe('***REDACTED***');
      expect(sanitized.config.timeout).toBe(30);
      expect(sanitized.credentials.accessToken).toBe('***REDACTED***');
      expect(sanitized.credentials.refreshToken).toBe('***REDACTED***');
    });
  });

  describe('cleanup', () => {
    it('should delete old audit logs', async () => {
      const queryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 150 }),
      };

      repository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.cleanup(90);

      expect(result).toBe(150);
      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalled();
      expect(queryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      repository.createQueryBuilder.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await service.cleanup(90);

      expect(result).toBe(0);
    });
  });
});
