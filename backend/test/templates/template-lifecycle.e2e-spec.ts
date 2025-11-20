import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Template Lifecycle E2E Tests
 * 
 * This test suite covers the complete template lifecycle:
 * 1. Template creation flow
 * 2. Submission and approval workflow
 * 3. Template usage in messaging
 * 4. Template analytics tracking
 * 
 * Requirements: All requirements from the WhatsApp Templates Enhancement spec
 */
describe('Template Lifecycle E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let tenantId: string;
  let userId: string;

  // Template IDs for different stages
  let draftTemplateId: string;
  let submittedTemplateId: string;
  let approvedTemplateId: string;
  let rejectedTemplateId: string;

  const createValidTemplate = (suffix: string) => ({
    name: `e2e_template_${suffix}_${Date.now()}`,
    displayName: `E2E Template ${suffix}`,
    category: 'TRANSACTIONAL',
    language: 'en_US',
    description: 'End-to-end test template',
    components: {
      header: {
        type: 'TEXT',
        text: 'Order Confirmation',
      },
      body: {
        text: 'Hello {{1}}, your order {{2}} has been confirmed. Total: {{3}}',
        placeholders: [
          { index: 1, example: 'John Doe' },
          { index: 2, example: '#ORD-12345' },
          { index: 3, example: '$99.99' },
        ],
      },
      footer: {
        text: 'Reply STOP to unsubscribe',
      },
      buttons: [
        {
          type: 'URL',
          text: 'Track Order',
          url: 'https://example.com/track/{{1}}',
        },
        {
          type: 'PHONE_NUMBER',
          text: 'Call Support',
          phoneNumber: '+1234567890',
        },
      ],
    },
    sampleValues: {
      '1': 'John Doe',
      '2': '#ORD-12345',
      '3': '$99.99',
    },
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create test tenant and admin user
    const adminResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `template-lifecycle-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Template',
        lastName: 'Tester',
        tenantName: 'Template Lifecycle Test Tenant',
      })
      .expect(201);

    adminToken = adminResponse.body.data?.accessToken || adminResponse.body.accessToken;
    tenantId = adminResponse.body.data?.user?.tenantId || adminResponse.body.user?.tenantId;
    userId = adminResponse.body.data?.user?.id || adminResponse.body.user?.id;

    expect(adminToken).toBeDefined();
    expect(tenantId).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== PHASE 1: Template Creation Flow ====================

  describe('Phase 1: Complete Template Creation Flow', () => {
    it('should create a draft template with all components', async () => {
      const templateData = createValidTemplate('draft');
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(templateData.name);
      expect(response.body.status).toBe('draft');
      expect(response.body.qualityScore).toBeDefined();
      expect(response.body.qualityScore).toBeGreaterThan(0);
      
      // Verify all components are saved
      expect(response.body.components.header).toBeDefined();
      expect(response.body.components.body).toBeDefined();
      expect(response.body.components.footer).toBeDefined();
      expect(response.body.components.buttons).toBeDefined();
      expect(response.body.components.buttons.length).toBe(2);

      draftTemplateId = response.body.id;
    });

    it('should validate template before creation', async () => {
      const invalidTemplate = createValidTemplate('invalid');
      invalidTemplate.name = 'Invalid Name With Spaces!';
      
      await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidTemplate)
        .expect(400);
    });

    it('should generate template preview', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${draftTemplateId}/preview`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          placeholderValues: JSON.stringify({
            '1': 'Jane Smith',
            '2': '#ORD-67890',
            '3': '$149.99',
          }),
        })
        .expect(200);

      expect(response.body.preview).toBeDefined();
      expect(response.body.preview).toContain('Jane Smith');
      expect(response.body.preview).toContain('#ORD-67890');
      expect(response.body.preview).toContain('$149.99');
      expect(response.body.renderedComponents).toBeDefined();
    });

    it('should update template and maintain version', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/templates/${draftTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description for lifecycle test',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated description for lifecycle test');
      expect(response.body.version).toBe(1);
    });

    it('should duplicate template successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/templates/${draftTemplateId}/duplicate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newName: `e2e_template_duplicated_${Date.now()}`,
        })
        .expect(201);

      expect(response.body.id).not.toBe(draftTemplateId);
      expect(response.body.status).toBe('draft');
      expect(response.body.components).toEqual(expect.objectContaining({
        body: expect.any(Object),
        header: expect.any(Object),
      }));
    });
  });

  // ==================== PHASE 2: Submission and Approval Workflow ====================

  describe('Phase 2: Template Submission and Approval Workflow', () => {
    beforeAll(async () => {
      // Create a template for submission testing
      const templateData = createValidTemplate('submission');
      const response = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(201);

      submittedTemplateId = response.body.id;
    });

    it('should validate template before submission', async () => {
      const validationResponse = await request(app.getHttpServer())
        .post('/api/v1/templates/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createValidTemplate('validation'))
        .expect(200);

      expect(validationResponse.body.isValid).toBe(true);
      expect(validationResponse.body.errors).toHaveLength(0);
      expect(validationResponse.body.qualityScore).toBeDefined();
    });

    it('should submit template to Meta (mocked)', async () => {
      // Note: In real scenario, this would interact with Meta API
      // For E2E tests, we're testing the flow without actual Meta submission
      const response = await request(app.getHttpServer())
        .post(`/api/v1/templates/${submittedTemplateId}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('pending');
      expect(response.body.submittedAt).toBeDefined();
    });

    it('should track status history after submission', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${submittedTemplateId}/status-history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.history).toBeDefined();
      expect(Array.isArray(response.body.history)).toBe(true);
      expect(response.body.history.length).toBeGreaterThan(0);
      
      const latestStatus = response.body.history[0];
      expect(latestStatus.toStatus).toBe('pending');
    });

    it('should manually refresh template status', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/templates/${submittedTemplateId}/refresh-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBeDefined();
    });

    it('should handle template approval', async () => {
      // Create and approve a template for testing
      const templateData = createValidTemplate('approved');
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(201);

      approvedTemplateId = createResponse.body.id;

      // Simulate approval (in real scenario, this comes from Meta webhook)
      await dataSource.query(
        `UPDATE templates SET status = 'approved', approval_status = 'APPROVED', approved_at = NOW() WHERE id = $1`,
        [approvedTemplateId]
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${approvedTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('approved');
      expect(response.body.approvedAt).toBeDefined();
    });

    it('should handle template rejection with reason', async () => {
      // Create and reject a template for testing
      const templateData = createValidTemplate('rejected');
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(201);

      rejectedTemplateId = createResponse.body.id;

      // Simulate rejection
      await dataSource.query(
        `UPDATE templates SET status = 'rejected', approval_status = 'REJECTED', 
         rejection_reason = 'Template content violates policy', rejected_at = NOW() WHERE id = $1`,
        [rejectedTemplateId]
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${rejectedTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('rejected');
      expect(response.body.rejectionReason).toBeDefined();
      expect(response.body.rejectedAt).toBeDefined();
    });

    it('should allow editing rejected template for resubmission', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/templates/${rejectedTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          components: {
            body: {
              text: 'Updated compliant body text with {{1}}',
              placeholders: [{ index: 1, example: 'value' }],
            },
          },
        })
        .expect(200);

      expect(response.body.status).toBe('draft');
    });

    it('should prevent deletion of approved templates', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/templates/${approvedTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  // ==================== PHASE 3: Template Usage in Messaging ====================

  describe('Phase 3: Template Usage in Messaging', () => {
    it('should only allow sending with approved templates', async () => {
      // Try to send with draft template - should fail
      const draftResponse = await request(app.getHttpServer())
        .post(`/api/v1/templates/${draftTemplateId}/send`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+1234567890',
          placeholderValues: {
            '1': 'John',
            '2': '#12345',
            '3': '$99.99',
          },
        })
        .expect(400);

      expect(draftResponse.body.message).toContain('approved');
    });

    it('should send test message with approved template', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/templates/${approvedTemplateId}/test`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+1234567890',
          placeholderValues: {
            '1': 'Test User',
            '2': '#TEST-001',
            '3': '$50.00',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.testSendId).toBeDefined();
    });

    it('should track test send history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${approvedTemplateId}/test-history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.testSends).toBeDefined();
      expect(Array.isArray(response.body.testSends)).toBe(true);
      expect(response.body.testSends.length).toBeGreaterThan(0);
    });

    it('should validate all placeholders are provided before sending', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/templates/${approvedTemplateId}/test`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+1234567890',
          placeholderValues: {
            '1': 'Test User',
            // Missing placeholders 2 and 3
          },
        })
        .expect(400);

      expect(response.body.message).toContain('placeholder');
    });

    it('should track template usage count', async () => {
      const beforeResponse = await request(app.getHttpServer())
        .get(`/api/v1/templates/${approvedTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const usageCountBefore = beforeResponse.body.usageCount || 0;

      // Send a test message
      await request(app.getHttpServer())
        .post(`/api/v1/templates/${approvedTemplateId}/test`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+1234567890',
          placeholderValues: {
            '1': 'User',
            '2': '#123',
            '3': '$10',
          },
        })
        .expect(200);

      const afterResponse = await request(app.getHttpServer())
        .get(`/api/v1/templates/${approvedTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(afterResponse.body.usageCount).toBeGreaterThan(usageCountBefore);
      expect(afterResponse.body.lastUsedAt).toBeDefined();
    });

    it('should prevent using template in active campaigns when deleting', async () => {
      // This would be tested with actual campaign integration
      // For now, we test the template protection mechanism
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/templates/${approvedTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  // ==================== PHASE 4: Template Analytics ====================

  describe('Phase 4: Template Analytics Tracking', () => {
    beforeAll(async () => {
      // Seed some analytics data for testing
      await dataSource.query(
        `INSERT INTO template_usage_analytics 
         (id, template_id, tenant_id, date, send_count, delivered_count, read_count, replied_count, 
          delivery_rate, read_rate, response_rate, created_at, updated_at)
         VALUES 
         (gen_random_uuid(), $1, $2, CURRENT_DATE, 100, 95, 80, 25, 95.00, 84.21, 31.25, NOW(), NOW()),
         (gen_random_uuid(), $1, $2, CURRENT_DATE - INTERVAL '1 day', 80, 75, 60, 20, 93.75, 80.00, 33.33, NOW(), NOW()),
         (gen_random_uuid(), $1, $2, CURRENT_DATE - INTERVAL '2 days', 120, 110, 90, 30, 91.67, 81.82, 33.33, NOW(), NOW())`,
        [approvedTemplateId, tenantId]
      );
    });

    it('should retrieve template analytics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${approvedTemplateId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body.templateId).toBe(approvedTemplateId);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.totalSent).toBeGreaterThan(0);
      expect(response.body.metrics.deliveryRate).toBeDefined();
      expect(response.body.metrics.readRate).toBeDefined();
      expect(response.body.metrics.responseRate).toBeDefined();
    });

    it('should retrieve analytics summary for all templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body.totalSent).toBeDefined();
      expect(response.body.avgDeliveryRate).toBeDefined();
      expect(response.body.avgReadRate).toBeDefined();
      expect(response.body.avgResponseRate).toBeDefined();
      expect(response.body.topTemplates).toBeDefined();
      expect(Array.isArray(response.body.topTemplates)).toBe(true);
    });

    it('should identify top performing templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates/analytics/top-templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          limit: 5,
          metric: 'responseRate',
        })
        .expect(200);

      expect(response.body.templates).toBeDefined();
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should identify low performing templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates/analytics/low-performing')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          threshold: 50,
          metric: 'deliveryRate',
        })
        .expect(200);

      expect(response.body.templates).toBeDefined();
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should track analytics trends over time', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${approvedTemplateId}/analytics/trends`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          interval: 'daily',
        })
        .expect(200);

      expect(response.body.trends).toBeDefined();
      expect(Array.isArray(response.body.trends)).toBe(true);
      expect(response.body.trends.length).toBeGreaterThan(0);
    });

    it('should export analytics data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${approvedTemplateId}/analytics/export`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          format: 'json',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should calculate performance metrics correctly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${approvedTemplateId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const metrics = response.body.metrics;
      
      // Verify rate calculations
      if (metrics.totalSent > 0) {
        expect(metrics.deliveryRate).toBeGreaterThanOrEqual(0);
        expect(metrics.deliveryRate).toBeLessThanOrEqual(100);
        expect(metrics.readRate).toBeGreaterThanOrEqual(0);
        expect(metrics.readRate).toBeLessThanOrEqual(100);
        expect(metrics.responseRate).toBeGreaterThanOrEqual(0);
        expect(metrics.responseRate).toBeLessThanOrEqual(100);
      }
    });
  });

  // ==================== PHASE 5: Complete Lifecycle Integration ====================

  describe('Phase 5: Complete Template Lifecycle Integration', () => {
    it('should complete full template lifecycle from creation to analytics', async () => {
      // Step 1: Create template
      const templateData = createValidTemplate('full_lifecycle');
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(201);

      const lifecycleTemplateId = createResponse.body.id;
      expect(createResponse.body.status).toBe('draft');

      // Step 2: Validate template
      const validateResponse = await request(app.getHttpServer())
        .post('/api/v1/templates/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(200);

      expect(validateResponse.body.isValid).toBe(true);

      // Step 3: Preview template
      const previewResponse = await request(app.getHttpServer())
        .get(`/api/v1/templates/${lifecycleTemplateId}/preview`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(previewResponse.body.preview).toBeDefined();

      // Step 4: Submit template (mocked)
      const submitResponse = await request(app.getHttpServer())
        .post(`/api/v1/templates/${lifecycleTemplateId}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(submitResponse.body.status).toBe('pending');

      // Step 5: Simulate approval
      await dataSource.query(
        `UPDATE templates SET status = 'approved', approval_status = 'APPROVED', approved_at = NOW() WHERE id = $1`,
        [lifecycleTemplateId]
      );

      // Step 6: Verify approved status
      const approvedResponse = await request(app.getHttpServer())
        .get(`/api/v1/templates/${lifecycleTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(approvedResponse.body.status).toBe('approved');

      // Step 7: Send test message
      const testResponse = await request(app.getHttpServer())
        .post(`/api/v1/templates/${lifecycleTemplateId}/test`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+1234567890',
          placeholderValues: {
            '1': 'Lifecycle Test',
            '2': '#LIFE-001',
            '3': '$100.00',
          },
        })
        .expect(200);

      expect(testResponse.body.success).toBe(true);

      // Step 8: Verify usage tracking
      const usageResponse = await request(app.getHttpServer())
        .get(`/api/v1/templates/${lifecycleTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(usageResponse.body.usageCount).toBeGreaterThan(0);
      expect(usageResponse.body.lastUsedAt).toBeDefined();

      // Step 9: Create new version
      const versionResponse = await request(app.getHttpServer())
        .patch(`/api/v1/templates/${lifecycleTemplateId}?createNewVersion=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          components: {
            body: {
              text: 'Updated version with {{1}}',
              placeholders: [{ index: 1, example: 'value' }],
            },
          },
        })
        .expect(200);

      expect(versionResponse.body.version).toBe(2);

      // Step 10: Verify version history
      const historyResponse = await request(app.getHttpServer())
        .get(`/api/v1/templates/${lifecycleTemplateId}/versions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(historyResponse.body.versions).toBeDefined();
      expect(historyResponse.body.versions.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle concurrent template operations', async () => {
      const templateData = createValidTemplate('concurrent');
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(201);

      const concurrentTemplateId = createResponse.body.id;

      // Perform multiple operations concurrently
      const operations = [
        request(app.getHttpServer())
          .get(`/api/v1/templates/${concurrentTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`),
        request(app.getHttpServer())
          .get(`/api/v1/templates/${concurrentTemplateId}/preview`)
          .set('Authorization', `Bearer ${adminToken}`),
        request(app.getHttpServer())
          .patch(`/api/v1/templates/${concurrentTemplateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ description: 'Concurrent update' }),
      ];

      const results = await Promise.all(operations);
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.status).toBeLessThan(400);
      });
    });

    it('should maintain data consistency across operations', async () => {
      const templateData = createValidTemplate('consistency');
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(201);

      const consistencyTemplateId = createResponse.body.id;

      // Update template
      await request(app.getHttpServer())
        .patch(`/api/v1/templates/${consistencyTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayName: 'Consistency Test Updated',
        })
        .expect(200);

      // Verify update persisted
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/templates/${consistencyTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getResponse.body.displayName).toBe('Consistency Test Updated');

      // Verify in list
      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'Consistency Test Updated' })
        .expect(200);

      const foundTemplate = listResponse.body.data.find(
        (t: any) => t.id === consistencyTemplateId
      );
      expect(foundTemplate).toBeDefined();
      expect(foundTemplate.displayName).toBe('Consistency Test Updated');
    });
  });

  // ==================== PHASE 6: Error Handling and Edge Cases ====================

  describe('Phase 6: Error Handling and Edge Cases', () => {
    it('should handle invalid template ID gracefully', async () => {
      const invalidId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .get(`/api/v1/templates/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should prevent unauthorized access to templates', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/templates/${draftTemplateId}`)
        .expect(401);
    });

    it('should handle malformed request data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'test',
          // Missing required fields
        })
        .expect(400);
    });

    it('should handle database errors gracefully', async () => {
      // Try to create template with duplicate name
      const templateData = createValidTemplate('duplicate');
      
      await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(201);

      // Try to create again with same name
      await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(409);
    });

    it('should validate rate limits for template operations', async () => {
      // This would test rate limiting if implemented
      // For now, we verify the endpoint handles multiple requests
      const requests = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/v1/templates')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const results = await Promise.all(requests);
      results.forEach(result => {
        expect(result.status).toBeLessThan(500);
      });
    });
  });
});
