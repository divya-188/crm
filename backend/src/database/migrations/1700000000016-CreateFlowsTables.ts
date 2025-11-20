import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateFlowsTables1700000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create flows table
    await queryRunner.createTable(
      new Table({
        name: 'flows',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
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
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'flowData',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'triggerConfig',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'draft'",
            isNullable: false,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'parentFlowId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'executionCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'successCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'failureCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for flows table
    await queryRunner.createIndex(
      'flows',
      new TableIndex({
        name: 'IDX_flows_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'flows',
      new TableIndex({
        name: 'IDX_flows_tenantId_status',
        columnNames: ['tenantId', 'status'],
      }),
    );

    // Create foreign key for tenantId
    await queryRunner.createForeignKey(
      'flows',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Create flow_executions table
    await queryRunner.createTable(
      new Table({
        name: 'flow_executions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'flowId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'conversationId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'contactId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'running'",
            isNullable: false,
          },
          {
            name: 'currentNodeId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'context',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'executionPath',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for flow_executions table
    await queryRunner.createIndex(
      'flow_executions',
      new TableIndex({
        name: 'IDX_flow_executions_flowId',
        columnNames: ['flowId'],
      }),
    );

    await queryRunner.createIndex(
      'flow_executions',
      new TableIndex({
        name: 'IDX_flow_executions_flowId_status',
        columnNames: ['flowId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'flow_executions',
      new TableIndex({
        name: 'IDX_flow_executions_conversationId',
        columnNames: ['conversationId'],
      }),
    );

    // Create foreign keys for flow_executions table
    await queryRunner.createForeignKey(
      'flow_executions',
      new TableForeignKey({
        columnNames: ['flowId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'flows',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'flow_executions',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'flow_executions',
      new TableForeignKey({
        columnNames: ['contactId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contacts',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop flow_executions table (foreign keys will be dropped automatically)
    await queryRunner.dropTable('flow_executions', true);

    // Drop flows table (foreign keys will be dropped automatically)
    await queryRunner.dropTable('flows', true);
  }
}
