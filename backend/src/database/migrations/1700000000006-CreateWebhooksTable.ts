import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateWebhooksTable1700000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create webhooks table
    await queryRunner.createTable(
      new Table({
        name: 'webhooks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'events',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'secret',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 3,
          },
          {
            name: 'timeout_seconds',
            type: 'integer',
            default: 30,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'last_triggered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'total_deliveries',
            type: 'integer',
            default: 0,
          },
          {
            name: 'successful_deliveries',
            type: 'integer',
            default: 0,
          },
          {
            name: 'failed_deliveries',
            type: 'integer',
            default: 0,
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

    // Create foreign key for tenant_id
    await queryRunner.createForeignKey(
      'webhooks',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Create webhook_logs table
    await queryRunner.createTable(
      new Table({
        name: 'webhook_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'webhook_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'response_status',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'response_body',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'response_time_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'attempt_count',
            type: 'integer',
            default: 1,
          },
          {
            name: 'is_success',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for webhook_logs
    await queryRunner.createForeignKey(
      'webhook_logs',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'webhook_logs',
      new TableForeignKey({
        columnNames: ['webhook_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'webhooks',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX idx_webhooks_tenant_id ON webhooks(tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_webhooks_is_active ON webhooks(is_active)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_webhook_logs_tenant_id ON webhook_logs(tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_webhook_logs_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_webhook_logs_tenant_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_webhook_logs_webhook_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_webhooks_is_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_webhooks_tenant_id`);

    // Drop tables
    await queryRunner.dropTable('webhook_logs', true);
    await queryRunner.dropTable('webhooks', true);
  }
}
