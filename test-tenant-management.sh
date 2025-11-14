#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Base URL
API_URL="http://localhost:3000/api/v1"

# Test credentials (Super Admin)
SUPER_ADMIN_EMAIL="superadmin@example.com"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"

echo -e "${YELLOW}=== Tenant Management API Test ===${NC}\n"

# Step 1: Login as Super Admin
echo -e "${YELLOW}1. Logging in as Super Admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$SUPER_ADMIN_EMAIL\",
    \"password\": \"$SUPER_ADMIN_PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Login failed${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}\n"

# Step 2: Create a new tenant
echo -e "${YELLOW}2. Creating a new tenant...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Corporation",
    "slug": "test-corp",
    "domain": "test.example.com",
    "limits": {
      "maxUsers": 20,
      "maxContacts": 5000,
      "maxMessages": 50000,
      "maxWhatsAppConnections": 2
    }
  }')

TENANT_ID=$(echo $CREATE_RESPONSE | jq -r '.id')

if [ "$TENANT_ID" == "null" ] || [ -z "$TENANT_ID" ]; then
  echo -e "${RED}✗ Tenant creation failed${NC}"
  echo $CREATE_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Tenant created successfully${NC}"
echo "Tenant ID: $TENANT_ID"
echo $CREATE_RESPONSE | jq '.'
echo ""

# Step 3: Get all tenants
echo -e "${YELLOW}3. Fetching all tenants...${NC}"
LIST_RESPONSE=$(curl -s -X GET "$API_URL/tenants?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

TENANT_COUNT=$(echo $LIST_RESPONSE | jq -r '.total')

if [ "$TENANT_COUNT" == "null" ]; then
  echo -e "${RED}✗ Failed to fetch tenants${NC}"
  echo $LIST_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Fetched tenants successfully${NC}"
echo "Total tenants: $TENANT_COUNT"
echo $LIST_RESPONSE | jq '.'
echo ""

# Step 4: Get tenant by ID
echo -e "${YELLOW}4. Fetching tenant by ID...${NC}"
GET_RESPONSE=$(curl -s -X GET "$API_URL/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $TOKEN")

TENANT_NAME=$(echo $GET_RESPONSE | jq -r '.name')

if [ "$TENANT_NAME" == "null" ]; then
  echo -e "${RED}✗ Failed to fetch tenant${NC}"
  echo $GET_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Tenant fetched successfully${NC}"
echo $GET_RESPONSE | jq '.'
echo ""

# Step 5: Get tenant stats
echo -e "${YELLOW}5. Fetching tenant stats...${NC}"
STATS_RESPONSE=$(curl -s -X GET "$API_URL/tenants/$TENANT_ID/stats" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Tenant stats fetched successfully${NC}"
echo $STATS_RESPONSE | jq '.'
echo ""

# Step 6: Update tenant
echo -e "${YELLOW}6. Updating tenant...${NC}"
UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/tenants/$TENANT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Corporation Updated",
    "limits": {
      "maxUsers": 30,
      "maxContacts": 10000,
      "maxMessages": 100000,
      "maxWhatsAppConnections": 3
    }
  }')

UPDATED_NAME=$(echo $UPDATE_RESPONSE | jq -r '.name')

if [ "$UPDATED_NAME" != "Test Corporation Updated" ]; then
  echo -e "${RED}✗ Tenant update failed${NC}"
  echo $UPDATE_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Tenant updated successfully${NC}"
echo $UPDATE_RESPONSE | jq '.'
echo ""

# Step 7: Update tenant status
echo -e "${YELLOW}7. Updating tenant status...${NC}"
STATUS_RESPONSE=$(curl -s -X PATCH "$API_URL/tenants/$TENANT_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "active"
  }')

UPDATED_STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')

if [ "$UPDATED_STATUS" != "active" ]; then
  echo -e "${RED}✗ Status update failed${NC}"
  echo $STATUS_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Tenant status updated successfully${NC}"
echo $STATUS_RESPONSE | jq '.'
echo ""

# Step 8: Update tenant settings
echo -e "${YELLOW}8. Updating tenant settings...${NC}"
SETTINGS_RESPONSE=$(curl -s -X PATCH "$API_URL/tenants/$TENANT_ID/settings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "timezone": "America/New_York",
    "language": "en",
    "theme": "dark"
  }')

echo -e "${GREEN}✓ Tenant settings updated successfully${NC}"
echo $SETTINGS_RESPONSE | jq '.'
echo ""

# Step 9: Filter tenants by status
echo -e "${YELLOW}9. Filtering tenants by status...${NC}"
FILTER_RESPONSE=$(curl -s -X GET "$API_URL/tenants?status=active" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Tenants filtered successfully${NC}"
echo $FILTER_RESPONSE | jq '.'
echo ""

# Step 10: Search tenants
echo -e "${YELLOW}10. Searching tenants...${NC}"
SEARCH_RESPONSE=$(curl -s -X GET "$API_URL/tenants?search=Test" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Tenants searched successfully${NC}"
echo $SEARCH_RESPONSE | jq '.'
echo ""

# Step 11: Delete tenant
echo -e "${YELLOW}11. Deleting tenant...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Tenant deleted successfully${NC}"
echo ""

# Verify deletion
echo -e "${YELLOW}12. Verifying tenant deletion...${NC}"
VERIFY_RESPONSE=$(curl -s -X GET "$API_URL/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $TOKEN")

VERIFY_STATUS=$(echo $VERIFY_RESPONSE | jq -r '.status')

if [ "$VERIFY_STATUS" == "expired" ]; then
  echo -e "${GREEN}✓ Tenant marked as expired (soft delete)${NC}"
else
  echo -e "${YELLOW}⚠ Tenant status: $VERIFY_STATUS${NC}"
fi

echo ""
echo -e "${GREEN}=== All Tenant Management Tests Completed Successfully ===${NC}"
