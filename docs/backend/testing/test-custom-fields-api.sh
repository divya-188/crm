#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
BASE_URL="http://localhost:3000/api"

# Test credentials
EMAIL="admin@example.com"
PASSWORD="Admin123!"

echo -e "${BLUE}=== Custom Fields API Test ===${NC}\n"

# Step 1: Login
echo -e "${BLUE}1. Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}\n"

# Step 2: Create a text custom field
echo -e "${BLUE}2. Creating text custom field...${NC}"
TEXT_FIELD_RESPONSE=$(curl -s -X POST "$BASE_URL/contacts/custom-fields" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "key": "customer_type",
    "label": "Customer Type",
    "type": "text",
    "isRequired": false,
    "placeholder": "Enter customer type",
    "helpText": "Classify the customer type"
  }')

TEXT_FIELD_ID=$(echo $TEXT_FIELD_RESPONSE | jq -r '.id')

if [ "$TEXT_FIELD_ID" == "null" ] || [ -z "$TEXT_FIELD_ID" ]; then
  echo -e "${RED}❌ Failed to create text custom field${NC}"
  echo $TEXT_FIELD_RESPONSE | jq '.'
else
  echo -e "${GREEN}✓ Text custom field created: $TEXT_FIELD_ID${NC}"
  echo $TEXT_FIELD_RESPONSE | jq '.'
fi
echo ""

# Step 3: Create a dropdown custom field
echo -e "${BLUE}3. Creating dropdown custom field...${NC}"
DROPDOWN_FIELD_RESPONSE=$(curl -s -X POST "$BASE_URL/contacts/custom-fields" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "key": "priority_level",
    "label": "Priority Level",
    "type": "dropdown",
    "options": ["High", "Medium", "Low"],
    "isRequired": true,
    "helpText": "Customer priority level"
  }')

DROPDOWN_FIELD_ID=$(echo $DROPDOWN_FIELD_RESPONSE | jq -r '.id')

if [ "$DROPDOWN_FIELD_ID" == "null" ] || [ -z "$DROPDOWN_FIELD_ID" ]; then
  echo -e "${RED}❌ Failed to create dropdown custom field${NC}"
  echo $DROPDOWN_FIELD_RESPONSE | jq '.'
else
  echo -e "${GREEN}✓ Dropdown custom field created: $DROPDOWN_FIELD_ID${NC}"
  echo $DROPDOWN_FIELD_RESPONSE | jq '.'
fi
echo ""

# Step 4: Create a number custom field
echo -e "${BLUE}4. Creating number custom field...${NC}"
NUMBER_FIELD_RESPONSE=$(curl -s -X POST "$BASE_URL/contacts/custom-fields" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "key": "lifetime_value",
    "label": "Lifetime Value",
    "type": "number",
    "isRequired": false,
    "placeholder": "0.00",
    "helpText": "Total customer lifetime value"
  }')

NUMBER_FIELD_ID=$(echo $NUMBER_FIELD_RESPONSE | jq -r '.id')

if [ "$NUMBER_FIELD_ID" == "null" ] || [ -z "$NUMBER_FIELD_ID" ]; then
  echo -e "${RED}❌ Failed to create number custom field${NC}"
  echo $NUMBER_FIELD_RESPONSE | jq '.'
else
  echo -e "${GREEN}✓ Number custom field created: $NUMBER_FIELD_ID${NC}"
  echo $NUMBER_FIELD_RESPONSE | jq '.'
fi
echo ""

# Step 5: Get all custom fields
echo -e "${BLUE}5. Getting all custom fields...${NC}"
ALL_FIELDS_RESPONSE=$(curl -s -X GET "$BASE_URL/contacts/custom-fields" \
  -H "Authorization: Bearer $TOKEN")

FIELD_COUNT=$(echo $ALL_FIELDS_RESPONSE | jq '. | length')
echo -e "${GREEN}✓ Retrieved $FIELD_COUNT custom fields${NC}"
echo $ALL_FIELDS_RESPONSE | jq '.'
echo ""

# Step 6: Update a custom field
if [ "$TEXT_FIELD_ID" != "null" ] && [ ! -z "$TEXT_FIELD_ID" ]; then
  echo -e "${BLUE}6. Updating text custom field...${NC}"
  UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/contacts/custom-fields/$TEXT_FIELD_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "label": "Customer Type (Updated)",
      "helpText": "Updated help text for customer type"
    }')

  echo -e "${GREEN}✓ Custom field updated${NC}"
  echo $UPDATE_RESPONSE | jq '.'
  echo ""
fi

# Step 7: Create a contact with custom fields
echo -e "${BLUE}7. Creating contact with custom field values...${NC}"
CONTACT_RESPONSE=$(curl -s -X POST "$BASE_URL/contacts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "email": "john.doe@example.com",
    "customFields": {
      "customer_type": "Premium",
      "priority_level": "High",
      "lifetime_value": "5000"
    }
  }')

CONTACT_ID=$(echo $CONTACT_RESPONSE | jq -r '.id')

if [ "$CONTACT_ID" == "null" ] || [ -z "$CONTACT_ID" ]; then
  echo -e "${RED}❌ Failed to create contact with custom fields${NC}"
  echo $CONTACT_RESPONSE | jq '.'
else
  echo -e "${GREEN}✓ Contact created with custom fields: $CONTACT_ID${NC}"
  echo $CONTACT_RESPONSE | jq '.'
fi
echo ""

# Step 8: Get contact to verify custom fields
if [ "$CONTACT_ID" != "null" ] && [ ! -z "$CONTACT_ID" ]; then
  echo -e "${BLUE}8. Getting contact to verify custom fields...${NC}"
  GET_CONTACT_RESPONSE=$(curl -s -X GET "$BASE_URL/contacts/$CONTACT_ID" \
    -H "Authorization: Bearer $TOKEN")

  echo -e "${GREEN}✓ Contact retrieved${NC}"
  echo $GET_CONTACT_RESPONSE | jq '.customFields'
  echo ""
fi

# Step 9: Deactivate a custom field
if [ "$NUMBER_FIELD_ID" != "null" ] && [ ! -z "$NUMBER_FIELD_ID" ]; then
  echo -e "${BLUE}9. Deactivating number custom field...${NC}"
  DEACTIVATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/contacts/custom-fields/$NUMBER_FIELD_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "isActive": false
    }')

  echo -e "${GREEN}✓ Custom field deactivated${NC}"
  echo $DEACTIVATE_RESPONSE | jq '.'
  echo ""
fi

# Step 10: Delete a custom field
if [ "$TEXT_FIELD_ID" != "null" ] && [ ! -z "$TEXT_FIELD_ID" ]; then
  echo -e "${BLUE}10. Deleting text custom field...${NC}"
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/contacts/custom-fields/$TEXT_FIELD_ID" \
    -H "Authorization: Bearer $TOKEN")

  echo -e "${GREEN}✓ Custom field deleted${NC}"
  echo ""
fi

echo -e "${BLUE}=== Custom Fields API Test Complete ===${NC}"
