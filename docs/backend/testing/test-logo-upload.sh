#!/bin/bash

# Test Logo/Favicon Upload Functionality
# This script tests the branding logo and favicon upload endpoints

BASE_URL="http://localhost:3000/api/v1"
SUPER_ADMIN_EMAIL="superadmin@whatscrm.com"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"

echo "🧪 Testing Logo/Favicon Upload Functionality"
echo "=============================================="
echo ""

# Step 1: Login as Super Admin
echo "📝 Step 1: Logging in as Super Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$SUPER_ADMIN_EMAIL\",
    \"password\": \"$SUPER_ADMIN_PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Get current branding settings
echo "📝 Step 2: Getting current branding settings..."
CURRENT_SETTINGS=$(curl -s -X GET "$BASE_URL/super-admin/settings/branding" \
  -H "Authorization: Bearer $TOKEN")

echo "Current settings:"
echo "$CURRENT_SETTINGS" | jq '.'
echo ""

# Step 3: Create a test image file (1x1 PNG)
echo "📝 Step 3: Creating test image files..."
# Create a simple 1x1 red PNG
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-logo.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-favicon.png

echo "✅ Test images created"
echo ""

# Step 4: Upload logo
echo "📝 Step 4: Uploading logo..."
LOGO_RESPONSE=$(curl -s -X POST "$BASE_URL/super-admin/settings/branding/upload/logo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-logo.png")

echo "Logo upload response:"
echo "$LOGO_RESPONSE" | jq '.'

LOGO_URL=$(echo $LOGO_RESPONSE | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -z "$LOGO_URL" ]; then
  echo "❌ Failed to upload logo"
  exit 1
fi

echo "✅ Logo uploaded successfully: $LOGO_URL"
echo ""

# Step 5: Upload favicon
echo "📝 Step 5: Uploading favicon..."
FAVICON_RESPONSE=$(curl -s -X POST "$BASE_URL/super-admin/settings/branding/upload/favicon" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-favicon.png")

echo "Favicon upload response:"
echo "$FAVICON_RESPONSE" | jq '.'

FAVICON_URL=$(echo $FAVICON_RESPONSE | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -z "$FAVICON_URL" ]; then
  echo "❌ Failed to upload favicon"
  exit 1
fi

echo "✅ Favicon uploaded successfully: $FAVICON_URL"
echo ""

# Step 6: Verify settings were updated
echo "📝 Step 6: Verifying settings were updated..."
UPDATED_SETTINGS=$(curl -s -X GET "$BASE_URL/super-admin/settings/branding" \
  -H "Authorization: Bearer $TOKEN")

echo "Updated settings:"
echo "$UPDATED_SETTINGS" | jq '.'

STORED_LOGO=$(echo $UPDATED_SETTINGS | grep -o '"logo":"[^"]*' | cut -d'"' -f4)
STORED_FAVICON=$(echo $UPDATED_SETTINGS | grep -o '"favicon":"[^"]*' | cut -d'"' -f4)

if [ "$STORED_LOGO" = "$LOGO_URL" ] && [ "$STORED_FAVICON" = "$FAVICON_URL" ]; then
  echo "✅ Settings updated correctly"
else
  echo "❌ Settings not updated correctly"
  echo "Expected logo: $LOGO_URL"
  echo "Stored logo: $STORED_LOGO"
  echo "Expected favicon: $FAVICON_URL"
  echo "Stored favicon: $STORED_FAVICON"
  exit 1
fi

echo ""

# Step 7: Test file size validation (create a file > 5MB)
echo "📝 Step 7: Testing file size validation..."
dd if=/dev/zero of=/tmp/large-file.png bs=1M count=6 2>/dev/null

LARGE_FILE_RESPONSE=$(curl -s -X POST "$BASE_URL/super-admin/settings/branding/upload/logo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/large-file.png")

if echo "$LARGE_FILE_RESPONSE" | grep -q "exceeds maximum"; then
  echo "✅ File size validation working"
else
  echo "⚠️  File size validation may not be working"
  echo "Response: $LARGE_FILE_RESPONSE"
fi

echo ""

# Cleanup
rm -f /tmp/test-logo.png /tmp/test-favicon.png /tmp/large-file.png

echo "=============================================="
echo "✅ All tests completed successfully!"
echo "=============================================="
