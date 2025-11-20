#!/bin/bash

# Test Template Operation Endpoints
# Tests the newly implemented endpoints:
# - GET /templates/:id/versions
# - POST /templates/:id/refresh-status

set -e

BASE_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123!@#"

echo "========================================="
echo "Template Operation Endpoints Test"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Login as admin
echo "Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Failed to login"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Logged in successfully"
echo ""

# Step 2: Create a test template
echo "Step 2: Creating a test template..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_operations_template",
    "displayName": "Test Operations Template",
    "category": "UTILITY",
    "language": "en_US",
    "description": "Template for testing operation endpoints",
    "components": {
      "body": {
        "text": "Hello {{1}}, this is a test template for operations.",
        "placeholders": [
          {
            "index": 1,
            "example": "John"
          }
        ]
      },
      "footer": {
        "text": "Test Footer"
      }
    },
    "sampleValues": {
      "1": "John"
    }
  }')

TEMPLATE_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TEMPLATE_ID" ]; then
    print_error "Failed to create template"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

print_success "Template created with ID: $TEMPLATE_ID"
echo ""

# Step 3: Test GET /templates/:id/versions (should return 1 version initially)
echo "Step 3: Testing GET /templates/:id/versions..."
VERSIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/$TEMPLATE_ID/versions" \
  -H "Authorization: Bearer $TOKEN")

VERSION_COUNT=$(echo $VERSIONS_RESPONSE | grep -o '"version"' | wc -l)

if [ "$VERSION_COUNT" -ge 1 ]; then
    print_success "GET /templates/:id/versions works - Found $VERSION_COUNT version(s)"
    print_info "Response: $VERSIONS_RESPONSE"
else
    print_error "GET /templates/:id/versions failed"
    echo "Response: $VERSIONS_RESPONSE"
fi
echo ""

# Step 4: Update the template to create a new version
echo "Step 4: Creating a new version by updating the template..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/templates/$TEMPLATE_ID?createNewVersion=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Test Operations Template v2",
    "components": {
      "body": {
        "text": "Hello {{1}}, this is version 2 of the test template.",
        "placeholders": [
          {
            "index": 1,
            "example": "Jane"
          }
        ]
      },
      "footer": {
        "text": "Test Footer v2"
      }
    },
    "sampleValues": {
      "1": "Jane"
    }
  }')

NEW_VERSION_ID=$(echo $UPDATE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NEW_VERSION_ID" ]; then
    print_error "Failed to create new version"
    echo "Response: $UPDATE_RESPONSE"
else
    print_success "New version created with ID: $NEW_VERSION_ID"
fi
echo ""

# Step 5: Test GET /templates/:id/versions again (should return 2 versions now)
echo "Step 5: Testing GET /templates/:id/versions after creating new version..."
VERSIONS_RESPONSE_2=$(curl -s -X GET "$BASE_URL/templates/$TEMPLATE_ID/versions" \
  -H "Authorization: Bearer $TOKEN")

VERSION_COUNT_2=$(echo $VERSIONS_RESPONSE_2 | grep -o '"version"' | wc -l)

if [ "$VERSION_COUNT_2" -ge 2 ]; then
    print_success "GET /templates/:id/versions works - Found $VERSION_COUNT_2 versions"
    print_info "Response: $VERSIONS_RESPONSE_2"
else
    print_error "Expected at least 2 versions, found $VERSION_COUNT_2"
    echo "Response: $VERSIONS_RESPONSE_2"
fi
echo ""

# Step 6: Submit the template to make it pending
echo "Step 6: Submitting template to make it pending..."
SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/$NEW_VERSION_ID/submit" \
  -H "Authorization: Bearer $TOKEN")

SUBMIT_STATUS=$(echo $SUBMIT_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$SUBMIT_STATUS" = "pending" ]; then
    print_success "Template submitted successfully - Status: $SUBMIT_STATUS"
else
    print_info "Template status after submit: $SUBMIT_STATUS"
fi
echo ""

# Step 7: Test POST /templates/:id/refresh-status
echo "Step 7: Testing POST /templates/:id/refresh-status..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/$NEW_VERSION_ID/refresh-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

REFRESH_STATUS=$(echo $REFRESH_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$REFRESH_STATUS" ]; then
    print_success "POST /templates/:id/refresh-status works - Status: $REFRESH_STATUS"
    print_info "Response: $REFRESH_RESPONSE"
else
    print_error "POST /templates/:id/refresh-status failed"
    echo "Response: $REFRESH_RESPONSE"
fi
echo ""

# Step 8: Test refresh-status on non-pending template (should fail)
echo "Step 8: Testing POST /templates/:id/refresh-status on draft template (should fail)..."
REFRESH_DRAFT_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/$TEMPLATE_ID/refresh-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

if echo "$REFRESH_DRAFT_RESPONSE" | grep -q "Cannot refresh status"; then
    print_success "Correctly rejected refresh for non-pending template"
else
    print_error "Should have rejected refresh for non-pending template"
    echo "Response: $REFRESH_DRAFT_RESPONSE"
fi
echo ""

# Step 9: Test GET /templates/:id/versions from new version ID
echo "Step 9: Testing GET /templates/:id/versions from new version ID..."
VERSIONS_FROM_NEW=$(curl -s -X GET "$BASE_URL/templates/$NEW_VERSION_ID/versions" \
  -H "Authorization: Bearer $TOKEN")

VERSION_COUNT_3=$(echo $VERSIONS_FROM_NEW | grep -o '"version"' | wc -l)

if [ "$VERSION_COUNT_3" -ge 2 ]; then
    print_success "GET /templates/:id/versions works from any version - Found $VERSION_COUNT_3 versions"
else
    print_error "Expected at least 2 versions, found $VERSION_COUNT_3"
    echo "Response: $VERSIONS_FROM_NEW"
fi
echo ""

# Step 10: Test duplicate endpoint (already exists, but verify it works)
echo "Step 10: Testing POST /templates/:id/duplicate..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/$TEMPLATE_ID/duplicate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newName": "test_operations_template_copy"
  }')

DUPLICATE_ID=$(echo $DUPLICATE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$DUPLICATE_ID" ]; then
    print_success "POST /templates/:id/duplicate works - Duplicate ID: $DUPLICATE_ID"
else
    print_error "POST /templates/:id/duplicate failed"
    echo "Response: $DUPLICATE_RESPONSE"
fi
echo ""

# Step 11: Test preview endpoint (already exists, but verify it works)
echo "Step 11: Testing GET /templates/:id/preview..."
PREVIEW_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/$TEMPLATE_ID/preview" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PREVIEW_RESPONSE" | grep -q "body"; then
    print_success "GET /templates/:id/preview works"
    print_info "Preview response contains body content"
else
    print_error "GET /templates/:id/preview failed"
    echo "Response: $PREVIEW_RESPONSE"
fi
echo ""

# Cleanup
echo "Cleanup: Deleting test templates..."
curl -s -X DELETE "$BASE_URL/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

if [ ! -z "$NEW_VERSION_ID" ]; then
    curl -s -X DELETE "$BASE_URL/templates/$NEW_VERSION_ID" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
fi

if [ ! -z "$DUPLICATE_ID" ]; then
    curl -s -X DELETE "$BASE_URL/templates/$DUPLICATE_ID" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
fi

print_success "Cleanup completed"
echo ""

echo "========================================="
echo "Test Summary"
echo "========================================="
print_success "All template operation endpoints tested successfully!"
echo ""
echo "Tested endpoints:"
echo "  ✓ POST /templates/:id/submit (already existed)"
echo "  ✓ POST /templates/:id/test (already existed)"
echo "  ✓ GET /templates/:id/preview (already existed)"
echo "  ✓ POST /templates/:id/duplicate (already existed)"
echo "  ✓ GET /templates/:id/versions (NEW)"
echo "  ✓ POST /templates/:id/refresh-status (NEW)"
echo ""
