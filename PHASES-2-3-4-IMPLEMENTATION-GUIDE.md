# 🔒 Phases 2-4 Implementation Guide

## Overview

This guide provides step-by-step instructions to implement the remaining enterprise security features from the hardening plan.

**Current Status:** Phase 1 & 5 complete (40% done)
**This Guide:** Phases 2, 3, 4 (60% remaining)
**Total Effort:** ~18 hours

---

## ⚠️ Important Note

**You don't need these features yet!** Your current implementation is production-ready for most use cases.

**Implement these when:**
- You have enterprise customers
- Compliance requires it (SOC 2, ISO 27001)
- You have complex integration needs
- Security audit mandates it

---

## 📋 Phase 2: API Key Scopes (6 hours)

### What You'll Get:
- Fine-grained API permissions
- Read-only API keys
- Scope-based access control
- Enhanced revocation tracking

### Implementation Steps:

#### Step 1: Create Migration (30 min)

```bash
cd backend
npm run migration:create -- src/database/migrations/EnhanceApiKeys
```

**File:** `backend/src/database/migrations/TIMESTAMP-EnhanceApiKeys.ts`

```typescript
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
    }));
    
    // Add revoked_by column
    await queryRunner.addColumn('api_keys', new TableColumn({
      name: 'revoked_by_user_id',
      type: 'uuid',
      isNullable: true,
    }));
    
    // Add revocation_reason
    await queryRunner.addColumn('api_keys', new TableColumn({
      name: 'revocation_reason',
      type: 'text',
      isNullable: true,
    }));
    
    // Set default scopes for existing keys
    await queryRunner.query(`
      UPDATE api_keys
      SET scopes = ARRAY[
        'conversations:read',
        'conversations:write',
        'contacts:read',
        'contacts:write',
        'campaigns:read',
        'campaigns:write'
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

#### Step 2: Define Scopes (30 min)

**File:** `backend/src/modules/api-keys/constants/api-scopes.ts`

```typescript
export const API_SCOPES = {
  // Conversations
  CONVERSATIONS_READ: 'conversations:read',
  CONVERSATIONS_WRITE: 'conversations:write',
  CONVERSATIONS_DELETE: 'conversations:delete',
  
  // Contacts
  CONTACTS_READ: 'contacts:read',
  CONTACTS_WRITE: 'contacts:write',
  CONTACTS_DELETE: 'contacts:delete',
  
  // Campaigns
  CAMPAIGNS_READ: 'campaigns:read',
  CAMPAIGNS_WRITE: 'campaigns:write',
  
  // Templates
  TEMPLATES_READ: 'templates:read',
  TEMPLATES_WRITE: 'templates:write',
  
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

#### Step 3: Update Entity (1 hour)

**File:** `backend/src/modules/api-keys/entities/api-key.entity.ts`

Add these fields:

```typescript
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

get isValid(): boolean {
  return this.isActive && !this.isRevoked && !this.isExpired;
}
```

#### Step 4: Create Scope Guard (2 hours)

**File:** `backend/src/modules/api-keys/guards/api-scope.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

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
      return true; // Not an API key request
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

#### Step 5: Update Service (2 hours)

**File:** `backend/src/modules/api-keys/api-keys.service.ts`

Add these methods:

```typescript
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

async validateApiKey(keyHash: string): Promise<ApiKey | null> {
  const apiKey = await this.apiKeysRepository.findOne({
    where: { keyHash },
    relations: ['tenant', 'createdBy'],
  });
  
  if (!apiKey || !apiKey.isValid) {
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

#### Step 6: Add Revoke Endpoint (30 min)

**File:** `backend/src/modules/api-keys/api-keys.controller.ts`

```typescript
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

#### Step 7: Apply Scope Guards (30 min)

Example usage in controllers:

```typescript
import { RequiredScopes } from '../api-keys/guards/api-scope.guard';
import { API_SCOPES } from '../api-keys/constants/api-scopes';

@Get()
@RequiredScopes(API_SCOPES.CONVERSATIONS_READ)
async findAll() {
  // Only API keys with conversations:read scope can access
}

@Post()
@RequiredScopes(API_SCOPES.CONVERSATIONS_WRITE)
async create() {
  // Only API keys with conversations:write scope can access
}
```

---

## 📋 Phase 3: Webhook Security (4 hours)

### What You'll Get:
- HMAC signature verification
- URL whitelist/approval
- Enhanced security metadata

### Implementation Steps:

#### Step 1: Create Migration (30 min)

```bash
npm run migration:create -- src/database/migrations/EnhanceWebhooks
```

**File:** `backend/src/database/migrations/TIMESTAMP-EnhanceWebhooks.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceWebhooks1234567892 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('webhooks', new TableColumn({
      name: 'created_by_user_id',
      type: 'uuid',
      isNullable: true,
    }));
    
    await queryRunner.addColumn('webhooks', new TableColumn({
      name: 'signature_algorithm',
      type: 'varchar',
      default: "'hmac-sha256'",
    }));
    
    await queryRunner.addColumn('webhooks', new TableColumn({
      name: 'requires_approval',
      type: 'boolean',
      default: false,
    }));
    
    await queryRunner.addColumn('webhooks', new TableColumn({
      name: 'approved_at',
      type: 'timestamp',
      isNullable: true,
    }));
    
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

#### Step 2: Update Entity (30 min)

**File:** `backend/src/modules/webhooks/entities/webhook.entity.ts`

Add these fields:

```typescript
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
```

#### Step 3: Add URL Whitelist (1 hour)

**File:** `backend/src/modules/webhooks/constants/webhook-config.ts`

```typescript
export const WEBHOOK_CONFIG = {
  ALLOWED_DOMAINS: [
    'webhook.site',
    'requestbin.com',
    'pipedream.com',
    // Add your trusted domains
  ],
  
  REQUIRE_APPROVAL_FOR_EXTERNAL: true,
  MAX_WEBHOOKS_PER_TENANT: 10,
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

#### Step 4: Add Signature Methods (1 hour)

**File:** `backend/src/modules/webhooks/webhooks.service.ts`

Add these methods:

```typescript
import * as crypto from 'crypto';

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
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

async approveWebhook(
  webhookId: string,
  approvedByUserId: string,
): Promise<Webhook> {
  const webhook = await this.findOne(webhookId);
  
  if (!webhook.requiresApproval) {
    throw new BadRequestException('Webhook does not require approval');
  }
  
  await this.webhooksRepository.update(webhookId, {
    approvedAt: new Date(),
    approvedByUserId,
    isActive: true,
  });
  
  return this.findOne(webhookId);
}
```

#### Step 5: Add Approval Endpoint (30 min)

**File:** `backend/src/modules/webhooks/webhooks.controller.ts`

```typescript
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

#### Step 6: Update Webhook Delivery (30 min)

**File:** `backend/src/modules/webhooks/services/webhook-delivery.service.ts`

Add signature to webhook delivery:

```typescript
async deliverWebhook(webhook: Webhook, payload: any): Promise<void> {
  const signature = this.webhooksService.generateSignature(
    payload,
    webhook.secret
  );
  
  await axios.post(webhook.url, payload, {
    headers: {
      'X-Webhook-Signature': signature,
      'X-Webhook-Signature-Algorithm': webhook.signatureAlgorithm,
      'Content-Type': 'application/json',
    },
    timeout: webhook.timeoutSeconds * 1000,
  });
}
```

---

## 📋 Phase 4: Audit Logging (8 hours)

### What You'll Get:
- Comprehensive audit trail
- Searchable logs
- Compliance-ready logging

### Implementation Steps:

#### Step 1: Create Entity (1 hour)

**File:** `backend/src/modules/audit/entities/audit-log.entity.ts`

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
@Index(['actorId', 'createdAt'])
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
  targetId: string;

  @Column({ nullable: true })
  @Index()
  tenantId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
```

#### Step 2: Create Migration (1 hour)

```bash
npm run migration:create -- src/database/migrations/CreateAuditLogs
```

See implementation plan for full migration code.

#### Step 3: Create Service (2 hours)

**File:** `backend/src/modules/audit/audit.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export enum AuditAction {
  USER_LOGIN = 'user.login',
  USER_CREATED = 'user.created',
  USER_DELETED = 'user.deleted',
  API_KEY_CREATED = 'api_key.created',
  API_KEY_REVOKED = 'api_key.revoked',
  WEBHOOK_CREATED = 'webhook.created',
  ADMIN_IMPERSONATE = 'admin.impersonate',
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(log);
  }

  async findByTenant(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: string;
    },
  ): Promise<{ data: AuditLog[]; total: number }> {
    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId });

    if (options?.action) {
      query.andWhere('log.action = :action', { action: options.action });
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
}
```

#### Step 4: Create Module (30 min)

**File:** `backend/src/modules/audit/audit.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
```

#### Step 5: Integrate with Operations (3 hours)

Add audit logging to critical operations:

**Example:** User deletion

```typescript
// In users.service.ts
async remove(requestingUserId: string, targetUserId: string): Promise<void> {
  // ... existing code ...
  
  await this.auditService.log({
    action: AuditAction.USER_DELETED,
    actorId: requestingUserId,
    targetId: targetUserId,
    tenantId: targetUser.tenantId,
    metadata: {
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
    },
  });
}
```

**Example:** API key creation

```typescript
// In api-keys.service.ts
async create(...): Promise<ApiKey> {
  // ... existing code ...
  
  await this.auditService.log({
    action: AuditAction.API_KEY_CREATED,
    actorId: userId,
    targetId: apiKey.id,
    tenantId,
    metadata: {
      keyName: apiKey.name,
      scopes: apiKey.scopes,
    },
  });
}
```

#### Step 6: Add Audit Controller (30 min)

**File:** `backend/src/modules/audit/audit.controller.ts`

```typescript
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('action') action?: string,
  ) {
    const result = await this.auditService.findByTenant(
      req.user.tenantId,
      { limit, offset, action }
    );
    
    return result;
  }
}
```

---

## 🧪 Testing

After implementing each phase, test thoroughly:

### Phase 2 Testing:
```bash
# Test API key with scopes
curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Read Only","scopes":["conversations:read"]}'

# Test revocation
curl -X POST http://localhost:3000/api/v1/api-keys/{id}/revoke \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason":"Security audit"}'
```

### Phase 3 Testing:
```bash
# Test webhook approval
curl -X POST http://localhost:3000/api/v1/webhooks/{id}/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Verify signature in webhook receiver
```

### Phase 4 Testing:
```bash
# View audit logs
curl -X GET http://localhost:3000/api/v1/audit \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 📊 Completion Checklist

### Phase 2:
- [ ] Migration created and run
- [ ] Scopes defined
- [ ] Entity updated
- [ ] Scope guard created
- [ ] Service methods added
- [ ] Revoke endpoint added
- [ ] Scope guards applied to controllers
- [ ] Tests passing

### Phase 3:
- [ ] Migration created and run
- [ ] Entity updated
- [ ] URL whitelist configured
- [ ] Signature methods added
- [ ] Approval endpoint added
- [ ] Webhook delivery updated
- [ ] Tests passing

### Phase 4:
- [ ] Entity created
- [ ] Migration created and run
- [ ] Service created
- [ ] Module created
- [ ] Integrated with operations
- [ ] Controller added
- [ ] Tests passing

---

## 🎯 Final Notes

**Remember:** You don't need these features immediately. Your current implementation is production-ready.

**Implement when:**
- Enterprise customers require it
- Compliance audit mandates it
- You have complex integration needs
- Security review recommends it

**Estimated Total Time:** 18 hours
**Complexity:** Medium to High
**Breaking Changes:** None (all additive)

---

**Need help?** Refer back to `SECURITY-HARDENING-IMPLEMENTATION-PLAN.md` for detailed code examples.

**Questions?** Review the existing Phase 1 & 5 implementations as reference.

**Ready to deploy?** Your current security is solid. Deploy with confidence!
