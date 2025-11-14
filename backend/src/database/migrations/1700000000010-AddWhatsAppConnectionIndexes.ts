import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsAppConnectionIndexes1700000000010 implements MigrationInterface {
  name = 'AddWhatsAppConnectionIndexes1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index for tenantId and type
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_whatsapp_connections_tenant_type" 
      ON "whatsapp_connections" ("tenantId", "type")
    `);

    // Add composite index for tenantId and createdAt (for ordering)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_whatsapp_connections_tenant_created" 
      ON "whatsapp_connections" ("tenantId", "createdAt")
    `);

    // Add index on name for search
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_whatsapp_connections_name" 
      ON "whatsapp_connections" ("name")
    `);

    // Add index on type
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_whatsapp_connections_type" 
      ON "whatsapp_connections" ("type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_whatsapp_connections_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_whatsapp_connections_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_whatsapp_connections_tenant_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_whatsapp_connections_tenant_type"`);
  }
}
