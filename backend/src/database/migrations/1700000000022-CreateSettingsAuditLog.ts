import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSettingsAuditLog1700000000022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'settings_audit_log',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'settings_type',
            type: 'varchar',
            length: '50',
            comment: 'payment_gateway, email, security, branding, whatsapp, team, etc.',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '20',
            comment: 'create, update, delete, test',
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: true,
            comment: 'Diff of changes made',
          },
          {
            name: 'ip_address',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'success'",
            comment: 'success, failed',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['tenant_id'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for faster queries
    await queryRunner.createIndex(
      'settings_audit_log',
      new TableIndex({
        name: 'IDX_settings_audit_log_user',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'settings_audit_log',
      new TableIndex({
        name: 'IDX_settings_audit_log_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'settings_audit_log',
      new TableIndex({
        name: 'IDX_settings_audit_log_type',
        columnNames: ['settings_type'],
      }),
    );

    await queryRunner.createIndex(
      'settings_audit_log',
      new TableIndex({
        name: 'IDX_settings_audit_log_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Create composite index for common queries
    await queryRunner.createIndex(
      'settings_audit_log',
      new TableIndex({
        name: 'IDX_settings_audit_log_tenant_type',
        columnNames: ['tenant_id', 'settings_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('settings_audit_log');
  }
}
