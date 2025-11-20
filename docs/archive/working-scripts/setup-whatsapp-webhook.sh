#!/bin/bash

echo "🚀 WhatsApp Webhook Setup Script"
echo "=================================="
echo ""

# Check if backend is running
echo "1️⃣  Checking if backend is running..."
if curl -s http://localhost:3000/api/v1 > /dev/null 2>&1; then
    echo "✅ Backend is running on port 3000"
else
    echo "❌ Backend is NOT running!"
    echo "   Please start backend first:"
    echo "   cd backend && npm run start:dev"
    exit 1
fi
echo ""

# Test webhook endpoint
echo "2️⃣  Testing webhook endpoint..."
VERIFY_TOKEN="divya_whatsapp_verify_2025"
RESPONSE=$(curl -s "http://localhost:3000/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=$VERIFY_TOKEN&hub.challenge=test123")

if [ "$RESPONSE" == "test123" ]; then
    echo "✅ Webhook endpoint is working!"
    echo "   Response: $RESPONSE"
else
    echo "❌ Webhook verification failed!"
    echo "   Response: $RESPONSE"
    echo "   Expected: test123"
    exit 1
fi
echo ""

# Check if ngrok is running
echo "3️⃣  Checking ngrok status..."
if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
    echo "✅ ngrok is running!"
    echo "   Public URL: $NGROK_URL"
    echo ""
    echo "📋 Your Webhook URL:"
    echo "   $NGROK_URL/api/v1/webhooks/whatsapp"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Go to Meta Developer Dashboard"
    echo "   2. Navigate to: WhatsApp → Configuration → Webhook"
    echo "   3. Enter Callback URL: $NGROK_URL/api/v1/webhooks/whatsapp"
    echo "   4. Enter Verify Token: $VERIFY_TOKEN"
    echo "   5. Click 'Verify and Save'"
    echo "   6. Subscribe to 'messages' field"
else
    echo "❌ ngrok is NOT running!"
    echo ""
    echo "   To start ngrok, run:"
    echo "   ngrok http 3000"
    echo ""
    echo "   Then run this script again."
    exit 1
fi
echo ""

echo "=================================="
echo "✅ Setup verification complete!"
echo ""
echo "🎯 Ready to configure webhook in Meta!"
