import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSubscriptionRenewalFields1700000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add autoRenew field
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'autoRenew',
        type: 'boolean',
        default: true,
      }),
    );

    // Add currentPeriodStart field
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'currentPeriodStart',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add currentPeriodEnd field
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'currentPeriodEnd',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add renewalAttempts field
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'renewalAttempts',
        type: 'integer',
        default: 0,
      }),
    );

    // Add lastRenewalAttempt field
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'lastRenewalAttempt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add gracePeriodEnd field
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'gracePeriodEnd',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add cancellationReason field
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'cancellationReason',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Add paymentMethod field (JSONB)
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'paymentMethod',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // Initialize currentPeriodStart and currentPeriodEnd for existing subscriptions
    await queryRunner.query(`
      UPDATE subscriptions 
      SET 
        "currentPeriodStart" = "startDate",
        "currentPeriodEnd" = "endDate"
      WHERE "currentPeriodStart" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('subscriptions', 'paymentMethod');
    await queryRunner.dropColumn('subscriptions', 'cancellationReason');
    await queryRunner.dropColumn('subscriptions', 'gracePeriodEnd');
    await queryRunner.dropColumn('subscriptions', 'lastRenewalAttempt');
    await queryRunner.dropColumn('subscriptions', 'renewalAttempts');
    await queryRunner.dropColumn('subscriptions', 'currentPeriodEnd');
    await queryRunner.dropColumn('subscriptions', 'currentPeriodStart');
    await queryRunner.dropColumn('subscriptions', 'autoRenew');
  }
}
