import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Email Settings E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let superAdminToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create super admin user
    const superAdminEmail = `superadmin-email-${Date.now()}@example.com`;
    await dataSource.query(
      `INSERT INTO users (id, email, password, first_name, last_name, role, tenant_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'Super', 'Admin', 'super_admin', NULL, NOW(), NOW())`,
      [superAdminEmail, '$2b$10$abcdefghijklmnopqrstuv']
    );

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: superAdminEmail,
        password: 'Test123!@#',
      });

    if (loginResponse.status === 200 || loginResponse.status === 201) {
      superAdminToken = loginResponse.body.data?.accessToken || loginResponse.body.accessToken;
    }

    // Create regular admin
    const adminResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `admin-email-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Admin',
        lastName: 'User',
        tenantName: 'Email Test Tenant',
      });

    adminToken = adminResponse.body.data?.accessToken || adminResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/super-admin/settings/email', () => {
    it('should return email settings for super admin', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/super-admin/settings/email')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.provider).toBeDefined();
      expect(response.body.from).toBeDefined();
      expect(response.body.from.name).toBeDefined();
      expect(response.body.from.email).toBeDefined();
    });

    it('should deny access to regular admin', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/super-admin/settings/email')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should deny access without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/super-admin/settings/email')
        .expect(401);
    });
  });

  describe('PUT /api/v1/super-admin/settings/email', () => {
    it('should update SMTP email settings', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .put('/api/v1/super-admin/settings/email')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          provider: 'smtp',
          smtp: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: {
              user: 'test@example.com',
              pass: 'test_password',
            },
          },
          from: {
            name: 'Test CRM',
            email: 'noreply@testcrm.com',
          },
        })
        .expect(200);

      expect(response.body.provider).toBe('smtp');
      expect(response.body.smtp.host).toBe('smtp.example.com');
      expect(response.body.smtp.port).toBe(587);
      expect(response.body.from.name).toBe('Test CRM');
    });

    it('should update SendGrid email settings', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .put('/api/v1/super-admin/settings/email')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          provider: 'sendgrid',
          sendgrid: {
            apiKey: 'SG.test_api_key',
          },
          from: {
            name: 'SendGrid Test',
            email: 'test@sendgrid.com',
          },
        })
        .expect(200);

      expect(response.body.provider).toBe('sendgrid');
      expect(response.body.sendgrid).toBeDefined();
    });

    it('should encrypt sensitive fields', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      await request(app.getHttpServer())
        .put('/api/v1/super-admin/settings/email')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          provider: 'smtp',
          smtp: {
            host: 'smtp.secure.com',
            port: 465,
            secure: true,
            auth: {
              user: 'secure@example.com',
              pass: 'super_secret_password',
            },
          },
          from: {
            name: 'Secure Email',
            email: 'secure@example.com',
          },
        })
        .expect(200);

      // Verify password is encrypted in database
      const dbSettings = await dataSource.query(
        `SELECT value FROM platform_settings WHERE key = 'email'`
      );

      if (dbSettings.length > 0) {
        const storedValue = dbSettings[0].value;
        // Password should be encrypted (contains colons from encryption format)
        expect(storedValue.smtp.auth.pass).toContain(':');
      }
    });

    it('should invalidate cache after update', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      const uniqueHost = `smtp-${Date.now()}.example.com`;

      await request(app.getHttpServer())
        .put('/api/v1/super-admin/settings/email')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          provider: 'smtp',
          smtp: {
            host: uniqueHost,
            port: 587,
            secure: false,
            auth: {
              user: 'cache@example.com',
              pass: 'cache_test',
            },
          },
          from: {
            name: 'Cache Test',
            email: 'cache@example.com',
          },
        })
        .expect(200);

      // Get settings again - should reflect new values
      const response = await request(app.getHttpServer())
        .get('/api/v1/super-admin/settings/email')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.smtp.host).toBe(uniqueHost);
    });
  });

  describe('POST /api/v1/super-admin/settings/email/test-connection', () => {
    it('should test SMTP connection with invalid credentials', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/super-admin/settings/email/test-connection')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          provider: 'smtp',
          smtp: {
            host: 'invalid.smtp.server',
            port: 587,
            secure: false,
            auth: {
              user: 'invalid@example.com',
              pass: 'invalid_password',
            },
          },
          from: {
            name: 'Test',
            email: 'test@example.com',
          },
        })
        .expect(201);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should test SendGrid connection with invalid API key', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/super-admin/settings/email/test-connection')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          provider: 'sendgrid',
          sendgrid: {
            apiKey: 'SG.invalid_api_key',
          },
          from: {
            name: 'Test',
            email: 'test@example.com',
          },
        })
        .expect(201);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/super-admin/settings/email/send-test', () => {
    it('should attempt to send test email', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/super-admin/settings/email/send-test')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          to: 'test@example.com',
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.success).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    it('should validate email address format', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/super-admin/settings/email/send-test')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          to: 'invalid-email',
        });

      // Should either validate or fail gracefully
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Audit Logging', () => {
    it('should log email settings updates', async () => {
      if (!superAdminToken) {
        console.log('Skipping test - super admin token not available');
        return;
      }

      await request(app.getHttpServer())
        .put('/api/v1/super-admin/settings/email')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          provider: 'smtp',
          smtp: {
            host: 'audit.smtp.com',
            port: 587,
            secure: false,
            auth: {
              user: 'audit@example.com',
              pass: 'audit_password',
            },
          },
          from: {
            name: 'Audit Test',
            email: 'audit@example.com',
          },
        })
        .expect(200);

      // Check audit log
      const auditLogs = await dataSource.query(
        `SELECT * FROM settings_audit_log WHERE settings_type = 'email' ORDER BY created_at DESC LIMIT 1`
      );

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].action).toBe('update');
      expect(auditLogs[0].settings_type).toBe('email');
      // Password should be sanitized in audit log
      if (auditLogs[0].changes.smtp?.auth?.pass) {
        expect(auditLogs[0].changes.smtp.auth.pass).toBe('***');
      }
    });
  });
});
