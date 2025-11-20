#!/bin/bash

echo "🧪 Testing Invoice Download Functionality"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api/v1"

echo -e "${YELLOW}📋 Test Configuration:${NC}"
echo "  Base URL: $BASE_URL"
echo "  API URL: $API_URL"
echo ""

# Test 1: Login as admin
echo -e "${YELLOW}🔐 Test 1: Admin Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo -e "${GREEN}✅ Admin login successful${NC}"
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "  Token: ${ACCESS_TOKEN:0:30}..."
else
  echo -e "${RED}❌ Admin login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi
echo ""

# Test 2: Get invoices
echo -e "${YELLOW}📄 Test 2: Get Invoices${NC}"
INVOICES_RESPONSE=$(curl -s -X GET "$API_URL/subscriptions/invoices" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $INVOICES_RESPONSE"
echo ""

if echo "$INVOICES_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Invoices retrieved successfully${NC}"
  
  # Extract first invoice ID
  INVOICE_ID=$(echo "$INVOICES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$INVOICE_ID" ]; then
    echo "  First Invoice ID: $INVOICE_ID"
  else
    echo -e "${YELLOW}⚠️  No invoices found${NC}"
    echo "  This is expected if no subscriptions have been created yet"
    exit 0
  fi
else
  echo -e "${RED}❌ Failed to get invoices${NC}"
  echo "Response: $INVOICES_RESPONSE"
  exit 1
fi
echo ""

# Test 3: Download PDF
echo -e "${YELLOW}📥 Test 3: Download Invoice PDF${NC}"
PDF_FILE="test-invoice-${INVOICE_ID}.pdf"

HTTP_CODE=$(curl -s -w "%{http_code}" -X GET "$API_URL/subscriptions/invoices/$INVOICE_ID/download" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o "$PDF_FILE")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PDF download successful (HTTP $HTTP_CODE)${NC}"
  
  # Check if file exists and has content
  if [ -f "$PDF_FILE" ] && [ -s "$PDF_FILE" ]; then
    FILE_SIZE=$(wc -c < "$PDF_FILE" | tr -d ' ')
    echo "  File size: $FILE_SIZE bytes"
    
    # Check if it's a valid PDF (starts with %PDF)
    if head -c 4 "$PDF_FILE" | grep -q "%PDF"; then
      echo -e "${GREEN}✅ Valid PDF file generated${NC}"
      echo "  PDF file saved as: $PDF_FILE"
      echo ""
      echo -e "${GREEN}🎉 You can now open the PDF file to verify the invoice format${NC}"
    else
      echo -e "${RED}❌ Invalid PDF file (doesn't start with %PDF)${NC}"
      echo "File content preview:"
      head -c 100 "$PDF_FILE"
    fi
  else
    echo -e "${RED}❌ PDF file is empty or doesn't exist${NC}"
  fi
else
  echo -e "${RED}❌ PDF download failed (HTTP $HTTP_CODE)${NC}"
  
  # Try to get error response
  ERROR_RESPONSE=$(curl -s -X GET "$API_URL/subscriptions/invoices/$INVOICE_ID/download" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  echo "Error response: $ERROR_RESPONSE"
  
  # Clean up empty file
  rm -f "$PDF_FILE"
fi
echo ""

echo -e "${YELLOW}📊 Test Summary${NC}"
echo "==============="
echo "✅ Tests completed"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Open the generated PDF file: $PDF_FILE"
echo "2. Verify the invoice format looks professional"
echo "3. Check that all invoice details are correct"
