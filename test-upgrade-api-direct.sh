#!/bin/bash

# Test the upgrade API directly to see what it returns

echo "🧪 Testing Upgrade API Directly"
echo "================================"

# Get your auth token (replace with your actual token from browser localStorage)
TOKEN="YOUR_AUTH_TOKEN_HERE"

# Your subscription ID
SUB_ID="d505c48f-ca79-4555-9e4a-685508c90412"

# New plan ID (one of the more expensive plans)
NEW_PLAN_ID="4b00c3b7-9eae-4bb8-bc51-17a9611b17b2"

echo ""
echo "📡 Calling upgrade API..."
echo "Subscription ID: $SUB_ID"
echo "New Plan ID: $NEW_PLAN_ID"
echo ""

curl -X PATCH "http://localhost:3001/api/v1/subscriptions/$SUB_ID/upgrade" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"newPlanId\": \"$NEW_PLAN_ID\",
    \"paymentProvider\": \"razorpay\"
  }" \
  | jq '.'

echo ""
echo "✅ Done! Check the response above for checkoutUrl"
