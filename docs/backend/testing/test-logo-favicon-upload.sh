#!/bin/bash

# Test Logo and Favicon Upload Functionality
# This script tests the complete logo/favicon upload flow

set -e

BASE_URL="http://localhost:3000/api/v1"
SUPER_ADMIN_EMAIL="superadmin@whatscrm.com"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"

echo "🧪 Testing Logo and Favicon Upload Functionality"
echo "================================================"

# Step 1: Login as Super Admin
echo ""
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

# Step 2: Get current branding settings
echo ""
echo "📝 Step 2: Getting current branding settings..."
BRANDING_RESPONSE=$(curl -s -X GET "$BASE_URL/super-admin/settings/branding" \
  -H "Authorization: Bearer $TOKEN")

echo "Current branding settings:"
echo "$BRANDING_RESPONSE"

# Step 3: Create a test logo image (1x1 PNG)
echo ""
echo "📝 Step 3: Creating test logo image..."
# Create a simple 1x1 red PNG
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-logo.png
echo "✅ Test logo created: /tmp/test-logo.png"

# Step 4: Upload logo
echo ""
echo "📝 Step 4: Uploading logo..."
LOGO_UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/super-admin/settings/branding/upload/logo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-logo.png")

echo "Logo upload response:"
echo "$LOGO_UPLOAD_RESPONSE"

LOGO_URL=$(echo $LOGO_UPLOAD_RESPONSE | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -z "$LOGO_URL" ]; then
  echo "❌ Failed to upload logo"
  exit 1
fi

echo "✅ Logo uploaded successfully: $LOGO_URL"

# Step 5: Create a test favicon image (1x1 PNG)
echo ""
echo "📝 Step 5: Creating test favicon image..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-favicon.png
echo "✅ Test favicon created: /tmp/test-favicon.png"

# Step 6: Upload favicon
echo ""
echo "📝 Step 6: Uploading favicon..."
FAVICON_UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/super-admin/settings/branding/upload/favicon" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-favicon.png")

echo "Favicon upload response:"
echo "$FAVICON_UPLOAD_RESPONSE"

FAVICON_URL=$(echo $FAVICON_UPLOAD_RESPONSE | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -z "$FAVICON_URL" ]; then
  echo "❌ Failed to upload favicon"
  exit 1
fi

echo "✅ Favicon uploaded successfully: $FAVICON_URL"

# Step 7: Verify branding settings were updated
echo ""
echo "📝 Step 7: Verifying branding settings were updated..."
UPDATED_BRANDING=$(curl -s -X GET "$BASE_URL/super-admin/settings/branding" \
  -H "Authorization: Bearer $TOKEN")

echo "Updated branding settings:"
echo "$UPDATED_BRANDING"

STORED_LOGO=$(echo $UPDATED_BRANDING | grep -o '"logo":"[^"]*' | cut -d'"' -f4)
STORED_FAVICON=$(echo $UPDATED_BRANDING | grep -o '"favicon":"[^"]*' | cut -d'"' -f4)

if [ "$STORED_LOGO" = "$LOGO_URL" ]; then
  echo "✅ Logo URL correctly stored in settings"
else
  echo "❌ Logo URL mismatch"
  echo "Expected: $LOGO_URL"
  echo "Got: $STORED_LOGO"
  exit 1
fi

if [ "$STORED_FAVICON" = "$FAVICON_URL" ]; then
  echo "✅ Favicon URL correctly stored in settings"
else
  echo "❌ Favicon URL mismatch"
  echo "Expected: $FAVICON_URL"
  echo "Got: $STORED_FAVICON"
  exit 1
fi

# Step 8: Test file size validation (upload file > 5MB)
echo ""
echo "📝 Step 8: Testing file size validation..."
# Create a 6MB file
dd if=/dev/zero of=/tmp/large-logo.png bs=1M count=6 2>/dev/null
LARGE_FILE_RESPONSE=$(curl -s -X POST "$BASE_URL/super-admin/settings/branding/upload/logo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/large-logo.png")

if echo "$LARGE_FILE_RESPONSE" | grep -q "exceeds maximum"; then
  echo "✅ File size validation working correctly"
else
  echo "⚠️  File size validation may not be working"
  echo "Response: $LARGE_FILE_RESPONSE"
fi

# Step 9: Test file type validation (upload invalid file type)
echo ""
echo "📝 Step 9: Testing file type validation..."
echo "test content" > /tmp/test.txt
INVALID_TYPE_RESPONSE=$(curl -s -X POST "$BASE_URL/super-admin/settings/branding/upload/logo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test.txt")

if echo "$INVALID_TYPE_RESPONSE" | grep -q "Invalid file type"; then
  echo "✅ File type validation working correctly"
else
  echo "⚠️  File type validation may not be working"
  echo "Response: $INVALID_TYPE_RESPONSE"
fi

# Step 10: Test accessing uploaded files
echo ""
echo "📝 Step 10: Testing file accessibility..."
LOGO_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$LOGO_URL")
FAVICON_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FAVICON_URL")

if [ "$LOGO_HTTP_CODE" = "200" ]; then
  echo "✅ Logo file is accessible via HTTP"
else
  echo "❌ Logo file is not accessible (HTTP $LOGO_HTTP_CODE)"
fi

if [ "$FAVICON_HTTP_CODE" = "200" ]; then
  echo "✅ Favicon file is accessible via HTTP"
else
  echo "❌ Favicon file is not accessible (HTTP $FAVICON_HTTP_CODE)"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up test files..."
rm -f /tmp/test-logo.png /tmp/test-favicon.png /tmp/large-logo.png /tmp/test.txt

echo ""
echo "================================================"
echo "✅ All logo/favicon upload tests completed!"
echo "================================================"
