#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api/v1"
TOKEN=""

echo "=========================================="
echo "Testing Subscription Plans API"
echo "=========================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# 1. Register a test user
echo -e "\n${YELLOW}1. Registering test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "plantest@example.com",
    "password": "Test123!@#",
    "tenantName": "Plan Test Tenant"
  }')

echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"

# 2. Login
echo -e "\n${YELLOW}2. Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "plantest@example.com",
    "password": "Test123!@#"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Failed to get access token${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}Login successful${NC}"

# 3. Get all subscription plans
echo -e "\n${YELLOW}3. Getting all subscription plans...${NC}"
PLANS_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

echo "$PLANS_RESPONSE" | jq '.' 2>/dev/null || echo "$PLANS_RESPONSE"
print_result $? "Get all plans"

# 4. Get plan comparison
echo -e "\n${YELLOW}4. Getting plan comparison...${NC}"
COMPARE_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans/compare" \
  -H "Authorization: Bearer $TOKEN")

echo "$COMPARE_RESPONSE" | jq '.' 2>/dev/null || echo "$COMPARE_RESPONSE"
print_result $? "Get plan comparison"

# 5. Create a new plan
echo -e "\n${YELLOW}5. Creating a new subscription plan...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plan",
    "description": "A test subscription plan",
    "price": 49.99,
    "billingCycle": "monthly",
    "features": {
      "maxContacts": 5000,
      "maxUsers": 5,
      "maxConversations": 2000,
      "maxCampaigns": 25,
      "maxFlows": 25,
      "maxAutomations": 25,
      "whatsappConnections": 3,
      "apiAccess": true,
      "customBranding": false,
      "prioritySupport": false
    },
    "isActive": true,
    "sortOrder": 5
  }')

echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
PLAN_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id' 2>/dev/null)
print_result $? "Create new plan"

# 6. Get specific plan
if [ ! -z "$PLAN_ID" ] && [ "$PLAN_ID" != "null" ]; then
    echo -e "\n${YELLOW}6. Getting specific plan...${NC}"
    GET_PLAN_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans/$PLAN_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$GET_PLAN_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_PLAN_RESPONSE"
    print_result $? "Get specific plan"

    # 7. Check feature
    echo -e "\n${YELLOW}7. Checking feature access...${NC}"
    FEATURE_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans/$PLAN_ID/check-feature/apiAccess" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$FEATURE_RESPONSE"
    print_result $? "Check feature"

    # 8. Check limit
    echo -e "\n${YELLOW}8. Checking limit...${NC}"
    LIMIT_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans/$PLAN_ID/check-limit/maxContacts" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$LIMIT_RESPONSE"
    print_result $? "Check limit"

    # 9. Update plan
    echo -e "\n${YELLOW}9. Updating plan...${NC}"
    UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/subscription-plans/$PLAN_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "price": 59.99,
        "description": "Updated test plan description"
      }')
    
    echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_RESPONSE"
    print_result $? "Update plan"

    # 10. Delete plan
    echo -e "\n${YELLOW}10. Deleting plan...${NC}"
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/subscription-plans/$PLAN_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$DELETE_RESPONSE"
    print_result $? "Delete plan"
fi

echo -e "\n=========================================="
echo -e "${GREEN}Subscription Plans API Testing Complete${NC}"
echo "=========================================="
