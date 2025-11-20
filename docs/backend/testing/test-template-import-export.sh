#!/bin/bash

# Test Template Import/Export Endpoints
# This script tests the template import and export functionality

BASE_URL="http://localhost:3000/api/v1"
TENANT_ID="your-tenant-id"
TOKEN="your-jwt-token"

echo "========================================="
echo "Template Import/Export Endpoints Test"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
  fi
}

# Function to print section header
print_section() {
  echo ""
  echo -e "${YELLOW}=== $1 ===${NC}"
  echo ""
}

# Test 1: Export all templates
print_section "Test 1: Export All Templates"
EXPORT_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/export" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$EXPORT_RESPONSE" | jq '.'

if echo "$EXPORT_RESPONSE" | jq -e '.templates' > /dev/null 2>&1; then
  print_result 0 "Export all templates"
  TEMPLATE_COUNT=$(echo "$EXPORT_RESPONSE" | jq '.templates | length')
  echo "  Exported $TEMPLATE_COUNT templates"
else
  print_result 1 "Export all templates"
fi

# Test 2: Export specific templates
print_section "Test 2: Export Specific Templates"
# Get first template ID from previous export
TEMPLATE_ID=$(echo "$EXPORT_RESPONSE" | jq -r '.templates[0].metadata.originalId // empty')

if [ -n "$TEMPLATE_ID" ]; then
  SPECIFIC_EXPORT=$(curl -s -X GET "$BASE_URL/templates/export?templateIds=$TEMPLATE_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

  echo "Response:"
  echo "$SPECIFIC_EXPORT" | jq '.'

  if echo "$SPECIFIC_EXPORT" | jq -e '.templates' > /dev/null 2>&1; then
    print_result 0 "Export specific template"
  else
    print_result 1 "Export specific template"
  fi
else
  echo "Skipping - no templates available"
fi

# Test 3: Export with analytics and history
print_section "Test 3: Export with Analytics and History"
FULL_EXPORT=$(curl -s -X GET "$BASE_URL/templates/export?includeAnalytics=true&includeHistory=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$FULL_EXPORT" | jq '.metadata'

if echo "$FULL_EXPORT" | jq -e '.metadata.includeAnalytics == true' > /dev/null 2>&1; then
  print_result 0 "Export with analytics flag"
else
  print_result 1 "Export with analytics flag"
fi

# Save export to file for import test
echo "$EXPORT_RESPONSE" > /tmp/template_export.json
echo "Saved export to /tmp/template_export.json"

# Test 4: Import preview
print_section "Test 4: Import Preview"

# Create a sample template for import
SAMPLE_TEMPLATE=$(cat <<EOF
{
  "templates": [
    {
      "name": "test_import_template",
      "displayName": "Test Import Template",
      "category": "TRANSACTIONAL",
      "language": "en_US",
      "description": "A test template for import",
      "components": {
        "body": {
          "text": "Hello {{1}}, your order {{2}} is confirmed!",
          "placeholders": [
            { "index": 1, "example": "John" },
            { "index": 2, "example": "#12345" }
          ]
        },
        "footer": {
          "text": "Thank you for your business"
        }
      },
      "sampleValues": {
        "1": "John",
        "2": "#12345"
      }
    }
  ]
}
EOF
)

PREVIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/import/preview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SAMPLE_TEMPLATE")

echo "Response:"
echo "$PREVIEW_RESPONSE" | jq '.'

if echo "$PREVIEW_RESPONSE" | jq -e '.totalTemplates' > /dev/null 2>&1; then
  print_result 0 "Import preview"
  VALID_COUNT=$(echo "$PREVIEW_RESPONSE" | jq '.validTemplates')
  INVALID_COUNT=$(echo "$PREVIEW_RESPONSE" | jq '.invalidTemplates')
  DUPLICATE_COUNT=$(echo "$PREVIEW_RESPONSE" | jq '.duplicates')
  echo "  Valid: $VALID_COUNT, Invalid: $INVALID_COUNT, Duplicates: $DUPLICATE_COUNT"
else
  print_result 1 "Import preview"
fi

# Test 5: Import templates
print_section "Test 5: Import Templates"

IMPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SAMPLE_TEMPLATE")

echo "Response:"
echo "$IMPORT_RESPONSE" | jq '.'

if echo "$IMPORT_RESPONSE" | jq -e '.imported' > /dev/null 2>&1; then
  print_result 0 "Import templates"
  IMPORTED_COUNT=$(echo "$IMPORT_RESPONSE" | jq '.imported')
  SKIPPED_COUNT=$(echo "$IMPORT_RESPONSE" | jq '.skipped')
  FAILED_COUNT=$(echo "$IMPORT_RESPONSE" | jq '.failed')
  echo "  Imported: $IMPORTED_COUNT, Skipped: $SKIPPED_COUNT, Failed: $FAILED_COUNT"
else
  print_result 1 "Import templates"
fi

# Test 6: Import with duplicate handling (skip)
print_section "Test 6: Import with Skip Duplicates"

SKIP_DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templates": [
      {
        "name": "test_import_template",
        "displayName": "Test Import Template",
        "category": "TRANSACTIONAL",
        "language": "en_US",
        "description": "A test template for import",
        "components": {
          "body": {
            "text": "Hello {{1}}, your order {{2}} is confirmed!",
            "placeholders": [
              { "index": 1, "example": "John" },
              { "index": 2, "example": "#12345" }
            ]
          }
        },
        "sampleValues": {
          "1": "John",
          "2": "#12345"
        }
      }
    ],
    "skipDuplicates": true
  }')

echo "Response:"
echo "$SKIP_DUPLICATE_RESPONSE" | jq '.'

if echo "$SKIP_DUPLICATE_RESPONSE" | jq -e '.skipped > 0' > /dev/null 2>&1; then
  print_result 0 "Skip duplicates"
else
  print_result 1 "Skip duplicates"
fi

# Test 7: Import with name prefix
print_section "Test 7: Import with Name Prefix"

PREFIX_IMPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/templates/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templates": [
      {
        "name": "prefixed_template",
        "displayName": "Prefixed Template",
        "category": "UTILITY",
        "language": "en_US",
        "components": {
          "body": {
            "text": "This is a prefixed template"
          }
        },
        "sampleValues": {}
      }
    ],
    "namePrefix": "imported_"
  }')

echo "Response:"
echo "$PREFIX_IMPORT_RESPONSE" | jq '.'

if echo "$PREFIX_IMPORT_RESPONSE" | jq -e '.templates[0].name | startswith("imported_")' > /dev/null 2>&1; then
  print_result 0 "Import with name prefix"
else
  print_result 1 "Import with name prefix"
fi

# Test 8: Import with invalid template
print_section "Test 8: Import with Invalid Template"

INVALID_IMPORT=$(curl -s -X POST "$BASE_URL/templates/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templates": [
      {
        "name": "invalid template with spaces",
        "category": "INVALID_CATEGORY",
        "language": "en_US",
        "components": {
          "body": {
            "text": "Invalid placeholder {1}"
          }
        },
        "sampleValues": {}
      }
    ]
  }')

echo "Response:"
echo "$INVALID_IMPORT" | jq '.'

if echo "$INVALID_IMPORT" | jq -e '.failed > 0' > /dev/null 2>&1; then
  print_result 0 "Reject invalid template"
else
  print_result 1 "Reject invalid template"
fi

# Test 9: Export using POST method
print_section "Test 9: Export Using POST Method"

POST_EXPORT=$(curl -s -X POST "$BASE_URL/templates/export" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "includeArchived": false,
    "includeAnalytics": true,
    "includeHistory": false
  }')

echo "Response:"
echo "$POST_EXPORT" | jq '.metadata'

if echo "$POST_EXPORT" | jq -e '.templates' > /dev/null 2>&1; then
  print_result 0 "Export using POST method"
else
  print_result 1 "Export using POST method"
fi

# Test 10: Import from file
print_section "Test 10: Import from File"

if [ -f "/tmp/template_export.json" ]; then
  FILE_IMPORT=$(curl -s -X POST "$BASE_URL/templates/import" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/tmp/template_export.json" \
    -F "skipDuplicates=true" \
    -F "namePrefix=reimported_")

  echo "Response:"
  echo "$FILE_IMPORT" | jq '.'

  if echo "$FILE_IMPORT" | jq -e '.imported' > /dev/null 2>&1; then
    print_result 0 "Import from file"
  else
    print_result 1 "Import from file"
  fi
else
  echo "Skipping - export file not found"
fi

# Summary
print_section "Test Summary"
echo "All import/export endpoint tests completed!"
echo ""
echo "Key Features Tested:"
echo "  ✓ Export all templates"
echo "  ✓ Export specific templates"
echo "  ✓ Export with analytics and history"
echo "  ✓ Import preview"
echo "  ✓ Import templates"
echo "  ✓ Skip duplicates"
echo "  ✓ Name prefix handling"
echo "  ✓ Invalid template rejection"
echo "  ✓ POST export method"
echo "  ✓ File upload import"
echo ""
echo "Cleanup: rm /tmp/template_export.json"
