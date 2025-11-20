#!/bin/bash

# Test WhatsApp Connection Endpoint
# This script tests the WhatsApp test connection endpoint

echo "🧪 Testing WhatsApp Connection Endpoint"
echo "========================================"
echo ""

# Get the JWT token (you'll need to replace this with your actual token)
# You can get this from your browser's developer tools after logging in
TOKEN="${1:-YOUR_JWT_TOKEN_HERE}"

if [ "$TOKEN" = "YOUR_JWT_TOKEN_HERE" ]; then
  echo "❌ Error: Please provide a JWT token as the first argument"
  echo "Usage: ./test-whatsapp-connection.sh YOUR_JWT_TOKEN"
  echo ""
  echo "To get your token:"
  echo "1. Log in to the application in your browser"
  echo "2. Open Developer Tools (F12)"
  echo "3. Go to Application/Storage > Local Storage"
  echo "4. Copy the JWT token value"
  exit 1
fi

echo "📡 Making request to: POST http://localhost:3000/api/v1/settings/whatsapp/test"
echo ""

# Make the request and capture the response
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/v1/settings/whatsapp/test)

# Split response body and status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)

echo "📊 Response Status: $HTTP_STATUS"
echo "📄 Response Body:"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Analyze the response
if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
  SUCCESS=$(echo "$HTTP_BODY" | jq -r '.success' 2>/dev/null)
  MESSAGE=$(echo "$HTTP_BODY" | jq -r '.message' 2>/dev/null)
  
  if [ "$SUCCESS" = "true" ]; then
    echo "✅ Connection test PASSED"
    echo "   Message: $MESSAGE"
  elif [ "$SUCCESS" = "false" ]; then
    echo "⚠️  Connection test returned success=false"
    echo "   Message: $MESSAGE"
  else
    echo "❓ Unexpected response format"
  fi
elif [ "$HTTP_STATUS" = "404" ]; then
  echo "❌ WhatsApp configuration not found"
  ERROR_MESSAGE=$(echo "$HTTP_BODY" | jq -r '.message' 2>/dev/null)
  echo "   Message: $ERROR_MESSAGE"
elif [ "$HTTP_STATUS" = "401" ]; then
  echo "❌ Unauthorized - Invalid or expired token"
else
  echo "❌ Request failed with status $HTTP_STATUS"
  ERROR_MESSAGE=$(echo "$HTTP_BODY" | jq -r '.message' 2>/dev/null)
  echo "   Message: $ERROR_MESSAGE"
fi

echo ""
echo "========================================"
