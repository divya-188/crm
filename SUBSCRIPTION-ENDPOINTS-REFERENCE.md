# Subscription Endpoints Reference

Quick reference for the subscription system endpoints.

---

## Authentication

All endpoints require JWT authentication via Bearer token.

```bash
# Login to get token
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}'
```

---

## Subscription Plans

### List All Plans
```bash
GET /api/v1/subscription-plans
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Starter",
      "price": "49.00",
      "billingCycle": "monthly",
      "features": {
        "maxContacts": 2500,
        "maxUsers": 3,
        "whatsappConnections": 1,
        ...
      }
    }
  ]
}
```

### Get Plan Details
```bash
GET /api/v1/subscription-plans/:id
```

---

## Current Subscription

### Get Current Subscription
```bash
GET /api/v1/subscriptions/current
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "planId": "uuid",
  "status": "active",
  "startDate": "2025-11-14T07:29:01.240Z",
  "endDate": "2025-12-14T07:29:01.240Z",
  "plan": {
    "id": "uuid",
    "name": "Starter",
    "features": {...}
  }
}
```

**Status Codes:**
- `200` - Subscription found
- `404` - No active subscription

---

## Usage Statistics

### Get Usage Statistics
```bash
GET /api/v1/subscriptions/usage
Authorization: Bearer {token}
```

**Response:**
```json
{
  "subscription": {
    "planName": "Starter",
    "status": "active",
    "currentPeriodEnd": "2025-12-14T07:29:01.240Z"
  },
  "usage": {
    "contacts": {
      "used": 3,
      "limit": 2500,
      "percentage": 0
    },
    "users": {
      "used": 3,
      "limit": 3,
      "percentage": 100
    },
    "campaigns": {
      "used": 0,
      "limit": 10,
      "percentage": 0
    },
    "conversations": {
      "used": 0,
      "limit": 1000,
      "percentage": 0
    },
    "flows": {
      "used": 0,
      "limit": 5,
      "percentage": 0
    },
    "automations": {
      "used": 0,
      "limit": 15,
      "percentage": 0
    },
    "whatsappConnections": {
      "used": 1,
      "limit": 1,
      "percentage": 100
    }
  },
  "features": {
    "customBranding": false,
    "prioritySupport": false,
    "apiAccess": false
  }
}
```

**Status Codes:**
- `200` - Usage statistics retrieved
- `404` - No active subscription

---

## Resource Types Tracked

| Resource | Description |
|----------|-------------|
| contacts | Total contacts in the system |
| users | Total users (admins, agents) |
| campaigns | Total marketing campaigns |
| conversations | Total WhatsApp conversations |
| flows | Total automation flows |
| automations | Total automation rules |
| whatsappConnections | Total WhatsApp Business accounts |

---

## Usage Examples

### Complete Flow

```bash
# 1. Login
TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# 2. List available plans
curl -X GET "http://localhost:3000/api/v1/subscription-plans" \
  -H "Authorization: Bearer $TOKEN"

# 3. Get current subscription
curl -X GET "http://localhost:3000/api/v1/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN"

# 4. Check usage statistics
curl -X GET "http://localhost:3000/api/v1/subscriptions/usage" \
  -H "Authorization: Bearer $TOKEN"
```

### Check if Near Quota Limit

```bash
# Get usage and check percentage
curl -s -X GET "http://localhost:3000/api/v1/subscriptions/usage" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.usage.contacts.percentage'

# If percentage > 80, show warning
# If percentage >= 100, block creation
```

---

## Error Responses

### No Active Subscription
```json
{
  "message": "No active subscription found",
  "error": "Not Found",
  "statusCode": 404
}
```

### Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### Forbidden (Wrong Role)
```json
{
  "message": "Forbidden resource",
  "error": "Forbidden",
  "statusCode": 403
}
```

---

## Testing

### Run E2E Tests
```bash
cd backend
./test-subscription-e2e-simple.sh
```

### Create Test Subscription
```bash
cd backend
npx ts-node scripts/create-test-subscription.ts
```

---

## Implementation Details

### Service Layer
- `SubscriptionsService` - Handles subscription and usage logic
- `SubscriptionPlansService` - Handles plan management
- `QuotaEnforcementService` - Enforces quota limits

### Database Queries
Usage statistics are calculated using direct SQL queries for performance:
```sql
SELECT COUNT(*) as count FROM contacts WHERE "tenantId" = $1
SELECT COUNT(*) as count FROM users WHERE "tenantId" = $1
-- etc.
```

### Caching
Consider implementing caching for usage statistics:
- Cache TTL: 5 minutes
- Invalidate on resource creation/deletion
- Use Redis for distributed caching

---

## Next Steps

1. **Implement quota enforcement guards**
   - Block resource creation when limit reached
   - Return 403 with quota exceeded message

2. **Add usage alerts**
   - Email when 80% quota reached
   - Email when 90% quota reached
   - Dashboard notifications

3. **Implement subscription lifecycle**
   - Create subscription with payment
   - Renew subscription
   - Cancel subscription
   - Upgrade/downgrade plans

4. **Add analytics**
   - Track usage trends over time
   - Predict when quota will be reached
   - Recommend plan upgrades
