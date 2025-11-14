import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSoftDeleteToUsers1700000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deletedAt column for soft delete
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );

    // Add isOwner flag to identify tenant owners
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'is_owner',
        type: 'boolean',
        default: false,
      }),
    );

    // Set first admin of each tenant as owner
    // This ensures existing tenants have an owner
    await queryRunner.query(`
      UPDATE users u1
      SET is_owner = true
      WHERE role = 'admin'
      AND id = (
        SELECT id FROM users u2
        WHERE u2."tenantId" = u1."tenantId"
        AND u2.role = 'admin'
        AND u2.deleted_at IS NULL
        ORDER BY u2."createdAt" ASC
        LIMIT 1
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'deleted_at');
    await queryRunner.dropColumn('users', 'is_owner');
  }
}
