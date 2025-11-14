import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateInvoicesTable1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
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
            name: 'subscriptionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'invoiceNumber',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'tax',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'USD'",
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'invoiceDate',
            type: 'timestamp',
          },
          {
            name: 'dueDate',
            type: 'timestamp',
          },
          {
            name: 'paidAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'stripeInvoiceId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'paypalInvoiceId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'razorpayInvoiceId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'pdfUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'items',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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

    // Create indexes
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_INVOICES_TENANT_ID',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_INVOICES_TENANT_STATUS',
        columnNames: ['tenantId', 'status'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['subscriptionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'subscriptions',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('invoices');
    
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('invoices', foreignKey);
      }
    }

    await queryRunner.dropIndex('invoices', 'IDX_INVOICES_TENANT_ID');
    await queryRunner.dropIndex('invoices', 'IDX_INVOICES_TENANT_STATUS');
    await queryRunner.dropTable('invoices');
  }
}
