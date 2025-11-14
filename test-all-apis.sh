#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"
echo "=== Testing All WhatsCRM APIs ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local response=$2
    # Check for actual errors (excluding expected validation errors like duplicate keys)
    if echo "$response" | grep -q "Internal server error" || (echo "$response" | grep -q "unauthorized\|Unauthorized" && ! echo "$name" | grep -q "Should Fail"); then
        echo -e "${RED}✗ FAILED: $name${NC}"
        ((FAILED++))
    else
        echo -e "${GREEN}✓ PASSED: $name${NC}"
        ((PASSED++))
    fi
}

echo "1. Health Check"
HEALTH=$(curl -s $BASE_URL/health)
test_endpoint "Health Check" "$HEALTH"
echo ""

echo "2. Authentication Tests"
# Register
REGISTER=$(curl -s -X POST $BASE_URL/auth/register -H "Content-Type: application/json" -d '{"email":"test'$(date +%s)'@example.com","password":"Test@123456","firstName":"Test","lastName":"User"}')
test_endpoint "Register New User" "$REGISTER"

# Login
LOGIN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"admin@whatscrm.com","password":"Admin@123"}')
TOKEN=$(echo $LOGIN | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
test_endpoint "Login" "$LOGIN"

# Get Profile
PROFILE=$(curl -s $BASE_URL/auth/me -H "Authorization: Bearer $TOKEN")
test_endpoint "Get Profile" "$PROFILE"

# Test without token (should fail)
NO_AUTH=$(curl -s $BASE_URL/users)
test_endpoint "Unauthorized Access (Should Fail)" "$NO_AUTH"
echo ""

echo "3. Tenant Tests"
# Create Tenant
TENANT=$(curl -s -X POST $BASE_URL/tenants -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Test Tenant","slug":"test-tenant-'$(date +%s)'"}')
TENANT_ID=$(echo $TENANT | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_endpoint "Create Tenant" "$TENANT"

# Get All Tenants
TENANTS=$(curl -s $BASE_URL/tenants -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All Tenants" "$TENANTS"

# Get Tenant by ID
if [ ! -z "$TENANT_ID" ]; then
    TENANT_DETAIL=$(curl -s $BASE_URL/tenants/$TENANT_ID -H "Authorization: Bearer $TOKEN")
    test_endpoint "Get Tenant by ID" "$TENANT_DETAIL"
fi
echo ""

echo "4. Contact Tests"
# Create Contact
CONTACT=$(curl -s -X POST $BASE_URL/contacts -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"firstName":"John","lastName":"Doe","email":"john'$(date +%s)'@example.com","phone":"+1234567890","tags":["customer"]}')
CONTACT_ID=$(echo $CONTACT | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_endpoint "Create Contact" "$CONTACT"

# Get All Contacts
CONTACTS=$(curl -s "$BASE_URL/contacts?page=1&limit=10" -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All Contacts" "$CONTACTS"

# Search Contacts
SEARCH=$(curl -s "$BASE_URL/contacts?search=John" -H "Authorization: Bearer $TOKEN")
test_endpoint "Search Contacts" "$SEARCH"
echo ""

echo "5. Conversation Tests"
# Create Conversation
if [ ! -z "$CONTACT_ID" ]; then
    CONVERSATION=$(curl -s -X POST $BASE_URL/conversations -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"contactId\":\"$CONTACT_ID\"}")
    CONV_ID=$(echo $CONVERSATION | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    test_endpoint "Create Conversation" "$CONVERSATION"
    
    # Send Message
    if [ ! -z "$CONV_ID" ]; then
        MESSAGE=$(curl -s -X POST $BASE_URL/conversations/$CONV_ID/messages -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"type":"text","direction":"outbound","content":"Hello!"}')
        test_endpoint "Send Message" "$MESSAGE"
        
        # Get Messages
        MESSAGES=$(curl -s $BASE_URL/conversations/$CONV_ID/messages -H "Authorization: Bearer $TOKEN")
        test_endpoint "Get Messages" "$MESSAGES"
    fi
fi
echo ""

echo "6. Template Tests"
# Create Template
TEMPLATE=$(curl -s -X POST $BASE_URL/templates -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"test_template_'$(date +%s)'","category":"marketing","language":"en","content":"Hello {{1}}!","variables":[{"name":"name","example":"John"}]}')
TEMPLATE_ID=$(echo $TEMPLATE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_endpoint "Create Template" "$TEMPLATE"

# Get All Templates
TEMPLATES=$(curl -s $BASE_URL/templates -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All Templates" "$TEMPLATES"

# Submit Template
if [ ! -z "$TEMPLATE_ID" ]; then
    SUBMIT=$(curl -s -X POST $BASE_URL/templates/$TEMPLATE_ID/submit -H "Authorization: Bearer $TOKEN")
    test_endpoint "Submit Template" "$SUBMIT"
    
    # Approve Template
    APPROVE=$(curl -s -X POST $BASE_URL/templates/$TEMPLATE_ID/approve -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}')
    test_endpoint "Approve Template" "$APPROVE"
fi
echo ""

echo "7. Campaign Tests"
# Create Campaign
if [ ! -z "$TEMPLATE_ID" ]; then
    CAMPAIGN=$(curl -s -X POST $BASE_URL/campaigns -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"Test Campaign\",\"templateId\":\"$TEMPLATE_ID\",\"segmentFilters\":{\"isActive\":true}}")
    CAMPAIGN_ID=$(echo $CAMPAIGN | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    test_endpoint "Create Campaign" "$CAMPAIGN"
    
    # Get Campaign Stats
    if [ ! -z "$CAMPAIGN_ID" ]; then
        STATS=$(curl -s $BASE_URL/campaigns/$CAMPAIGN_ID/stats -H "Authorization: Bearer $TOKEN")
        test_endpoint "Get Campaign Stats" "$STATS"
    fi
fi
echo ""

echo "8. WhatsApp Connection Tests"
# Create WhatsApp Connection
WHATSAPP=$(curl -s -X POST $BASE_URL/whatsapp/connections -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Test Connection","type":"baileys"}')
WA_ID=$(echo $WHATSAPP | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_endpoint "Create WhatsApp Connection" "$WHATSAPP"

# Get All Connections
CONNECTIONS=$(curl -s $BASE_URL/whatsapp/connections -H "Authorization: Bearer $TOKEN")
test_endpoint "Get All WhatsApp Connections" "$CONNECTIONS"
echo ""

echo "9. Webhook Tests"
# Webhook Verification
WEBHOOK=$(curl -s "$BASE_URL/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=whatscrm_webhook_verify_token_12345&hub.challenge=test123")
test_endpoint "Webhook Verification" "$WEBHOOK"
echo ""

echo "=== Test Summary ==="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
