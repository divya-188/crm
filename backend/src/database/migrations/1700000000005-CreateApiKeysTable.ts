import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateApiKeysTable1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'api_keys',
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
            name: 'key_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'key_prefix',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'permissions',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'rate_limit',
            type: 'integer',
            default: 100,
          },
          {
            name: 'rate_limit_window',
            type: 'integer',
            default: 60,
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'total_requests',
            type: 'integer',
            default: 0,
          },
          {
            name: 'last_request_at',
            type: 'timestamp',
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

    // Add foreign key for tenant_id
    await queryRunner.createForeignKey(
      'api_keys',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for created_by_user_id
    await queryRunner.createForeignKey(
      'api_keys',
      new TableForeignKey({
        columnNames: ['created_by_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes for optimized queries
    await queryRunner.query(
      `CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_api_keys_is_active ON api_keys(is_active)`,
    );
    // Composite index for pagination queries (tenant_id + created_at + id)
    await queryRunner.query(
      `CREATE INDEX idx_api_keys_tenant_created ON api_keys(tenant_id, created_at DESC, id DESC)`,
    );
    // Composite index for filtering by tenant and status
    await queryRunner.query(
      `CREATE INDEX idx_api_keys_tenant_active ON api_keys(tenant_id, is_active)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('api_keys');
  }
}
