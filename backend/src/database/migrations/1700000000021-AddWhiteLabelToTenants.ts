import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWhiteLabelToTenants1700000000021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add white_label_enabled column
    await queryRunner.addColumn(
      'tenants',
      new TableColumn({
        name: 'white_label_enabled',
        type: 'boolean',
        default: false,
        comment: 'Whether tenant can customize branding (premium feature)',
      }),
    );

    // Add team_settings column
    await queryRunner.addColumn(
      'tenants',
      new TableColumn({
        name: 'team_settings',
        type: 'jsonb',
        default: "'{}'",
        comment: 'Team configuration: default_role, auto_assign, assignment_strategy, departments',
      }),
    );

    // Add integration_settings column
    await queryRunner.addColumn(
      'tenants',
      new TableColumn({
        name: 'integration_settings',
        type: 'jsonb',
        default: "'{}'",
        comment: 'Third-party integration configurations and OAuth tokens',
      }),
    );

    // Create index on white_label_enabled for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_tenants_white_label_enabled" 
      ON "tenants" ("white_label_enabled")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_tenants_white_label_enabled"`);
    await queryRunner.dropColumn('tenants', 'integration_settings');
    await queryRunner.dropColumn('tenants', 'team_settings');
    await queryRunner.dropColumn('tenants', 'white_label_enabled');
  }
}
