#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Flow APIs ===${NC}\n"

# Login and get token
echo "Logging in..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@whatscrm.com","password":"Admin@123"}' | \
  grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get auth token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Logged in successfully${NC}\n"

# Test 1: Create a simple flow
echo -e "${BLUE}Test 1: Create Flow${NC}"
FLOW_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/flows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Flow",
    "description": "Automated welcome message flow",
    "flowData": {
      "nodes": [
        {
          "id": "start-1",
          "type": "start",
          "position": {"x": 100, "y": 100},
          "data": {}
        },
        {
          "id": "message-1",
          "type": "message",
          "position": {"x": 300, "y": 100},
          "data": {
            "message": "Welcome! How can I help you today?"
          }
        }
      ],
      "edges": [
        {
          "id": "e1",
          "source": "start-1",
          "target": "message-1"
        }
      ]
    },
    "triggerConfig": {
      "type": "welcome"
    },
    "status": "draft"
  }')

FLOW_ID=$(echo $FLOW_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FLOW_ID" ]; then
  echo -e "${GREEN}✓ Flow created: $FLOW_ID${NC}"
else
  echo -e "${RED}✗ Failed to create flow${NC}"
  echo "Response: $FLOW_RESPONSE"
fi

echo ""

# Test 2: Get all flows
echo -e "${BLUE}Test 2: Get All Flows${NC}"
FLOWS=$(curl -s http://localhost:3000/api/v1/flows \
  -H "Authorization: Bearer $TOKEN")

FLOW_COUNT=$(echo $FLOWS | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ -n "$FLOW_COUNT" ]; then
  echo -e "${GREEN}✓ Retrieved $FLOW_COUNT flows${NC}"
else
  echo -e "${RED}✗ Failed to get flows${NC}"
fi

echo ""

# Test 3: Get single flow
if [ -n "$FLOW_ID" ]; then
  echo -e "${BLUE}Test 3: Get Flow Details${NC}"
  FLOW_DETAIL=$(curl -s http://localhost:3000/api/v1/flows/$FLOW_ID \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$FLOW_DETAIL" | grep -q "Welcome Flow"; then
    echo -e "${GREEN}✓ Flow details retrieved${NC}"
  else
    echo -e "${RED}✗ Failed to get flow details${NC}"
  fi
  echo ""
fi

# Test 4: Update flow
if [ -n "$FLOW_ID" ]; then
  echo -e "${BLUE}Test 4: Update Flow${NC}"
  UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:3000/api/v1/flows/$FLOW_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Welcome Flow",
      "description": "Updated description"
    }')
  
  if echo "$UPDATE_RESPONSE" | grep -q "Updated Welcome Flow"; then
    echo -e "${GREEN}✓ Flow updated${NC}"
  else
    echo -e "${RED}✗ Failed to update flow${NC}"
  fi
  echo ""
fi

# Test 5: Activate flow
if [ -n "$FLOW_ID" ]; then
  echo -e "${BLUE}Test 5: Activate Flow${NC}"
  ACTIVATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/flows/$FLOW_ID/activate \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$ACTIVATE_RESPONSE" | grep -q '"status":"active"'; then
    echo -e "${GREEN}✓ Flow activated${NC}"
  else
    echo -e "${RED}✗ Failed to activate flow${NC}"
  fi
  echo ""
fi

# Test 6: Duplicate flow
if [ -n "$FLOW_ID" ]; then
  echo -e "${BLUE}Test 6: Duplicate Flow${NC}"
  DUPLICATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/flows/$FLOW_ID/duplicate \
    -H "Authorization: Bearer $TOKEN")
  
  DUPLICATE_ID=$(echo $DUPLICATE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$DUPLICATE_ID" ] && [ "$DUPLICATE_ID" != "$FLOW_ID" ]; then
    echo -e "${GREEN}✓ Flow duplicated: $DUPLICATE_ID${NC}"
  else
    echo -e "${RED}✗ Failed to duplicate flow${NC}"
  fi
  echo ""
fi

# Test 7: Create keyword trigger flow
echo -e "${BLUE}Test 7: Create Keyword Trigger Flow${NC}"
KEYWORD_FLOW=$(curl -s -X POST http://localhost:3000/api/v1/flows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Help Flow",
    "description": "Triggered by help keyword",
    "flowData": {
      "nodes": [
        {
          "id": "start-1",
          "type": "start",
          "position": {"x": 100, "y": 100},
          "data": {}
        },
        {
          "id": "message-1",
          "type": "message",
          "position": {"x": 300, "y": 100},
          "data": {
            "message": "I can help you with:\n1. Product info\n2. Support\n3. Pricing"
          }
        }
      ],
      "edges": [
        {
          "id": "e1",
          "source": "start-1",
          "target": "message-1"
        }
      ]
    },
    "triggerConfig": {
      "type": "keyword",
      "keywords": ["help", "support", "assist"]
    },
    "status": "active"
  }')

KEYWORD_FLOW_ID=$(echo $KEYWORD_FLOW | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$KEYWORD_FLOW_ID" ]; then
  echo -e "${GREEN}✓ Keyword flow created: $KEYWORD_FLOW_ID${NC}"
else
  echo -e "${RED}✗ Failed to create keyword flow${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}=== Test Summary ===${NC}"
echo "All flow API tests completed!"
echo ""
echo "Created flows:"
echo "  - Welcome Flow: $FLOW_ID"
echo "  - Keyword Flow: $KEYWORD_FLOW_ID"
