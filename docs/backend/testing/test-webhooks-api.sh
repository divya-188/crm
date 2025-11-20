#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api/v1"

echo -e "${YELLOW}=== WhatsApp CRM - Webhooks API Test ===${NC}\n"

# Step 1: Register a test user
echo -e "${YELLOW}Step 1: Registering test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "webhook-test@example.com",
    "password": "Test123!@#",
    "firstName": "Webhook",
    "lastName": "Tester",
    "tenantName": "Webhook Test Tenant"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract access token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo -e "${RED}Failed to get access token. Trying to login...${NC}"
  
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "webhook-test@example.com",
      "password": "Test123!@#"
    }')
  
  echo "$LOGIN_RESPONSE" | jq '.'
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')
fi

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo -e "${RED}Failed to authenticate. Exiting.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}\n"

# Step 2: Get available webhook events
echo -e "${YELLOW}Step 2: Getting available webhook events...${NC}"
EVENTS_RESPONSE=$(curl -s -X GET "$API_URL/webhooks/events" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$EVENTS_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Retrieved available events${NC}\n"

# Step 3: Create a webhook
echo -e "${YELLOW}Step 3: Creating a webhook...${NC}"
CREATE_WEBHOOK_RESPONSE=$(curl -s -X POST "$API_URL/webhooks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webhook",
    "url": "https://webhook.site/unique-id",
    "events": ["message.new", "conversation.created"],
    "retryCount": 3,
    "timeoutSeconds": 30
  }')

echo "$CREATE_WEBHOOK_RESPONSE" | jq '.'

WEBHOOK_ID=$(echo "$CREATE_WEBHOOK_RESPONSE" | jq -r '.data.id')

if [ -z "$WEBHOOK_ID" ] || [ "$WEBHOOK_ID" = "null" ]; then
  echo -e "${RED}Failed to create webhook${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Webhook created with ID: $WEBHOOK_ID${NC}\n"

# Step 4: Get all webhooks
echo -e "${YELLOW}Step 4: Getting all webhooks...${NC}"
LIST_WEBHOOKS_RESPONSE=$(curl -s -X GET "$API_URL/webhooks" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$LIST_WEBHOOKS_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Retrieved webhooks list${NC}\n"

# Step 5: Get webhook details
echo -e "${YELLOW}Step 5: Getting webhook details...${NC}"
WEBHOOK_DETAILS_RESPONSE=$(curl -s -X GET "$API_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$WEBHOOK_DETAILS_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Retrieved webhook details${NC}\n"

# Step 6: Update webhook
echo -e "${YELLOW}Step 6: Updating webhook...${NC}"
UPDATE_WEBHOOK_RESPONSE=$(curl -s -X PATCH "$API_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Webhook",
    "events": ["message.new", "conversation.created", "campaign.completed"]
  }')

echo "$UPDATE_WEBHOOK_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Webhook updated${NC}\n"

# Step 7: Test webhook
echo -e "${YELLOW}Step 7: Testing webhook...${NC}"
TEST_WEBHOOK_RESPONSE=$(curl -s -X POST "$API_URL/webhooks/$WEBHOOK_ID/test" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "message.new",
    "payload": {
      "messageId": "test_msg_123",
      "content": "This is a test message"
    }
  }')

echo "$TEST_WEBHOOK_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Webhook test initiated${NC}\n"

# Wait a bit for the webhook to be delivered
sleep 2

# Step 8: Get webhook logs
echo -e "${YELLOW}Step 8: Getting webhook logs...${NC}"
LOGS_RESPONSE=$(curl -s -X GET "$API_URL/webhooks/$WEBHOOK_ID/logs?limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$LOGS_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Retrieved webhook logs${NC}\n"

# Step 9: Get webhook statistics
echo -e "${YELLOW}Step 9: Getting webhook statistics...${NC}"
STATS_RESPONSE=$(curl -s -X GET "$API_URL/webhooks/$WEBHOOK_ID/stats" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$STATS_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Retrieved webhook statistics${NC}\n"

# Step 10: Delete webhook
echo -e "${YELLOW}Step 10: Deleting webhook...${NC}"
DELETE_WEBHOOK_RESPONSE=$(curl -s -X DELETE "$API_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$DELETE_WEBHOOK_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Webhook deleted${NC}\n"

# Step 11: Verify deletion
echo -e "${YELLOW}Step 11: Verifying webhook deletion...${NC}"
VERIFY_DELETE_RESPONSE=$(curl -s -X GET "$API_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$VERIFY_DELETE_RESPONSE" | jq '.'

if echo "$VERIFY_DELETE_RESPONSE" | jq -e '.statusCode == 404' > /dev/null; then
  echo -e "${GREEN}✓ Webhook successfully deleted${NC}\n"
else
  echo -e "${RED}✗ Webhook still exists${NC}\n"
fi

echo -e "${GREEN}=== Webhooks API Test Complete ===${NC}"
