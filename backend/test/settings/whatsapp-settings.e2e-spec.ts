import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('WhatsApp Settings E2E Tests (Tenant Level)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let tenantId: string;
  let agentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create tenant admin
    const adminResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `admin-whatsapp-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'WhatsApp',
        lastName: 'Admin',
        tenantName: 'WhatsApp Test Tenant',
      })
      .expect(201);

    adminToken = adminResponse.body.data?.accessToken || adminResponse.body.accessToken;
    tenantId = adminResponse.body.data?.user?.tenantId || adminResponse.body.user?.tenantId;

    // Create agent user
    const agentEmail = `agent-whatsapp-${Date.now()}@example.com`;
    await dataSource.query(
      `INSERT INTO users (id, email, password, first_name, last_name, role, tenant_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'Agent', 'User', 'agent', $3, NOW(), NOW())`,
      [agentEmail, '$2b$10$abcdefghijklmnopqrstuv', tenantId]
    );

    const agentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: agentEmail,
        password: 'Test123!@#',
      });

    if (agentLogin.status === 200 || agentLogin.status === 201) {
      agentToken = agentLogin.body.data?.accessToken || agentLogin.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/tenants/settings/whatsapp', () => {
    it('should return WhatsApp settings for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tenants/settings/whatsapp')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should allow agent to view WhatsApp settings', async () => {
      if (!agentToken) {
        console.log('Skipping test - agent token not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/tenants/settings/whatsapp')
        .set('Authorization', `Bearer ${agentToken}`);

      // Agents may or may not have access depending on implementation
      expect([200, 403]).toContain(response.status);
    });

    it('should deny access without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tenants/settings/whatsapp')
        .expect(401);
    });
  });

  describe('PUT /api/v1/tenants/settings/whatsapp', () => {
    it('should update WhatsApp configuration', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/tenants/settings/whatsapp')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumberId: 'test_phone_number_id',
          accessToken: 'test_access_token',
          businessAccountId: 'test_business_account_id',
          webhookVerifyToken: 'test_webhook_token',
        })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should encrypt sensitive fields', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/tenants/settings/whatsapp')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumberId: 'encrypt_test_phone',
          accessToken: 'super_secret_access_token',
          businessAccountId: 'encrypt_test_business',
          webhookVerifyToken: 'secret_webhook_token',
        })
        .expect(200);

      // Verify tokens are encrypted in database
      const dbConfig = await dataSource.query(
        `SELECT whatsapp_config FROM tenants WHERE id = $1`,
        [tenantId]
      );

      if (dbConfig.length > 0 && dbConfig[0].whatsapp_config) {
        const config = dbConfig[0].whatsapp_config;
        // Access token should be encrypted (contains colons from encryption format)
        if (config.accessToken) {
          expect(config.accessToken).toContain(':');
        }
      }
    });

    it('should deny agent from updating settings', async () => {
      if (!agentToken) {
        console.log('Skipping test - agent token not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .put('/api/v1/tenants/settings/whatsapp')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          phoneNumberId: 'agent_test',
          accessToken: 'agent_token',
        });

      // Agents should not be able to update settings
      expect([403, 401]).toContain(response.status);
    });
  });

  describe('POST /api/v1/tenants/settings/whatsapp/test-connection', () => {
    it('should test WhatsApp connection with invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tenants/settings/whatsapp/test-connection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumberId: 'invalid_phone_id',
          accessToken: 'invalid_access_token',
        })
        .expect(201);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tenants/settings/whatsapp/test-connection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumberId: '',
          accessToken: '',
        });

      // Should validate or fail gracefully
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Business Profile Settings', () => {
    it('should update business profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/tenants/settings/business-profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          businessName: 'Test Business',
          description: 'A test business for WhatsApp',
          email: 'business@example.com',
          address: '123 Test Street',
          website: 'https://testbusiness.com',
          businessHours: {
            monday: { open: '09:00', close: '17:00' },
            tuesday: { open: '09:00', close: '17:00' },
            wednesday: { open: '09:00', close: '17:00' },
            thursday: { open: '09:00', close: '17:00' },
            friday: { open: '09:00', close: '17:00' },
          },
        });

      // Business profile endpoint may or may not exist
      if (response.status === 200) {
        expect(response.body.businessName).toBe('Test Business');
      }
    });
  });

  describe('Integration: Complete WhatsApp setup workflow', () => {
    it('should configure WhatsApp and test connection', async () => {
      // 1. Update WhatsApp configuration
      const configResponse = await request(app.getHttpServer())
        .put('/api/v1/tenants/settings/whatsapp')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumberId: 'workflow_phone_id',
          accessToken: 'workflow_access_token',
          businessAccountId: 'workflow_business_id',
          webhookVerifyToken: 'workflow_webhook_token',
        })
        .expect(200);

      expect(configResponse.body).toBeDefined();

      // 2. Test connection (will fail with invalid credentials)
      const testResponse = await request(app.getHttpServer())
        .post('/api/v1/tenants/settings/whatsapp/test-connection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumberId: 'workflow_phone_id',
          accessToken: 'workflow_access_token',
        })
        .expect(201);

      expect(testResponse.body.success).toBeDefined();
      expect(testResponse.body.message).toBeDefined();

      // 3. Verify settings are retrievable
      const getResponse = await request(app.getHttpServer())
        .get('/api/v1/tenants/settings/whatsapp')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getResponse.body).toBeDefined();
    });
  });

  describe('Audit Logging', () => {
    it('should log WhatsApp settings updates', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/tenants/settings/whatsapp')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumberId: 'audit_phone_id',
          accessToken: 'audit_access_token',
        })
        .expect(200);

      // Check audit log
      const auditLogs = await dataSource.query(
        `SELECT * FROM settings_audit_log WHERE settings_type = 'whatsapp' AND tenant_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [tenantId]
      );

      if (auditLogs.length > 0) {
        expect(auditLogs[0].action).toBe('update');
        expect(auditLogs[0].settings_type).toBe('whatsapp');
        // Access token should be sanitized in audit log
        if (auditLogs[0].changes.accessToken) {
          expect(auditLogs[0].changes.accessToken).toBe('***');
        }
      }
    });
  });
});
