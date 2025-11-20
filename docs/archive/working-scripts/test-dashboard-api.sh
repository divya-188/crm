#!/bin/bash

# Test Dashboard Analytics API
# This script tests the dashboard metrics endpoint

BASE_URL="http://localhost:3000/api/v1"

echo "==================================="
echo "Dashboard Analytics API Test"
echo "==================================="
echo ""

# First, login to get a token
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Please check credentials."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Test dashboard metrics
echo "2. Fetching dashboard metrics..."
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Dashboard Metrics Response:"
echo "$DASHBOARD_RESPONSE" | jq '.' 2>/dev/null || echo "$DASHBOARD_RESPONSE"
echo ""

# Check if response contains expected fields
if echo "$DASHBOARD_RESPONSE" | grep -q "totalConversations"; then
  echo "✅ Dashboard metrics retrieved successfully"
  
  # Extract and display key metrics
  TOTAL_CONVERSATIONS=$(echo "$DASHBOARD_RESPONSE" | grep -o '"totalConversations":[0-9]*' | cut -d':' -f2)
  TOTAL_MESSAGES=$(echo "$DASHBOARD_RESPONSE" | grep -o '"totalMessages":[0-9]*' | cut -d':' -f2)
  TOTAL_CONTACTS=$(echo "$DASHBOARD_RESPONSE" | grep -o '"totalContacts":[0-9]*' | cut -d':' -f2)
  
  echo ""
  echo "Key Metrics:"
  echo "  - Total Conversations: $TOTAL_CONVERSATIONS"
  echo "  - Total Messages: $TOTAL_MESSAGES"
  echo "  - Total Contacts: $TOTAL_CONTACTS"
else
  echo "❌ Dashboard metrics retrieval failed"
fi

echo ""
echo "==================================="
echo "Test Complete"
echo "==================================="
