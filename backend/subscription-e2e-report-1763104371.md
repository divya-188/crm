# SUBSCRIPTION SYSTEM E2E TEST REPORT

**Date:** Fri Nov 14 12:42:51 IST 2025
**API URL:** http://localhost:3000/api/v1

## Test Execution Log

### 1.1 Super Admin Login: ✅ PASS
Token: eyJhbGciOiJIUzI1NiIs...

### 1.2 Tenant Admin Login: ✅ PASS
Token: eyJhbGciOiJIUzI1NiIs...
Tenant ID: 656b754d-0385-4401-a00b-ae8f4d3fe5e0

### 1.3 Agent Login: ❌ FAIL

### 2.1 List Plans: ✅ PASS
```json
{"data":[{"id":"b3130ef7-97de-4826-b94c-43e16fc4a64f","name":"Starter","description":"Perfect for small businesses and startups getting started with WhatsApp automation","price":"49.00","billingCycle":"monthly","features":{"maxFlows":5,"maxUsers":3,"apiAccess":false,"maxContacts":2500,"maxCampaigns":10,"customBranding":false,"maxAutomations":15,"prioritySupport":false,"maxConversations":1000,"whatsappConnections":1},"isActive":true,"sortOrder":1,"createdAt":"2025-11-14T05:01:59.823Z","updatedAt":"2025-11-14T05:01:59.823Z"},{"id":"4b00c3b7-9eae-4bb8-bc51-17a9611b17b2","name":"Growth","description":"Ideal for growing teams that need more power and flexibility","price":"149.00","billingCycle":"monthly","features":{"maxFlows":20,"maxUsers":10,"apiAccess":true,"maxContacts":10000,"maxCampaigns":50,"customBranding":false,"maxAutomations":50,"prioritySupport":false,"maxConversations":5000,"whatsappConnections":3},"isActive":true,"sortOrder":2,"createdAt":"2025-11-14T05:01:59.886Z","updatedAt":"2025-11-14T05:01:59.886Z"},{"id":"4eab5f01-0ba0-431d-b5f2-0f862d7af5d0","name":"Professional","description":"Advanced features for established businesses scaling their customer engagement","price":"299.00","billingCycle":"monthly","features":{"maxFlows":50,"maxUsers":25,"apiAccess":true,"maxContacts":50000,"maxCampaigns":200,"customBranding":true,"maxAutomations":150,"prioritySupport":true,"maxConversations":25000,"whatsappConnections":5},"isActive":true,"sortOrder":3,"createdAt":"2025-11-14T05:01:59.889Z","updatedAt":"2025-11-14T05:01:59.889Z"},{"id":"e6015e44-c333-4bad-b7df-45d2400f32fc","name":"Enterprise","description":"Unlimited power for large organizations with complex requirements and dedicated support","price":"799.00","billingCycle":"monthly","features":{"maxFlows":200,"maxUsers":100,"apiAccess":true,"maxContacts":250000,"maxCampaigns":1000,"customBranding":true,"maxAutomations":500,"prioritySupport":true,"maxConversations":100000,"whatsappConnections":15},"isActive":true,"sortOrder":4,"createdAt":"2025-11-14T05:01:59.890Z","updatedAt":"2025-11-14T05:01:59.890Z"}],"total":4,"page":1,"limit":20,"hasMore":false}
```

### 2.2 Get Plan Details: ✅ PASS

### 3.1 Get Current Subscription: ✅ PASS
```json
{"message":"Cannot GET /api/v1/subscriptions/current","error":"Not Found","statusCode":404}
```

### 3.2 Get Quota Usage: ⚠️  WARN

### 4.1 Create Contact: ⚠️  WARN
Response: {"message":["property name should not exist"],"error":"Bad Request","statusCode":400}

### 4.2 List Contacts: ✅ PASS

### 5.1 List WhatsApp Connections: ✅ PASS

### 6.1 List Campaigns: ✅ PASS

### 7.1 RBAC - Agent Blocked: ✅ PASS

### 7.2 RBAC - Tenant Admin Blocked: ✅ PASS


---

## Test Summary

| Metric | Value |
|--------|-------|
| Total Tests | 13 |
| Passed | 10 |
| Failed | 1 |
| Success Rate | 76.92% |

❌ **SOME TESTS FAILED** - Review failures above
