import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

/**
 * Migration for optimizing template database queries
 * Task 59: Optimize database queries
 * 
 * This migration adds:
 * - Additional indexes for common query patterns
 * - Composite indexes for filtering and sorting
 * - Database views for analytics aggregation
 * - Optimizations for cursor-based pagination
 * 
 * Requirements: Performance targets
 */
export class OptimizeTemplateQueries1700000000025 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. ADD PERFORMANCE INDEXES FOR TEMPLATES
    // ============================================

    // Composite index for tenant + status + category (common filter combination)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_tenant_status_category',
        columnNames: ['tenantId', 'status', 'category'],
      }),
    );

    // Composite index for tenant + status + language (common filter combination)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_tenant_status_language',
        columnNames: ['tenantId', 'status', 'language'],
      }),
    );

    // Index for tenant + isActive + createdAt (for active templates sorted by date)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_tenant_active_created',
        columnNames: ['tenantId', 'isActive', 'createdAt'],
      }),
    );

    // Index for tenant + usageCount (for sorting by popularity)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_tenant_usage',
        columnNames: ['tenantId', 'usageCount'],
      }),
    );

    // Index for tenant + qualityScore (for sorting by quality)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_tenant_quality',
        columnNames: ['tenantId', 'qualityScore'],
      }),
    );

    // Index for tenant + approvedAt (for sorting by approval date)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_tenant_approved',
        columnNames: ['tenantId', 'approvedAt'],
      }),
    );

    // Index for metaTemplateId (for Meta API lookups)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_meta_template_id',
        columnNames: ['metaTemplateId'],
      }),
    );

    // Index for wabaId (for WABA-specific queries)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_waba_id',
        columnNames: ['wabaId'],
      }),
    );

    // Partial index for pending templates (for status polling optimization)
    await queryRunner.query(`
      CREATE INDEX "IDX_templates_pending_submitted" 
      ON templates (tenantId, submittedAt) 
      WHERE status = 'pending';
    `);

    // Partial index for approved templates (most commonly queried)
    await queryRunner.query(`
      CREATE INDEX "IDX_templates_approved_active" 
      ON templates (tenantId, createdAt DESC) 
      WHERE status = 'approved' AND "isActive" = true;
    `);

    // Index for parent_template_id (for version history queries)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_parent_template',
        columnNames: ['parentTemplateId', 'version'],
      }),
    );

    // ============================================
    // 2. OPTIMIZE ANALYTICS TABLES
    // ============================================

    // Composite index for tenant + date range queries on analytics
    await queryRunner.createIndex(
      'template_usage_analytics',
      new TableIndex({
        name: 'IDX_analytics_tenant_date_range',
        columnNames: ['tenantId', 'date'],
      }),
    );

    // Index for high-performing templates (delivery rate)
    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_high_delivery" 
      ON template_usage_analytics (templateId, "deliveryRate" DESC) 
      WHERE "deliveryRate" >= 90;
    `);

    // Index for low-performing templates (delivery rate)
    await queryRunner.query(`
      CREATE INDEX "IDX_analytics_low_delivery" 
      ON template_usage_analytics (templateId, "deliveryRate" ASC) 
      WHERE "deliveryRate" < 70 AND "sendCount" > 10;
    `);

    // ============================================
    // 3. OPTIMIZE STATUS HISTORY TABLE
    // ============================================

    // Index for tenant + date range on status history
    await queryRunner.createIndex(
      'template_status_history',
      new TableIndex({
        name: 'IDX_status_history_tenant_date',
        columnNames: ['tenantId', 'changedAt'],
      }),
    );

    // Index for status transitions (from -> to)
    await queryRunner.createIndex(
      'template_status_history',
      new TableIndex({
        name: 'IDX_status_history_transitions',
        columnNames: ['fromStatus', 'toStatus', 'changedAt'],
      }),
    );

    // ============================================
    // 4. OPTIMIZE TEST SENDS TABLE
    // ============================================

    // Index for tenant + status + date (for test send reports)
    await queryRunner.createIndex(
      'template_test_sends',
      new TableIndex({
        name: 'IDX_test_sends_tenant_status_date',
        columnNames: ['tenantId', 'status', 'sentAt'],
      }),
    );

    // ============================================
    // 5. CREATE DATABASE VIEWS FOR ANALYTICS
    // ============================================

    // View: Template Performance Summary
    await queryRunner.query(`
      CREATE OR REPLACE VIEW template_performance_summary AS
      SELECT 
        t.id AS template_id,
        t."tenantId" AS tenant_id,
        t.name,
        t."displayName" AS display_name,
        t.category,
        t.language,
        t.status,
        t."usageCount" AS total_usage,
        t."qualityScore" AS quality_score,
        
        -- Aggregate analytics from last 30 days
        COALESCE(SUM(a."sendCount"), 0) AS sends_last_30_days,
        COALESCE(SUM(a."deliveredCount"), 0) AS delivered_last_30_days,
        COALESCE(SUM(a."readCount"), 0) AS read_last_30_days,
        COALESCE(SUM(a."repliedCount"), 0) AS replied_last_30_days,
        COALESCE(SUM(a."failedCount"), 0) AS failed_last_30_days,
        
        -- Calculate average rates
        CASE 
          WHEN SUM(a."sendCount") > 0 
          THEN ROUND((SUM(a."deliveredCount")::DECIMAL / SUM(a."sendCount")) * 100, 2)
          ELSE NULL 
        END AS avg_delivery_rate,
        
        CASE 
          WHEN SUM(a."deliveredCount") > 0 
          THEN ROUND((SUM(a."readCount")::DECIMAL / SUM(a."deliveredCount")) * 100, 2)
          ELSE NULL 
        END AS avg_read_rate,
        
        CASE 
          WHEN SUM(a."readCount") > 0 
          THEN ROUND((SUM(a."repliedCount")::DECIMAL / SUM(a."readCount")) * 100, 2)
          ELSE NULL 
        END AS avg_response_rate,
        
        t."createdAt" AS created_at,
        t."approvedAt" AS approved_at,
        t."lastUsedAt" AS last_used_at
        
      FROM templates t
      LEFT JOIN template_usage_analytics a 
        ON t.id = a."templateId" 
        AND a.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE t."isActive" = true
      GROUP BY 
        t.id, t."tenantId", t.name, t."displayName", t.category, 
        t.language, t.status, t."usageCount", t."qualityScore",
        t."createdAt", t."approvedAt", t."lastUsedAt";
    `);

    // View: Daily Analytics Summary
    await queryRunner.query(`
      CREATE OR REPLACE VIEW daily_analytics_summary AS
      SELECT 
        a."tenantId" AS tenant_id,
        a.date,
        COUNT(DISTINCT a."templateId") AS active_templates,
        SUM(a."sendCount") AS total_sends,
        SUM(a."deliveredCount") AS total_delivered,
        SUM(a."readCount") AS total_read,
        SUM(a."repliedCount") AS total_replied,
        SUM(a."failedCount") AS total_failed,
        
        CASE 
          WHEN SUM(a."sendCount") > 0 
          THEN ROUND((SUM(a."deliveredCount")::DECIMAL / SUM(a."sendCount")) * 100, 2)
          ELSE 0 
        END AS overall_delivery_rate,
        
        CASE 
          WHEN SUM(a."deliveredCount") > 0 
          THEN ROUND((SUM(a."readCount")::DECIMAL / SUM(a."deliveredCount")) * 100, 2)
          ELSE 0 
        END AS overall_read_rate,
        
        CASE 
          WHEN SUM(a."readCount") > 0 
          THEN ROUND((SUM(a."repliedCount")::DECIMAL / SUM(a."readCount")) * 100, 2)
          ELSE 0 
        END AS overall_response_rate
        
      FROM template_usage_analytics a
      GROUP BY a."tenantId", a.date
      ORDER BY a.date DESC;
    `);

    // View: Top Performing Templates
    await queryRunner.query(`
      CREATE OR REPLACE VIEW top_performing_templates AS
      SELECT 
        t.id AS template_id,
        t."tenantId" AS tenant_id,
        t.name,
        t."displayName" AS display_name,
        t.category,
        t."usageCount" AS total_usage,
        
        -- Last 30 days metrics
        COALESCE(SUM(a."sendCount"), 0) AS recent_sends,
        COALESCE(AVG(a."deliveryRate"), 0) AS avg_delivery_rate,
        COALESCE(AVG(a."readRate"), 0) AS avg_read_rate,
        COALESCE(AVG(a."responseRate"), 0) AS avg_response_rate,
        
        -- Performance score (weighted combination)
        ROUND(
          (COALESCE(AVG(a."deliveryRate"), 0) * 0.3) +
          (COALESCE(AVG(a."readRate"), 0) * 0.3) +
          (COALESCE(AVG(a."responseRate"), 0) * 0.4),
          2
        ) AS performance_score
        
      FROM templates t
      LEFT JOIN template_usage_analytics a 
        ON t.id = a."templateId" 
        AND a.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE 
        t.status = 'approved' 
        AND t."isActive" = true
        AND t."usageCount" > 0
      GROUP BY 
        t.id, t."tenantId", t.name, t."displayName", 
        t.category, t."usageCount"
      HAVING SUM(a."sendCount") > 10
      ORDER BY performance_score DESC;
    `);

    // View: Low Performing Templates (need attention)
    await queryRunner.query(`
      CREATE OR REPLACE VIEW low_performing_templates AS
      SELECT 
        t.id AS template_id,
        t."tenantId" AS tenant_id,
        t.name,
        t."displayName" AS display_name,
        t.category,
        
        COALESCE(SUM(a."sendCount"), 0) AS recent_sends,
        COALESCE(AVG(a."deliveryRate"), 0) AS avg_delivery_rate,
        COALESCE(AVG(a."readRate"), 0) AS avg_read_rate,
        COALESCE(AVG(a."responseRate"), 0) AS avg_response_rate,
        
        -- Identify specific issues
        CASE 
          WHEN AVG(a."deliveryRate") < 70 THEN 'Low Delivery Rate'
          WHEN AVG(a."readRate") < 50 THEN 'Low Read Rate'
          WHEN AVG(a."responseRate") < 10 THEN 'Low Response Rate'
          ELSE 'Multiple Issues'
        END AS primary_issue
        
      FROM templates t
      INNER JOIN template_usage_analytics a 
        ON t.id = a."templateId" 
        AND a.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE 
        t.status = 'approved' 
        AND t."isActive" = true
      GROUP BY 
        t.id, t."tenantId", t.name, t."displayName", t.category
      HAVING 
        SUM(a."sendCount") > 10
        AND (
          AVG(a."deliveryRate") < 70 
          OR AVG(a."readRate") < 50 
          OR AVG(a."responseRate") < 10
        )
      ORDER BY 
        AVG(a."deliveryRate") ASC,
        AVG(a."readRate") ASC;
    `);

    // View: Category Performance Comparison
    await queryRunner.query(`
      CREATE OR REPLACE VIEW category_performance AS
      SELECT 
        t."tenantId" AS tenant_id,
        t.category,
        COUNT(DISTINCT t.id) AS template_count,
        SUM(t."usageCount") AS total_usage,
        
        -- Last 30 days aggregates
        COALESCE(SUM(a."sendCount"), 0) AS total_sends,
        COALESCE(AVG(a."deliveryRate"), 0) AS avg_delivery_rate,
        COALESCE(AVG(a."readRate"), 0) AS avg_read_rate,
        COALESCE(AVG(a."responseRate"), 0) AS avg_response_rate
        
      FROM templates t
      LEFT JOIN template_usage_analytics a 
        ON t.id = a."templateId" 
        AND a.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE 
        t.status = 'approved' 
        AND t."isActive" = true
      GROUP BY t."tenantId", t.category
      ORDER BY total_usage DESC;
    `);

    // View: Language Performance Comparison
    await queryRunner.query(`
      CREATE OR REPLACE VIEW language_performance AS
      SELECT 
        t."tenantId" AS tenant_id,
        t.language,
        COUNT(DISTINCT t.id) AS template_count,
        SUM(t."usageCount") AS total_usage,
        
        COALESCE(SUM(a."sendCount"), 0) AS total_sends,
        COALESCE(AVG(a."deliveryRate"), 0) AS avg_delivery_rate,
        COALESCE(AVG(a."readRate"), 0) AS avg_read_rate,
        COALESCE(AVG(a."responseRate"), 0) AS avg_response_rate
        
      FROM templates t
      LEFT JOIN template_usage_analytics a 
        ON t.id = a."templateId" 
        AND a.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE 
        t.status = 'approved' 
        AND t."isActive" = true
      GROUP BY t."tenantId", t.language
      ORDER BY total_usage DESC;
    `);

    // ============================================
    // 6. ADD CURSOR PAGINATION SUPPORT
    // ============================================

    // Create a composite index for cursor-based pagination
    // This allows efficient keyset pagination using (createdAt, id)
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_cursor_pagination',
        columnNames: ['tenantId', 'createdAt', 'id'],
      }),
    );

    // Index for cursor pagination with status filter
    await queryRunner.query(`
      CREATE INDEX "IDX_templates_cursor_status" 
      ON templates ("tenantId", status, "createdAt" DESC, id)
      WHERE "isActive" = true;
    `);

    // ============================================
    // 7. OPTIMIZE JSONB QUERIES
    // ============================================

    // GIN index for components JSONB field (for searching within components)
    await queryRunner.query(`
      CREATE INDEX "IDX_templates_components_gin" 
      ON templates USING gin(components);
    `);

    // GIN index for sample_values JSONB field
    await queryRunner.query(`
      CREATE INDEX "IDX_templates_sample_values_gin" 
      ON templates USING gin("sampleValues");
    `);

    // ============================================
    // 8. ADD STATISTICS FOR QUERY PLANNER
    // ============================================

    // Update statistics for better query planning
    await queryRunner.query(`
      ANALYZE templates;
      ANALYZE template_usage_analytics;
      ANALYZE template_status_history;
      ANALYZE template_test_sends;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop views
    await queryRunner.query('DROP VIEW IF EXISTS language_performance;');
    await queryRunner.query('DROP VIEW IF EXISTS category_performance;');
    await queryRunner.query('DROP VIEW IF EXISTS low_performing_templates;');
    await queryRunner.query('DROP VIEW IF EXISTS top_performing_templates;');
    await queryRunner.query('DROP VIEW IF EXISTS daily_analytics_summary;');
    await queryRunner.query('DROP VIEW IF EXISTS template_performance_summary;');

    // Drop JSONB indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_templates_sample_values_gin";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_templates_components_gin";');

    // Drop cursor pagination indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_templates_cursor_status";');
    await queryRunner.dropIndex('templates', 'IDX_templates_cursor_pagination');

    // Drop test sends indexes
    await queryRunner.dropIndex('template_test_sends', 'IDX_test_sends_tenant_status_date');

    // Drop status history indexes
    await queryRunner.dropIndex('template_status_history', 'IDX_status_history_transitions');
    await queryRunner.dropIndex('template_status_history', 'IDX_status_history_tenant_date');

    // Drop analytics indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_analytics_low_delivery";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_analytics_high_delivery";');
    await queryRunner.dropIndex('template_usage_analytics', 'IDX_analytics_tenant_date_range');

    // Drop template indexes
    await queryRunner.dropIndex('templates', 'IDX_templates_parent_template');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_templates_approved_active";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_templates_pending_submitted";');
    await queryRunner.dropIndex('templates', 'IDX_templates_waba_id');
    await queryRunner.dropIndex('templates', 'IDX_templates_meta_template_id');
    await queryRunner.dropIndex('templates', 'IDX_templates_tenant_approved');
    await queryRunner.dropIndex('templates', 'IDX_templates_tenant_quality');
    await queryRunner.dropIndex('templates', 'IDX_templates_tenant_usage');
    await queryRunner.dropIndex('templates', 'IDX_templates_tenant_active_created');
    await queryRunner.dropIndex('templates', 'IDX_templates_tenant_status_language');
    await queryRunner.dropIndex('templates', 'IDX_templates_tenant_status_category');
  }
}
