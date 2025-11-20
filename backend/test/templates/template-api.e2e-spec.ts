import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Template API E2E Tests (Requirements: All API requirements)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let tenantId: string;
  let templateId: string;
  let approvedTemplateId: string;

  const validTemplateData = {
    name: 'test_template_' + Date.now(),
    displayName: 'Test Template',
    category: 'TRANSACTIONAL',
    language: 'en_US',
    description: 'A test template for E2E testing',
    components: {
      body: {
        text: 'Hello {{1}}, your order {{2}} has been confirmed.',
        placeholders: [
          { index: 1, example: 'John' },
          { index: 2, example: '#12345' },
        ],
      },
      footer: {
        text: 'Reply STOP to unsubscribe',
      },
    },
    sampleValues: {
      '1': 'John',
      '2': '#12345',
    },
  };

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
        email: `template-admin-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Template',
        lastName: 'Admin',
        tenantName: 'Template Test Tenant',
      })
      .expect(201);

    adminToken = adminResponse.body.data?.accessToken || adminResponse.body.accessToken;
    tenantId = adminResponse.body.data?.user?.tenantId || adminResponse.body.user?.tenantId;

    expect(adminToken).toBeDefined();
    expect(tenantId).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== Template CRUD Operations ====================

  describe('POST /api/v1/templates - Create Template', () => {
    it('should create a new template with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validTemplateData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(validTemplateData.name);
      expect(response.body.category).toBe(validTemplateData.category);
      expect(response.body.status).toBe('draft');
      expect(response.body.qualityScore).toBeDefined();

      templateId = response.body.id;
    });

    it('should reject template with invalid name format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validTemplateData,
          name: 'Invalid Name With Spaces',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject template with invalid placeholder format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validTemplateData,
          name: 'invalid_placeholder_' + Date.now(),
          components: {
            body: {
              text: 'Hello {1}, invalid placeholder format',
              placeholders: [],
            },
          },
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });


    it('should reject template without required body component', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validTemplateData,
          name: 'no_body_' + Date.now(),
          components: {
            footer: { text: 'Footer only' },
          },
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should deny access without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/templates')
        .send(validTemplateData)
        .expect(401);
    });
  });

  describe('GET /api/v1/templates - List Templates', () => {
    it('should retrieve all templates for tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBeDefined();
      expect(response.body.limit).toBeDefined();
    });

    it('should filter templates by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates?status=draft')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      if (response.body.data.length > 0) {
        expect(response.body.data.every((t: any) => t.status === 'draft')).toBe(true);
      }
    });

    it('should filter templates by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates?category=TRANSACTIONAL')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      if (response.body.data.length > 0) {
        expect(response.body.data.every((t: any) => t.category === 'TRANSACTIONAL')).toBe(true);
      }
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
    });

    it('should support search functionality', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates?search=${validTemplateData.name}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should support sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates?sortBy=createdAt&sortOrder=DESC')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });


  describe('GET /api/v1/templates/:id - Get Template by ID', () => {
    it('should retrieve a specific template', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/templates/${templateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(templateId);
      expect(response.body.name).toBe(validTemplateData.name);
      expect(response.body.components).toBeDefined();
    });

    it('should return 404 for non-existent template', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/api/v1/templates/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/templates/:id - Update Template', () => {
    it('should update template fields', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/templates/${templateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayName: 'Updated Template Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.displayName).toBe('Updated Template Name');
      expect(response.body.description).toBe('Updated description');
    });

    it('should create new version when requested', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/templates/${templateId}?createNewVersion=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          components: {
            body: {
              text: 'Updated body text with {{1}}',
              placeholders: [{ index: 1, example: 'value' }],
            },
          },
        })
        .expect(200);

      expect(response.body.version).toBeGreaterThan(1);
    });
  });

  describe('POST /api/v1/templates/:id/duplicate - Duplicate Template', () => {
    it('should duplicate an existing template', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/templates/${templateId}/duplicate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newName: 'duplicated_template_' + Date.now(),
        })
        .expect(201);

      expect(response.body.id).not.toBe(templateId);
      expect(response.body.status).toBe('draft');
      expect(response.body.components).toEqual(expect.objectContaining({
        body: expect.any(Object),
      }));
    });
  });

  describe('DELETE /api/v1/templates/:id - Delete Template', () => {
    it('should delete a draft template', async () => {
      // Create a template to delete
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validTemplateData,
          name: 'to_delete_' + Date.now(),
        })
        .expect(201);

      const deleteId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/templates/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/api/v1/templates/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });


  // ==================== Template Validation ====================

  describe('POST /api/v1/templates/validate - Validate Template', () => {
    it('should validate a valid template', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/templates/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validTemplateData)
        .expect(200);

      expect(response.body.isValid).toBe(true);
      expect(response.body.errors).toBeDefined();
      expect(response.body.warnings).toBeDefined();
      expect(response.body.qualityScore).toBeDefined();
      expect(response.body.qualityScore.score).toBeGreaterThanOrEqual(0);
      expect(response.body.qualityScore.score).toBeLessThanOrEqual(100);
    });

    it('should return validation errors for invalid template', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/templates/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validTemplateData,
          name: 'Invalid Name!',
          components: {
            body: {
              text: 'Invalid placeholder {1}',
              placeholders: [],
            },
          },
        })
        .expect(200);

      expect(response.body.isValid).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should cache validation results', async () => {
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/templates/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validTemplateData)
        .expect(200);

      expect(response1.body.cached).toBe(false);

      const response2 = await request(app.getHttpServer())
        .post('/api/v1/templates/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validTemplateData)
        .expect(200);

      expect(response2.body.cached).toBe(true);
      expect(response2.body.cacheExpiresIn).toBeGreaterThan(0);
    });
  });

  // ==================== Template Metadata ====================

  describe('GET /api/v1/templates/categories - Get Categories', () => {
    it('should return all template categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
      
      const category = response.body.categories[0];
      expect(category.code).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.description).toBeDefined();
      expect(category.examples).toBeDefined();
    });

    it('should cache category results', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.cached).toBe(true);
    });
  });

  describe('GET /api/v1/templates/languages - Get Languages', () => {
    it('should return all supported languages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/templates/languages')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.languages).toBeDefined();
      expect(Array.isArray(response.body.languages)).toBe(true);
      expect(response.body.languages.length).toBeGreaterThan(0);
      
      const language = response.body.languages[0];
      expect(language.code).toBeDefined();
      expect(language.name).toBeDefined();
      expect(language.direction).toBeDefined();
    });
  });
});
