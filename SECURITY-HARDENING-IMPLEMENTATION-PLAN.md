# 🔒 Security Hardening Implementation Plan

## Overview

This document provides a **production-ready, non-breaking** implementation plan for hardening your WhatsApp CRM security. All changes are **additive** and **backward-compatible**.

**Database:** TypeORM (PostgreSQL)  
**Approach:** Incremental migrations with zero downtime  
**Testing:** Each phase includes integration tests

---

## 📋 Phase 1: Critical Security Fixes (Week 1)

### Priority 1.1: Restrict Sensitive Operations to Admin Only
**Time:** 2 hours  
**Risk:** None (additive only)  
**Breaking:** No

#### Changes Required:

**1. API Keys Controller**
```typescript
// backend/src/modules/api-keys/api-keys.controller.ts
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Add RolesGuard
export class ApiKeysController {
  
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this line
  async create(@Request() req, @Body() createApiKeyDto: CreateApiKeyDto) {
    // existing code unchanged
  }
  
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this line
  async update(/* existing params */) {
    // existing code unchanged
  }
  
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this line
  async remove(/* existing params */) {
    // existing code unchanged
  }
}
```

**2. Webhooks Controller**
```typescript
// backend/src/modules/webhooks/webhooks.controller.ts
@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Add RolesGuard
export class WebhooksController {
  
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add
  async create(/* existing params */) {
    // existing code unchanged
  }
  
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add
  async update(/* existing params */) {
    // existing code unchanged
  }
  
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add
  async remove(/* existing params */) {
    // existing code unchanged
  }
}
```

**3. WhatsApp Controller**
```typescript
// backend/src/modules/whatsapp/whatsapp.controller.ts
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Add RolesGuard
export class WhatsAppController {
  
  @Post('connections')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add
  create(/* existing params */) {
    // existing code unchanged
  }
  
  @Delete('connections/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add
  remove(/* existing params */) {
    // existing code unchanged
  }
  
  @Post('connections/:id/disconnect')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add
  disconnect(/* existing params */) {
    // existing code unchanged
  }
}
```



**Testing:**
```typescript
// test/api-keys.e2e-spec.ts
describe('API Keys Security', () => {
  it('should prevent agents from creating API keys', async () => {
    const agentToken = await getAgentToken();
    const response = await request(app.getHttpServer())
      .post('/api-keys')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ name: 'Test Key' })
      .expect(403);
  });
  
  it('should allow admins to create API keys', async () => {
    const adminToken = await getAdminToken();
    const response = await request(app.getHttpServer())
      .post('/api-keys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Key' })
      .expect(201);
  });
});
```

---

### Priority 1.2: Prevent Admin-to-Admin Deletion + Add Soft Delete
**Time:** 4 hours  
**Risk:** Low (backward compatible)  
**Breaking:** No

#### Step 1: Add Soft Delete Column (Migration)

```typescript
// backend/src/database/migrations/TIMESTAMP-AddSoftDeleteToUsers.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSoftDeleteToUsers1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deletedAt column
    await queryRunner.addColumn('users', new TableColumn({
      name: 'deleted_at',
      type: 'timestamp',
      isNullable: true,
      default: null,
    }));
    
    // Add isOwner flag
    await queryRunner.addColumn('users', new TableColumn({
      name: 'is_owner',
      type: 'boolean',
      default: false,
    }));
    
    // Set first admin of each tenant as owner
    await queryRunner.query(`
      UPDATE users u1
      SET is_owner = true
      WHERE role = 'admin'
      AND id = (
        SELECT id FROM users u2
        WHERE u2.tenant_id = u1.tenant_id
        AND u2.role = 'admin'
        ORDER BY created_at ASC
        LIMIT 1
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'deleted_at');
    await queryRunner.dropColumn('users', 'is_owner');
  }
}
```

#### Step 2: Update User Entity

```typescript
// backend/src/modules/users/entities/user.entity.ts
import { DeleteDateColumn } from 'typeorm';

@Entity('users')
export class User {
  // ... existing columns ...
  
  @Column({ name: 'is_owner', default: false })
  isOwner: boolean;
  
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
  
  // ... rest of entity ...
}
```

#### Step 3: Update Users Service

```typescript
// backend/src/modules/users/users.service.ts
async remove(requestingUserId: string, targetUserId: string): Promise<void> {
  const [requestingUser, targetUser] = await Promise.all([
    this.usersRepository.findOne({ where: { id: requestingUserId } }),
    this.usersRepository.findOne({ where: { id: targetUserId } }),
  ]);

  if (!requestingUser || !targetUser) {
    throw new NotFoundException('User not found');
  }

  // Prevent self-deletion
  if (requestingUserId === targetUserId) {
    throw new ForbiddenException('You cannot delete your own account');
  }

  // Prevent owner deletion without transfer
  if (targetUser.isOwner) {
    throw new ForbiddenException(
      'Owner accounts require ownership transfer before deletion. Contact support.'
    );
  }

  // Prevent admins from deleting other admins
  if (
    requestingUser.role === UserRole.ADMIN &&
    targetUser.role === UserRole.ADMIN
  ) {
    throw new ForbiddenException(
      'Admins cannot delete other admins. Contact super admin for assistance.'
    );
  }

  // Only super admin can delete admins
  if (
    targetUser.role === UserRole.ADMIN &&
    requestingUser.role !== UserRole.SUPER_ADMIN
  ) {
    throw new ForbiddenException('Only super admins can delete admin users');
  }

  // Soft delete
  await this.usersRepository.softDelete(targetUserId);
  
  // Revoke all sessions and tokens
  await this.revokeAllUserSessions(targetUserId);
}

private async revokeAllUserSessions(userId: string): Promise<void> {
  // Clear refresh token
  await this.usersRepository.update(userId, { refreshToken: null });
  
  // Revoke all API keys
  await this.apiKeysService.revokeAllForUser(userId);
}
```

#### Step 4: Update Users Controller

```typescript
// backend/src/modules/users/users.controller.ts
@Delete(':id')
async remove(@Request() req, @Param('id') id: string): Promise<void> {
  return this.usersService.remove(req.user.userId, id);  // ← Pass requesting user ID
}
```

---

## 📋 Phase 2: API Key Hardening (Week 2)

### Priority 2.1: Add Scopes and Enhanced Metadata
**Time:** 6 hours  
**Risk:** Low (additive)  
**Breaking:** No

#### Step 1: Migration

```typescript
// backend/src/database/migrations/TIMESTAMP-EnhanceApiKeys.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceApiKeys1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add scopes column
    await queryRunner.addColumn('api_keys', new TableColumn({
      name: 'scopes',
      type: 'text',
      isArray: true,
      default: "'{}'",
    }));
    
    // Add revoked_at column
    await queryRunner.addColumn('api_keys', new TableColumn({
      name: 'revoked_at',
      type: 'timestamp',
      isNullable: true,
      default: null,
    }));
    
    // Add revoked_by column
    await queryRunner.addColumn('api_keys', new TableColumn({
      name: 'revoked_by_user_id',
      type: 'uuid',
      isNullable: true,
    }));
    
    // Add revocation_reason column
    await queryRunner.addColumn('api_keys', new TableColumn({
      name: 'revocation_reason',
      type: 'text',
      isNullable: true,
    }));
    
    // Set default scopes for existing keys (full access)
    await queryRunner.query(`
      UPDATE api_keys
      SET scopes = ARRAY[
        'conversations:read',
        'conversations:write',
        'contacts:read',
        'contacts:write',
        'campaigns:read',
        'campaigns:write',
        'templates:read',
        'templates:write'
      ]
      WHERE scopes = '{}';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('api_keys', 'scopes');
    await queryRunner.dropColumn('api_keys', 'revoked_at');
    await queryRunner.dropColumn('api_keys', 'revoked_by_user_id');
    await queryRunner.dropColumn('api_keys', 'revocation_reason');
  }
}
```

#### Step 2: Update API Key Entity

```typescript
// backend/src/modules/api-keys/entities/api-key.entity.ts
@Entity('api_keys')
export class ApiKey {
  // ... existing columns ...
  
  @Column({ type: 'simple-array', default: [] })
  scopes: string[];
  
  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date;
  
  @Column({ name: 'revoked_by_user_id', nullable: true })
  revokedByUserId: string;
  
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'revoked_by_user_id' })
  revokedBy: User;
  
  @Column({ name: 'revocation_reason', type: 'text', nullable: true })
  revocationReason: string;
  
  // Helper methods
  get isRevoked(): boolean {
    return this.revokedAt !== null;
  }
  
  get isExpired(): boolean {
    return this.expiresAt && this.expiresAt < new Date();
  }
  
  get isValid(): boolean {
    return this.isActive && !this.isRevoked && !this.isExpired;
  }
}
```

#### Step 3: Define Scopes

```typescript
// backend/src/modules/api-keys/constants/api-scopes.ts
export const API_SCOPES = {
  // Conversations
  CONVERSATIONS_READ: 'conversations:read',
  CONVERSATIONS_WRITE: 'conversations:write',
  CONVERSATIONS_DELETE: 'conversations:delete',
  CONVERSATIONS_EXPORT: 'conversations:export',
  
  // Contacts
  CONTACTS_READ: 'contacts:read',
  CONTACTS_WRITE: 'contacts:write',
  CONTACTS_DELETE: 'contacts:delete',
  CONTACTS_EXPORT: 'contacts:export',
  
  // Campaigns
  CAMPAIGNS_READ: 'campaigns:read',
  CAMPAIGNS_WRITE: 'campaigns:write',
  CAMPAIGNS_DELETE: 'campaigns:delete',
  
  // Templates
  TEMPLATES_READ: 'templates:read',
  TEMPLATES_WRITE: 'templates:write',
  TEMPLATES_DELETE: 'templates:delete',
  
  // Webhooks
  WEBHOOKS_READ: 'webhooks:read',
  WEBHOOKS_WRITE: 'webhooks:write',
  
  // Analytics
  ANALYTICS_READ: 'analytics:read',
} as const;

export const SCOPE_GROUPS = {
  READ_ONLY: [
    API_SCOPES.CONVERSATIONS_READ,
    API_SCOPES.CONTACTS_READ,
    API_SCOPES.CAMPAIGNS_READ,
    API_SCOPES.TEMPLATES_READ,
    API_SCOPES.ANALYTICS_READ,
  ],
  FULL_ACCESS: Object.values(API_SCOPES),
};
```

#### Step 4: Create Scope Guard

```typescript
// backend/src/modules/api-keys/guards/api-scope.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRED_SCOPES_KEY = 'required_scopes';
export const RequiredScopes = (...scopes: string[]) => 
  SetMetadata(REQUIRED_SCOPES_KEY, scopes);

@Injectable()
export class ApiScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.apiKey;

    if (!apiKey) {
      return true; // Not an API key request, let other guards handle
    }

    const hasAllScopes = requiredScopes.every(scope => 
      apiKey.scopes.includes(scope)
    );

    if (!hasAllScopes) {
      throw new ForbiddenException(
        `API key missing required scopes: ${requiredScopes.join(', ')}`
      );
    }

    return true;
  }
}
```

#### Step 5: Update API Key Service

```typescript
// backend/src/modules/api-keys/api-keys.service.ts
async revoke(
  tenantId: string,
  apiKeyId: string,
  revokedByUserId: string,
  reason?: string,
): Promise<void> {
  const apiKey = await this.findOne(tenantId, apiKeyId);
  
  if (apiKey.isRevoked) {
    throw new BadRequestException('API key is already revoked');
  }
  
  await this.apiKeysRepository.update(apiKeyId, {
    revokedAt: new Date(),
    revokedByUserId,
    revocationReason: reason,
    isActive: false,
  });
}

async revokeAllForUser(userId: string): Promise<void> {
  await this.apiKeysRepository.update(
    { createdByUserId: userId },
    {
      revokedAt: new Date(),
      revokedByUserId: userId,
      revocationReason: 'User account deleted',
      isActive: false,
    }
  );
}

async validateApiKey(keyHash: string): Promise<ApiKey | null> {
  const apiKey = await this.apiKeysRepository.findOne({
    where: { keyHash },
    relations: ['tenant', 'createdBy'],
  });
  
  if (!apiKey) {
    return null;
  }
  
  // Check if valid
  if (!apiKey.isValid) {
    return null;
  }
  
  // Update last used
  await this.apiKeysRepository.update(apiKey.id, {
    lastUsedAt: new Date(),
    totalRequests: () => 'total_requests + 1',
  });
  
  return apiKey;
}
```

#### Step 6: Add Revoke Endpoint

```typescript
// backend/src/modules/api-keys/api-keys.controller.ts
@Post(':id/revoke')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
async revoke(
  @Request() req,
  @Param('id') id: string,
  @Body() body: { reason?: string },
) {
  await this.apiKeysService.revoke(
    req.user.tenantId,
    id,
    req.user.userId,
    body.reason,
  );
  
  return {
    message: 'API key revoked successfully',
  };
}
```



---

## 📋 Phase 3: Webhook Security (Week 2)

### Priority 3.1: Add Signature Verification & URL Whitelist
**Time:** 4 hours  
**Risk:** Low (additive)  
**Breaking:** No

#### Step 1: Migration

```typescript
// backend/src/database/migrations/TIMESTAMP-EnhanceWebhooks.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceWebhooks1234567892 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add created_by column
    await queryRunner.addColumn('webhooks', new TableColumn({
      name: 'created_by_user_id',
      type: 'uuid',
      isNullable: true,
    }));
    
    // Add signature_algorithm column
    await queryRunner.addColumn('webhooks', new TableColumn({
      name: 'signature_algorithm',
      type: 'varchar',
      default: "'hmac-sha256'",
    }));
    
    // Add requires_approval column
    await queryRunner.addColumn('webhooks', new TableColumn({
      name: 'requires_approval',
      type: 'boolean',
      default: false,
    }));
    
    // Add approved_at column
    await queryRunner.addColumn('webhooks', new TableColumn({
      name: 'approved_at',
      type: 'timestamp',
      isNullable: true,
    }));
    
    // Add approved_by column
    await queryRunner.addColumn('webhooks', new TableColumn({
      name: 'approved_by_user_id',
      type: 'uuid',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('webhooks', 'created_by_user_id');
    await queryRunner.dropColumn('webhooks', 'signature_algorithm');
    await queryRunner.dropColumn('webhooks', 'requires_approval');
    await queryRunner.dropColumn('webhooks', 'approved_at');
    await queryRunner.dropColumn('webhooks', 'approved_by_user_id');
  }
}
```

#### Step 2: Update Webhook Entity

```typescript
// backend/src/modules/webhooks/entities/webhook.entity.ts
@Entity('webhooks')
export class Webhook {
  // ... existing columns ...
  
  @Column({ name: 'created_by_user_id', nullable: true })
  createdByUserId: string;
  
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;
  
  @Column({ name: 'signature_algorithm', default: 'hmac-sha256' })
  signatureAlgorithm: string;
  
  @Column({ name: 'requires_approval', default: false })
  requiresApproval: boolean;
  
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;
  
  @Column({ name: 'approved_by_user_id', nullable: true })
  approvedByUserId: string;
  
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedBy: User;
  
  get isApproved(): boolean {
    return !this.requiresApproval || this.approvedAt !== null;
  }
}
```

#### Step 3: Add URL Whitelist Configuration

```typescript
// backend/src/modules/webhooks/constants/webhook-config.ts
export const WEBHOOK_CONFIG = {
  // Allowed domains (can be configured per tenant)
  ALLOWED_DOMAINS: [
    'webhook.site',
    'requestbin.com',
    'pipedream.com',
    // Add your trusted domains
  ],
  
  // Require approval for non-whitelisted domains
  REQUIRE_APPROVAL_FOR_EXTERNAL: true,
  
  // Max webhooks per tenant
  MAX_WEBHOOKS_PER_TENANT: 10,
  
  // Rate limits
  MAX_DELIVERIES_PER_MINUTE: 60,
};

export function isWhitelistedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    return WEBHOOK_CONFIG.ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}
```

#### Step 4: Update Webhook Service

```typescript
// backend/src/modules/webhooks/webhooks.service.ts
import * as crypto from 'crypto';

async create(
  tenantId: string,
  userId: string,
  createWebhookDto: CreateWebhookDto,
): Promise<Webhook> {
  // Check webhook limit
  const count = await this.webhooksRepository.count({ where: { tenantId } });
  if (count >= WEBHOOK_CONFIG.MAX_WEBHOOKS_PER_TENANT) {
    throw new BadRequestException(
      `Maximum ${WEBHOOK_CONFIG.MAX_WEBHOOKS_PER_TENANT} webhooks per tenant`
    );
  }
  
  // Check if URL needs approval
  const requiresApproval = 
    WEBHOOK_CONFIG.REQUIRE_APPROVAL_FOR_EXTERNAL &&
    !isWhitelistedDomain(createWebhookDto.url);
  
  const webhook = this.webhooksRepository.create({
    ...createWebhookDto,
    tenantId,
    createdByUserId: userId,
    requiresApproval,
    secret: this.generateSecret(),
  });
  
  await this.webhooksRepository.save(webhook);
  
  if (requiresApproval) {
    // Send notification to admins
    await this.notifyAdminsForApproval(webhook);
  }
  
  return webhook;
}

private generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

async approveWebhook(
  webhookId: string,
  approvedByUserId: string,
): Promise<Webhook> {
  const webhook = await this.findOne(webhookId);
  
  if (!webhook.requiresApproval) {
    throw new BadRequestException('Webhook does not require approval');
  }
  
  if (webhook.isApproved) {
    throw new BadRequestException('Webhook is already approved');
  }
  
  await this.webhooksRepository.update(webhookId, {
    approvedAt: new Date(),
    approvedByUserId,
    isActive: true,
  });
  
  return this.findOne(webhookId);
}

generateSignature(payload: any, secret: string): string {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
}

verifySignature(
  payload: any,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = this.generateSignature(payload, secret);
  
  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
```

#### Step 5: Add Approval Endpoint

```typescript
// backend/src/modules/webhooks/webhooks.controller.ts
@Post(':id/approve')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
async approveWebhook(
  @Request() req,
  @Param('id') id: string,
) {
  const webhook = await this.webhooksService.approveWebhook(
    id,
    req.user.userId,
  );
  
  return {
    message: 'Webhook approved successfully',
    data: webhook,
  };
}
```

---

## 📋 Phase 4: Audit Logging System (Week 3)

### Priority 4.1: Comprehensive Audit Trail
**Time:** 8 hours  
**Risk:** Low (new feature)  
**Breaking:** No

#### Step 1: Create Audit Log Entity

```typescript
// backend/src/modules/audit/entities/audit-log.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
@Index(['actorId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  action: string;

  @Column({ nullable: true })
  actorId: string;

  @Column({ nullable: true })
  actorEmail: string;

  @Column({ nullable: true })
  actorRole: string;

  @Column({ nullable: true })
  targetId: string;

  @Column({ nullable: true })
  targetType: string;

  @Column({ nullable: true })
  @Index()
  tenantId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  changes: {
    before?: any;
    after?: any;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
```

#### Step 2: Create Migration

```typescript
// backend/src/database/migrations/TIMESTAMP-CreateAuditLogs.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditLogs1234567893 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'action',
            type: 'varchar',
          },
          {
            name: 'actor_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'actor_email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'actor_role',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'target_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'target_type',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_tenant_created',
        columnNames: ['tenant_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_actor_created',
        columnNames: ['actor_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_action_created',
        columnNames: ['action', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
```

#### Step 3: Create Audit Service

```typescript
// backend/src/modules/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export enum AuditAction {
  // User actions
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  
  // Admin actions
  ADMIN_IMPERSONATE = 'admin.impersonate',
  ADMIN_DELETE_USER = 'admin.delete_user',
  
  // API Key actions
  API_KEY_CREATED = 'api_key.created',
  API_KEY_REVOKED = 'api_key.revoked',
  API_KEY_DELETED = 'api_key.deleted',
  
  // Webhook actions
  WEBHOOK_CREATED = 'webhook.created',
  WEBHOOK_APPROVED = 'webhook.approved',
  WEBHOOK_DELETED = 'webhook.deleted',
  
  // WhatsApp actions
  WHATSAPP_CONNECTED = 'whatsapp.connected',
  WHATSAPP_DISCONNECTED = 'whatsapp.disconnected',
  
  // Tenant actions
  TENANT_CREATED = 'tenant.created',
  TENANT_UPDATED = 'tenant.updated',
  TENANT_SUSPENDED = 'tenant.suspended',
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: {
    action: AuditAction | string;
    actorId?: string;
    actorEmail?: string;
    actorRole?: string;
    targetId?: string;
    targetType?: string;
    tenantId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    changes?: { before?: any; after?: any };
  }): Promise<AuditLog> {
    const log = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(log);
  }

  async findByTenant(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ data: AuditLog[]; total: number }> {
    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId });

    if (options?.action) {
      query.andWhere('log.action = :action', { action: options.action });
    }

    if (options?.startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: options.endDate });
    }

    query.orderBy('log.createdAt', 'DESC');

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findByActor(
    actorId: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { actorId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
```

#### Step 4: Create Audit Interceptor

```typescript
// backend/src/common/interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, ip, headers } = request;

    // Determine action from route
    const action = this.getActionFromRoute(method, url);

    if (!action) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // Log after successful execution
        this.auditService.log({
          action,
          actorId: user?.userId,
          actorEmail: user?.email,
          actorRole: user?.role,
          tenantId: user?.tenantId,
          ipAddress: ip,
          userAgent: headers['user-agent'],
          metadata: {
            method,
            url,
          },
        });
      }),
    );
  }

  private getActionFromRoute(method: string, url: string): string | null {
    // Map routes to actions
    if (url.includes('/api-keys') && method === 'POST') {
      return 'api_key.created';
    }
    if (url.includes('/api-keys') && method === 'DELETE') {
      return 'api_key.deleted';
    }
    if (url.includes('/webhooks') && method === 'POST') {
      return 'webhook.created';
    }
    // Add more mappings as needed
    return null;
  }
}
```

#### Step 5: Use in Critical Operations

```typescript
// backend/src/modules/super-admin/super-admin.service.ts
async impersonateTenant(
  superAdminId: string,
  tenantId: string,
  ipAddress: string,
  reason?: string,
) {
  // Log the impersonation
  await this.auditService.log({
    action: AuditAction.ADMIN_IMPERSONATE,
    actorId: superAdminId,
    targetId: tenantId,
    targetType: 'tenant',
    tenantId,
    ipAddress,
    metadata: {
      reason: reason || 'Customer support',
      timestamp: new Date(),
    },
  });
  
  // Generate short-lived token
  const token = await this.generateImpersonationToken(tenantId);
  
  return { token, expiresIn: '1h' };
}
```



---

## 📋 Phase 5: Additional Security Enhancements (Week 4)

### Priority 5.1: Rate Limiting
**Time:** 2 hours  
**Risk:** None  
**Breaking:** No

```bash
cd backend
npm install @nestjs/throttler
```

```typescript
// backend/src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    // ... other imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... other providers
  ],
})
export class AppModule {}
```

```typescript
// backend/src/modules/auth/auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle(5, 60)  // 5 attempts per minute
  async login(@Body() loginDto: LoginDto) {
    // existing code
  }
  
  @Post('register')
  @Throttle(3, 3600)  // 3 registrations per hour
  async register(@Body() registerDto: RegisterDto) {
    // existing code
  }
}
```

### Priority 5.2: Password Policy
**Time:** 1 hour  
**Risk:** None  
**Breaking:** No

```typescript
// backend/src/modules/auth/dto/register.dto.ts
import { IsStrongPassword } from 'class-validator';

export class RegisterDto {
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }, {
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol'
  })
  password: string;
  
  // ... other fields
}
```

### Priority 5.3: Transaction Wrapping for Registration
**Time:** 2 hours  
**Risk:** Low  
**Breaking:** No

```typescript
// backend/src/modules/auth/auth.service.ts
import { DataSource } from 'typeorm';

constructor(
  private dataSource: DataSource,
  // ... other dependencies
) {}

async register(registerDto: RegisterDto) {
  // Check email first (outside transaction)
  const existingUser = await this.usersService.findByEmail(registerDto.email);
  if (existingUser) {
    throw new ConflictException('Email already exists');
  }

  // Use transaction for tenant + user creation
  return await this.dataSource.transaction(async (manager) => {
    // Create tenant
    const tenant = manager.create(Tenant, {
      name: `${registerDto.firstName} ${registerDto.lastName}'s Workspace`,
      slug: this.generateSlug(registerDto.email),
      status: 'active',
    });
    await manager.save(tenant);
    
    // Create admin user
    const hashedPassword = await this.usersService.hashPassword(registerDto.password);
    const user = manager.create(User, {
      ...registerDto,
      password: hashedPassword,
      tenantId: tenant.id,
      role: UserRole.ADMIN,
      isOwner: true,  // First admin is owner
    });
    await manager.save(user);
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Log audit
    await this.auditService.log({
      action: AuditAction.USER_CREATED,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      tenantId: tenant.id,
      metadata: {
        registrationType: 'self-registration',
      },
    });
    
    return { user, tenant, tokens };
  });
}

private generateSlug(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
}
```

---

## 📋 Testing Strategy

### Unit Tests

```typescript
// backend/src/modules/users/users.service.spec.ts
describe('UsersService - Security', () => {
  describe('remove', () => {
    it('should prevent admin from deleting another admin', async () => {
      const admin1 = createMockUser({ role: UserRole.ADMIN });
      const admin2 = createMockUser({ role: UserRole.ADMIN });
      
      await expect(
        service.remove(admin1.id, admin2.id)
      ).rejects.toThrow(ForbiddenException);
    });
    
    it('should prevent owner deletion', async () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      const owner = createMockUser({ role: UserRole.ADMIN, isOwner: true });
      
      await expect(
        service.remove(admin.id, owner.id)
      ).rejects.toThrow(ForbiddenException);
    });
    
    it('should allow super admin to delete admin', async () => {
      const superAdmin = createMockUser({ role: UserRole.SUPER_ADMIN });
      const admin = createMockUser({ role: UserRole.ADMIN });
      
      await expect(
        service.remove(superAdmin.id, admin.id)
      ).resolves.not.toThrow();
    });
  });
});
```

### Integration Tests

```typescript
// backend/test/security.e2e-spec.ts
describe('Security (e2e)', () => {
  describe('API Keys', () => {
    it('should prevent agents from creating API keys', async () => {
      const agentToken = await getAgentToken();
      
      return request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ name: 'Test Key', scopes: ['conversations:read'] })
        .expect(403);
    });
    
    it('should allow admins to create API keys with scopes', async () => {
      const adminToken = await getAdminToken();
      
      const response = await request(app.getHttpServer())
        .post('/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Key',
          scopes: ['conversations:read', 'contacts:read'],
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .expect(201);
      
      expect(response.body.apiKey.scopes).toEqual([
        'conversations:read',
        'contacts:read',
      ]);
    });
  });
  
  describe('Audit Logs', () => {
    it('should log impersonation', async () => {
      const superAdminToken = await getSuperAdminToken();
      const tenant = await createTestTenant();
      
      await request(app.getHttpServer())
        .post(`/super-admin/tenants/${tenant.id}/impersonate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Testing' })
        .expect(200);
      
      const logs = await auditService.findByTenant(tenant.id);
      expect(logs.data).toContainEqual(
        expect.objectContaining({
          action: 'admin.impersonate',
        })
      );
    });
  });
});
```

---

## 📊 Migration Checklist

### Pre-Migration
- [ ] Backup database
- [ ] Review all migrations
- [ ] Test migrations on staging
- [ ] Prepare rollback plan

### Migration Execution
- [ ] Run migrations in order
- [ ] Verify data integrity
- [ ] Check indexes created
- [ ] Test backward compatibility

### Post-Migration
- [ ] Run integration tests
- [ ] Verify existing functionality
- [ ] Monitor error logs
- [ ] Update documentation

---

## 🚀 Deployment Strategy

### Phase 1 (Week 1)
1. Deploy role guards (no migration needed)
2. Test in staging for 2 days
3. Deploy to production
4. Monitor for 403 errors

### Phase 2 (Week 2)
1. Run soft delete migration
2. Deploy user deletion logic
3. Test admin deletion prevention
4. Monitor audit logs

### Phase 3 (Week 2-3)
1. Run API key enhancement migration
2. Deploy scope system
3. Test API key validation
4. Monitor API usage

### Phase 4 (Week 3)
1. Run webhook enhancement migration
2. Deploy signature verification
3. Test webhook delivery
4. Monitor webhook logs

### Phase 5 (Week 3-4)
1. Run audit log migration
2. Deploy audit service
3. Enable audit logging
4. Create audit dashboard

### Phase 6 (Week 4)
1. Deploy rate limiting
2. Deploy password policy
3. Deploy transaction wrapping
4. Final testing

---

## 📈 Success Metrics

### Security Metrics
- [ ] Zero unauthorized API key creations by agents
- [ ] Zero admin-to-admin deletions
- [ ] 100% impersonation events logged
- [ ] All webhooks have signatures
- [ ] All API keys have scopes

### Performance Metrics
- [ ] No increase in response times
- [ ] No database deadlocks
- [ ] Audit logs under 100ms write time
- [ ] Rate limiting working correctly

### Business Metrics
- [ ] Zero customer complaints about access
- [ ] Zero data breach incidents
- [ ] Compliance requirements met
- [ ] Audit trail available for review

---

## 🔧 Rollback Plan

### If Issues Occur

**Phase 1 (Role Guards):**
```typescript
// Remove @Roles decorators
// Redeploy without guards
```

**Phase 2-5 (Database Changes):**
```bash
# Revert migrations
npm run migration:revert

# Redeploy previous version
git checkout <previous-tag>
npm run build
npm run start:prod
```

**Emergency Rollback:**
```sql
-- Restore from backup
pg_restore -d whatscrm_db backup.dump
```

---

## 📞 Support & Questions

If you encounter any issues during implementation:

1. Check migration logs
2. Review error messages
3. Test in staging first
4. Ask for help if stuck

**Want me to implement any specific phase?** Just let me know which one!

---

## ✅ Final Checklist

Before going to production:

- [ ] All migrations tested
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Backup created
- [ ] Staging tested
- [ ] Security review completed
- [ ] Compliance verified
