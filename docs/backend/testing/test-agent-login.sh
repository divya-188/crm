#!/bin/bash

echo "🔍 Testing Agent Login..."
echo ""

# Test login
echo "📝 Attempting login with agent@test.com..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@test.com",
    "password": "Agent123!"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if login was successful
if echo "$RESPONSE" | grep -q "accessToken"; then
  echo "✅ Login successful!"
  
  # Extract token
  TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken' 2>/dev/null)
  
  if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "🔑 Access Token: ${TOKEN:0:50}..."
    echo ""
    
    # Test accessing a protected route
    echo "🧪 Testing protected route..."
    PROFILE=$(curl -s -X GET http://localhost:3000/api/v1/auth/profile \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Profile:"
    echo "$PROFILE" | jq '.' 2>/dev/null || echo "$PROFILE"
  fi
else
  echo "❌ Login failed!"
  echo ""
  echo "Possible issues:"
  echo "1. Agent user doesn't exist - Run: npm run seed:agent"
  echo "2. Wrong password"
  echo "3. User is inactive"
  echo "4. Backend not running"
fi
