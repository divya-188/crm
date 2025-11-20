import { MigrationInterface, QueryRunner, TableColumn, Table, TableIndex, TableForeignKey } from 'typeorm';

export class EnhanceTemplatesSchema1700000000023 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to templates table
    await queryRunner.addColumns('templates', [
      new TableColumn({
        name: 'display_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'description',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'components',
        type: 'jsonb',
        isNullable: false,
        default: "'{}'",
      }),
      new TableColumn({
        name: 'sample_values',
        type: 'jsonb',
        isNullable: false,
        default: "'{}'",
      }),
      new TableColumn({
        name: 'meta_template_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'meta_template_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'waba_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'approval_status',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'rejected_at',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'version',
        type: 'integer',
        default: 1,
      }),
      new TableColumn({
        name: 'parent_template_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
      }),
      new TableColumn({
        name: 'usage_count',
        type: 'integer',
        default: 0,
      }),
      new TableColumn({
        name: 'last_used_at',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'quality_score',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'delivery_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'read_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'response_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'created_by_user_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'updated_by_user_id',
        type: 'uuid',
        isNullable: true,
      }),
    ]);

    // Add status 'superseded' to existing status check constraint
    await queryRunner.query(`
      ALTER TABLE templates DROP CONSTRAINT IF EXISTS "CHK_template_status";
      ALTER TABLE templates ADD CONSTRAINT "CHK_template_status" 
      CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'superseded'));
    `);

    // Add category constraints
    await queryRunner.query(`
      ALTER TABLE templates DROP CONSTRAINT IF EXISTS "CHK_template_category";
      ALTER TABLE templates ADD CONSTRAINT "CHK_template_category" 
      CHECK (category IN ('TRANSACTIONAL', 'UTILITY', 'MARKETING', 'ACCOUNT_UPDATE', 'OTP', 'marketing', 'utility', 'authentication'));
    `);

    // Add indexes
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_language',
        columnNames: ['language'],
      }),
    );

    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_templates_meta_id',
        columnNames: ['meta_template_id'],
      }),
    );

    // Add full-text search index
    await queryRunner.query(`
      CREATE INDEX "IDX_templates_name_search" ON templates 
      USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
    `);

    // Add foreign key for parent_template_id
    await queryRunner.createForeignKey(
      'templates',
      new TableForeignKey({
        columnNames: ['parent_template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'templates',
        onDelete: 'SET NULL',
      }),
    );

    // Create template_status_history table
    await queryRunner.createTable(
      new Table({
        name: 'template_status_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'template_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'from_status',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'to_status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'meta_response',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'changed_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'changed_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for template_status_history
    await queryRunner.createForeignKey(
      'template_status_history',
      new TableForeignKey({
        columnNames: ['template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'templates',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'template_status_history',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Add index for template_status_history
    await queryRunner.createIndex(
      'template_status_history',
      new TableIndex({
        name: 'IDX_template_history_template',
        columnNames: ['template_id', 'changed_at'],
      }),
    );

    // Create template_test_sends table
    await queryRunner.createTable(
      new Table({
        name: 'template_test_sends',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'template_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'test_phone_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'placeholder_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'meta_message_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sent_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'delivered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys for template_test_sends
    await queryRunner.createForeignKey(
      'template_test_sends',
      new TableForeignKey({
        columnNames: ['template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'templates',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'template_test_sends',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Create template_usage_analytics table
    await queryRunner.createTable(
      new Table({
        name: 'template_usage_analytics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'template_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'send_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'delivered_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'read_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'replied_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'failed_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'delivery_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'read_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'response_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for template_usage_analytics
    await queryRunner.createForeignKey(
      'template_usage_analytics',
      new TableForeignKey({
        columnNames: ['template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'templates',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'template_usage_analytics',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Add unique constraint and index for template_usage_analytics
    await queryRunner.query(`
      ALTER TABLE template_usage_analytics 
      ADD CONSTRAINT "UQ_template_usage_analytics_template_date" 
      UNIQUE (template_id, date);
    `);

    await queryRunner.createIndex(
      'template_usage_analytics',
      new TableIndex({
        name: 'IDX_template_analytics_date',
        columnNames: ['template_id', 'date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop template_usage_analytics table
    await queryRunner.dropTable('template_usage_analytics', true);

    // Drop template_test_sends table
    await queryRunner.dropTable('template_test_sends', true);

    // Drop template_status_history table
    await queryRunner.dropTable('template_status_history', true);

    // Drop indexes from templates
    await queryRunner.dropIndex('templates', 'IDX_templates_name_search');
    await queryRunner.dropIndex('templates', 'IDX_templates_meta_id');
    await queryRunner.dropIndex('templates', 'IDX_templates_language');
    await queryRunner.dropIndex('templates', 'IDX_templates_category');

    // Drop foreign key for parent_template_id
    const table = await queryRunner.getTable('templates');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('parent_template_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('templates', foreignKey);
    }

    // Drop new columns from templates
    await queryRunner.dropColumns('templates', [
      'display_name',
      'description',
      'components',
      'sample_values',
      'meta_template_id',
      'meta_template_name',
      'waba_id',
      'approval_status',
      'rejected_at',
      'version',
      'parent_template_id',
      'is_active',
      'usage_count',
      'last_used_at',
      'quality_score',
      'delivery_rate',
      'read_rate',
      'response_rate',
      'created_by_user_id',
      'updated_by_user_id',
    ]);

    // Restore original constraints
    await queryRunner.query(`
      ALTER TABLE templates DROP CONSTRAINT IF EXISTS "CHK_template_status";
      ALTER TABLE templates ADD CONSTRAINT "CHK_template_status" 
      CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));
    `);

    await queryRunner.query(`
      ALTER TABLE templates DROP CONSTRAINT IF EXISTS "CHK_template_category";
      ALTER TABLE templates ADD CONSTRAINT "CHK_template_category" 
      CHECK (category IN ('marketing', 'utility', 'authentication'));
    `);
  }
}
