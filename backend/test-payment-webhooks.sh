#!/bin/bash

# Test Payment Gateway Webhooks
# Tests webhook handling for Stripe, PayPal, and Razorpay

BASE_URL="http://localhost:3000/api/v1"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Payment Gateway Webhooks Testing                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# STRIPE WEBHOOK TEST
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Stripe Webhook - Payment Success"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Sending Stripe webhook event..."
STRIPE_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions/webhooks/stripe" \
    -H "Content-Type: application/json" \
    -H "stripe-signature: test_signature_12345" \
    -d '{
      "id": "evt_test_webhook",
      "object": "event",
      "type": "checkout.session.completed",
      "data": {
        "object": {
          "id": "cs_test_123",
          "customer": "cus_test_123",
          "subscription": "sub_test_123",
          "payment_status": "paid",
          "metadata": {
            "subscriptionId": "test-subscription-id",
            "tenantId": "test-tenant-id"
          }
        }
      }
    }')

echo "$STRIPE_RESPONSE"
echo ""

# ============================================================================
# PAYPAL WEBHOOK TEST
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: PayPal Webhook - Subscription Activated"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Sending PayPal webhook event..."
PAYPAL_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions/webhooks/paypal" \
    -H "Content-Type: application/json" \
    -H "paypal-transmission-sig: test_signature_67890" \
    -d '{
      "id": "WH-test-123",
      "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
      "resource": {
        "id": "I-test-subscription",
        "status": "ACTIVE",
        "subscriber": {
          "email_address": "test@example.com"
        },
        "custom_id": "test-subscription-id"
      }
    }')

echo "$PAYPAL_RESPONSE"
echo ""

# ============================================================================
# RAZORPAY WEBHOOK TEST
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Razorpay Webhook - Payment Captured"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Sending Razorpay webhook event..."
RAZORPAY_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions/webhooks/razorpay" \
    -H "Content-Type: application/json" \
    -H "x-razorpay-signature: test_signature_abcde" \
    -d '{
      "event": "payment.captured",
      "payload": {
        "payment": {
          "entity": {
            "id": "pay_test_123",
            "amount": 4900,
            "currency": "USD",
            "status": "captured",
            "notes": {
              "subscriptionId": "test-subscription-id",
              "tenantId": "test-tenant-id"
            }
          }
        }
      }
    }')

echo "$RAZORPAY_RESPONSE"
echo ""

# ============================================================================
# WEBHOOK SIGNATURE VALIDATION TEST
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Webhook Signature Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 4.1: Stripe webhook without signature (should fail)"
NO_SIG_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions/webhooks/stripe" \
    -H "Content-Type: application/json" \
    -d '{"type": "test"}')
echo "$NO_SIG_RESPONSE"
echo ""

echo "Test 4.2: Razorpay webhook without signature (should fail)"
NO_SIG_RAZORPAY=$(curl -s -X POST "$BASE_URL/subscriptions/webhooks/razorpay" \
    -H "Content-Type: application/json" \
    -d '{"event": "test"}')
echo "$NO_SIG_RAZORPAY"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "WEBHOOK TESTING COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "--------"
echo "✓ Stripe webhook endpoint tested"
echo "✓ PayPal webhook endpoint tested"
echo "✓ Razorpay webhook endpoint tested"
echo "✓ Signature validation tested"
echo ""
echo "Notes:"
echo "------"
echo "• Webhook signatures are validated in production"
echo "• Test signatures may not pass validation"
echo "• Real webhooks require proper signature generation"
echo "• Configure webhook secrets in .env file:"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - PAYPAL_WEBHOOK_ID"
echo "  - RAZORPAY_WEBHOOK_SECRET"
