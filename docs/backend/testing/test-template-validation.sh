#!/bin/bash

# Test Template Validation Endpoint
# This script tests the POST /templates/validate endpoint

BASE_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin@123"

echo "========================================="
echo "Template Validation Endpoint Test"
echo "========================================="
echo ""

# Step 1: Login as admin
echo "Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to login"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Test valid template validation
echo "Step 2: Testing valid template validation..."
VALID_TEMPLATE=$(curl -s -X POST "$BASE_URL/templates/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "order_confirmation_v1",
    "category": "TRANSACTIONAL",
    "language": "en_US",
    "description": "Order confirmation template",
    "components": {
      "header": {
        "type": "TEXT",
        "text": "Order Confirmation"
      },
      "body": {
        "text": "Hi {{1}}, your order {{2}} has been confirmed and will be delivered by {{3}}.",
        "placeholders": [
          { "index": 1, "example": "John Doe" },
          { "index": 2, "example": "#12345" },
          { "index": 3, "example": "Dec 25, 2024" }
        ]
      },
      "footer": {
        "text": "Thank you for your order"
      },
      "buttons": [
        {
          "type": "URL",
          "text": "Track Order",
          "url": "https://example.com/track"
        }
      ]
    },
    "sampleValues": {
      "1": "John Doe",
      "2": "#12345",
      "3": "Dec 25, 2024"
    }
  }')

echo "Response:"
echo "$VALID_TEMPLATE" | jq '.'
echo ""

IS_VALID=$(echo $VALID_TEMPLATE | jq -r '.isValid')
QUALITY_SCORE=$(echo $VALID_TEMPLATE | jq -r '.qualityScore.score')
QUALITY_RATING=$(echo $VALID_TEMPLATE | jq -r '.qualityScore.rating')

if [ "$IS_VALID" = "true" ]; then
  echo "✅ Valid template passed validation"
  echo "   Quality Score: $QUALITY_SCORE/100 ($QUALITY_RATING)"
else
  echo "❌ Valid template failed validation (unexpected)"
fi
echo ""

# Step 3: Test invalid template (missing placeholders)
echo "Step 3: Testing invalid template (non-sequential placeholders)..."
INVALID_TEMPLATE=$(curl -s -X POST "$BASE_URL/templates/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "invalid_template",
    "category": "MARKETING",
    "language": "en_US",
    "components": {
      "body": {
        "text": "Hi {{1}}, check out {{3}}!",
        "placeholders": [
          { "index": 1, "example": "John" },
          { "index": 3, "example": "our sale" }
        ]
      }
    },
    "sampleValues": {
      "1": "John",
      "3": "our sale"
    }
  }')

echo "Response:"
echo "$INVALID_TEMPLATE" | jq '.'
echo ""

IS_VALID=$(echo $INVALID_TEMPLATE | jq -r '.isValid')
ERROR_COUNT=$(echo $INVALID_TEMPLATE | jq -r '.errors | length')

if [ "$IS_VALID" = "false" ] && [ "$ERROR_COUNT" -gt "0" ]; then
  echo "✅ Invalid template correctly rejected"
  echo "   Errors found: $ERROR_COUNT"
else
  echo "❌ Invalid template not properly validated"
fi
echo ""

# Step 4: Test template with policy violations
echo "Step 4: Testing template with policy violations (spam language)..."
SPAM_TEMPLATE=$(curl -s -X POST "$BASE_URL/templates/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "spam_template",
    "category": "MARKETING",
    "language": "en_US",
    "components": {
      "body": {
        "text": "Buy now! Limited time offer! Act fast before it expires!",
        "placeholders": []
      }
    }
  }')

echo "Response:"
echo "$SPAM_TEMPLATE" | jq '.'
echo ""

IS_VALID=$(echo $SPAM_TEMPLATE | jq -r '.isValid')
ERROR_COUNT=$(echo $SPAM_TEMPLATE | jq -r '.errors | length')
QUALITY_SCORE=$(echo $SPAM_TEMPLATE | jq -r '.qualityScore.score')

if [ "$IS_VALID" = "false" ] && [ "$ERROR_COUNT" -gt "0" ]; then
  echo "✅ Spam template correctly flagged"
  echo "   Errors found: $ERROR_COUNT"
  echo "   Quality Score: $QUALITY_SCORE/100 (should be low)"
else
  echo "⚠️  Spam template validation result: isValid=$IS_VALID, errors=$ERROR_COUNT"
fi
echo ""

# Step 5: Test caching (call same validation twice)
echo "Step 5: Testing validation caching..."
echo "First call (should not be cached)..."
FIRST_CALL=$(curl -s -X POST "$BASE_URL/templates/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "cache_test",
    "category": "UTILITY",
    "language": "en_US",
    "components": {
      "body": {
        "text": "This is a test message for caching.",
        "placeholders": []
      }
    }
  }')

CACHED_FIRST=$(echo $FIRST_CALL | jq -r '.cached')
echo "   Cached: $CACHED_FIRST"

echo "Second call (should be cached)..."
sleep 1
SECOND_CALL=$(curl -s -X POST "$BASE_URL/templates/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "cache_test",
    "category": "UTILITY",
    "language": "en_US",
    "components": {
      "body": {
        "text": "This is a test message for caching.",
        "placeholders": []
      }
    }
  }')

CACHED_SECOND=$(echo $SECOND_CALL | jq -r '.cached')
CACHE_EXPIRES=$(echo $SECOND_CALL | jq -r '.cacheExpiresIn')
echo "   Cached: $CACHED_SECOND"
echo "   Cache expires in: $CACHE_EXPIRES seconds"

if [ "$CACHED_FIRST" = "false" ] && [ "$CACHED_SECOND" = "true" ]; then
  echo "✅ Caching working correctly"
else
  echo "⚠️  Caching behavior: first=$CACHED_FIRST, second=$CACHED_SECOND"
fi
echo ""

# Step 6: Test template with excessive placeholders
echo "Step 6: Testing template with excessive placeholders (quality score penalty)..."
EXCESSIVE_PLACEHOLDERS=$(curl -s -X POST "$BASE_URL/templates/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "excessive_placeholders",
    "category": "TRANSACTIONAL",
    "language": "en_US",
    "components": {
      "body": {
        "text": "Hi {{1}}, your {{2}} is {{3}} and {{4}} with {{5}} and {{6}} plus {{7}}.",
        "placeholders": [
          { "index": 1, "example": "John" },
          { "index": 2, "example": "order" },
          { "index": 3, "example": "ready" },
          { "index": 4, "example": "packed" },
          { "index": 5, "example": "label" },
          { "index": 6, "example": "tracking" },
          { "index": 7, "example": "invoice" }
        ]
      }
    },
    "sampleValues": {
      "1": "John",
      "2": "order",
      "3": "ready",
      "4": "packed",
      "5": "label",
      "6": "tracking",
      "7": "invoice"
    }
  }')

QUALITY_SCORE=$(echo $EXCESSIVE_PLACEHOLDERS | jq -r '.qualityScore.score')
QUALITY_RATING=$(echo $EXCESSIVE_PLACEHOLDERS | jq -r '.qualityScore.rating')
PLACEHOLDER_CATEGORY=$(echo $EXCESSIVE_PLACEHOLDERS | jq -r '.qualityScore.breakdown[] | select(.category == "Placeholder Usage")')

echo "Quality Score: $QUALITY_SCORE/100 ($QUALITY_RATING)"
echo "Placeholder Usage Scoring:"
echo "$PLACEHOLDER_CATEGORY" | jq '.'

if [ "$QUALITY_SCORE" -lt "90" ]; then
  echo "✅ Quality score correctly penalized for excessive placeholders"
else
  echo "⚠️  Quality score: $QUALITY_SCORE (expected penalty for 7 placeholders)"
fi
echo ""

# Step 7: Test template with button validation
echo "Step 7: Testing template with invalid button configuration..."
INVALID_BUTTONS=$(curl -s -X POST "$BASE_URL/templates/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "invalid_buttons",
    "category": "MARKETING",
    "language": "en_US",
    "components": {
      "body": {
        "text": "Check out our products!",
        "placeholders": []
      },
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Yes"
        },
        {
          "type": "URL",
          "text": "Visit",
          "url": "https://example.com"
        }
      ]
    }
  }')

echo "Response:"
echo "$INVALID_BUTTONS" | jq '.'
echo ""

IS_VALID=$(echo $INVALID_BUTTONS | jq -r '.isValid')
MIXED_BUTTONS_ERROR=$(echo $INVALID_BUTTONS | jq -r '.errors[] | select(.code == "MIXED_BUTTON_TYPES")')

if [ "$IS_VALID" = "false" ] && [ ! -z "$MIXED_BUTTONS_ERROR" ]; then
  echo "✅ Mixed button types correctly detected"
else
  echo "⚠️  Button validation result: isValid=$IS_VALID"
fi
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "✅ All validation endpoint tests completed"
echo ""
echo "Key Features Tested:"
echo "  - Valid template validation"
echo "  - Invalid template detection"
echo "  - Policy violation detection"
echo "  - Validation result caching"
echo "  - Quality score calculation"
echo "  - Button validation"
echo ""
