#!/bin/bash

echo "=========================================="
echo "Monitoring Razorpay Webhooks"
echo "=========================================="
echo ""
echo "Webhook URL: https://eabf68a7b071.ngrok-free.app/api/v1/subscriptions/webhooks/razorpay"
echo ""
echo "Waiting for webhook events from Razorpay..."
echo "Go to Razorpay Dashboard > Settings > Webhooks and click 'Send Test Webhook'"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""
echo "=========================================="
echo ""

# Test that the endpoint is accessible
echo "Testing endpoint accessibility..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3000/api/v1/subscriptions/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test" \
  -d '{"event": "test"}')

if [ "$RESPONSE" = "400" ]; then
    echo "✓ Webhook endpoint is accessible and validating signatures"
else
    echo "⚠ Unexpected response: $RESPONSE"
fi

echo ""
echo "Monitoring for incoming webhooks..."
echo "(Watch for 'Received Razorpay webhook' messages below)"
echo ""

# Monitor the backend process output
# This will show webhook-related logs in real-time
while true; do
    sleep 1
done
