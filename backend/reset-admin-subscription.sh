#!/bin/bash

# Reset Admin Subscription Data
# This script removes all subscription data for the admin user to allow fresh testing

echo "🧹 Resetting Admin User Subscription Data..."
echo "=============================================="

# Change to backend directory if not already there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Get database credentials from .env
if [ -f .env ]; then
  source .env
else
  echo "❌ .env file not found in backend directory!"
  exit 1
fi

# Admin user email
ADMIN_EMAIL="admin@test.com"

echo ""
echo "📧 Finding admin user: $ADMIN_EMAIL"

# Get admin tenant ID
TENANT_ID=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME -t -c "
  SELECT id FROM tenants WHERE slug = 'test-company';
" | xargs)

if [ -z "$TENANT_ID" ]; then
  echo "❌ Admin tenant not found!"
  exit 1
fi

echo "✅ Found tenant ID: $TENANT_ID"
echo ""

# Delete subscription data
echo "🗑️  Deleting subscription data..."

# 1. Delete invoices
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME -c "
  DELETE FROM invoices WHERE \"tenantId\" = '$TENANT_ID';
"
echo "   ✓ Deleted invoices"

# 2. Delete subscriptions
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME -c "
  DELETE FROM subscriptions WHERE \"tenantId\" = '$TENANT_ID';
"
echo "   ✓ Deleted subscriptions"

# 3. Reset tenant subscription fields
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME -c "
  UPDATE tenants 
  SET 
    \"subscriptionPlanId\" = NULL,
    \"subscriptionEndsAt\" = NULL,
    \"trialEndsAt\" = NULL,
    \"quotaWarnings\" = NULL
  WHERE id = '$TENANT_ID';
"
echo "   ✓ Reset tenant subscription fields"

echo ""
echo "✅ Admin subscription data has been reset!"
echo ""
echo "📊 Current Status:"
echo "=================="

# Show current tenant status
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -d $DATABASE_NAME -c "
  SELECT 
    name,
    slug,
    status,
    \"subscriptionPlanId\",
    \"subscriptionEndsAt\",
    \"trialEndsAt\"
  FROM tenants 
  WHERE id = '$TENANT_ID';
"

echo ""
echo "🎯 You can now test the subscription upgrade flow from scratch!"
echo ""
echo "Next steps:"
echo "1. Login as admin@test.com"
echo "2. Go to /admin/plans"
echo "3. Click 'Upgrade Now' on any plan"
echo "4. Complete the payment"
echo "5. Verify the success page and subscription activation"
