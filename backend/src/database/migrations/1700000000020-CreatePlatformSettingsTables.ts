import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePlatformSettingsTables1700000000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create platform_settings table
    await queryRunner.createTable(
      new Table({
        name: 'platform_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            comment: 'payment, email, security, whatsapp_mode, branding',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'value',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'encrypted',
            type: 'boolean',
            default: false,
            comment: 'Whether value is encrypted',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional configuration data',
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
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['updated_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create unique index on category + key
    await queryRunner.createIndex(
      'platform_settings',
      new TableIndex({
        name: 'IDX_platform_settings_category_key',
        columnNames: ['category', 'key'],
        isUnique: true,
      }),
    );

    // Create index on category for faster lookups
    await queryRunner.createIndex(
      'platform_settings',
      new TableIndex({
        name: 'IDX_platform_settings_category',
        columnNames: ['category'],
      }),
    );

    // Create platform_branding table
    await queryRunner.createTable(
      new Table({
        name: 'platform_branding',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'logo_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'favicon_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'primary_color',
            type: 'varchar',
            length: '7',
            default: "'#3b82f6'",
            comment: 'Hex color code',
          },
          {
            name: 'secondary_color',
            type: 'varchar',
            length: '7',
            default: "'#8b5cf6'",
            comment: 'Hex color code',
          },
          {
            name: 'accent_color',
            type: 'varchar',
            length: '7',
            default: "'#10b981'",
            comment: 'Hex color code',
          },
          {
            name: 'font_family',
            type: 'varchar',
            length: '100',
            default: "'Inter'",
          },
          {
            name: 'custom_css',
            type: 'text',
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
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['updated_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Insert default platform branding
    await queryRunner.query(`
      INSERT INTO platform_branding (
        primary_color,
        secondary_color,
        accent_color,
        font_family
      ) VALUES (
        '#3b82f6',
        '#8b5cf6',
        '#10b981',
        'Inter'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('platform_branding');
    await queryRunner.dropTable('platform_settings');
  }
}
