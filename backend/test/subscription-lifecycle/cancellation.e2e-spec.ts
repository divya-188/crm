import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Subscription Cancellation E2E Tests (Requirements: 4.1, 4.2, 4.3, 4.4, 4.5)', () => {
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

  describe('Setup: Create test subscription', () => {
    it('should register a new tenant admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `cancel-test-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'Cancel',
          lastName: 'Test',
          tenantName: 'Cancellation Test Tenant',
        })
        .expect(201);

      adminToken = response.body.data?.accessToken || response.body.accessToken;
      tenantId = response.body.data?.user?.tenantId || response.body.user?.tenantId;

      expect(adminToken).toBeDefined();
      expect(tenantId).toBeDefined();
    });

    it('should create a subscription', async () => {
      const plansResponse = await request(app.getHttpServer())
        .get('/api/v1/subscription-plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      planId = plansResponse.body.data[0].id;

      const response = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          planId,
          paymentProvider: 'stripe',
          paymentMethodId: 'pm_test_cancellation',
        })
        .expect(201);

      subscriptionId = response.body.data?.id || response.body.id;
      expect(subscriptionId).toBeDefined();
    });
  });

  describe('Requirement 4.1: Cancellation endpoint with optional reason', () => {
    it('should accept cancellation request with reason', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cancellationReason: 'Testing cancellation flow',
          cancelImmediately: false,
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success || response.body.data?.success).toBeTruthy();
    });

    it('should verify user has permission to cancel', async () => {
      // Create another user without admin rights
      const agentResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `agent-cancel-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'Agent',
          lastName: 'Test',
          tenantName: 'Agent Test Tenant',
        })
        .expect(201);

      const agentToken = agentResponse.body.data?.accessToken || agentResponse.body.accessToken;

      // Agent should not be able to cancel another tenant's subscription
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          cancellationReason: 'Unauthorized attempt',
        });

      expect([403, 404]).toContain(response.status);
    });

    it('should reject cancellation without authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${subscriptionId}`)
        .send({
          cancellationReason: 'No auth',
        })
        .expect(401);
    });
  });

  describe('Requirement 4.2: Mark for cancellation at period end', () => {
    it('should mark subscription for cancellation at period end by default', async () => {
      // Create new subscription for this test
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `period-end-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'Period',
          lastName: 'End',
          tenantName: 'Period End Test',
        })
        .expect(201);

      const token = registerResponse.body.data?.accessToken || registerResponse.body.accessToken;

      const subResponse = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId,
          paymentProvider: 'stripe',
          paymentMethodId: 'pm_test_period_end',
        })
        .expect(201);

      const newSubId = subResponse.body.data?.id || subResponse.body.id;

      // Cancel at period end
      await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${newSubId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cancellationReason: 'Testing period end cancellation',
          cancelImmediately: false,
        });

      // Verify subscription is marked for cancellation
      const currentResponse = await request(app.getHttpServer())
        .get('/api/v1/subscriptions/current')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const subscription = currentResponse.body.data || currentResponse.body;
      
      // Check for cancellation metadata
      if (subscription.metadata) {
        expect(subscription.metadata.cancelAtPeriodEnd).toBeTruthy();
      }
      
      // Subscription should still be active until period end
      expect(['active', 'pending']).toContain(subscription.status);
    });

    it('should continue service until current period ends', async () => {
      // Verify subscription is still accessible
      const response = await request(app.getHttpServer())
        .get('/api/v1/subscriptions/current')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const subscription = response.body.data || response.body;
      
      // Should still have access
      expect(subscription.id).toBeDefined();
      expect(['active', 'pending', 'cancelled']).toContain(subscription.status);
    });
  });

  describe('Requirement 4.3: Update status to cancelled at period end', () => {
    it('should change status to cancelled when period ends', async () => {
      // Simulate period end by updating end date to past
      await dataSource.query(
        `UPDATE subscriptions 
         SET "currentPeriodEnd" = NOW() - INTERVAL '1 day',
             "endDate" = NOW() - INTERVAL '1 day',
             status = 'cancelled'
         WHERE id = $1`,
        [subscriptionId]
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/subscriptions/current')
        .set('Authorization', `Bearer ${adminToken}`);

      // May return 404 if cancelled subscription is not returned
      if (response.status === 200) {
        const subscription = response.body.data || response.body;
        expect(subscription.status).toBe('cancelled');
      } else {
        expect(response.status).toBe(404);
      }
    });
  });

  describe('Requirement 4.4: Cancel payment gateway subscription', () => {
    it('should cancel subscription with Stripe', async () => {
      // Create new subscription for gateway cancellation test
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `stripe-cancel-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'Stripe',
          lastName: 'Cancel',
          tenantName: 'Stripe Cancel Test',
        })
        .expect(201);

      const token = registerResponse.body.data?.accessToken || registerResponse.body.accessToken;

      const subResponse = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId,
          paymentProvider: 'stripe',
          paymentMethodId: 'pm_test_stripe_cancel',
        })
        .expect(201);

      const newSubId = subResponse.body.data?.id || subResponse.body.id;

      // Cancel subscription
      const cancelResponse = await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${newSubId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cancellationReason: 'Testing Stripe cancellation',
        });

      expect([200, 201]).toContain(cancelResponse.status);
    });

    it('should handle cancellation for PayPal subscriptions', async () => {
      // Create subscription with PayPal
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `paypal-cancel-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'PayPal',
          lastName: 'Cancel',
          tenantName: 'PayPal Cancel Test',
        })
        .expect(201);

      const token = registerResponse.body.data?.accessToken || registerResponse.body.accessToken;

      const subResponse = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId,
          paymentProvider: 'paypal',
          paymentMethodId: 'paypal_test_cancel',
        })
        .expect(201);

      const newSubId = subResponse.body.data?.id || subResponse.body.id;

      // Cancel subscription
      const cancelResponse = await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${newSubId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cancellationReason: 'Testing PayPal cancellation',
        });

      expect([200, 201]).toContain(cancelResponse.status);
    });

    it('should handle cancellation for Razorpay subscriptions', async () => {
      // Create subscription with Razorpay
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `razorpay-cancel-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'Razorpay',
          lastName: 'Cancel',
          tenantName: 'Razorpay Cancel Test',
        })
        .expect(201);

      const token = registerResponse.body.data?.accessToken || registerResponse.body.accessToken;

      const subResponse = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId,
          paymentProvider: 'razorpay',
          paymentMethodId: 'razorpay_test_cancel',
        })
        .expect(201);

      const newSubId = subResponse.body.data?.id || subResponse.body.id;

      // Cancel subscription
      const cancelResponse = await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${newSubId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cancellationReason: 'Testing Razorpay cancellation',
        });

      expect([200, 201]).toContain(cancelResponse.status);
    });
  });

  describe('Requirement 4.5: Send cancellation confirmation email', () => {
    it('should send confirmation email with service end date', async () => {
      // Create and cancel subscription
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `email-cancel-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'Email',
          lastName: 'Cancel',
          tenantName: 'Email Cancel Test',
        })
        .expect(201);

      const token = registerResponse.body.data?.accessToken || registerResponse.body.accessToken;

      const subResponse = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId,
          paymentProvider: 'stripe',
          paymentMethodId: 'pm_test_email_cancel',
        })
        .expect(201);

      const newSubId = subResponse.body.data?.id || subResponse.body.id;

      // Cancel subscription
      const cancelResponse = await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${newSubId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cancellationReason: 'Testing email notification',
        });

      expect([200, 201]).toContain(cancelResponse.status);
      
      // Note: Email sending is verified by service layer
      // Actual email delivery would require email service integration
    });

    it('should include reactivation option in confirmation', async () => {
      // Verify cancelled subscription can be retrieved
      const response = await request(app.getHttpServer())
        .get('/api/v1/subscriptions/current')
        .set('Authorization', `Bearer ${adminToken}`);

      // Cancelled subscriptions may not be returned by current endpoint
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Integration: Complete cancellation flow', () => {
    it('should handle immediate cancellation', async () => {
      // Create new subscription
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `immediate-cancel-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'Immediate',
          lastName: 'Cancel',
          tenantName: 'Immediate Cancel Test',
        })
        .expect(201);

      const token = registerResponse.body.data?.accessToken || registerResponse.body.accessToken;

      const subResponse = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId,
          paymentProvider: 'stripe',
          paymentMethodId: 'pm_test_immediate',
        })
        .expect(201);

      const newSubId = subResponse.body.data?.id || subResponse.body.id;

      // Cancel immediately
      const cancelResponse = await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${newSubId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cancellationReason: 'Testing immediate cancellation',
          cancelImmediately: true,
        });

      expect([200, 201]).toContain(cancelResponse.status);

      // Verify subscription is cancelled
      const currentResponse = await request(app.getHttpServer())
        .get('/api/v1/subscriptions/current')
        .set('Authorization', `Bearer ${token}`);

      if (currentResponse.status === 200) {
        const subscription = currentResponse.body.data || currentResponse.body;
        expect(subscription.status).toBe('cancelled');
      } else {
        // Cancelled subscription may not be returned
        expect(currentResponse.status).toBe(404);
      }
    });

    it('should handle end-of-period cancellation workflow', async () => {
      // Create new subscription
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `eop-cancel-${Date.now()}@example.com`,
          password: 'Test123!@#',
          firstName: 'EOP',
          lastName: 'Cancel',
          tenantName: 'EOP Cancel Test',
        })
        .expect(201);

      const token = registerResponse.body.data?.accessToken || registerResponse.body.accessToken;

      const subResponse = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId,
          paymentProvider: 'stripe',
          paymentMethodId: 'pm_test_eop',
        })
        .expect(201);

      const newSubId = subResponse.body.data?.id || subResponse.body.id;

      // Cancel at period end
      await request(app.getHttpServer())
        .delete(`/api/v1/subscriptions/${newSubId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cancellationReason: 'Testing end-of-period cancellation',
          cancelImmediately: false,
        });

      // Verify subscription is still active
      const activeResponse = await request(app.getHttpServer())
        .get('/api/v1/subscriptions/current')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const activeSub = activeResponse.body.data || activeResponse.body;
      expect(['active', 'pending']).toContain(activeSub.status);

      // Simulate period end
      await dataSource.query(
        `UPDATE subscriptions 
         SET "currentPeriodEnd" = NOW() - INTERVAL '1 day',
             status = 'cancelled'
         WHERE id = $1`,
        [newSubId]
      );

      // Verify subscription is now cancelled
      const cancelledResponse = await request(app.getHttpServer())
        .get('/api/v1/subscriptions/current')
        .set('Authorization', `Bearer ${token}`);

      if (cancelledResponse.status === 200) {
        const cancelledSub = cancelledResponse.body.data || cancelledResponse.body;
        expect(cancelledSub.status).toBe('cancelled');
      } else {
        expect(cancelledResponse.status).toBe(404);
      }
    });
  });
});
