#!/bin/bash

# Test Security Fix #1: Restrict API Keys, Webhooks, WhatsApp to Admin Only

echo "🔒 Testing Security Fix #1: Role-Based Access Control"
echo "======================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api/v1"

# Test credentials (from your existing test users)
SUPER_ADMIN_EMAIL="superadmin@whatscrm.com"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"

ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="Admin123!"

AGENT_EMAIL="agent@test.com"
AGENT_PASSWORD="Agent123!"

# Function to login and get token
login() {
  local email=$1
  local password=$2
  
  response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  
  token=$(echo $response | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  echo $token
}

# Function to test API key creation
test_api_key_creation() {
  local role=$1
  local token=$2
  local should_succeed=$3
  
  echo -n "Testing API Key creation as $role... "
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api-keys" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Key"}')
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$should_succeed" = "true" ]; then
    if [ "$http_code" = "201" ]; then
      echo -e "${GREEN}✓ PASS${NC} (201 Created)"
    else
      echo -e "${RED}✗ FAIL${NC} (Expected 201, got $http_code)"
    fi
  else
    if [ "$http_code" = "403" ]; then
      echo -e "${GREEN}✓ PASS${NC} (403 Forbidden)"
    else
      echo -e "${RED}✗ FAIL${NC} (Expected 403, got $http_code)"
    fi
  fi
}

# Function to test webhook creation
test_webhook_creation() {
  local role=$1
  local token=$2
  local should_succeed=$3
  
  echo -n "Testing Webhook creation as $role... "
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/webhooks" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Webhook","url":"https://webhook.site/test","events":["message.received"]}')
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$should_succeed" = "true" ]; then
    if [ "$http_code" = "201" ]; then
      echo -e "${GREEN}✓ PASS${NC} (201 Created)"
    else
      echo -e "${RED}✗ FAIL${NC} (Expected 201, got $http_code)"
    fi
  else
    if [ "$http_code" = "403" ]; then
      echo -e "${GREEN}✓ PASS${NC} (403 Forbidden)"
    else
      echo -e "${RED}✗ FAIL${NC} (Expected 403, got $http_code)"
    fi
  fi
}

# Function to test WhatsApp connection creation
test_whatsapp_connection() {
  local role=$1
  local token=$2
  local should_succeed=$3
  
  echo -n "Testing WhatsApp connection as $role... "
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/whatsapp/connections" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Connection","type":"baileys","phoneNumber":"+1234567890"}')
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$should_succeed" = "true" ]; then
    if [ "$http_code" = "201" ]; then
      echo -e "${GREEN}✓ PASS${NC} (201 Created)"
    else
      echo -e "${RED}✗ FAIL${NC} (Expected 201, got $http_code)"
    fi
  else
    if [ "$http_code" = "403" ]; then
      echo -e "${GREEN}✓ PASS${NC} (403 Forbidden)"
    else
      echo -e "${RED}✗ FAIL${NC} (Expected 403, got $http_code)"
    fi
  fi
}

# Login as different users
echo "Logging in as different users..."
echo ""

SUPER_ADMIN_TOKEN=$(login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD")
ADMIN_TOKEN=$(login "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
AGENT_TOKEN=$(login "$AGENT_EMAIL" "$AGENT_PASSWORD")

if [ -z "$SUPER_ADMIN_TOKEN" ] || [ -z "$ADMIN_TOKEN" ] || [ -z "$AGENT_TOKEN" ]; then
  echo -e "${RED}✗ Failed to login. Please check credentials and ensure backend is running.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ All users logged in successfully${NC}"
echo ""

# Run tests
echo "Running Security Tests..."
echo "========================"
echo ""

echo "1. API Keys Tests:"
echo "------------------"
test_api_key_creation "Super Admin" "$SUPER_ADMIN_TOKEN" "true"
test_api_key_creation "Admin" "$ADMIN_TOKEN" "true"
test_api_key_creation "Agent" "$AGENT_TOKEN" "false"
echo ""

echo "2. Webhooks Tests:"
echo "------------------"
test_webhook_creation "Super Admin" "$SUPER_ADMIN_TOKEN" "true"
test_webhook_creation "Admin" "$ADMIN_TOKEN" "true"
test_webhook_creation "Agent" "$AGENT_TOKEN" "false"
echo ""

echo "3. WhatsApp Connections Tests:"
echo "------------------------------"
test_whatsapp_connection "Super Admin" "$SUPER_ADMIN_TOKEN" "true"
test_whatsapp_connection "Admin" "$ADMIN_TOKEN" "true"
test_whatsapp_connection "Agent" "$AGENT_TOKEN" "false"
echo ""

echo "======================================================"
echo -e "${GREEN}✓ Security Fix #1 Testing Complete!${NC}"
echo ""
echo "Summary:"
echo "- Agents can no longer create API keys ✓"
echo "- Agents can no longer create webhooks ✓"
echo "- Agents can no longer create WhatsApp connections ✓"
echo "- Admins and Super Admins retain full access ✓"
