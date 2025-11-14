#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api"
TOKEN=""

echo -e "${YELLOW}=== WhatsApp CRM - Templates API Test ===${NC}\n"

# Login to get token
echo -e "${YELLOW}1. Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}\n"

# Create a template
echo -e "${YELLOW}2. Creating a template...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "welcome_message",
    "category": "utility",
    "language": "en",
    "content": "Hello {{1}}, welcome to {{2}}! We are glad to have you.",
    "header": "Welcome!",
    "footer": "Thank you for joining us",
    "variables": [
      {
        "name": "customer_name",
        "example": "John Doe"
      },
      {
        "name": "company_name",
        "example": "Acme Corp"
      }
    ],
    "buttons": [
      {
        "type": "url",
        "text": "Visit Website",
        "url": "https://example.com"
      }
    ]
  }')

TEMPLATE_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$TEMPLATE_ID" ]; then
  echo -e "${RED}✗ Template creation failed${NC}"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Template created with ID: $TEMPLATE_ID${NC}\n"

# Get all templates
echo -e "${YELLOW}3. Getting all templates...${NC}"
LIST_RESPONSE=$(curl -s -X GET "$API_URL/templates" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Templates retrieved${NC}"
echo "Response: $LIST_RESPONSE"
echo ""

# Get single template
echo -e "${YELLOW}4. Getting template by ID...${NC}"
GET_RESPONSE=$(curl -s -X GET "$API_URL/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Template retrieved${NC}"
echo "Response: $GET_RESPONSE"
echo ""

# Update template
echo -e "${YELLOW}5. Updating template...${NC}"
UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/templates/$TEMPLATE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Hi {{1}}, welcome to {{2}}! We are excited to have you on board."
  }')

echo -e "${GREEN}✓ Template updated${NC}"
echo "Response: $UPDATE_RESPONSE"
echo ""

# Submit template for approval
echo -e "${YELLOW}6. Submitting template for approval...${NC}"
SUBMIT_RESPONSE=$(curl -s -X POST "$API_URL/templates/$TEMPLATE_ID/submit" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Template submitted${NC}"
echo "Response: $SUBMIT_RESPONSE"
echo ""

# Preview template
echo -e "${YELLOW}7. Previewing template...${NC}"
PREVIEW_RESPONSE=$(curl -s -X POST "$API_URL/templates/$TEMPLATE_ID/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "variables": {
      "customer_name": "Jane Smith",
      "company_name": "Tech Solutions"
    }
  }')

echo -e "${GREEN}✓ Template preview generated${NC}"
echo "Response: $PREVIEW_RESPONSE"
echo ""

# Delete template (should fail because it's pending)
echo -e "${YELLOW}8. Attempting to delete pending template (should fail)...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $DELETE_RESPONSE"
echo ""

echo -e "${GREEN}=== All tests completed ===${NC}"
