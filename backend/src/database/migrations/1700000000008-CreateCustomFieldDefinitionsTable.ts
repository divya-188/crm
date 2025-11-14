import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCustomFieldDefinitionsTable1700000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'custom_field_definitions',
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
          },
          {
            name: 'key',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'label',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'number', 'date', 'dropdown', 'checkbox'],
            default: "'text'",
          },
          {
            name: 'options',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isRequired',
            type: 'boolean',
            default: false,
          },
          {
            name: 'defaultValue',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'placeholder',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'helpText',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sortOrder',
            type: 'integer',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'custom_field_definitions',
      new TableIndex({
        name: 'IDX_custom_field_definitions_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'custom_field_definitions',
      new TableIndex({
        name: 'IDX_custom_field_definitions_tenantId_key',
        columnNames: ['tenantId', 'key'],
        isUnique: true,
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'custom_field_definitions',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('custom_field_definitions');
  }
}
