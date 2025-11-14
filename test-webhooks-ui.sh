#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000/api"

# Test credentials
EMAIL="user@example.com"
PASSWORD="password123"

echo -e "${YELLOW}=== WhatsApp CRM - Webhook UI Test ===${NC}\n"

# Login and get token
echo -e "${YELLOW}1. Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}\n"

# Get available events
echo -e "${YELLOW}2. Getting available webhook events...${NC}"
EVENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/webhooks/events" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $EVENTS_RESPONSE"
echo -e "${GREEN}✓ Events retrieved${NC}\n"

# Create a webhook
echo -e "${YELLOW}3. Creating a webhook...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webhook",
    "url": "https://webhook.site/unique-id",
    "events": ["message.new", "conversation.created"],
    "retryCount": 3,
    "timeoutSeconds": 30,
    "isActive": true
  }')

WEBHOOK_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$WEBHOOK_ID" ]; then
  echo -e "${RED}✗ Webhook creation failed${NC}"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "Response: $CREATE_RESPONSE"
echo -e "${GREEN}✓ Webhook created with ID: $WEBHOOK_ID${NC}\n"

# Get all webhooks
echo -e "${YELLOW}4. Getting all webhooks...${NC}"
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/webhooks" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $LIST_RESPONSE"
echo -e "${GREEN}✓ Webhooks retrieved${NC}\n"

# Get webhook details
echo -e "${YELLOW}5. Getting webhook details...${NC}"
DETAILS_RESPONSE=$(curl -s -X GET "$BASE_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $DETAILS_RESPONSE"
echo -e "${GREEN}✓ Webhook details retrieved${NC}\n"

# Test webhook
echo -e "${YELLOW}6. Testing webhook...${NC}"
TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks/$WEBHOOK_ID/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "message.new",
    "payload": {
      "messageId": "test_123",
      "content": "Test message"
    }
  }')

echo "Response: $TEST_RESPONSE"
echo -e "${GREEN}✓ Webhook test initiated${NC}\n"

# Get webhook logs
echo -e "${YELLOW}7. Getting webhook logs...${NC}"
sleep 2  # Wait for test to complete
LOGS_RESPONSE=$(curl -s -X GET "$BASE_URL/webhooks/$WEBHOOK_ID/logs?limit=10" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $LOGS_RESPONSE"
echo -e "${GREEN}✓ Webhook logs retrieved${NC}\n"

# Get webhook stats
echo -e "${YELLOW}8. Getting webhook statistics...${NC}"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/webhooks/$WEBHOOK_ID/stats" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $STATS_RESPONSE"
echo -e "${GREEN}✓ Webhook stats retrieved${NC}\n"

# Update webhook
echo -e "${YELLOW}9. Updating webhook...${NC}"
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Webhook",
    "isActive": false
  }')

echo "Response: $UPDATE_RESPONSE"
echo -e "${GREEN}✓ Webhook updated${NC}\n"

# Delete webhook
echo -e "${YELLOW}10. Deleting webhook...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/webhooks/$WEBHOOK_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $DELETE_RESPONSE"
echo -e "${GREEN}✓ Webhook deleted${NC}\n"

echo -e "${GREEN}=== All webhook UI tests completed successfully! ===${NC}"
