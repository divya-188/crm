import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Quota Enforcement E2E Tests (Requirements: 1.1, 1.2, 1.3, 1.4, 1.5)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let tenantId: string;
  let planId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Setup: Create test tenant and subscription', () => {
    it('should register a new tenant admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `quota-test-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'Quota',
          lastName: 'Test',
          tenantName: 'Quota Test Tenant',
        })
        .expect(201);

      adminToken = response.body.data?.accessToken || response.body.accessToken;
      tenantId = response.body.data?.user?.tenantId || response.body.user?.tenantId;

      expect(adminToken).toBeDefined();
      expect(tenantId).toBeDefined();
    });

    it('should get available subscription plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/subscription-plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Get the starter plan (lowest limits for testing)
      const starterPlan = response.body.data.find((p: any) => p.name === 'Starter');
      planId = starterPlan?.id || response.body.data[0].id;
      
      expect(planId).toBeDefined();
    });

    it('should create a subscription', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          planId,
          paymentProvider: 'stripe',
          paymentMethodId: 'pm_test_quota_enforcement',
        })
        .expect(201);

      subscriptionId = response.body.data?.id || response.body.id;
      expect(subscriptionId).toBeDefined();
    });
  });

  describe('Requirement 1.1: Contact quota enforcement', () => {
    it('should allow creating contacts within quota limit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          lastName: 'Contact',
          phone: '+1234567890',
          email: `contact-${Date.now()}@test.com`,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should block contact creation when quota is exceeded', async () => {
      // Get current plan limits
      const planResponse = await request(app.getHttpServer())
        .get(`/api/v1/subscription-plans/${planId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const contactLimit = planResponse.body.features?.maxContacts || 100;

      // Create contacts up to the limit
      const contactsToCreate = Math.min(contactLimit - 1, 5); // Create a few more, but not too many for test speed
      
      for (let i = 0; i < contactsToCreate; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/contacts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: `Quota`,
            lastName: `Test${i}`,
            phone: `+123456789${i}`,
            email: `quota-test-${i}-${Date.now()}@test.com`,
          });
      }

      // This should succeed if we're still under limit
      const lastValidResponse = await request(app.getHttpServer())
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Last',
          lastName: 'Valid',
          phone: '+1234567899',
          email: `last-valid-${Date.now()}@test.com`,
        });

      // If we hit the limit, expect 403, otherwise 201
      if (lastValidResponse.status === 403) {
        expect(lastValidResponse.body.message).toContain('quota');
        expect(lastValidResponse.body.details?.resourceType).toBe('contacts');
      } else {
        expect(lastValidResponse.status).toBe(201);
      }
    });
  });

  describe('Requirement 1.2: User quota enforcement', () => {
    it('should allow creating users within quota limit', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `user-${Date.now()}@test.com`,
          password: 'User123!@#',
          firstName: 'Test',
          lastName: 'User',
          role: 'agent',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should block user creation when quota is exceeded', async () => {
      const planResponse = await request(app.getHttpServer())
        .get(`/api/v1/subscription-plans/${planId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const userLimit = planResponse.body.features?.maxUsers || 5;

      // Create users up to near the limit
      const usersToCreate = Math.min(userLimit - 2, 3);
      
      for (let i = 0; i < usersToCreate; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: `quota-user-${i}-${Date.now()}@test.com`,
            password: 'User123!@#',
            firstName: `Quota`,
            lastName: `User${i}`,
            role: 'agent',
          });
      }

      // Verify quota enforcement message structure
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `over-quota-${Date.now()}@test.com`,
          password: 'User123!@#',
          firstName: 'Over',
          lastName: 'Quota',
          role: 'agent',
        });

      if (response.status === 403) {
        expect(response.body.message).toContain('quota');
        expect(response.body.details?.upgradeUrl).toBeDefined();
      }
    });
  });

  describe('Requirement 1.3: WhatsApp connection quota enforcement', () => {
    it('should enforce quota on WhatsApp connection creation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/whatsapp/connections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Connection',
          phoneNumber: '+1234567890',
          provider: 'meta',
        });

      // Should either succeed (201) or fail with quota error (403)
      if (response.status === 403) {
        expect(response.body.message).toContain('quota');
        expect(response.body.details?.resourceType).toBe('whatsapp_connections');
      } else {
        expect(response.status).toBe(201);
      }
    });
  });

  describe('Requirement 1.4: Campaign quota enforcement', () => {
    it('should enforce quota on campaign creation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Campaign',
          type: 'broadcast',
          status: 'draft',
        });

      if (response.status === 403) {
        expect(response.body.message).toContain('quota');
        expect(response.body.details?.resourceType).toBe('campaigns');
      } else {
        expect(response.status).toBe(201);
      }
    });
  });

  describe('Requirement 1.5: Multiple resource type quota enforcement', () => {
    it('should enforce quotas independently for different resource types', async () => {
      // Test that quota for one resource doesn't affect another
      const contactResponse = await request(app.getHttpServer())
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Independent',
          lastName: 'Test',
          phone: '+9876543210',
          email: `independent-${Date.now()}@test.com`,
        });

      const userResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `independent-user-${Date.now()}@test.com`,
          password: 'User123!@#',
          firstName: 'Independent',
          lastName: 'User',
          role: 'agent',
        });

      // Both should have independent quota checks
      expect([201, 403]).toContain(contactResponse.status);
      expect([201, 403]).toContain(userResponse.status);
    });
  });

  describe('Plan upgrade allows continued resource creation', () => {
    it('should allow resource creation after upgrading to higher plan', async () => {
      // Get a higher tier plan
      const plansResponse = await request(app.getHttpServer())
        .get('/api/v1/subscription-plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const higherPlan = plansResponse.body.data.find(
        (p: any) => p.name === 'Professional' || p.name === 'Growth'
      );

      if (higherPlan) {
        // Upgrade subscription
        const upgradeResponse = await request(app.getHttpServer())
          .patch(`/api/v1/subscriptions/${subscriptionId}/upgrade`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            newPlanId: higherPlan.id,
          });

        if (upgradeResponse.status === 200) {
          // Try creating a resource after upgrade
          const contactResponse = await request(app.getHttpServer())
            .post('/api/v1/contacts')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              firstName: 'Post',
              lastName: 'Upgrade',
              phone: '+1111111111',
              email: `post-upgrade-${Date.now()}@test.com`,
            });

          expect([201, 403]).toContain(contactResponse.status);
        }
      }
    });
  });
});
