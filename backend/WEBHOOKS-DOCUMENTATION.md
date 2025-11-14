# Webhooks API Documentation

## Overview

The Webhooks API allows you to receive real-time notifications about events happening in your WhatsApp CRM account. When an event occurs, the system will send an HTTP POST request to your configured webhook URL with details about the event.

## Features

- **Event Subscriptions**: Subscribe to specific events or all events using the wildcard `*`
- **Signature Verification**: Secure webhooks with HMAC SHA-256 signatures
- **Automatic Retries**: Failed deliveries are automatically retried with exponential backoff
- **Delivery Logs**: Complete logs of all webhook deliveries with response details
- **Testing Interface**: Test webhooks with sample payloads before going live
- **Statistics**: Track delivery success rates and performance metrics

## Available Events

### Message Events
- `message.new` - New message received
- `message.sent` - Message sent successfully
- `message.delivered` - Message delivered to recipient
- `message.read` - Message read by recipient
- `message.failed` - Message delivery failed

### Conversation Events
- `conversation.created` - New conversation created
- `conversation.updated` - Conversation details updated
- `conversation.assigned` - Conversation assigned to agent
- `conversation.resolved` - Conversation marked as resolved
- `conversation.closed` - Conversation closed

### Contact Events
- `contact.created` - New contact created
- `contact.updated` - Contact details updated

### Campaign Events
- `campaign.started` - Campaign execution started
- `campaign.completed` - Campaign execution completed
- `campaign.failed` - Campaign execution failed

### Flow Events
- `flow.started` - Chatbot flow execution started
- `flow.completed` - Chatbot flow execution completed
- `flow.failed` - Chatbot flow execution failed

### Automation Events
- `automation.triggered` - Automation rule triggered
- `automation.completed` - Automation execution completed

### Template Events
- `template.approved` - Template approved by Meta
- `template.rejected` - Template rejected by Meta

### Wildcard
- `*` - Subscribe to all events

## API Endpoints

### Create Webhook

Create a new webhook subscription.

**Endpoint:** `POST /api/v1/webhooks`

**Request Body:**
```json
{
  "name": "My Webhook",
  "url": "https://example.com/webhook",
  "events": ["message.new", "conversation.created"],
  "secret": "optional-secret-key",
  "retryCount": 3,
  "timeoutSeconds": 30,
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Webhook created successfully",
  "data": {
    "id": "webhook-uuid",
    "name": "My Webhook",
    "url": "https://example.com/webhook",
    "events": ["message.new", "conversation.created"],
    "secret": "generated-or-provided-secret",
    "retryCount": 3,
    "timeoutSeconds": 30,
    "isActive": true,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### List Webhooks

Get all webhooks for your account.

**Endpoint:** `GET /api/v1/webhooks`

**Response:**
```json
{
  "data": [
    {
      "id": "webhook-uuid",
      "name": "My Webhook",
      "url": "https://example.com/webhook",
      "events": ["message.new", "conversation.created"],
      "retryCount": 3,
      "timeoutSeconds": 30,
      "isActive": true,
      "status": "active",
      "totalDeliveries": 150,
      "successfulDeliveries": 145,
      "failedDeliveries": 5,
      "lastTriggeredAt": "2024-01-01T12:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Webhook Details

Get details of a specific webhook.

**Endpoint:** `GET /api/v1/webhooks/:id`

**Response:**
```json
{
  "data": {
    "id": "webhook-uuid",
    "name": "My Webhook",
    "url": "https://example.com/webhook",
    "events": ["message.new", "conversation.created"],
    "secret": "your-secret-key",
    "retryCount": 3,
    "timeoutSeconds": 30,
    "isActive": true,
    "status": "active",
    "totalDeliveries": 150,
    "successfulDeliveries": 145,
    "failedDeliveries": 5,
    "lastTriggeredAt": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Webhook

Update webhook configuration.

**Endpoint:** `PATCH /api/v1/webhooks/:id`

**Request Body:**
```json
{
  "name": "Updated Webhook Name",
  "events": ["message.new", "conversation.created", "campaign.completed"],
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Webhook updated successfully",
  "data": {
    "id": "webhook-uuid",
    "name": "Updated Webhook Name",
    "url": "https://example.com/webhook",
    "events": ["message.new", "conversation.created", "campaign.completed"],
    "retryCount": 3,
    "timeoutSeconds": 30,
    "isActive": true,
    "status": "active",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Delete Webhook

Delete a webhook.

**Endpoint:** `DELETE /api/v1/webhooks/:id`

**Response:**
```json
{
  "message": "Webhook deleted successfully"
}
```

### Test Webhook

Send a test event to your webhook.

**Endpoint:** `POST /api/v1/webhooks/:id/test`

**Request Body:**
```json
{
  "eventType": "message.new",
  "payload": {
    "messageId": "test_msg_123",
    "content": "This is a test message"
  }
}
```

**Response:**
```json
{
  "message": "Webhook test initiated",
  "eventType": "message.new",
  "payload": {
    "messageId": "test_msg_123",
    "content": "This is a test message"
  }
}
```

### Get Webhook Logs

Get delivery logs for a webhook.

**Endpoint:** `GET /api/v1/webhooks/:id/logs?limit=50`

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50)

**Response:**
```json
{
  "data": [
    {
      "id": "log-uuid",
      "webhookId": "webhook-uuid",
      "eventType": "message.new",
      "payload": { ... },
      "responseStatus": 200,
      "responseBody": "{\"success\":true}",
      "responseTimeMs": 245,
      "errorMessage": null,
      "attemptCount": 1,
      "isSuccess": true,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### Get Webhook Statistics

Get delivery statistics for a webhook.

**Endpoint:** `GET /api/v1/webhooks/:id/stats`

**Response:**
```json
{
  "data": {
    "totalDeliveries": 150,
    "successfulDeliveries": 145,
    "failedDeliveries": 5,
    "successRate": 96.67,
    "avgResponseTimeMs": 234,
    "lastTriggeredAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Get Available Events

Get list of all available webhook events.

**Endpoint:** `GET /api/v1/webhooks/events`

**Response:**
```json
{
  "data": [
    "message.new",
    "message.sent",
    "message.delivered",
    "message.read",
    "message.failed",
    "conversation.created",
    "conversation.updated",
    "conversation.assigned",
    "conversation.resolved",
    "conversation.closed",
    "contact.created",
    "contact.updated",
    "campaign.started",
    "campaign.completed",
    "campaign.failed",
    "flow.started",
    "flow.completed",
    "flow.failed",
    "automation.triggered",
    "automation.completed",
    "template.approved",
    "template.rejected",
    "*"
  ]
}
```

## Webhook Payload Format

All webhook deliveries follow this format:

```json
{
  "event": "message.new",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    // Event-specific data
  }
}
```

### Headers

Each webhook request includes these headers:

- `Content-Type: application/json`
- `User-Agent: WhatsApp-CRM-Webhook/1.0`
- `X-Webhook-Event: <event-type>`
- `X-Webhook-Signature: sha256=<signature>` (if secret is configured)

## Signature Verification

If you provide a secret when creating a webhook, all deliveries will include an `X-Webhook-Signature` header. You should verify this signature to ensure the webhook is from our system.

### Verification Steps

1. Get the raw request body as a string
2. Create an HMAC SHA-256 hash using your secret
3. Compare with the signature in the header

### Example (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = 'sha256=' + 
    crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = 'your-webhook-secret';
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  console.log('Event:', req.body.event);
  console.log('Data:', req.body.data);
  
  res.status(200).send('OK');
});
```

### Example (Python)

```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload, signature, secret):
    expected_signature = 'sha256=' + hmac.new(
        secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

# In your webhook handler
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    secret = 'your-webhook-secret'
    
    if not verify_webhook_signature(request.json, signature, secret):
        return 'Invalid signature', 401
    
    # Process webhook
    print('Event:', request.json['event'])
    print('Data:', request.json['data'])
    
    return 'OK', 200
```

## Retry Logic

If your webhook endpoint returns a non-2xx status code or times out, the system will automatically retry the delivery:

- **Retry Attempts**: Configurable (default: 3)
- **Backoff Strategy**: Exponential (1s, 2s, 4s, 8s, etc.)
- **Timeout**: Configurable (default: 30 seconds)

## Best Practices

1. **Respond Quickly**: Return a 200 status code as soon as you receive the webhook. Process the data asynchronously.

2. **Verify Signatures**: Always verify the webhook signature to ensure authenticity.

3. **Handle Duplicates**: In rare cases, you might receive the same event multiple times. Use the event ID to deduplicate.

4. **Use HTTPS**: Always use HTTPS URLs for your webhook endpoints.

5. **Monitor Logs**: Regularly check webhook logs to identify and fix delivery issues.

6. **Test First**: Use the test endpoint to verify your webhook handler before going live.

7. **Handle Errors Gracefully**: If processing fails, log the error but still return 200 to prevent retries.

## Troubleshooting

### Webhook Not Receiving Events

1. Check if the webhook is active (`isActive: true`)
2. Verify the URL is accessible from the internet
3. Check webhook logs for delivery attempts
4. Ensure your server is responding with 2xx status codes

### Signature Verification Failing

1. Ensure you're using the correct secret
2. Verify you're hashing the raw request body
3. Check that you're comparing the full signature including the `sha256=` prefix

### High Failure Rate

1. Check webhook statistics to identify patterns
2. Review webhook logs for error messages
3. Ensure your endpoint responds within the timeout period
4. Verify your server can handle the request volume

## Rate Limits

- Maximum 10 webhooks per tenant
- Maximum 100 events per webhook subscription
- Webhook deliveries are rate-limited to prevent overwhelming your endpoint

## Support

For issues or questions about webhooks:
- Check the webhook logs for detailed error messages
- Review the statistics to identify patterns
- Use the test endpoint to debug your webhook handler
- Contact support with your webhook ID and relevant log entries
