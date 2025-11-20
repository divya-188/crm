#!/bin/bash

# Test WhatsApp Settings API
# This script tests the per-tenant WhatsApp configuration endpoints

BASE_URL="http://localhost:3000"
ADMIN_TOKEN=""

echo "=== WhatsApp Settings API Test ==="
echo ""

# Check if token is provided
if [ -z "$1" ]; then
  echo "Usage: ./test-whatsapp-settings.sh <admin_token>"
  echo ""
  echo "Get your admin token by logging in:"
  echo "curl -X POST $BASE_URL/api/v1/auth/login \\"
  echo "  -H 'Content-Type: application/json' \\"
  echo "  -d '{\"email\":\"admin@example.com\",\"password\":\"password\"}'"
  exit 1
fi

ADMIN_TOKEN=$1

echo "1. Get Current WhatsApp Configuration"
echo "--------------------------------------"
curl -X GET "$BASE_URL/api/v1/settings/whatsapp" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "2. Create WhatsApp Configuration"
echo "--------------------------------------"
curl -X POST "$BASE_URL/api/v1/settings/whatsapp" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test WhatsApp Business",
    "phoneNumberId": "123456789012345",
    "accessToken": "EAAtest_token_here",
    "businessAccountId": "987654321098765",
    "webhookUrl": "https://yourdomain.com/api/v1/webhooks/whatsapp"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "3. Get Configuration Again (Should Show Created Config)"
echo "--------------------------------------"
curl -X GET "$BASE_URL/api/v1/settings/whatsapp" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "4. Update WhatsApp Configuration"
echo "--------------------------------------"
curl -X PUT "$BASE_URL/api/v1/settings/whatsapp" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated WhatsApp Business",
    "isActive": true
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "5. Test Connection (Will Fail with Test Credentials)"
echo "--------------------------------------"
curl -X POST "$BASE_URL/api/v1/settings/whatsapp/test" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "6. Regenerate Webhook Secret"
echo "--------------------------------------"
curl -X POST "$BASE_URL/api/v1/settings/whatsapp/regenerate-secret" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "7. Delete WhatsApp Configuration"
echo "--------------------------------------"
curl -X DELETE "$BASE_URL/api/v1/settings/whatsapp" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "=== Test Complete ==="
echo ""
echo "Expected Results:"
echo "1. GET (first): 404 or null (no config yet)"
echo "2. POST: 201 (created)"
echo "3. GET (second): 200 (config exists)"
echo "4. PUT: 200 (updated)"
echo "5. POST test: 200 (test result, likely failed with test credentials)"
echo "6. POST regenerate: 200 (new secret generated)"
echo "7. DELETE: 200 (deleted)"
