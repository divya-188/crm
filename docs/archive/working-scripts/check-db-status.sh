#!/bin/bash

# Check Database Status After Payment

cd backend
source .env

TENANT_ID="656b754d-0385-4401-a00b-ae8f4d3fe5e0"

echo "🔍 Checking Database Status..."
echo "================================"
echo ""

PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME << EOF

-- Check Tenant
SELECT 
  'TENANT' as type,
  name,
  "subscriptionPlanId",
  "subscriptionEndsAt",
  status
FROM tenants 
WHERE id = '$TENANT_ID';

-- Check Subscriptions
SELECT 
  'SUBSCRIPTION' as type,
  id,
  "planId",
  status,
  "razorpaySubscriptionId",
  metadata
FROM subscriptions 
WHERE "tenantId" = '$TENANT_ID'
ORDER BY "createdAt" DESC
LIMIT 3;

-- Check Invoices
SELECT 
  'INVOICE' as type,
  id,
  amount,
  status,
  "razorpayPaymentId"
FROM invoices 
WHERE "tenantId" = '$TENANT_ID'
ORDER BY "createdAt" DESC
LIMIT 3;

EOF
