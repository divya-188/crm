# 🔒 Security Fixes Checklist

## Quick Reference for Implementation

### ✅ Phase 1: Critical Fixes (4 hours)

#### 1. Restrict API Keys to Admin Only (30 min)
**File:** `backend/src/modules/api-keys/api-keys.controller.ts`

```typescript
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Add RolesGuard
export class ApiKeysController {
  
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this
  async create(@Request() req, @Body() createApiKeyDto: CreateApiKeyDto) {
    // existing code
  }
  
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this
  async remove(@Request() req, @Param('id') id: string) {
    // existing code
  }
}
```

---

#### 2. Restrict Webhooks to Admin Only (30 min)
**File:** `backend/src/modules/webhooks/webhooks.controller.ts`

```typescript
@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Add RolesGuard
export class WebhooksController {
  
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this
  async create(@Request() req, @Body() createWebhookDto: CreateWebhookDto) {
    // existing code
  }
  
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this
  async remove(@Request() req, @Param('id') id: string) {
    // existing code
  }
}
```

---

#### 3. Restrict WhatsApp Connections to Admin Only (30 min)
**File:** `backend/src/modules/whatsapp/whatsapp.controller.ts`

```typescript
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Add RolesGuard
export class WhatsAppController {
  
  @Post('connections')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this
  create(@TenantId() tenantId: string, @Body() createConnectionDto: CreateConnectionDto) {
    // existing code
  }
  
  @Delete('connections/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    // existing code
  }
  
  @Post('connections/:id/disconnect')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)  // ← Add this
  disconnect(@TenantId() tenantId: string, @Param('id') id: string) {
    // existing code
  }
}
```

---

#### 4. Prevent Admins from Deleting Other Admins (2 hours)
**File:** `backend/src/modules/users/users.service.ts`

```typescript
async remove(requestingUserId: string, targetUserId: string): Promise<void> {
  const requestingUser = await this.findOne(requestingUserId);
  const targetUser = await this.findOne(targetUserId);
  
  if (!requestingUser || !targetUser) {
    throw new NotFoundException('User not found');
  }
  
  // Prevent admins from deleting other admins
  if (requestingUser.role === UserRole.ADMIN && targetUser.role === UserRole.ADMIN) {
    throw new ForbiddenException('Admins cannot delete other admins. Contact support.');
  }
  
  // Only super admin can delete admins
  if (targetUser.role === UserRole.ADMIN && requestingUser.role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenException('Only super admins can delete admin users');
  }
  
  // Prevent self-deletion
  if (requestingUserId === targetUserId) {
    throw new ForbiddenException('You cannot delete your own account');
  }
  
  await this.usersRepository.delete(targetUserId);
}
```

**File:** `backend/src/modules/users/users.controller.ts`

```typescript
@Delete(':id')
async remove(@Request() req, @Param('id') id: string): Promise<void> {
  return this.usersService.remove(req.user.userId, id);  // ← Pass requesting user ID
}
```

---

### ✅ Phase 2: High Priority (8 hours)

#### 5. Add Audit Logging (4 hours)

**Step 1:** Create audit log entity
**File:** `backend/src/modules/audit/entities/audit-log.entity.ts`

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;  // 'impersonate', 'delete_user', 'create_api_key', etc.

  @Column({ nullable: true })
  actorId: string;  // Who did it

  @Column({ nullable: true })
  targetId: string;  // Who/what it was done to

  @Column({ nullable: true })
  tenantId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Step 2:** Create audit service
**File:** `backend/src/modules/audit/audit.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

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

  async findByTenant(tenantId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByActor(actorId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { actorId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
```

**Step 3:** Use in impersonation
**File:** `backend/src/modules/super-admin/super-admin.service.ts`

```typescript
async impersonateTenant(superAdminId: string, tenantId: string, ipAddress: string) {
  // Log the impersonation
  await this.auditService.log({
    action: 'impersonate_tenant',
    actorId: superAdminId,
    targetId: tenantId,
    tenantId,
    ipAddress,
    metadata: { timestamp: new Date() }
  });
  
  // Generate impersonation token
  const token = await this.generateImpersonationToken(tenantId);
  return { token };
}
```

---

#### 6. Add Transaction to Registration (2 hours)
**File:** `backend/src/modules/auth/auth.service.ts`

```typescript
import { DataSource } from 'typeorm';

constructor(
  private dataSource: DataSource,  // ← Add this
  // ... other dependencies
) {}

async register(registerDto: RegisterDto) {
  // Check if email exists first
  const existingUser = await this.usersService.findByEmail(registerDto.email);
  if (existingUser) {
    throw new ConflictException('Email already exists');
  }

  // Use transaction
  return await this.dataSource.transaction(async (manager) => {
    // Create tenant
    const tenant = manager.create(Tenant, {
      name: `${registerDto.firstName} ${registerDto.lastName}'s Workspace`,
      slug: this.generateSlug(registerDto.email),
      status: 'active'
    });
    await manager.save(tenant);
    
    // Create admin user
    const hashedPassword = await this.usersService.hashPassword(registerDto.password);
    const user = manager.create(User, {
      ...registerDto,
      password: hashedPassword,
      tenantId: tenant.id,
      role: 'admin'
    });
    await manager.save(user);
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // If anything fails above, both tenant and user are rolled back
    return { user, tenant, tokens };
  });
}

private generateSlug(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
}
```

---

#### 7. Add Rate Limiting (2 hours)

**Step 1:** Install package
```bash
cd backend
npm install @nestjs/throttler
```

**Step 2:** Configure in app module
**File:** `backend/src/app.module.ts`

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // Time window in seconds
      limit: 100,   // Max requests per window
    }),
    // ... other imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,  // Apply globally
    },
    // ... other providers
  ],
})
export class AppModule {}
```

**Step 3:** Add to sensitive endpoints
**File:** `backend/src/modules/auth/auth.controller.ts`

```typescript
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

---

## 🧪 Testing Checklist

After implementing fixes, test:

- [ ] Agent cannot create API keys (should get 403)
- [ ] Agent cannot create webhooks (should get 403)
- [ ] Agent cannot create WhatsApp connections (should get 403)
- [ ] Admin cannot delete another admin (should get 403)
- [ ] Admin can delete agents (should work)
- [ ] Super admin can delete admins (should work)
- [ ] Impersonation is logged in audit_logs table
- [ ] Registration creates both tenant and user atomically
- [ ] Login rate limiting works (try 6 times quickly)
- [ ] API key creation rate limiting works

---

## 📝 Migration Scripts Needed

### Create Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255) NOT NULL,
  actor_id UUID,
  target_id UUID,
  tenant_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

## 🎯 Success Criteria

✅ All Phase 1 fixes implemented
✅ All tests passing
✅ No breaking changes to existing functionality
✅ Documentation updated
✅ Security review completed

---

## 📞 Need Help?

If you get stuck on any of these, just ask! I can:
- Implement any of these fixes
- Write tests for the changes
- Create migration scripts
- Update documentation
