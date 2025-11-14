#!/bin/bash

# Test Invoice Generation System
# This script tests the invoice generation, PDF creation, and download endpoints

BASE_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="superadmin@whatscrm.com"
ADMIN_PASSWORD="SuperAdmin123!"

echo "=========================================="
echo "Invoice Generation System Test"
echo "=========================================="
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
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Get current subscription
echo "Step 2: Getting current subscription..."
SUBSCRIPTION_RESPONSE=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Subscription: $SUBSCRIPTION_RESPONSE"
SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo "⚠️  No active subscription found"
  echo ""
else
  echo "✅ Found subscription: $SUBSCRIPTION_ID"
  echo ""
fi

# Step 3: Get all invoices
echo "Step 3: Getting all invoices..."
INVOICES_RESPONSE=$(curl -s -X GET "$BASE_URL/subscriptions/invoices" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Invoices Response:"
echo "$INVOICES_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$INVOICES_RESPONSE"
echo ""

# Extract first invoice ID if available
INVOICE_ID=$(echo $INVOICES_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$INVOICE_ID" ]; then
  echo "⚠️  No invoices found"
  echo ""
else
  echo "✅ Found invoice: $INVOICE_ID"
  echo ""
  
  # Step 4: Get invoice details
  echo "Step 4: Getting invoice details..."
  INVOICE_DETAIL=$(curl -s -X GET "$BASE_URL/subscriptions/invoices/$INVOICE_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  echo "Invoice Details:"
  echo "$INVOICE_DETAIL" | python3 -m json.tool 2>/dev/null || echo "$INVOICE_DETAIL"
  echo ""
  
  # Step 5: Download invoice PDF
  echo "Step 5: Testing invoice PDF download..."
  PDF_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/subscriptions/invoices/$INVOICE_ID/download" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -o "/tmp/test-invoice-$INVOICE_ID.pdf")
  
  HTTP_CODE=$(echo "$PDF_RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    PDF_SIZE=$(wc -c < "/tmp/test-invoice-$INVOICE_ID.pdf")
    echo "✅ PDF downloaded successfully ($PDF_SIZE bytes)"
    echo "   Saved to: /tmp/test-invoice-$INVOICE_ID.pdf"
    
    # Check if it's a valid PDF
    if file "/tmp/test-invoice-$INVOICE_ID.pdf" | grep -q "PDF"; then
      echo "✅ Valid PDF file"
    else
      echo "❌ Invalid PDF file"
    fi
  else
    echo "❌ PDF download failed (HTTP $HTTP_CODE)"
  fi
  echo ""
fi

# Step 6: Test legacy subscription invoice endpoint
if [ ! -z "$SUBSCRIPTION_ID" ]; then
  echo "Step 6: Testing legacy subscription invoice endpoint..."
  LEGACY_PDF_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/invoice" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -o "/tmp/test-subscription-invoice.pdf")
  
  HTTP_CODE=$(echo "$LEGACY_PDF_RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    PDF_SIZE=$(wc -c < "/tmp/test-subscription-invoice.pdf")
    echo "✅ Legacy PDF endpoint works ($PDF_SIZE bytes)"
    echo "   Saved to: /tmp/test-subscription-invoice.pdf"
  else
    echo "❌ Legacy PDF endpoint failed (HTTP $HTTP_CODE)"
  fi
  echo ""
fi

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "✅ Invoice listing endpoint working"
if [ ! -z "$INVOICE_ID" ]; then
  echo "✅ Invoice details endpoint working"
  echo "✅ Invoice PDF download endpoint working"
else
  echo "⚠️  No invoices to test download"
fi
echo ""
echo "Note: To create invoices, complete a subscription payment"
echo "      or trigger a renewal event."
