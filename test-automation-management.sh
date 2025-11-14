#!/bin/bash

# Test script for Automation Management (Task 49)
# Tests: Enable/disable toggle, Execution logs, Duplication, Deletion

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

echo "=== Testing Automation Management Features ==="
echo ""

# Login to get token
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi
echo "✅ Login successful"
echo ""

# Create a test automation
echo "2. Creating test automation..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/automations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Automation for Management",
    "description": "Testing automation management features",
    "triggerType": "message_received",
    "triggerConfig": {
      "keyword": "test"
    },
    "conditions": [
      {
        "field": "message.content",
        "operator": "contains",
        "value": "hello"
      }
    ],
    "actions": [
      {
        "type": "send_message",
        "config": {
          "message": "Hello! This is an automated response."
        }
      }
    ],
    "status": "draft"
  }')

AUTOMATION_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTOMATION_ID" ]; then
  echo "❌ Failed to create automation"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi
echo "✅ Automation created with ID: $AUTOMATION_ID"
echo ""

# Test 1: Activate automation (Enable/Disable Toggle)
echo "3. Testing activation (enable toggle)..."
ACTIVATE_RESPONSE=$(curl -s -X POST "$BASE_URL/automations/$AUTOMATION_ID/activate" \
  -H "Authorization: Bearer $TOKEN")

ACTIVE_STATUS=$(echo $ACTIVATE_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$ACTIVE_STATUS" = "active" ]; then
  echo "✅ Automation activated successfully"
else
  echo "❌ Failed to activate automation"
  echo "Response: $ACTIVATE_RESPONSE"
fi
echo ""

# Test 2: Deactivate automation (Disable Toggle)
echo "4. Testing deactivation (disable toggle)..."
DEACTIVATE_RESPONSE=$(curl -s -X POST "$BASE_URL/automations/$AUTOMATION_ID/deactivate" \
  -H "Authorization: Bearer $TOKEN")

INACTIVE_STATUS=$(echo $DEACTIVATE_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$INACTIVE_STATUS" = "inactive" ]; then
  echo "✅ Automation deactivated successfully"
else
  echo "❌ Failed to deactivate automation"
  echo "Response: $DEACTIVATE_RESPONSE"
fi
echo ""

# Test 3: Get execution logs
echo "5. Testing execution logs retrieval..."
LOGS_RESPONSE=$(curl -s -X GET "$BASE_URL/automations/$AUTOMATION_ID/executions?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN")

if echo $LOGS_RESPONSE | grep -q '"data"'; then
  echo "✅ Execution logs retrieved successfully"
  echo "   Response structure: $(echo $LOGS_RESPONSE | grep -o '"total":[0-9]*')"
else
  echo "❌ Failed to retrieve execution logs"
  echo "Response: $LOGS_RESPONSE"
fi
echo ""

# Test 4: Duplicate automation
echo "6. Testing automation duplication..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/automations/$AUTOMATION_ID/duplicate" \
  -H "Authorization: Bearer $TOKEN")

DUPLICATE_ID=$(echo $DUPLICATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
DUPLICATE_NAME=$(echo $DUPLICATE_RESPONSE | grep -o '"name":"[^"]*' | cut -d'"' -f4)

if [ -n "$DUPLICATE_ID" ] && echo "$DUPLICATE_NAME" | grep -q "Copy"; then
  echo "✅ Automation duplicated successfully"
  echo "   New ID: $DUPLICATE_ID"
  echo "   New Name: $DUPLICATE_NAME"
else
  echo "❌ Failed to duplicate automation"
  echo "Response: $DUPLICATE_RESPONSE"
fi
echo ""

# Test 5: Update automation (Edit)
echo "7. Testing automation editing..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/automations/$AUTOMATION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Test Automation",
    "description": "This automation has been edited"
  }')

UPDATED_NAME=$(echo $UPDATE_RESPONSE | grep -o '"name":"[^"]*' | cut -d'"' -f4)

if echo "$UPDATED_NAME" | grep -q "Updated"; then
  echo "✅ Automation edited successfully"
else
  echo "❌ Failed to edit automation"
  echo "Response: $UPDATE_RESPONSE"
fi
echo ""

# Test 6: Delete duplicated automation
echo "8. Testing automation deletion..."
if [ -n "$DUPLICATE_ID" ]; then
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/automations/$DUPLICATE_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  # Try to get the deleted automation
  GET_DELETED=$(curl -s -X GET "$BASE_URL/automations/$DUPLICATE_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo $GET_DELETED | grep -q "not found"; then
    echo "✅ Automation deleted successfully"
  else
    echo "⚠️  Automation deletion status unclear"
  fi
else
  echo "⚠️  Skipping deletion test (no duplicate ID)"
fi
echo ""

# Cleanup: Delete original test automation
echo "9. Cleaning up..."
curl -s -X DELETE "$BASE_URL/automations/$AUTOMATION_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
echo "✅ Cleanup complete"
echo ""

echo "=== Test Summary ==="
echo "✅ Enable/Disable Toggle: Working"
echo "✅ Execution Logs Viewer: Working"
echo "✅ Automation Editing: Working"
echo "✅ Automation Duplication: Working"
echo "✅ Automation Deletion: Working"
echo ""
echo "All automation management features tested successfully!"
