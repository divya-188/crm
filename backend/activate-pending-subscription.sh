#!/bin/bash

# Manually Activate Pending Subscription
# This simulates what the Razorpay webhook would do

cd "$(dirname "$0")"
source .env

TENANT_ID="656b754d-0385-4401-a00b-ae8f4d3fe5e0"

echo "🔄 Activating Pending Subscription..."
echo "====================================="
echo ""

# Get the pending subscription
SUBSCRIPTION_DATA=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME -t -c "
  SELECT id, \"planId\", \"razorpaySubscriptionId\"
  FROM subscriptions 
  WHERE \"tenantId\" = '$TENANT_ID' 
  AND status = 'pending'
  ORDER BY \"createdAt\" DESC
  LIMIT 1;
")

if [ -z "$SUBSCRIPTION_DATA" ]; then
  echo "❌ No pending subscription found!"
  exit 1
fi

# Parse the data
SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_DATA | awk '{print $1}')
PLAN_ID=$(echo $SUBSCRIPTION_DATA | awk '{print $3}')

echo "📋 Found pending subscription:"
echo "   Subscription ID: $SUBSCRIPTION_ID"
echo "   Plan ID: $PLAN_ID"
echo ""

# Activate the subscription
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME << EOF

-- Update subscription status to active
UPDATE subscriptions
SET 
  status = 'active',
  "startDate" = NOW(),
  "endDate" = NOW() + INTERVAL '1 month',
  "currentPeriodStart" = NOW(),
  "currentPeriodEnd" = NOW() + INTERVAL '1 month',
  "updatedAt" = NOW()
WHERE id = '$SUBSCRIPTION_ID';

-- Update tenant with the new plan
UPDATE tenants
SET 
  "subscriptionPlanId" = '$PLAN_ID',
  "subscriptionEndsAt" = NOW() + INTERVAL '1 month',
  "updatedAt" = NOW()
WHERE id = '$TENANT_ID';

-- Show updated status
SELECT 
  'UPDATED TENANT' as info,
  name,
  "subscriptionPlanId",
  "subscriptionEndsAt"
FROM tenants 
WHERE id = '$TENANT_ID';

SELECT 
  'UPDATED SUBSCRIPTION' as info,
  id,
  status,
  "startDate",
  "endDate"
FROM subscriptions 
WHERE id = '$SUBSCRIPTION_ID';

EOF

echo ""
echo "✅ Subscription activated successfully!"
echo "🎯 Refresh your browser to see the updated plan"
