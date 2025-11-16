#!/bin/bash

echo "🔧 Activating Pending Razorpay Subscription"
echo "==========================================="
echo ""

# Activate the most recent pending subscription
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d whatscrm << 'EOF'
-- Get the most recent pending subscription with Razorpay ID
\echo '📋 Current Status:'
SELECT id, status, "razorpaySubscriptionId", "createdAt"
FROM subscriptions 
WHERE status = 'pending' 
  AND "razorpaySubscriptionId" IS NOT NULL
ORDER BY "createdAt" DESC 
LIMIT 1;

\echo ''
\echo '🔄 Activating subscription...'

-- Update to active status
UPDATE subscriptions
SET 
  status = 'active',
  "startDate" = NOW(),
  "endDate" = NOW() + INTERVAL '1 month',
  "currentPeriodStart" = NOW(),
  "currentPeriodEnd" = NOW() + INTERVAL '1 month'
WHERE id = (
  SELECT id 
  FROM subscriptions 
  WHERE status = 'pending' 
    AND "razorpaySubscriptionId" IS NOT NULL
  ORDER BY "createdAt" DESC 
  LIMIT 1
);

\echo ''
\echo '✅ Updated Status:'
SELECT id, status, "razorpaySubscriptionId", "startDate", "endDate"
FROM subscriptions 
WHERE "razorpaySubscriptionId" IS NOT NULL
ORDER BY "createdAt" DESC 
LIMIT 1;

\echo ''
\echo '🎉 Subscription activated successfully!'
EOF
