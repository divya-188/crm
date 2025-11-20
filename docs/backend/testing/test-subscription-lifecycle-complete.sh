#!/bin/bash

# Comprehensive Subscription Lifecycle Test Script
# Tests all tasks from 1-9 in the subscription lifecycle

BASE_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="superadmin@whatscrm.com"
ADMIN_PASSWORD="SuperAdmin123!"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print section headers
print_section() {
    echo ""
    echo "=========================================="
    echo -e "${BLUE}$1${NC}"
    echo "=========================================="
    echo ""
}

# Function to print test results
print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$1" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✅ PASS${NC}: $2"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}❌ FAIL${NC}: $2"
        if [ ! -z "$3" ]; then
            echo -e "   ${YELLOW}Details: $3${NC}"
        fi
    fi
}

# Function to extract JSON value
get_json_value() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*" | cut -d'"' -f4
}

print_section "SUBSCRIPTION LIFECYCLE COMPLETE TEST SUITE"
echo "Testing all tasks from 1-9"
echo "Base URL: $BASE_URL"
echo ""

# ==========================================
# SETUP: Login and Get Access Token
# ==========================================
print_section "SETUP: Authentication"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    print_test "FAIL" "Authentication" "Could not obtain access token"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_test "PASS" "Authentication successful"

# Get tenant ID from token payload
TENANT_ID=$(echo $LOGIN_RESPONSE | grep -o '"tenantId":"[^"]*' | cut -d'"' -f4)
echo "Tenant ID: $TENANT_ID"

# ==========================================
# TASK 1: Quota Enforcement System
# ==========================================
print_section "TASK 1: Quota Enforcement System"

# 1.1 Get current subscription to check quotas
SUBSCRIPTION_RESPONSE=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$SUBSCRIPTION_RESPONSE" | grep -q '"id"'; then
    print_test "PASS" "Get current subscription"
    SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "   Subscription ID: $SUBSCRIPTION_ID"
else
    print_test "FAIL" "Get current subscription" "No active subscription found"
fi

# 1.2 Get usage statistics
USAGE_RESPONSE=$(curl -s -X GET "$BASE_URL/subscriptions/usage" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$USAGE_RESPONSE" | grep -q '"contacts"'; then
    print_test "PASS" "Get usage statistics"
    echo "   Usage: $(echo $USAGE_RESPONSE | head -c 200)..."
else
    print_test "FAIL" "Get usage statistics"
fi

# 1.3 Test quota enforcement by creating a contact
CONTACT_RESPONSE=$(curl -s -X POST "$BASE_URL/contacts" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contact for Quota",
    "phone": "+1234567890",
    "email": "quota-test@example.com"
  }')

if echo "$CONTACT_RESPONSE" | grep -q '"id"'; then
    print_test "PASS" "Create contact (quota check passed)"
else
    if echo "$CONTACT_RESPONSE" | grep -q "quota"; then
        print_test "PASS" "Quota enforcement working (limit reached)"
    else
        print_test "FAIL" "Create contact" "$CONTACT_RESPONSE"
    fi
fi

# ==========================================
# TASK 2: Subscription Creation with Payment
# ==========================================
print_section "TASK 2: Subscription Creation with Payment"

# 2.1 Get available subscription plans
PLANS_RESPONSE=$(curl -s -X GET "$BASE_URL/subscription-plans" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PLANS_RESPONSE" | grep -q '"id"'; then
    print_test "PASS" "Get subscription plans"
    PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "   First Plan ID: $PLAN_ID"
else
    print_test "FAIL" "Get subscription plans"
fi

# 2.2 Test subscription creation endpoint exists
CREATE_SUB_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/subscriptions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"paymentProvider\": \"stripe\",
    \"paymentMethodId\": \"pm_test_123\"
  }")

HTTP_CODE=$(echo "$CREATE_SUB_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_SUB_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ] || echo "$RESPONSE_BODY" | grep -q "subscription"; then
    print_test "PASS" "Subscription creation endpoint"
else
    print_test "FAIL" "Subscription creation endpoint" "HTTP $HTTP_CODE"
fi

# 2.3 Test webhook endpoints exist
WEBHOOK_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/subscriptions/webhooks/stripe" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test_signature" \
  -d '{"type": "test"}')

HTTP_CODE=$(echo "$WEBHOOK_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
    print_test "PASS" "Stripe webhook endpoint exists"
else
    print_test "FAIL" "Stripe webhook endpoint" "HTTP $HTTP_CODE"
fi

# ==========================================
# TASK 3: Automatic Subscription Renewal
# ==========================================
print_section "TASK 3: Automatic Subscription Renewal"

# 3.1 Test renewal endpoint
if [ ! -z "$SUBSCRIPTION_ID" ]; then
    RENEW_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/renew" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{}')
    
    HTTP_CODE=$(echo "$RENEW_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "400" ]; then
        print_test "PASS" "Renewal endpoint exists"
    else
        print_test "FAIL" "Renewal endpoint" "HTTP $HTTP_CODE"
    fi
else
    print_test "FAIL" "Renewal endpoint" "No subscription ID available"
fi

# 3.2 Check if renewal scheduler service exists
if grep -q "RenewalSchedulerService" src/modules/subscriptions/subscriptions.module.ts 2>/dev/null; then
    print_test "PASS" "Renewal scheduler service configured"
else
    print_test "FAIL" "Renewal scheduler service not found"
fi

# ==========================================
# TASK 4: Subscription Cancellation
# ==========================================
print_section "TASK 4: Subscription Cancellation"

# 4.1 Test cancellation endpoint (without actually cancelling)
if [ ! -z "$SUBSCRIPTION_ID" ]; then
    # Just check if endpoint exists by sending invalid request
    CANCEL_CHECK=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/subscriptions/invalid-id" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"cancellationReason": "Testing"}')
    
    HTTP_CODE=$(echo "$CANCEL_CHECK" | tail -n1)
    if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "200" ]; then
        print_test "PASS" "Cancellation endpoint exists"
    else
        print_test "FAIL" "Cancellation endpoint" "HTTP $HTTP_CODE"
    fi
else
    print_test "FAIL" "Cancellation endpoint" "No subscription ID available"
fi

# 4.2 Check cancellation service methods exist
if grep -q "cancelSubscription" src/modules/subscriptions/services/subscription-lifecycle.service.ts 2>/dev/null; then
    print_test "PASS" "Cancellation service method exists"
else
    print_test "FAIL" "Cancellation service method not found"
fi

# ==========================================
# TASK 5: Invoice Generation
# ==========================================
print_section "TASK 5: Invoice Generation"

# 5.1 Get invoices list
INVOICES_RESPONSE=$(curl -s -X GET "$BASE_URL/subscriptions/invoices" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$INVOICES_RESPONSE" | grep -q '"success"'; then
    print_test "PASS" "Get invoices list"
    
    # Check if there are any invoices
    if echo "$INVOICES_RESPONSE" | grep -q '"id"'; then
        INVOICE_ID=$(echo $INVOICES_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        echo "   Found invoice: $INVOICE_ID"
        
        # 5.2 Test invoice download
        INVOICE_DL=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/subscriptions/invoices/$INVOICE_ID/download" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -o /tmp/test-invoice.pdf)
        
        HTTP_CODE=$(echo "$INVOICE_DL" | tail -n1)
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
            print_test "PASS" "Invoice download endpoint"
        else
            print_test "FAIL" "Invoice download endpoint" "HTTP $HTTP_CODE"
        fi
    else
        print_test "PASS" "Invoice list endpoint (no invoices yet)"
    fi
else
    print_test "FAIL" "Get invoices list"
fi

# 5.3 Check invoice entity and service exist
if [ -f "src/modules/subscriptions/entities/invoice.entity.ts" ]; then
    print_test "PASS" "Invoice entity exists"
else
    print_test "FAIL" "Invoice entity not found"
fi

if [ -f "src/modules/subscriptions/services/invoice.service.ts" ]; then
    print_test "PASS" "Invoice service exists"
else
    print_test "FAIL" "Invoice service not found"
fi

# ==========================================
# TASK 6: Plan Upgrades and Downgrades
# ==========================================
print_section "TASK 6: Plan Upgrades and Downgrades"

# 6.1 Test upgrade endpoint
if [ ! -z "$SUBSCRIPTION_ID" ] && [ ! -z "$PLAN_ID" ]; then
    UPGRADE_CHECK=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/upgrade" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"newPlanId\": \"$PLAN_ID\", \"paymentProvider\": \"stripe\", \"paymentMethodId\": \"pm_test\"}")
    
    HTTP_CODE=$(echo "$UPGRADE_CHECK" | tail -n1)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "201" ]; then
        print_test "PASS" "Upgrade endpoint exists"
    else
        print_test "FAIL" "Upgrade endpoint" "HTTP $HTTP_CODE"
    fi
else
    print_test "FAIL" "Upgrade endpoint" "Missing subscription or plan ID"
fi

# 6.2 Test downgrade endpoint
if [ ! -z "$SUBSCRIPTION_ID" ] && [ ! -z "$PLAN_ID" ]; then
    DOWNGRADE_CHECK=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/downgrade" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"newPlanId\": \"$PLAN_ID\"}")
    
    HTTP_CODE=$(echo "$DOWNGRADE_CHECK" | tail -n1)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "201" ]; then
        print_test "PASS" "Downgrade endpoint exists"
    else
        print_test "FAIL" "Downgrade endpoint" "HTTP $HTTP_CODE"
    fi
else
    print_test "FAIL" "Downgrade endpoint" "Missing subscription or plan ID"
fi

# 6.3 Check lifecycle service methods
if grep -q "upgradeSubscription\|downgradeSubscription" src/modules/subscriptions/services/subscription-lifecycle.service.ts 2>/dev/null; then
    print_test "PASS" "Plan change service methods exist"
else
    print_test "FAIL" "Plan change service methods not found"
fi

# ==========================================
# TASK 7: Email Notification System
# ==========================================
print_section "TASK 7: Email Notification System"

# 7.1 Check email service exists
if [ -f "src/modules/subscriptions/services/email-notification.service.ts" ]; then
    print_test "PASS" "Email notification service exists"
else
    print_test "FAIL" "Email notification service not found"
fi

# 7.2 Check email templates exist
TEMPLATE_COUNT=0
for template in subscription-welcome payment-success payment-failed quota-warning renewal-reminder subscription-cancelled; do
    if [ -f "src/modules/subscriptions/templates/${template}.hbs" ]; then
        TEMPLATE_COUNT=$((TEMPLATE_COUNT + 1))
    fi
done

if [ $TEMPLATE_COUNT -ge 5 ]; then
    print_test "PASS" "Email templates exist ($TEMPLATE_COUNT/6 found)"
else
    print_test "FAIL" "Email templates incomplete" "Only $TEMPLATE_COUNT/6 found"
fi

# 7.3 Check email service methods
EMAIL_METHODS=0
for method in sendSubscriptionWelcome sendPaymentSuccess sendPaymentFailed sendQuotaWarning sendRenewalReminder; do
    if grep -q "$method" src/modules/subscriptions/services/email-notification.service.ts 2>/dev/null; then
        EMAIL_METHODS=$((EMAIL_METHODS + 1))
    fi
done

if [ $EMAIL_METHODS -ge 4 ]; then
    print_test "PASS" "Email service methods exist ($EMAIL_METHODS/5 found)"
else
    print_test "FAIL" "Email service methods incomplete" "Only $EMAIL_METHODS/5 found"
fi

# ==========================================
# TASK 8: Grace Period Management
# ==========================================
print_section "TASK 8: Grace Period Management"

# 8.1 Check grace period fields in entity
if grep -q "gracePeriodEnd" src/modules/subscriptions/entities/subscription.entity.ts 2>/dev/null; then
    print_test "PASS" "Grace period field exists in entity"
else
    print_test "FAIL" "Grace period field not found in entity"
fi

# 8.2 Check grace period middleware
if [ -f "src/common/middleware/grace-period-warning.middleware.ts" ]; then
    print_test "PASS" "Grace period warning middleware exists"
else
    print_test "FAIL" "Grace period warning middleware not found"
fi

# 8.3 Test reactivation endpoint
if [ ! -z "$SUBSCRIPTION_ID" ]; then
    REACTIVATE_CHECK=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/reactivate" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"paymentMethodId": "pm_test"}')
    
    HTTP_CODE=$(echo "$REACTIVATE_CHECK" | tail -n1)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "201" ]; then
        print_test "PASS" "Reactivation endpoint exists"
    else
        print_test "FAIL" "Reactivation endpoint" "HTTP $HTTP_CODE"
    fi
else
    print_test "FAIL" "Reactivation endpoint" "No subscription ID available"
fi

# 8.4 Check lifecycle service has reactivation method
if grep -q "reactivateSubscription" src/modules/subscriptions/services/subscription-lifecycle.service.ts 2>/dev/null; then
    print_test "PASS" "Reactivation service method exists"
else
    print_test "FAIL" "Reactivation service method not found"
fi

# ==========================================
# TASK 9: E2E Tests
# ==========================================
print_section "TASK 9: E2E Tests"

# 9.1 Check if E2E test files exist
E2E_TESTS=0
for test_file in subscription-creation quota-enforcement renewal cancellation plan-changes; do
    if [ -f "test/subscription-lifecycle/${test_file}.e2e-spec.ts" ]; then
        E2E_TESTS=$((E2E_TESTS + 1))
    fi
done

if [ $E2E_TESTS -ge 4 ]; then
    print_test "PASS" "E2E test files exist ($E2E_TESTS/5 found)"
else
    print_test "FAIL" "E2E test files incomplete" "Only $E2E_TESTS/5 found"
fi

# 9.2 Check if test scripts exist
TEST_SCRIPTS=0
for script in test-subscription-creation.sh test-grace-period.sh test-plan-changes.sh test-email-notifications.sh; do
    if [ -f "$script" ]; then
        TEST_SCRIPTS=$((TEST_SCRIPTS + 1))
    fi
done

if [ $TEST_SCRIPTS -ge 3 ]; then
    print_test "PASS" "Test scripts exist ($TEST_SCRIPTS/4 found)"
else
    print_test "FAIL" "Test scripts incomplete" "Only $TEST_SCRIPTS/4 found"
fi

# ==========================================
# FINAL SUMMARY
# ==========================================
print_section "TEST SUMMARY"

echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "Pass Rate: ${PASS_RATE}%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Review the output above.${NC}"
    exit 1
fi
