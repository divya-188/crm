import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTemplateAuditLogs1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create template_audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'template_audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'templateId',
            type: 'uuid',
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'template_audit_logs',
      new TableIndex({
        name: 'IDX_template_audit_logs_templateId_createdAt',
        columnNames: ['templateId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'template_audit_logs',
      new TableIndex({
        name: 'IDX_template_audit_logs_tenantId_createdAt',
        columnNames: ['tenantId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'template_audit_logs',
      new TableIndex({
        name: 'IDX_template_audit_logs_userId_createdAt',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'template_audit_logs',
      new TableIndex({
        name: 'IDX_template_audit_logs_templateId',
        columnNames: ['templateId'],
      }),
    );

    await queryRunner.createIndex(
      'template_audit_logs',
      new TableIndex({
        name: 'IDX_template_audit_logs_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'template_audit_logs',
      new TableIndex({
        name: 'IDX_template_audit_logs_userId',
        columnNames: ['userId'],
      }),
    );

    // Create foreign key to templates table
    await queryRunner.createForeignKey(
      'template_audit_logs',
      new TableForeignKey({
        columnNames: ['templateId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'templates',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('template_audit_logs');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('templateId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('template_audit_logs', foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex('template_audit_logs', 'IDX_template_audit_logs_templateId_createdAt');
    await queryRunner.dropIndex('template_audit_logs', 'IDX_template_audit_logs_tenantId_createdAt');
    await queryRunner.dropIndex('template_audit_logs', 'IDX_template_audit_logs_userId_createdAt');
    await queryRunner.dropIndex('template_audit_logs', 'IDX_template_audit_logs_templateId');
    await queryRunner.dropIndex('template_audit_logs', 'IDX_template_audit_logs_tenantId');
    await queryRunner.dropIndex('template_audit_logs', 'IDX_template_audit_logs_userId');

    // Drop table
    await queryRunner.dropTable('template_audit_logs');
  }
}
