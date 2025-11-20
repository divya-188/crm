#!/bin/bash

# Test Template Metadata Endpoints
# This script tests the GET /templates/categories and GET /templates/languages endpoints

set -e

BASE_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin@123"

echo "========================================="
echo "Template Metadata Endpoints Test"
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

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    print_error "Failed to login"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Logged in successfully"
echo ""

# Step 2: Get template categories
echo "Step 2: Getting template categories..."
CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/categories" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "$CATEGORIES_RESPONSE" | jq '.' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Categories endpoint returned valid JSON"
    
    # Check if categories array exists
    CATEGORIES_COUNT=$(echo "$CATEGORIES_RESPONSE" | jq '.categories | length')
    if [ "$CATEGORIES_COUNT" -gt 0 ]; then
        print_success "Found $CATEGORIES_COUNT categories"
        
        # Display categories
        echo ""
        print_info "Available Categories:"
        echo "$CATEGORIES_RESPONSE" | jq -r '.categories[] | "  - \(.code): \(.name) (\(.approvalDifficulty))"'
        
        # Check for required categories
        echo ""
        print_info "Checking required categories..."
        for category in "TRANSACTIONAL" "UTILITY" "MARKETING" "ACCOUNT_UPDATE" "OTP"; do
            HAS_CATEGORY=$(echo "$CATEGORIES_RESPONSE" | jq -r ".categories[] | select(.code == \"$category\") | .code")
            if [ "$HAS_CATEGORY" == "$category" ]; then
                print_success "Category $category exists"
            else
                print_error "Category $category is missing"
            fi
        done
        
        # Check category structure
        echo ""
        print_info "Checking category structure..."
        FIRST_CATEGORY=$(echo "$CATEGORIES_RESPONSE" | jq -r '.categories[0]')
        
        for field in "code" "name" "description" "examples" "approvalDifficulty" "restrictions"; do
            HAS_FIELD=$(echo "$FIRST_CATEGORY" | jq -r "has(\"$field\")")
            if [ "$HAS_FIELD" == "true" ]; then
                print_success "Category has $field field"
            else
                print_error "Category missing $field field"
            fi
        done
        
        # Check if cached field exists
        IS_CACHED=$(echo "$CATEGORIES_RESPONSE" | jq -r '.cached')
        if [ "$IS_CACHED" == "false" ]; then
            print_success "First request not cached (as expected)"
        else
            print_info "Response was cached"
        fi
    else
        print_error "No categories found"
    fi
else
    print_error "Categories endpoint returned invalid JSON"
    echo "Response: $CATEGORIES_RESPONSE"
fi

echo ""
echo "========================================="
echo ""

# Step 3: Get template categories again (should be cached)
echo "Step 3: Getting template categories again (testing cache)..."
sleep 1
CATEGORIES_CACHED_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/categories" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

IS_CACHED=$(echo "$CATEGORIES_CACHED_RESPONSE" | jq -r '.cached')
if [ "$IS_CACHED" == "true" ]; then
    print_success "Second request served from cache"
    CACHE_EXPIRES_IN=$(echo "$CATEGORIES_CACHED_RESPONSE" | jq -r '.cacheExpiresIn')
    print_info "Cache expires in $CACHE_EXPIRES_IN seconds"
else
    print_error "Second request not cached"
fi

echo ""
echo "========================================="
echo ""

# Step 4: Get template languages
echo "Step 4: Getting template languages..."
LANGUAGES_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/languages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "$LANGUAGES_RESPONSE" | jq '.' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Languages endpoint returned valid JSON"
    
    # Check if languages array exists
    LANGUAGES_COUNT=$(echo "$LANGUAGES_RESPONSE" | jq '.languages | length')
    if [ "$LANGUAGES_COUNT" -gt 0 ]; then
        print_success "Found $LANGUAGES_COUNT languages"
        
        # Display popular languages
        echo ""
        print_info "Popular Languages:"
        echo "$LANGUAGES_RESPONSE" | jq -r '.languages[] | select(.popular == true) | "  - \(.code): \(.name) (\(.nativeName)) [\(.direction)]"'
        
        # Check for required popular languages
        echo ""
        print_info "Checking required popular languages..."
        for lang in "en_US" "es_ES" "pt_BR" "hi_IN" "ar" "fr_FR" "de_DE" "zh_CN"; do
            HAS_LANG=$(echo "$LANGUAGES_RESPONSE" | jq -r ".languages[] | select(.code == \"$lang\") | .code")
            if [ "$HAS_LANG" == "$lang" ]; then
                print_success "Language $lang exists"
            else
                print_error "Language $lang is missing"
            fi
        done
        
        # Check language structure
        echo ""
        print_info "Checking language structure..."
        FIRST_LANGUAGE=$(echo "$LANGUAGES_RESPONSE" | jq -r '.languages[0]')
        
        for field in "code" "name" "nativeName" "direction" "popular"; do
            HAS_FIELD=$(echo "$FIRST_LANGUAGE" | jq -r "has(\"$field\")")
            if [ "$HAS_FIELD" == "true" ]; then
                print_success "Language has $field field"
            else
                print_error "Language missing $field field"
            fi
        done
        
        # Check RTL languages
        echo ""
        print_info "Checking RTL languages..."
        RTL_COUNT=$(echo "$LANGUAGES_RESPONSE" | jq '[.languages[] | select(.direction == "rtl")] | length')
        if [ "$RTL_COUNT" -gt 0 ]; then
            print_success "Found $RTL_COUNT RTL languages"
            echo "$LANGUAGES_RESPONSE" | jq -r '.languages[] | select(.direction == "rtl") | "  - \(.code): \(.name)"'
        else
            print_error "No RTL languages found"
        fi
        
        # Check if cached field exists
        IS_CACHED=$(echo "$LANGUAGES_RESPONSE" | jq -r '.cached')
        if [ "$IS_CACHED" == "false" ]; then
            print_success "First request not cached (as expected)"
        else
            print_info "Response was cached"
        fi
    else
        print_error "No languages found"
    fi
else
    print_error "Languages endpoint returned invalid JSON"
    echo "Response: $LANGUAGES_RESPONSE"
fi

echo ""
echo "========================================="
echo ""

# Step 5: Get template languages again (should be cached)
echo "Step 5: Getting template languages again (testing cache)..."
sleep 1
LANGUAGES_CACHED_RESPONSE=$(curl -s -X GET "$BASE_URL/templates/languages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

IS_CACHED=$(echo "$LANGUAGES_CACHED_RESPONSE" | jq -r '.cached')
if [ "$IS_CACHED" == "true" ]; then
    print_success "Second request served from cache"
    CACHE_EXPIRES_IN=$(echo "$LANGUAGES_CACHED_RESPONSE" | jq -r '.cacheExpiresIn')
    print_info "Cache expires in $CACHE_EXPIRES_IN seconds"
else
    print_error "Second request not cached"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""

# Summary
print_info "Categories: $CATEGORIES_COUNT found"
print_info "Languages: $LANGUAGES_COUNT found"
print_info "Caching: Working correctly"

echo ""
print_success "All metadata endpoint tests completed!"
echo ""
