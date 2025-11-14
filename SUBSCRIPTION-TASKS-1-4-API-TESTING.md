# Subscription Lifecycle Tasks 1-4 API Testing Guide

Complete guide for testing the subscription lifecycle APIs (Tasks 1-4) with different user roles using curl commands.

---

## Prerequisites

1. **Start the backend server:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Verify server is running:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

3. **Test credentials available:**
   - Super Admin: `superadmin@whatscrm.com` / `SuperAdmin123!`
   - Tenant Admin: `admin@test.com` / `Admin123!`
   - Agent: `agent@test.com` / `Agent123!`

---

## Quick Test Script

Run the automated test script:
```bash
chmod +x backend/test-subscription-tasks-1-4-simple.sh
./backend/test-subscription-tasks-1-4-simple.sh
```

---

## Manual Testing with curl

### Step 1: Login and Get Token

#### Login as Tenant Admin
```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

**Save the token:**
```bash
TOKEN="<paste_access_token_here>"
```

Or use this one-liner:
```bash
TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

---

## TASK 1: Quota Enforcement System

### Test 1.1: Get Current Subscription
```bash
curl -X GET "http://localhost:3000/api/v1/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

**Expected Response:**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "planId": "uuid",
  "status": "active",
  "startDate": "2025-11-14T...",
  "endDate": "2025-12-14T...",
  "plan": {
    "name": "Starter",
    "features": {...}
  }
}
```

### Test 1.2: Get Usage Statistics
```bash
curl -X GET "http://localhost:3000/api/v1/subscriptions/usage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

**Expected Response:**
```json
{
  "subscription": {
    "planName": "Starter",
    "status": "active",
    "currentPeriodEnd": "2025-12-14T..."
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
    "whatsappConnections": {
      "used": 1,
      "limit": 1,
      "percentage": 100
    }
  }
}
```

### Test 1.3: Create Contact (Quota Check)
```bash
curl -X POST "http://localhost:3000/api/v1/contacts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contact Quota",
    "phone": "+1234567890",
    "email": "quota.test@example.com"
  }' | jq '.'
```

**Expected Responses:**
- **If under quota:** Returns contact with `id`
- **If quota exceeded:** Returns 403 error:
```json
{
  "statusCode": 403,
  "message": "Contact quota limit reached. Please upgrade your plan.",
  "error": "Forbidden"
}
```

### Test 1.4: Create User (Quota Check)
```bash
curl -X POST "http://localhost:3000/api/v1/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quota.user@test.com",
    "password": "QuotaUser123!",
    "name": "Quota Test User",
    "role": "agent"
  }' | jq '.'
```

**Expected Responses:**
- **If under quota:** Returns user with `id`
- **If quota exceeded:** Returns 403 error with quota message

### Test 1.5: Create WhatsApp Connection (Quota Check)
```bash
curl -X POST "http://localhost:3000/api/v1/whatsapp/connections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quota Test Connection",
    "type": "qr",
    "phoneNumber": "+1234567891"
  }' | jq '.'
```

**Expected Responses:**
- **If under quota:** Returns connection with `id`
- **If quota exceeded:** Returns 403 error

---

## TASK 2: Subscription Creation with Payment

### Test 2.1: List Available Subscription Plans
```bash
curl -X GET "http://localhost:3000/api/v1/subscription-plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

**Save a plan ID:**
```bash
PLAN_ID=$(curl -s -X GET "http://localhost:3000/api/v1/subscription-plans" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

echo "Plan ID: $PLAN_ID"
```

### Test 2.2: Create Subscription with Payment
```bash
curl -X POST "http://localhost:3000/api/v1/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"paymentProvider\": \"stripe\",
    \"billingCycle\": \"monthly\"
  }" | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "checkoutUrl": "https://checkout.stripe.com/...",
    "status": "pending"
  },
  "message": "Subscription created successfully"
}
```

### Test 2.3: Get Subscription After Creation
```bash
curl -X GET "http://localhost:3000/api/v1/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Test 2.4: Sync Subscription Status
```bash
# Get subscription ID first
SUB_ID=$(curl -s -X GET "http://localhost:3000/api/v1/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.id')

# Sync status
curl -X GET "http://localhost:3000/api/v1/subscriptions/$SUB_ID/sync" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## TASK 3: Automatic Subscription Renewal

### Test 3.1: Get Current Subscription (Check Renewal Fields)
```bash
curl -X GET "http://localhost:3000/api/v1/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Look for renewal fields:**
- `renewalAttempts`
- `lastRenewalAttempt`
- `nextRenewalDate`

### Test 3.2: Trigger Manual Renewal
```bash
# Get subscription ID
SUB_ID=$(curl -s -X GET "http://localhost:3000/api/v1/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.id')

# Trigger renewal
curl -X POST "http://localhost:3000/api/v1/subscriptions/$SUB_ID/renew" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "endDate": "2025-12-14T...",
    "renewalAttempts": 0
  }
}
```

### Test 3.3: Verify Usage Statistics After Renewal
```bash
curl -X GET "http://localhost:3000/api/v1/subscriptions/usage" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## TASK 4: Subscription Cancellation

### Test 4.1: Cancel Subscription at Period End
```bash
# Get subscription ID
SUB_ID=$(curl -s -X GET "http://localhost:3000/api/v1/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.id')

# Cancel subscription
curl -X DELETE "http://localhost:3000/api/v1/subscriptions/$SUB_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cancellationReason": "Testing cancellation flow",
    "cancelImmediately": false
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "cancellationReason": "Testing cancellation flow"
  },
  "message": "Subscription will be cancelled at the end of the current period"
}
```

### Test 4.2: Cancel Subscription Immediately
```bash
curl -X DELETE "http://localhost:3000/api/v1/subscriptions/$SUB_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cancellationReason": "Immediate cancellation test",
    "cancelImmediately": true
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "cancelled",
    "cancelledAt": "2025-11-14T..."
  },
  "message": "Subscription cancelled immediately"
}
```

### Test 4.3: Check Subscription Status After Cancellation
```bash
curl -X GET "http://localhost:3000/api/v1/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Test 4.4: Verify Service Access During Grace Period
```bash
curl -X GET "http://localhost:3000/api/v1/subscriptions/usage" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## Role-Based Access Control Testing

### Test with Super Admin

#### Login as Super Admin
```bash
SUPER_TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@whatscrm.com","password":"SuperAdmin123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Super Admin Token: $SUPER_TOKEN"
```

#### List Subscription Plans (Super Admin)
```bash
curl -X GET "http://localhost:3000/api/v1/subscription-plans" \
  -H "Authorization: Bearer $SUPER_TOKEN" | jq '.'
```

#### Create Subscription Plan (Super Admin Only)
```bash
curl -X POST "http://localhost:3000/api/v1/subscription-plans" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plan API",
    "description": "Test plan created via API",
    "price": 99.00,
    "billingCycle": "monthly",
    "features": {
      "maxContacts": 5000,
      "maxUsers": 5,
      "whatsappConnections": 2,
      "maxCampaigns": 20,
      "maxConversations": 2000,
      "maxFlows": 10,
      "maxAutomations": 30,
      "customBranding": true,
      "prioritySupport": true,
      "apiAccess": true
    },
    "isActive": true
  }' | jq '.'
```

**Expected Response:**
```json
{
  "id": "uuid",
  "name": "Test Plan API",
  "price": "99.00",
  "billingCycle": "monthly",
  "isActive": true
}
```

### Test with Agent (Limited Access)

#### Login as Agent
```bash
AGENT_TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@test.com","password":"Agent123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Agent Token: $AGENT_TOKEN"
```

#### Try to Access Subscription Plans (Should be Limited)
```bash
curl -X GET "http://localhost:3000/api/v1/subscription-plans" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

**Expected Response:**
- May return 403 Forbidden
- Or limited data based on role permissions

#### Try to Access Subscription Usage
```bash
curl -X GET "http://localhost:3000/api/v1/subscriptions/usage" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
```

---

## Complete Test Flow

Here's a complete test flow combining all tasks:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

# 1. Login as Tenant Admin
echo "=== Logging in as Tenant Admin ==="
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:30}..."
echo ""

# 2. TASK 1: Check Quota
echo "=== TASK 1: Quota Enforcement ==="
echo "Current Subscription:"
curl -s -X GET "$BASE_URL/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "Usage Statistics:"
curl -s -X GET "$BASE_URL/subscriptions/usage" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 3. TASK 2: Create Subscription
echo "=== TASK 2: Subscription Creation ==="
PLAN_ID=$(curl -s -X GET "$BASE_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

echo "Creating subscription with plan: $PLAN_ID"
curl -s -X POST "$BASE_URL/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"$PLAN_ID\",\"paymentProvider\":\"stripe\",\"billingCycle\":\"monthly\"}" \
  | jq '.'
echo ""

# 4. TASK 3: Renewal
echo "=== TASK 3: Subscription Renewal ==="
SUB_ID=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.id')

echo "Triggering renewal for subscription: $SUB_ID"
curl -s -X POST "$BASE_URL/subscriptions/$SUB_ID/renew" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

# 5. TASK 4: Cancellation
echo "=== TASK 4: Subscription Cancellation ==="
echo "Cancelling subscription: $SUB_ID"
curl -s -X DELETE "$BASE_URL/subscriptions/$SUB_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cancellationReason":"Testing","cancelImmediately":false}' \
  | jq '.'
echo ""

echo "=== Testing Complete ==="
```

---

## Expected Status Codes

| Endpoint | Success | Quota Exceeded | Unauthorized | Forbidden |
|----------|---------|----------------|--------------|-----------|
| GET /subscriptions/current | 200 | - | 401 | - |
| GET /subscriptions/usage | 200 | - | 401 | - |
| POST /contacts | 201 | 403 | 401 | - |
| POST /subscriptions | 201 | - | 401 | 403 |
| POST /subscriptions/:id/renew | 200 | - | 401 | 403 |
| DELETE /subscriptions/:id | 200 | - | 401 | 403 |

---

## Troubleshooting

### Server Not Running
```bash
# Check if server is running
curl http://localhost:3000/api/v1/health

# If not, start it
cd backend
npm run start:dev
```

### Invalid Token
```bash
# Re-login to get fresh token
TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
```

### No Subscription Found
```bash
# Create a test subscription first
cd backend
npx ts-node scripts/create-test-subscription.ts
```

### jq Not Installed
```bash
# Install jq for JSON formatting
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Or remove | jq '.' from commands
```

---

## Summary

This guide covers all API endpoints for Tasks 1-4 of the subscription lifecycle:

✅ **Task 1:** Quota Enforcement - Check limits and block resource creation
✅ **Task 2:** Subscription Creation - Create subscriptions with payment
✅ **Task 3:** Automatic Renewal - Trigger and verify renewal process
✅ **Task 4:** Cancellation - Cancel subscriptions with grace period

All tests include role-based access control verification for:
- Super Admin (full access)
- Tenant Admin (subscription management)
- Agent (limited access)
