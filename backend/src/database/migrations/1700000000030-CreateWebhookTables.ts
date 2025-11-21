import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWebhookTables1700000000030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create campaign_messages table
    await queryRunner.createTable(
      new Table({
        name: 'campaign_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'campaignId',
            type: 'uuid',
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'recipientPhone',
            type: 'varchar',
          },
          {
            name: 'recipientName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metaMessageId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
            default: "'pending'",
          },
          {
            name: 'templateData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'errorCode',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deliveredAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'readAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failedAt',
            type: 'timestamp',
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
        foreignKeys: [
          {
            columnNames: ['campaignId'],
            referencedTableName: 'campaigns',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for campaign_messages
    await queryRunner.createIndex(
      'campaign_messages',
      new TableIndex({
        name: 'IDX_campaign_messages_campaign_id',
        columnNames: ['campaignId'],
      }),
    );

    await queryRunner.createIndex(
      'campaign_messages',
      new TableIndex({
        name: 'IDX_campaign_messages_meta_message_id',
        columnNames: ['metaMessageId'],
      }),
    );

    await queryRunner.createIndex(
      'campaign_messages',
      new TableIndex({
        name: 'IDX_campaign_messages_status',
        columnNames: ['status'],
      }),
    );

    // Create incoming_messages table
    await queryRunner.createTable(
      new Table({
        name: 'incoming_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'metaMessageId',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'from',
            type: 'varchar',
          },
          {
            name: 'fromName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'image', 'video', 'document', 'audio', 'location', 'contacts', 'interactive'],
            default: "'text'",
          },
          {
            name: 'text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'media',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'context',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
          },
          {
            name: 'isRead',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isReplied',
            type: 'boolean',
            default: false,
          },
          {
            name: 'repliedAt',
            type: 'timestamp',
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

    // Create indexes for incoming_messages
    await queryRunner.createIndex(
      'incoming_messages',
      new TableIndex({
        name: 'IDX_incoming_messages_tenant_id',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'incoming_messages',
      new TableIndex({
        name: 'IDX_incoming_messages_from',
        columnNames: ['from'],
      }),
    );

    await queryRunner.createIndex(
      'incoming_messages',
      new TableIndex({
        name: 'IDX_incoming_messages_is_read',
        columnNames: ['isRead'],
      }),
    );

    // Create webhook_logs table
    await queryRunner.createTable(
      new Table({
        name: 'webhook_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'eventType',
            type: 'enum',
            enum: ['message_status', 'incoming_message', 'template_status', 'account_update', 'template_quality'],
          },
          {
            name: 'payload',
            type: 'jsonb',
          },
          {
            name: 'signature',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'processed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for webhook_logs
    await queryRunner.createIndex(
      'webhook_logs',
      new TableIndex({
        name: 'IDX_webhook_logs_event_type',
        columnNames: ['eventType'],
      }),
    );

    await queryRunner.createIndex(
      'webhook_logs',
      new TableIndex({
        name: 'IDX_webhook_logs_processed',
        columnNames: ['processed'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('webhook_logs');
    await queryRunner.dropTable('incoming_messages');
    await queryRunner.dropTable('campaign_messages');
  }
}
