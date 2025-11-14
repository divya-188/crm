# Webhooks Integration Checklist

Use this checklist to integrate webhooks into your existing services.

## Database Setup

- [ ] Run database migration or SQL script
  ```bash
  npm run migration:run
  # OR
  psql -h localhost -U postgres -d whatscrm -f backend/scripts/create-webhooks-tables.sql
  ```

- [ ] Verify tables created
  ```sql
  \dt webhooks*
  ```

## Module Integration

For each service that needs to trigger webhooks:

### 1. Import WebhooksModule

- [ ] Add WebhooksModule to imports in your feature module

```typescript
// Example: messages.module.ts
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    WebhooksModule, // Add this
  ],
  // ...
})
export class MessagesModule {}
```

### 2. Inject WebhooksService

- [ ] Add WebhooksService to your service constructor

```typescript
// Example: messages.service.ts
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private webhooksService: WebhooksService, // Add this
  ) {}
}
```

### 3. Trigger Webhook Events

- [ ] Add webhook triggers to appropriate methods

```typescript
// After creating/updating a resource
await this.webhooksService.triggerEvent(
  tenantId,
  'event.type',
  payload
);
```

## Service-Specific Integration

### Messages Service

- [ ] Trigger `message.new` on incoming messages
- [ ] Trigger `message.sent` when message is sent
- [ ] Trigger `message.delivered` on delivery confirmation
- [ ] Trigger `message.read` on read receipt
- [ ] Trigger `message.failed` on send failure

### Conversations Service

- [ ] Trigger `conversation.created` on new conversation
- [ ] Trigger `conversation.updated` on conversation update
- [ ] Trigger `conversation.assigned` on agent assignment
- [ ] Trigger `conversation.resolved` when marked resolved
- [ ] Trigger `conversation.closed` when closed

### Contacts Service

- [ ] Trigger `contact.created` on new contact
- [ ] Trigger `contact.updated` on contact update

### Campaigns Service

- [ ] Trigger `campaign.started` when campaign begins
- [ ] Trigger `campaign.completed` when campaign finishes
- [ ] Trigger `campaign.failed` on campaign failure

### Flows Service

- [ ] Trigger `flow.started` when flow execution begins
- [ ] Trigger `flow.completed` when flow finishes
- [ ] Trigger `flow.failed` on flow execution failure

### Automations Service

- [ ] Trigger `automation.triggered` when automation runs
- [ ] Trigger `automation.completed` when automation finishes

### Templates Service

- [ ] Trigger `template.approved` on Meta approval
- [ ] Trigger `template.rejected` on Meta rejection

## Error Handling

- [ ] Wrap webhook triggers in try-catch blocks
- [ ] Log webhook errors without breaking main flow
- [ ] Consider async/fire-and-forget pattern for non-critical events

```typescript
try {
  await this.webhooksService.triggerEvent(tenantId, eventType, payload);
} catch (error) {
  console.error('Failed to trigger webhook:', error);
  // Don't throw - continue with main logic
}
```

## Testing

- [ ] Run the test script
  ```bash
  chmod +x backend/test-webhooks-api.sh
  ./backend/test-webhooks-api.sh
  ```

- [ ] Create a test webhook using webhook.site
- [ ] Trigger events and verify delivery
- [ ] Check webhook logs for errors
- [ ] Verify signature generation

## Documentation

- [ ] Review `WEBHOOKS-DOCUMENTATION.md`
- [ ] Review `WEBHOOKS-INTEGRATION-EXAMPLE.md`
- [ ] Review `WEBHOOKS-QUICKSTART.md`
- [ ] Update API documentation if needed

## Production Readiness

- [ ] Configure proper error logging
- [ ] Set up monitoring for webhook failures
- [ ] Configure rate limiting if needed
- [ ] Test with production-like load
- [ ] Verify retry logic works correctly
- [ ] Test signature verification
- [ ] Ensure HTTPS URLs in production

## Performance Optimization

- [ ] Consider async webhook delivery for high-volume events
- [ ] Monitor webhook delivery latency
- [ ] Optimize payload size
- [ ] Add caching if needed
- [ ] Monitor database query performance

## Security Review

- [ ] Verify tenant isolation works correctly
- [ ] Test signature verification
- [ ] Ensure secrets are stored securely
- [ ] Validate all user inputs
- [ ] Test with malicious payloads
- [ ] Review access control

## Monitoring Setup

- [ ] Set up alerts for high failure rates
- [ ] Monitor average response times
- [ ] Track webhook usage per tenant
- [ ] Set up log aggregation
- [ ] Create dashboards for webhook metrics

## User Documentation

- [ ] Create user guide for webhook setup
- [ ] Document available events
- [ ] Provide code examples for popular languages
- [ ] Create troubleshooting guide
- [ ] Add webhook section to API docs

## Final Verification

- [ ] All database tables created
- [ ] All modules properly imported
- [ ] All services inject WebhooksService
- [ ] All events trigger webhooks
- [ ] Error handling in place
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Production ready

## Rollout Plan

1. **Phase 1: Internal Testing**
   - [ ] Deploy to staging environment
   - [ ] Test all webhook events
   - [ ] Verify delivery and retry logic
   - [ ] Test with multiple tenants

2. **Phase 2: Beta Testing**
   - [ ] Enable for select beta users
   - [ ] Monitor webhook usage
   - [ ] Collect feedback
   - [ ] Fix any issues

3. **Phase 3: General Availability**
   - [ ] Deploy to production
   - [ ] Announce feature to all users
   - [ ] Monitor performance
   - [ ] Provide support

## Support Preparation

- [ ] Train support team on webhooks
- [ ] Create internal troubleshooting guide
- [ ] Set up support ticket categories
- [ ] Prepare FAQ document
- [ ] Create video tutorials

## Maintenance

- [ ] Schedule regular log cleanup
- [ ] Monitor storage usage
- [ ] Review and optimize queries
- [ ] Update documentation as needed
- [ ] Plan for scaling

---

## Quick Reference

### Trigger a Webhook Event

```typescript
await this.webhooksService.triggerEvent(
  tenantId,      // string
  'event.type',  // string
  { data }       // object
);
```

### Available Events

```
message.new, message.sent, message.delivered, message.read, message.failed
conversation.created, conversation.updated, conversation.assigned, conversation.resolved, conversation.closed
contact.created, contact.updated
campaign.started, campaign.completed, campaign.failed
flow.started, flow.completed, flow.failed
automation.triggered, automation.completed
template.approved, template.rejected
* (all events)
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Webhook not triggering | Check if webhook is active and events match |
| Signature verification failing | Ensure using correct secret and raw body |
| High failure rate | Check endpoint timeout and response codes |
| Logs not appearing | Verify database connection and permissions |

---

**Last Updated**: Task 27 Implementation
**Status**: ✅ Complete
