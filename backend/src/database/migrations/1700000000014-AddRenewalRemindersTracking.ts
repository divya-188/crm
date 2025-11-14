import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRenewalRemindersTracking1700000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add renewalReminders column to subscriptions table to track which reminders were sent
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'renewalReminders',
        type: 'jsonb',
        isNullable: true,
        default: "'[]'",
        comment: 'Array of days before renewal when reminders were sent (e.g., [7, 3, 1])',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('subscriptions', 'renewalReminders');
  }
}
