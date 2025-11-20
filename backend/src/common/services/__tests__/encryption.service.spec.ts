import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ENCRYPTION_KEY') {
                return 'test-encryption-key-for-testing-purposes-only';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const plainText = 'my-secret-api-key';
      const encrypted = service.encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);
      expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:encryptedData
    });

    it('should produce different encrypted values for same input', () => {
      const plainText = 'my-secret-api-key';
      const encrypted1 = service.encrypt(plainText);
      const encrypted2 = service.encrypt(plainText);

      expect(encrypted1).not.toBe(encrypted2); // Different IVs
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const plainText = 'my-secret-api-key';
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should handle special characters', () => {
      const plainText = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should handle unicode characters', () => {
      const plainText = 'Hello 世界 🌍';
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => service.decrypt('invalid-data')).toThrow();
    });

    it('should throw error for tampered data', () => {
      const plainText = 'my-secret-api-key';
      const encrypted = service.encrypt(plainText);
      const tampered = encrypted.replace('a', 'b');

      expect(() => service.decrypt(tampered)).toThrow();
    });
  });

  describe('hash', () => {
    it('should hash a string', () => {
      const text = 'password123';
      const hashed = service.hash(text);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(text);
      expect(hashed).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should produce same hash for same input', () => {
      const text = 'password123';
      const hash1 = service.hash(text);
      const hash2 = service.hash(text);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = service.hash('password123');
      const hash2 = service.hash('password124');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compareHash', () => {
    it('should return true for matching hash', () => {
      const text = 'password123';
      const hashed = service.hash(text);

      expect(service.compareHash(text, hashed)).toBe(true);
    });

    it('should return false for non-matching hash', () => {
      const text = 'password123';
      const hashed = service.hash(text);

      expect(service.compareHash('wrong-password', hashed)).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a random token', () => {
      const token = service.generateToken();

      expect(token).toBeDefined();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    it('should generate different tokens', () => {
      const token1 = service.generateToken();
      const token2 = service.generateToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate token of specified length', () => {
      const token = service.generateToken(16);

      expect(token).toHaveLength(32); // 16 bytes = 32 hex characters
    });
  });

  describe('error handling', () => {
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      const configServiceMock = {
        get: jest.fn(() => null),
      };

      expect(() => {
        new EncryptionService(configServiceMock as any);
      }).toThrow('ENCRYPTION_KEY environment variable is required');
    });
  });
});
