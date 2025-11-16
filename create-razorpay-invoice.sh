#!/bin/bash

echo "📄 Creating Invoice for Razorpay Subscription"
echo "=============================================="
echo ""

# Create invoice for the active Razorpay subscription
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d whatscrm << 'EOF'
-- Get the active subscription details
\echo '📋 Active Subscription:'
SELECT 
    s.id as subscription_id,
    s."tenantId",
    s."planId",
    p.name as plan_name,
    p.price,
    s."razorpaySubscriptionId"
FROM subscriptions s
JOIN subscription_plans p ON s."planId" = p.id
WHERE s.status = 'active' 
  AND s."razorpaySubscriptionId" IS NOT NULL
LIMIT 1;

\echo ''
\echo '💰 Creating invoice...'

-- Insert invoice
INSERT INTO invoices (
    "tenantId",
    "subscriptionId",
    "invoiceNumber",
    amount,
    tax,
    total,
    currency,
    status,
    "invoiceDate",
    "dueDate",
    "paidAt",
    "paymentMethod",
    "razorpayInvoiceId",
    items,
    metadata,
    "createdAt",
    "updatedAt"
)
SELECT 
    s."tenantId",
    s.id,
    'INV-2025-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || FLOOR(RANDOM() * 1000)::int,
    p.price,
    0.00,
    p.price,
    'USD',
    'paid',
    NOW(),
    NOW(),
    NOW(),
    'Razorpay',
    s."razorpaySubscriptionId",
    jsonb_build_array(
        jsonb_build_object(
            'description', p.name || ' - ' || p."billingCycle" || ' subscription',
            'quantity', 1,
            'unitPrice', p.price::numeric,
            'total', p.price::numeric
        )
    ),
    jsonb_build_object(
        'provider', 'razorpay',
        'razorpaySubscriptionId', s."razorpaySubscriptionId",
        'paymentLinkId', s.metadata->>'razorpayPaymentLinkId'
    ),
    NOW(),
    NOW()
FROM subscriptions s
JOIN subscription_plans p ON s."planId" = p.id
WHERE s.status = 'active' 
  AND s."razorpaySubscriptionId" IS NOT NULL
LIMIT 1;

\echo ''
\echo '✅ Invoice created!'
\echo ''
\echo '📄 Latest Invoices:'
SELECT 
    "invoiceNumber",
    amount,
    "paymentMethod",
    status,
    "createdAt"
FROM invoices
WHERE "tenantId" = (
    SELECT "tenantId" FROM subscriptions 
    WHERE status = 'active' 
    AND "razorpaySubscriptionId" IS NOT NULL 
    LIMIT 1
)
ORDER BY "createdAt" DESC
LIMIT 3;
EOF
