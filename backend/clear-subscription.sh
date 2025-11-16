#!/bin/bash

# Clear Admin Subscription - Quick Reset Script
echo "🧹 Clearing Admin Subscription Data..."

# Change to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "❌ .env file not found!"
  exit 1
fi

# Tenant ID for test-company
TENANT_ID="656b754d-0385-4401-a00b-ae8f4d3fe5e0"

echo "📋 Resetting subscription for tenant: $TENANT_ID"
echo ""

# Run SQL commands
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME << EOF

-- Delete invoices
DELETE FROM invoices WHERE "tenantId" = '$TENANT_ID';

-- Delete subscriptions  
DELETE FROM subscriptions WHERE "tenantId" = '$TENANT_ID';

-- Reset tenant fields
UPDATE tenants 
SET 
  "subscriptionPlanId" = NULL,
  "subscriptionEndsAt" = NULL,
  "trialEndsAt" = NULL,
  "quotaWarnings" = NULL
WHERE id = '$TENANT_ID';

-- Show result
SELECT 
  name,
  slug,
  status,
  "subscriptionPlanId",
  "subscriptionEndsAt"
FROM tenants 
WHERE id = '$TENANT_ID';

EOF

echo ""
echo "✅ Subscription data cleared!"
echo "🎯 You can now test the upgrade flow from scratch"
