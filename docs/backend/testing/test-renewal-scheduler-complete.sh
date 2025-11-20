#!/bin/bash

# Test Renewal Scheduler (Cron Job)
# This script tests the automatic renewal scheduler functionality

BASE_URL="http://localhost:3000/api/v1"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Renewal Scheduler (Cron Job) Testing                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Login as admin
echo "→ Logging in as Tenant Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "✗ Login failed"
    exit 1
fi

echo "✓ Login successful"
echo ""

# Get current subscription
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Get Current Subscription"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CURRENT_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" -H "Authorization: Bearer $TOKEN")
echo "$CURRENT_SUB"
echo ""

SUB_ID=$(echo "$CURRENT_SUB" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
END_DATE=$(echo "$CURRENT_SUB" | grep -o '"endDate":"[^"]*"' | cut -d'"' -f4)

echo "Subscription ID: $SUB_ID"
echo "Current End Date: $END_DATE"
echo ""

# Check renewal fields
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Check Renewal Fields"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Renewal Attempts: $(echo "$CURRENT_SUB" | grep -o '"renewalAttempts":[0-9]*' | cut -d':' -f2)"
echo "Last Renewal Attempt: $(echo "$CURRENT_SUB" | grep -o '"lastRenewalAttempt":"[^"]*"' | cut -d'"' -f4)"
echo "Auto Renew: $(echo "$CURRENT_SUB" | grep -o '"autoRenew":[a-z]*' | cut -d':' -f2)"
echo ""

# Trigger manual renewal to simulate cron job
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Trigger Manual Renewal (Simulating Cron Job)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$SUB_ID" ]; then
    echo "Triggering renewal for subscription: $SUB_ID"
    RENEWAL_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions/$SUB_ID/renew" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}')
    echo "$RENEWAL_RESPONSE"
    echo ""
fi

# Check subscription after renewal
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Verify Subscription After Renewal"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

UPDATED_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" -H "Authorization: Bearer $TOKEN")
echo "$UPDATED_SUB"
echo ""

NEW_END_DATE=$(echo "$UPDATED_SUB" | grep -o '"endDate":"[^"]*"' | cut -d'"' -f4)

echo "Previous End Date: $END_DATE"
echo "New End Date:      $NEW_END_DATE"
echo ""

if [ "$END_DATE" != "$NEW_END_DATE" ]; then
    echo "✓ Renewal successful! End date extended."
else
    echo "⚠ End date unchanged. Check renewal logic."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RENEWAL SCHEDULER TEST COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Notes:"
echo "------"
echo "• The renewal scheduler runs as a cron job in production"
echo "• It checks for subscriptions expiring within 7 days"
echo "• This test simulates the renewal process manually"
echo "• In production, the scheduler runs automatically via @Cron decorator"
echo ""
echo "To check the actual cron job implementation:"
echo "  backend/src/modules/subscriptions/services/renewal-scheduler.service.ts"
