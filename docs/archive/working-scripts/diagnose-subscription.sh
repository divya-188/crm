#!/bin/bash

echo "🔍 Diagnosing Subscription Issue"
echo "================================="
echo ""

# Check recent subscriptions via API
echo "1️⃣ Checking via API (requires login)..."
echo ""

# Try to get current subscription
echo "GET /api/v1/subscriptions/current"
curl -s http://localhost:3000/api/v1/subscriptions/current \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | python3 -m json.tool 2>/dev/null || echo "Need valid token"

echo ""
echo ""

# Check database directly
echo "2️⃣ Checking Database..."
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d whatscrm << 'EOF'
\echo '📊 Recent Subscriptions:'
SELECT 
    id, 
    "tenantId", 
    "planId", 
    status, 
    "razorpaySubscriptionId",
    "createdAt"
FROM subscriptions 
ORDER BY "createdAt" DESC 
LIMIT 3;

\echo ''
\echo '📋 Status Breakdown:'
SELECT status, COUNT(*) as count 
FROM subscriptions 
GROUP BY status;

\echo ''
\echo '🔍 Pending/Failed Subscriptions:'
SELECT 
    id,
    "tenantId",
    status,
    "razorpaySubscriptionId",
    metadata,
    "createdAt"
FROM subscriptions 
WHERE status IN ('pending', 'payment_failed')
ORDER BY "createdAt" DESC
LIMIT 3;
EOF
