import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration for Template Testing functionality
 * Creates tables for:
 * - template_test_sends: Track test template sends
 * - test_phone_numbers: Manage test phone numbers (max 5 per WABA)
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 */
export class CreateTemplateTestingTables1700000000024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create template_test_sends table
    await queryRunner.createTable(
      new Table({
        name: 'template_test_sends',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'templateId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'testPhoneNumber',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'placeholderValues',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'sent'",
          },
          {
            name: 'metaMessageId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metaResponse',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'sentByUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deliveredAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'readAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for template_test_sends
    await queryRunner.createIndex(
      'template_test_sends',
      new TableIndex({
        name: 'IDX_template_test_sends_templateId',
        columnNames: ['templateId'],
      }),
    );

    await queryRunner.createIndex(
      'template_test_sends',
      new TableIndex({
        name: 'IDX_template_test_sends_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'template_test_sends',
      new TableIndex({
        name: 'IDX_template_test_sends_templateId_sentAt',
        columnNames: ['templateId', 'sentAt'],
      }),
    );

    await queryRunner.createIndex(
      'template_test_sends',
      new TableIndex({
        name: 'IDX_template_test_sends_tenantId_sentAt',
        columnNames: ['tenantId', 'sentAt'],
      }),
    );

    // Create foreign keys for template_test_sends
    await queryRunner.createForeignKey(
      'template_test_sends',
      new TableForeignKey({
        columnNames: ['templateId'],
        referencedTableName: 'templates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'template_test_sends',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'template_test_sends',
      new TableForeignKey({
        columnNames: ['sentByUserId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Create test_phone_numbers table
    await queryRunner.createTable(
      new Table({
        name: 'test_phone_numbers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'wabaId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'addedByUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'lastUsedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'usageCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create unique constraint for test_phone_numbers (tenantId + phoneNumber)
    await queryRunner.createIndex(
      'test_phone_numbers',
      new TableIndex({
        name: 'IDX_test_phone_numbers_tenantId_phoneNumber',
        columnNames: ['tenantId', 'phoneNumber'],
        isUnique: true,
      }),
    );

    // Create index for test_phone_numbers (tenantId + wabaId)
    await queryRunner.createIndex(
      'test_phone_numbers',
      new TableIndex({
        name: 'IDX_test_phone_numbers_tenantId_wabaId',
        columnNames: ['tenantId', 'wabaId'],
      }),
    );

    // Create foreign keys for test_phone_numbers
    await queryRunner.createForeignKey(
      'test_phone_numbers',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'test_phone_numbers',
      new TableForeignKey({
        columnNames: ['addedByUserId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop test_phone_numbers table
    const testPhoneNumbersTable = await queryRunner.getTable('test_phone_numbers');
    if (testPhoneNumbersTable) {
      const testPhoneNumbersForeignKeys = testPhoneNumbersTable.foreignKeys;
      for (const foreignKey of testPhoneNumbersForeignKeys) {
        await queryRunner.dropForeignKey('test_phone_numbers', foreignKey);
      }
    }
    await queryRunner.dropTable('test_phone_numbers', true);

    // Drop template_test_sends table
    const testSendsTable = await queryRunner.getTable('template_test_sends');
    if (testSendsTable) {
      const testSendsForeignKeys = testSendsTable.foreignKeys;
      for (const foreignKey of testSendsForeignKeys) {
        await queryRunner.dropForeignKey('template_test_sends', foreignKey);
      }
    }
    await queryRunner.dropTable('template_test_sends', true);
  }
}
