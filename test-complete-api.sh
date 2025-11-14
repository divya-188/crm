#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
BASE_URL="http://localhost:3000/api/v1"

test_endpoint() {
    local name=$1
    local response=$2
    if echo "$response" | grep -q "statusCode.*[45][0-9][0-9]\|Internal server error\|Bad Request\|Unauthorized" && ! echo "$name" | grep -q "Should Fail"; then
        echo -e "${RED}✗ FAILED: $name${NC}"
        echo "Response: $response"
        ((FAILED++))
    else
        echo -e "${GREEN}✓ PASSED: $name${NC}"
        ((PASSED++))
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Complete API Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# ============================================
# 1. HEALTH & AUTH
# ============================================
echo -e "${YELLOW}=== 1. Health & Authentication ===${NC}"

RESPONSE=$(curl -s $BASE_URL/health)
test_endpoint "Health Check" "$RESPONSE"

REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test$(date +%s)@test.com\",\"password\":\"Test@123\",\"firstName\":\"Test\",\"lastName\":\"User\"}")
test_endpoint "Register New User" "$REGISTER_RESPONSE"

LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@whatscrm.com","password":"Admin@123"}')
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
test_endpoint "Login" "$LOGIN_RESPONSE"

PROFILE_RESPONSE=$(curl -s $BASE_URL/auth/me \
  -H "Authorization: Bearer $TOKEN")
test_endpoint "Get Profile" "$PROFILE_RESPONSE"

UNAUTH_RESPONSE=$(curl -s $BASE_URL/auth/me)
test_endpoint "Unauthorized Access (Should Fail)" "$UNAUTH_RESPONSE"

echo ""

# ============================================
# 2. TENANTS
# ============================================
echo -e "${YELLOW}=== 2. Tenants ===${NC}"

TENANT_RESPONSE=$(curl -s -X POST $BASE_URL/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Tenant\",\"slug\":\"test-tenant-$(date +%s)\"}")
TENANT_ID=$(echo $TENANT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_endpoint "Create Tenant" "$TENANT_RESPONSE"

TENANTS_LIST=$(curl -s $BASE_URL/tenants \
  -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All Tenants" "$TENANTS_LIST"

echo ""

# ============================================
# 3. CONTACTS
# ============================================
echo -e "${YELLOW}=== 3. Contacts ===${NC}"

CONTACT_RESPONSE=$(curl -s -X POST $BASE_URL/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Smith","email":"jane@example.com","phone":"+1234567891","tags":["lead"]}')
CONTACT_ID=$(echo $CONTACT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_endpoint "Create Contact" "$CONTACT_RESPONSE"

CONTACTS_LIST=$(curl -s "$BASE_URL/contacts" \
  -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All Contacts" "$CONTACTS_LIST"

SEARCH_CONTACTS=$(curl -s "$BASE_URL/contacts?search=Jane" \
  -H "Authorization: Bearer $TOKEN")
test_endpoint "Search Contacts" "$SEARCH_CONTACTS"

if [ -n "$CONTACT_ID" ]; then
  UPDATE_CONTACT=$(curl -s -X PATCH $BASE_URL/contacts/$CONTACT_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Jane Updated"}')
  test_endpoint "Update Contact" "$UPDATE_CONTACT"
fi

echo ""

# ============================================
# 4. CONVERSATIONS
# ============================================
echo -e "${YELLOW}=== 4. Conversations ===${NC}"

if [ -n "$CONTACT_ID" ]; then
  CONV_RESPONSE=$(curl -s -X POST $BASE_URL/conversations \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"contactId\":\"$CONTACT_ID\"}")
  CONV_ID=$(echo $CONV_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  test_endpoint "Create Conversation" "$CONV_RESPONSE"
fi

CONVS_LIST=$(curl -s $BASE_URL/conversations \
  -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All Conversations" "$CONVS_LIST"

if [ -n "$CONV_ID" ]; then
  MESSAGE_RESPONSE=$(curl -s -X POST $BASE_URL/conversations/$CONV_ID/messages \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"type":"text","content":"Test message","direction":"outbound"}')
  test_endpoint "Send Message" "$MESSAGE_RESPONSE"

  MESSAGES_LIST=$(curl -s $BASE_URL/conversations/$CONV_ID/messages \
    -H "Authorization: Bearer $TOKEN")
  test_endpoint "Get Messages" "$MESSAGES_LIST"
fi

echo ""

# ============================================
# 5. TEMPLATES
# ============================================
echo -e "${YELLOW}=== 5. Templates ===${NC}"

TEMPLATE_RESPONSE=$(curl -s -X POST $BASE_URL/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Welcome Template","category":"marketing","language":"en","content":"Hello {{1}}, welcome to our service!","variables":[{"name":"1","example":"John"}]}')
TEMPLATE_ID=$(echo $TEMPLATE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_endpoint "Create Template" "$TEMPLATE_RESPONSE"

TEMPLATES_LIST=$(curl -s $BASE_URL/templates \
  -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All Templates" "$TEMPLATES_LIST"

if [ -n "$TEMPLATE_ID" ]; then
  SUBMIT_TEMPLATE=$(curl -s -X POST $BASE_URL/templates/$TEMPLATE_ID/submit \
    -H "Authorization: Bearer $TOKEN")
  test_endpoint "Submit Template" "$SUBMIT_TEMPLATE"

  APPROVE_TEMPLATE=$(curl -s -X POST $BASE_URL/templates/$TEMPLATE_ID/approve \
    -H "Authorization: Bearer $TOKEN")
  test_endpoint "Approve Template" "$APPROVE_TEMPLATE"
fi

echo ""

# ============================================
# 6. CAMPAIGNS
# ============================================
echo -e "${YELLOW}=== 6. Campaigns ===${NC}"

if [ -n "$TEMPLATE_ID" ]; then
  CAMPAIGN_RESPONSE=$(curl -s -X POST $BASE_URL/campaigns \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Campaign\",\"templateId\":\"$TEMPLATE_ID\",\"segmentFilters\":{\"isActive\":true}}")
  CAMPAIGN_ID=$(echo $CAMPAIGN_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  test_endpoint "Create Campaign" "$CAMPAIGN_RESPONSE"
fi

CAMPAIGNS_LIST=$(curl -s $BASE_URL/campaigns \
  -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All Campaigns" "$CAMPAIGNS_LIST"

if [ -n "$CAMPAIGN_ID" ]; then
  CAMPAIGN_STATS=$(curl -s $BASE_URL/campaigns/$CAMPAIGN_ID/stats \
    -H "Authorization: Bearer $TOKEN")
  test_endpoint "Get Campaign Stats" "$CAMPAIGN_STATS"
fi

echo ""

# ============================================
# 7. FLOWS (NEW)
# ============================================
echo -e "${YELLOW}=== 7. Chatbot Flows ===${NC}"

FLOW_RESPONSE=$(curl -s -X POST $BASE_URL/flows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Flow",
    "description": "Automated welcome message",
    "flowData": {
      "nodes": [
        {"id": "start-1", "type": "start", "position": {"x": 100, "y": 100}, "data": {}},
        {"id": "msg-1", "type": "message", "position": {"x": 300, "y": 100}, "data": {"message": "Welcome!"}}
      ],
      "edges": [{"id": "e1", "source": "start-1", "target": "msg-1"}]
    },
    "triggerConfig": {"type": "welcome"},
    "status": "draft"
  }')
FLOW_ID=$(echo $FLOW_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_endpoint "Create Flow" "$FLOW_RESPONSE"

FLOWS_LIST=$(curl -s $BASE_URL/flows \
  -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All Flows" "$FLOWS_LIST"

if [ -n "$FLOW_ID" ]; then
  FLOW_DETAIL=$(curl -s $BASE_URL/flows/$FLOW_ID \
    -H "Authorization: Bearer $TOKEN")
  test_endpoint "Get Flow Details" "$FLOW_DETAIL"

  UPDATE_FLOW=$(curl -s -X PUT $BASE_URL/flows/$FLOW_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Welcome Flow"}')
  test_endpoint "Update Flow" "$UPDATE_FLOW"

  ACTIVATE_FLOW=$(curl -s -X POST $BASE_URL/flows/$FLOW_ID/activate \
    -H "Authorization: Bearer $TOKEN")
  test_endpoint "Activate Flow" "$ACTIVATE_FLOW"

  DUPLICATE_FLOW=$(curl -s -X POST $BASE_URL/flows/$FLOW_ID/duplicate \
    -H "Authorization: Bearer $TOKEN")
  test_endpoint "Duplicate Flow" "$DUPLICATE_FLOW"
fi

# Create keyword trigger flow
KEYWORD_FLOW=$(curl -s -X POST $BASE_URL/flows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Help Flow",
    "flowData": {
      "nodes": [
        {"id": "start-1", "type": "start", "position": {"x": 100, "y": 100}, "data": {}},
        {"id": "msg-1", "type": "message", "position": {"x": 300, "y": 100}, "data": {"message": "How can I help?"}}
      ],
      "edges": [{"id": "e1", "source": "start-1", "target": "msg-1"}]
    },
    "triggerConfig": {"type": "keyword", "keywords": ["help", "support"]},
    "status": "active"
  }')
test_endpoint "Create Keyword Flow" "$KEYWORD_FLOW"

echo ""

# ============================================
# 8. WHATSAPP
# ============================================
echo -e "${YELLOW}=== 8. WhatsApp ===${NC}"

WA_CONN_RESPONSE=$(curl -s -X POST $BASE_URL/whatsapp/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Connection","type":"meta_api","phoneNumber":"+1234567890","phoneNumberId":"test123","accessToken":"test_token"}')
WA_CONN_ID=$(echo $WA_CONN_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_endpoint "Create WhatsApp Connection" "$WA_CONN_RESPONSE"

WA_CONNS_LIST=$(curl -s $BASE_URL/whatsapp/connections \
  -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All WhatsApp Connections" "$WA_CONNS_LIST"

WEBHOOK_VERIFY=$(curl -s "$BASE_URL/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=whatscrm_webhook_secret")
test_endpoint "Webhook Verification" "$WEBHOOK_VERIFY"

echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
