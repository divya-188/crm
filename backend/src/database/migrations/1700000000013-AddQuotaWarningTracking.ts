import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQuotaWarningTracking1700000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add quotaWarnings column to tenants table to track when warnings were sent
    await queryRunner.addColumn(
      'tenants',
      new TableColumn({
        name: 'quotaWarnings',
        type: 'jsonb',
        isNullable: true,
        comment: 'Tracks quota warning emails sent to avoid spam. Format: { resourceType: { percentage: timestamp } }',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tenants', 'quotaWarnings');
  }
}
