import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGracePeriodField1700000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add gracePeriodEnd column to subscriptions table
    await queryRunner.addColumn(
      'subscriptions',
      new TableColumn({
        name: 'gracePeriodEnd',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('subscriptions', 'gracePeriodEnd');
  }
}
