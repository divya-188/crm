#!/bin/bash

# Test Stripe Webhooks with Live Forwarding
# Run this AFTER starting 'stripe listen'

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Stripe Webhook Live Testing                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if stripe listen is running
echo "→ Checking if stripe listen is running..."
if ! pgrep -f "stripe listen" > /dev/null; then
    echo "✗ Stripe listen is not running!"
    echo ""
    echo "Please start it in another terminal:"
    echo "  stripe listen --forward-to localhost:3000/api/v1/subscriptions/webhooks/stripe"
    echo ""
    echo "Then update your backend/.env with the webhook secret and restart the server."
    exit 1
fi
echo "✓ Stripe listen is running"
echo ""

# Check if backend is running
echo "→ Checking if backend server is running..."
if ! curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "✗ Backend server is not running"
    echo "  Please start: cd backend && npm run start:dev"
    exit 1
fi
echo "✓ Backend server is running"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TRIGGERING STRIPE WEBHOOK EVENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 1: Payment Intent Succeeded"
echo "--------------------------------"
stripe trigger payment_intent.succeeded
echo ""
sleep 2

echo "Test 2: Customer Subscription Created"
echo "-------------------------------------"
stripe trigger customer.subscription.created
echo ""
sleep 2

echo "Test 3: Customer Subscription Updated"
echo "-------------------------------------"
stripe trigger customer.subscription.updated
echo ""
sleep 2

echo "Test 4: Invoice Payment Succeeded"
echo "---------------------------------"
stripe trigger invoice.payment_succeeded
echo ""
sleep 2

echo "Test 5: Invoice Payment Failed"
echo "------------------------------"
stripe trigger invoice.payment_failed
echo ""
sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "WEBHOOK TESTING COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Check the following to verify webhooks are working:"
echo ""
echo "1. Stripe Listen Terminal"
echo "   - Should show webhook events being forwarded"
echo "   - Should show [200] responses from your server"
echo ""
echo "2. Backend Server Logs"
echo "   - Should show 'Processing stripe webhook event' messages"
echo "   - Should show subscription/payment processing logs"
echo ""
echo "3. Stripe Dashboard"
echo "   - Visit: https://dashboard.stripe.com/test/events"
echo "   - Should show all triggered events"
echo ""
echo "If you see errors, check:"
echo "  - STRIPE_WEBHOOK_SECRET in backend/.env matches stripe listen output"
echo "  - Backend server was restarted after updating .env"
echo "  - No firewall blocking localhost:3000"
echo ""
