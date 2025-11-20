#!/bin/bash

# Test Payment Gateway Settings Integration with UnifiedPaymentService
# This script tests that payment services use settings from the database

echo "=========================================="
echo "Payment Settings Integration Test"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo "Step 1: Login as Super Admin"
echo "------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "SuperAdmin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to login as super admin${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Logged in successfully${NC}"
echo ""

echo "Step 2: Get Current Payment Gateway Settings"
echo "---------------------------------------------"
CURRENT_SETTINGS=$(curl -s -X GET "$BASE_URL/super-admin/settings/payment-gateway" \
  -H "Authorization: Bearer $TOKEN")

echo "Current settings:"
echo $CURRENT_SETTINGS | jq '.'
echo ""

echo "Step 3: Update Stripe Settings"
echo "-------------------------------"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/super-admin/settings/payment-gateway" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stripe": {
      "enabled": true,
      "publicKey": "pk_test_updated",
      "secretKey": "sk_test_updated",
      "webhookSecret": "whsec_test_updated"
    }
  }')

echo "Update response:"
echo $UPDATE_RESPONSE | jq '.'

# Check if update was successful
if echo $UPDATE_RESPONSE | grep -q "pk_test_updated"; then
    print_result 0 "Stripe settings updated successfully"
else
    print_result 1 "Failed to update Stripe settings"
fi
echo ""

echo "Step 4: Verify Settings Were Saved"
echo "-----------------------------------"
VERIFY_SETTINGS=$(curl -s -X GET "$BASE_URL/super-admin/settings/payment-gateway" \
  -H "Authorization: Bearer $TOKEN")

echo "Verified settings:"
echo $VERIFY_SETTINGS | jq '.'

if echo $VERIFY_SETTINGS | grep -q "pk_test_updated"; then
    print_result 0 "Settings persisted correctly"
else
    print_result 1 "Settings not persisted"
fi
echo ""

echo "Step 5: Test Stripe Connection"
echo "-------------------------------"
TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/super-admin/settings/payment-gateway/test-connection" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "stripe",
    "credentials": {
      "publicKey": "'"$STRIPE_PUBLISHABLE_KEY"'",
      "secretKey": "'"$STRIPE_SECRET_KEY"'"
    }
  }')

echo "Test connection response:"
echo $TEST_RESPONSE | jq '.'

if echo $TEST_RESPONSE | grep -q '"success":true'; then
    print_result 0 "Stripe connection test successful"
else
    print_result 1 "Stripe connection test failed"
fi
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi
