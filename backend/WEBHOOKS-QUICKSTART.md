# Webhooks Quick Start Guide

## Setup (5 minutes)

### 1. Create Database Tables

Run the SQL script to create webhook tables:

```bash
# Using psql
psql -h localhost -U postgres -d whatscrm -f backend/scripts/create-webhooks-tables.sql

# Or run the migration
cd backend
npm run migration:run
```

### 2. Verify Installation

Check if the tables were created:

```sql
SELECT * FROM webhooks LIMIT 1;
SELECT * FROM webhook_logs LIMIT 1;
```

## Basic Usage

### Create Your First Webhook

```bash
# 1. Login to get access token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Save the access token from response

# 2. Create a webhook
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Webhook",
    "url": "https://webhook.site/your-unique-id",
    "events": ["message.new", "conversation.created"]
  }'
```

### Test Your Webhook

```bash
# Get webhook ID from previous response, then:
curl -X POST http://localhost:3000/api/v1/webhooks/WEBHOOK_ID/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "message.new",
    "payload": {
      "messageId": "test_123",
      "content": "Hello World"
    }
  }'
```

### Check Delivery Logs

```bash
curl -X GET http://localhost:3000/api/v1/webhooks/WEBHOOK_ID/logs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Using webhook.site for Testing

1. Go to https://webhook.site
2. Copy your unique URL
3. Use that URL when creating your webhook
4. Trigger events and see them appear in real-time on webhook.site

## Common Event Types

```javascript
// Subscribe to new messages
events: ["message.new"]

// Subscribe to conversation events
events: ["conversation.created", "conversation.assigned"]

// Subscribe to campaign events
events: ["campaign.started", "campaign.completed"]

// Subscribe to everything
events: ["*"]
```

## Webhook Payload Example

When an event occurs, you'll receive:

```json
{
  "event": "message.new",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "messageId": "msg_123",
    "conversationId": "conv_456",
    "contactId": "contact_789",
    "direction": "inbound",
    "type": "text",
    "content": "Hello!",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Verifying Signatures (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhook(req, secret) {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  const expectedSignature = 'sha256=' + 
    crypto.createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  
  return signature === expectedSignature;
}

// In your Express handler
app.post('/webhook', (req, res) => {
  if (!verifyWebhook(req, 'your-webhook-secret')) {
    return res.status(401).send('Invalid signature');
  }
  
  console.log('Event:', req.body.event);
  console.log('Data:', req.body.data);
  
  res.status(200).send('OK');
});
```

## Verifying Signatures (Python)

```python
import hmac
import hashlib
import json

def verify_webhook(request, secret):
    signature = request.headers.get('X-Webhook-Signature')
    payload = json.dumps(request.json)
    
    expected_signature = 'sha256=' + hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

# In your Flask handler
@app.route('/webhook', methods=['POST'])
def webhook():
    if not verify_webhook(request, 'your-webhook-secret'):
        return 'Invalid signature', 401
    
    print('Event:', request.json['event'])
    print('Data:', request.json['data'])
    
    return 'OK', 200
```

## Troubleshooting

### Webhook not receiving events?

1. Check if webhook is active:
   ```bash
   curl -X GET http://localhost:3000/api/v1/webhooks/WEBHOOK_ID \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

2. Check delivery logs:
   ```bash
   curl -X GET http://localhost:3000/api/v1/webhooks/WEBHOOK_ID/logs \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. Verify your endpoint is accessible from the internet

### Signature verification failing?

1. Make sure you're using the correct secret
2. Hash the raw request body (before parsing JSON)
3. Include the `sha256=` prefix when comparing

### High failure rate?

1. Check webhook statistics:
   ```bash
   curl -X GET http://localhost:3000/api/v1/webhooks/WEBHOOK_ID/stats \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

2. Ensure your endpoint responds within 30 seconds
3. Return 200 status code even if processing fails

## Next Steps

- Read the full documentation: `WEBHOOKS-DOCUMENTATION.md`
- See integration examples: `WEBHOOKS-INTEGRATION-EXAMPLE.md`
- Run the test script: `./test-webhooks-api.sh`

## Support

For issues or questions:
- Check the logs endpoint for detailed error messages
- Review the statistics to identify patterns
- Use the test endpoint to debug your webhook handler
