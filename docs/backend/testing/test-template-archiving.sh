#!/bin/bash

# Test Template Archiving System
# Tests all archiving functionality including archive, restore, bulk operations

BASE_URL="http://localhost:3000/api/v1"
CONTENT_TYPE="Content-Type: application/json"

echo "🧪 Testing Template Archiving System"
echo "===================================="
echo ""

# Login and get token
echo "📝 Step 1: Login to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!@#"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Got auth token"
echo ""

# Create test template
echo "📝 Step 2: Create test template..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/templates" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "test_archive_template",
    "displayName": "Test Archive Template",
    "category": "UTILITY",
    "language": "en_US",
    "components": {
      "body": {
        "text": "This is a test template for archiving",
        "placeholders": []
      }
    },
    "sampleValues": {}
  }')

TEMPLATE_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$TEMPLATE_ID" ]; then
  echo "❌ Failed to create template"
  exit 1
fi

echo "✅ Created template: $TEMPLATE_ID"
echo ""

# Test archive template
echo "📝 Step 3: Archive template with reason..."
ARCHIVE_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/$TEMPLATE_ID/archive" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reason": "Testing archive functionality"
  }')

IS_ACTIVE=$(echo $ARCHIVE_RESPONSE | grep -o '"isActive":[^,}]*' | cut -d':' -f2)

if [ "$IS_ACTIVE" = "false" ]; then
  echo "✅ Template archived successfully"
else
  echo "❌ Failed to archive template"
  echo "Response: $ARCHIVE_RESPONSE"
fi
echo ""

# Test get archived templates
echo "📝 Step 4: Get archived templates..."
ARCHIVED_LIST=$(curl -s -X GET "$BASE_URL/templates/archived?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

ARCHIVED_COUNT=$(echo $ARCHIVED_LIST | grep -o '"total":[0-9]*' | cut -d':' -f2)

echo "✅ Found $ARCHIVED_COUNT archived templates"
echo ""

# Test restore template
echo "📝 Step 5: Restore template from archive..."
RESTORE_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/$TEMPLATE_ID/restore" \
  -H "Authorization: Bearer $TOKEN")

IS_ACTIVE=$(echo $RESTORE_RESPONSE | grep -o '"isActive":[^,}]*' | cut -d':' -f2)

if [ "$IS_ACTIVE" = "true" ]; then
  echo "✅ Template restored successfully"
else
  echo "❌ Failed to restore template"
  echo "Response: $RESTORE_RESPONSE"
fi
echo ""

# Create more templates for bulk testing
echo "📝 Step 6: Create additional templates for bulk testing..."
TEMPLATE_ID_2=$(curl -s -X POST "$BASE_URL/templates" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "test_bulk_archive_1",
    "category": "UTILITY",
    "language": "en_US",
    "components": {
      "body": {
        "text": "Bulk test template 1",
        "placeholders": []
      }
    },
    "sampleValues": {}
  }' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

TEMPLATE_ID_3=$(curl -s -X POST "$BASE_URL/templates" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "test_bulk_archive_2",
    "category": "UTILITY",
    "language": "en_US",
    "components": {
      "body": {
        "text": "Bulk test template 2",
        "placeholders": []
      }
    },
    "sampleValues": {}
  }' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo "✅ Created templates: $TEMPLATE_ID_2, $TEMPLATE_ID_3"
echo ""

# Test bulk archive
echo "📝 Step 7: Bulk archive templates..."
BULK_ARCHIVE_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/bulk-archive" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"templateIds\": [\"$TEMPLATE_ID_2\", \"$TEMPLATE_ID_3\"],
    \"reason\": \"Bulk archive test\"
  }")

ARCHIVED_COUNT=$(echo $BULK_ARCHIVE_RESPONSE | grep -o '"archived":[0-9]*' | cut -d':' -f2)

echo "✅ Bulk archived $ARCHIVED_COUNT templates"
echo ""

# Test bulk restore
echo "📝 Step 8: Bulk restore templates..."
BULK_RESTORE_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/bulk-restore" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"templateIds\": [\"$TEMPLATE_ID_2\", \"$TEMPLATE_ID_3\"]
  }")

RESTORED_COUNT=$(echo $BULK_RESTORE_RESPONSE | grep -o '"restored":[0-9]*' | cut -d':' -f2)

echo "✅ Bulk restored $RESTORED_COUNT templates"
echo ""

# Test delete non-approved template (should succeed)
echo "📝 Step 9: Delete non-approved template (should succeed)..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo $DELETE_RESPONSE | grep -q "success"; then
  echo "✅ Successfully deleted non-approved template"
else
  echo "❌ Failed to delete template"
  echo "Response: $DELETE_RESPONSE"
fi
echo ""

# Create and approve a template to test deletion prevention
echo "📝 Step 10: Create and approve template to test deletion prevention..."
APPROVED_TEMPLATE=$(curl -s -X POST "$BASE_URL/templates" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "test_approved_template",
    "category": "UTILITY",
    "language": "en_US",
    "components": {
      "body": {
        "text": "Approved template test",
        "placeholders": []
      }
    },
    "sampleValues": {}
  }')

APPROVED_ID=$(echo $APPROVED_TEMPLATE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Submit and approve
curl -s -X POST "$BASE_URL/templates/$APPROVED_ID/submit" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

curl -s -X POST "$BASE_URL/templates/$APPROVED_ID/approve" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo "✅ Created and approved template: $APPROVED_ID"
echo ""

# Test delete approved template (should fail)
echo "📝 Step 11: Try to delete approved template (should fail)..."
DELETE_APPROVED_RESPONSE=$(curl -s -X DELETE "$BASE_URL/templates/$APPROVED_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo $DELETE_APPROVED_RESPONSE | grep -q "Cannot delete approved template"; then
  echo "✅ Correctly prevented deletion of approved template"
else
  echo "❌ Should have prevented deletion of approved template"
  echo "Response: $DELETE_APPROVED_RESPONSE"
fi
echo ""

# Test archive approved template (should succeed)
echo "📝 Step 12: Archive approved template (should succeed)..."
ARCHIVE_APPROVED=$(curl -s -X POST "$BASE_URL/templates/$APPROVED_ID/archive" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reason": "Testing archive of approved template"
  }')

if echo $ARCHIVE_APPROVED | grep -q '"isActive":false'; then
  echo "✅ Successfully archived approved template"
else
  echo "❌ Failed to archive approved template"
  echo "Response: $ARCHIVE_APPROVED"
fi
echo ""

# Cleanup
echo "📝 Step 13: Cleanup test templates..."
curl -s -X DELETE "$BASE_URL/templates/$TEMPLATE_ID_2" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
curl -s -X DELETE "$BASE_URL/templates/$TEMPLATE_ID_3" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo "✅ Cleanup complete"
echo ""

echo "=================================="
echo "✅ All archiving tests completed!"
echo "=================================="
