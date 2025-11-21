#!/bin/bash

echo "🔍 Checking Webhook Activity..."
echo ""
echo "📊 Recent Webhook Logs:"
PGPASSWORD=postgres psql -h localhost -U postgres -d whatscrm -c "SELECT \"eventType\", processed, \"createdAt\" FROM webhook_logs ORDER BY \"createdAt\" DESC LIMIT 5;"

echo ""
echo "💬 Recent Incoming Messages:"
PGPASSWORD=postgres psql -h localhost -U postgres -d whatscrm -c "SELECT \"from\", text, timestamp FROM incoming_messages ORDER BY timestamp DESC LIMIT 5;"

echo ""
echo "📨 Recent Campaign Messages:"
PGPASSWORD=postgres psql -h localhost -U postgres -d whatscrm -c "SELECT \"recipientPhone\", status, \"sentAt\", \"deliveredAt\", \"readAt\" FROM campaign_messages ORDER BY \"createdAt\" DESC LIMIT 5;"
