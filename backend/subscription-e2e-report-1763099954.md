# SUBSCRIPTION SYSTEM E2E TEST REPORT

**Date:** Fri Nov 14 11:29:14 IST 2025
**API URL:** http://localhost:3000/api/v1

## Test Execution Log

### 1.1 Super Admin Login: ✅ PASS
Token: eyJhbGciOiJIUzI1NiIs...

### 1.2 Tenant Admin Login: ✅ PASS
Token: eyJhbGciOiJIUzI1NiIs...
Tenant ID: 656b754d-0385-4401-a00b-ae8f4d3fe5e0

### 1.3 Agent Login: ❌ FAIL

### 2.1 List Plans: ❌ FAIL

### 3.1 Get Current Subscription: ✅ PASS
```json
{"message":"Cannot GET /api/v1/api/subscriptions/current","error":"Not Found","statusCode":404}
```

### 3.2 Get Quota Usage: ⚠️  WARN

### 4.1 Create Contact: ⚠️  WARN
Response: {"message":"Cannot POST /api/v1/api/contacts","error":"Not Found","statusCode":404}

### 4.2 List Contacts: ❌ FAIL

### 5.1 List WhatsApp Connections: ⚠️  WARN

### 6.1 List Campaigns: ⚠️  WARN

### 7.1 RBAC - Agent Blocked: ❌ FAIL

### 7.2 RBAC - Tenant Admin Blocked: ❌ FAIL


---

## Test Summary

| Metric | Value |
|--------|-------|
| Total Tests | 12 |
| Passed | 3 |
| Failed | 5 |
| Success Rate | 25.00% |

❌ **SOME TESTS FAILED** - Review failures above
