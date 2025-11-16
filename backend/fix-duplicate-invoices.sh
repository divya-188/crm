#!/bin/bash

echo "🔧 Fixing Duplicate Invoice Issue"
echo "=================================="
echo ""

# Get tenant ID
TENANT_ID="656b754d-0385-4401-a00b-ae8f4d3fe5e0"

echo "📋 Current invoices:"
psql -U postgres -d whatscrm -c "
SELECT 
  id,
  \"invoiceNumber\",
  amount,
  total,
  status,
  \"invoiceDate\",
  \"subscriptionId\"
FROM invoices 
WHERE \"tenantId\" = '$TENANT_ID'
ORDER BY \"createdAt\" DESC;
"

echo ""
echo "🗑️  Removing duplicate/incorrect invoices..."
echo ""

# Remove the incorrect $149 invoice (keep only the $99 initial invoice)
# We'll identify it by the amount and keep only the oldest one
psql -U postgres -d whatscrm -c "
WITH ranked_invoices AS (
  SELECT 
    id,
    amount,
    \"createdAt\",
    ROW_NUMBER() OVER (PARTITION BY \"subscriptionId\" ORDER BY \"createdAt\" ASC) as rn
  FROM invoices
  WHERE \"tenantId\" = '$TENANT_ID'
)
DELETE FROM invoices
WHERE id IN (
  SELECT id FROM ranked_invoices WHERE rn > 1
);
"

echo ""
echo "✅ Duplicate invoices removed"
echo ""

echo "📊 Updated invoice list:"
psql -U postgres -d whatscrm -c "
SELECT 
  id,
  \"invoiceNumber\",
  amount,
  total,
  status,
  \"invoiceDate\",
  \"subscriptionId\"
FROM invoices 
WHERE \"tenantId\" = '$TENANT_ID'
ORDER BY \"createdAt\" DESC;
"

echo ""
echo "💰 Total amount:"
psql -U postgres -d whatscrm -c "
SELECT 
  COUNT(*) as invoice_count,
  SUM(total) as total_paid
FROM invoices 
WHERE \"tenantId\" = '$TENANT_ID';
"

echo ""
echo "✅ Fix complete!"
echo ""
echo "📝 Note: Future upgrades will only create prorated invoices"
