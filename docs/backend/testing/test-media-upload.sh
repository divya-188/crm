#!/bin/bash

# Test Media Upload for Template Headers
# This script tests the media upload functionality for WhatsApp templates

set -e

echo "🧪 Testing Media Upload for Template Headers"
echo "=============================================="
echo ""

# Configuration
API_URL="http://localhost:3000/api/v1"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if server is running
echo "1. Checking if server is running..."
if curl -s "${API_URL}/health" > /dev/null 2>&1; then
    success "Server is running"
else
    error "Server is not running. Please start the backend server first."
    exit 1
fi
echo ""

# Login to get token
echo "2. Logging in to get authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@example.com",
        "password": "Admin123!"
    }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    error "Failed to get authentication token"
    info "Response: $LOGIN_RESPONSE"
    exit 1
fi

success "Authentication successful"
echo ""

# Create test image file (1x1 PNG)
echo "3. Creating test image file..."
TEST_IMAGE="/tmp/test-template-image.png"
# Create a valid 1x1 PNG image
echo -n -e '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0a\x49\x44\x41\x54\x78\x9c\x63\x00\x01\x00\x00\x05\x00\x01\x0d\x0a\x2d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > "$TEST_IMAGE"
success "Test image created: $TEST_IMAGE"
echo ""

# Test 1: Upload valid image
echo "4. Testing image upload..."
UPLOAD_RESPONSE=$(curl -s -X POST "${API_URL}/templates/media/upload" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@${TEST_IMAGE}" \
    -F "type=image")

MEDIA_HANDLE=$(echo $UPLOAD_RESPONSE | grep -o '"mediaHandle":"[^"]*' | cut -d'"' -f4)

if [ -n "$MEDIA_HANDLE" ]; then
    success "Image uploaded successfully"
    info "Media Handle: $MEDIA_HANDLE"
    info "Response: $UPLOAD_RESPONSE"
else
    error "Image upload failed"
    info "Response: $UPLOAD_RESPONSE"
fi
echo ""

# Test 2: Get media preview
if [ -n "$MEDIA_HANDLE" ]; then
    echo "5. Testing media preview..."
    PREVIEW_RESPONSE=$(curl -s -X GET "${API_URL}/templates/media/${MEDIA_HANDLE}/preview" \
        -H "Authorization: Bearer ${TOKEN}")
    
    PREVIEW_URL=$(echo $PREVIEW_RESPONSE | grep -o '"url":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$PREVIEW_URL" ]; then
        success "Media preview retrieved successfully"
        info "Preview URL: $PREVIEW_URL"
    else
        error "Failed to get media preview"
        info "Response: $PREVIEW_RESPONSE"
    fi
    echo ""
fi

# Test 3: Upload without file (should fail)
echo "6. Testing upload without file (should fail)..."
ERROR_RESPONSE=$(curl -s -X POST "${API_URL}/templates/media/upload" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "type=image")

if echo "$ERROR_RESPONSE" | grep -q "File is required"; then
    success "Correctly rejected upload without file"
else
    error "Should have rejected upload without file"
    info "Response: $ERROR_RESPONSE"
fi
echo ""

# Test 4: Upload with invalid type (should fail)
echo "7. Testing upload with invalid MIME type (should fail)..."
# Create a text file
TEST_TEXT="/tmp/test-invalid.txt"
echo "This is not an image" > "$TEST_TEXT"

ERROR_RESPONSE=$(curl -s -X POST "${API_URL}/templates/media/upload" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@${TEST_TEXT}" \
    -F "type=image")

if echo "$ERROR_RESPONSE" | grep -q "Invalid file type"; then
    success "Correctly rejected invalid file type"
else
    error "Should have rejected invalid file type"
    info "Response: $ERROR_RESPONSE"
fi
echo ""

# Test 5: Create template with uploaded media
if [ -n "$MEDIA_HANDLE" ]; then
    echo "8. Testing template creation with uploaded media..."
    TEMPLATE_RESPONSE=$(curl -s -X POST "${API_URL}/templates" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"test_media_template_$(date +%s)\",
            \"displayName\": \"Test Media Template\",
            \"category\": \"MARKETING\",
            \"language\": \"en_US\",
            \"description\": \"Template with media header\",
            \"components\": {
                \"header\": {
                    \"type\": \"IMAGE\",
                    \"mediaHandle\": \"${MEDIA_HANDLE}\"
                },
                \"body\": {
                    \"text\": \"Welcome to our service!\",
                    \"placeholders\": []
                }
            }
        }")
    
    TEMPLATE_ID=$(echo $TEMPLATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TEMPLATE_ID" ]; then
        success "Template created successfully with media header"
        info "Template ID: $TEMPLATE_ID"
    else
        error "Failed to create template with media"
        info "Response: $TEMPLATE_RESPONSE"
    fi
    echo ""
fi

# Cleanup
echo "9. Cleaning up test files..."
rm -f "$TEST_IMAGE" "$TEST_TEXT"
success "Test files cleaned up"
echo ""

# Summary
echo "=============================================="
echo "📊 Test Summary"
echo "=============================================="
echo ""
success "All media upload tests completed!"
echo ""
info "Tested functionality:"
echo "  • Image upload with validation"
echo "  • Media preview retrieval"
echo "  • Error handling for missing files"
echo "  • Error handling for invalid file types"
echo "  • Template creation with media header"
echo ""
info "Next steps:"
echo "  • Test video upload (MP4, 3GPP)"
echo "  • Test document upload (PDF)"
echo "  • Test file size limits"
echo "  • Test Meta API integration"
echo ""
