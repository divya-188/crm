import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWindowTrackingToConversations1700000000031 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'lastInboundMessageAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'windowExpiresAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'isWindowOpen',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('conversations', 'isWindowOpen');
    await queryRunner.dropColumn('conversations', 'windowExpiresAt');
    await queryRunner.dropColumn('conversations', 'lastInboundMessageAt');
  }
}
