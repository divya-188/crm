# API Keys and Public API Documentation

## Overview

The WhatsApp CRM platform provides a comprehensive Public REST API that allows external systems to integrate with the platform using API keys for authentication. This document describes the API key management system, public API endpoints, rate limiting, and usage tracking.

## Features Implemented

### 1. API Key Generation
- Secure random API key generation (48-character alphanumeric)
- Bcrypt hashing for secure storage
- Key prefix for efficient lookup
- Customizable permissions per key
- Optional expiration dates

### 2. API Key Authentication
- Support for two authentication methods:
  - `Authorization: Bearer <api-key>` header
  - `X-API-Key: <api-key>` header
- Automatic tenant identification from API key
- Permission-based access control
- Expiration checking

### 3. Rate Limiting
- Per-API-key rate limiting
- Configurable limits (requests per window)
- Redis-based counter implementation
- Rate limit headers in responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets
- HTTP 429 (Too Many Requests) response when exceeded

### 4. Public API Endpoints
Comprehensive REST API covering:
- **Contacts**: List, create, get details
- **Messages**: Send messages, check delivery status
- **Conversations**: List, get details, get messages
- **Templates**: List, get details, send template messages
- **Campaigns**: List, get details, get statistics
- **Webhooks**: Trigger custom webhook events

### 5. OpenAPI Documentation
- Full Swagger/OpenAPI 3.0 documentation
- Interactive API explorer at `/api/docs`
- Request/response schemas
- Authentication examples
- Multiple server configurations

### 6. API Usage Tracking
- Total request count per API key
- Last used timestamp
- Last request timestamp
- Usage statistics endpoint

## API Endpoints

### API Key Management (Authenticated with JWT)

#### Create API Key
```http
POST /api/v1/api-keys
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "My API Key",
  "permissions": {
    "contacts": ["read", "create"],
    "messages": ["send", "read"],
    "conversations": ["read"]
  },
  "rateLimit": 100,
  "rateLimitWindow": 60,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "message": "API key created successfully. Save this key securely as it will not be shown again.",
  "apiKey": {
    "id": "uuid",
    "name": "My API Key",
    "key": "abc123...xyz789",
    "keyPrefix": "abc123",
    "permissions": {...},
    "rateLimit": 100,
    "rateLimitWindow": 60,
    "expiresAt": "2025-12-31T23:59:59Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### List API Keys
```http
GET /api/v1/api-keys
Authorization: Bearer <jwt-token>
```

#### Get API Key Details
```http
GET /api/v1/api-keys/:id
Authorization: Bearer <jwt-token>
```

#### Update API Key
```http
PATCH /api/v1/api-keys/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "rateLimit": 200,
  "isActive": true
}
```

#### Delete API Key
```http
DELETE /api/v1/api-keys/:id
Authorization: Bearer <jwt-token>
```

#### Get API Key Usage Statistics
```http
GET /api/v1/api-keys/:id/usage
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "data": {
    "totalRequests": 1523,
    "lastUsedAt": "2024-01-15T10:30:00Z",
    "lastRequestAt": "2024-01-15T10:30:00Z",
    "rateLimit": 100,
    "rateLimitWindow": 60,
    "isActive": true,
    "expiresAt": null
  }
}
```

### Public API Endpoints (Authenticated with API Key)

All public API endpoints require authentication using an API key:
```http
X-API-Key: <your-api-key>
```
or
```http
Authorization: Bearer <your-api-key>
```

#### Contacts

**List Contacts**
```http
GET /api/v1/public/v1/contacts?page=1&limit=20&search=john
X-API-Key: <api-key>
```

**Get Contact**
```http
GET /api/v1/public/v1/contacts/:id
X-API-Key: <api-key>
```

**Create Contact**
```http
POST /api/v1/public/v1/contacts
X-API-Key: <api-key>
Content-Type: application/json

{
  "phone": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "tags": ["customer", "vip"]
}
```

#### Messages

**Send Message**
```http
POST /api/v1/public/v1/messages/send
X-API-Key: <api-key>
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "message": "Hello from API!",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "uuid",
    "conversationId": "uuid",
    "contactId": "uuid",
    "status": "sent"
  }
}
```

**Get Message Status**
```http
GET /api/v1/public/v1/messages/:id/status
X-API-Key: <api-key>
```

#### Conversations

**List Conversations**
```http
GET /api/v1/public/v1/conversations?page=1&limit=20&status=open
X-API-Key: <api-key>
```

**Get Conversation**
```http
GET /api/v1/public/v1/conversations/:id
X-API-Key: <api-key>
```

**Get Conversation Messages**
```http
GET /api/v1/public/v1/conversations/:id/messages?page=1&limit=50
X-API-Key: <api-key>
```

#### Templates

**List Templates**
```http
GET /api/v1/public/v1/templates?page=1&limit=20&status=approved
X-API-Key: <api-key>
```

**Get Template**
```http
GET /api/v1/public/v1/templates/:id
X-API-Key: <api-key>
```

**Send Template Message**
```http
POST /api/v1/public/v1/templates/:id/send
X-API-Key: <api-key>
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "variables": {
    "name": "John",
    "code": "ABC123"
  }
}
```

#### Campaigns

**List Campaigns**
```http
GET /api/v1/public/v1/campaigns?page=1&limit=20&status=completed
X-API-Key: <api-key>
```

**Get Campaign**
```http
GET /api/v1/public/v1/campaigns/:id
X-API-Key: <api-key>
```

**Get Campaign Statistics**
```http
GET /api/v1/public/v1/campaigns/:id/stats
X-API-Key: <api-key>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRecipients": 1000,
    "sentCount": 950,
    "deliveredCount": 920,
    "readCount": 850,
    "failedCount": 50,
    "deliveryRate": "96.84",
    "readRate": "92.39"
  }
}
```

## Permission System

API keys support granular permissions for different resources:

```json
{
  "permissions": {
    "contacts": ["read", "create", "update", "delete"],
    "messages": ["send", "read"],
    "conversations": ["read", "update"],
    "templates": ["read", "send"],
    "campaigns": ["read"],
    "webhooks": ["trigger"]
  }
}
```

**Permission Actions:**
- `read`: View resources
- `create`: Create new resources
- `update`: Modify existing resources
- `delete`: Remove resources
- `send`: Send messages/templates
- `trigger`: Trigger webhooks
- `*`: All actions (wildcard)

**Empty Permissions:**
If no permissions are specified, the API key has access to all resources and actions.

## Rate Limiting

### Configuration
Each API key has configurable rate limits:
- `rateLimit`: Maximum number of requests allowed
- `rateLimitWindow`: Time window in seconds

**Example:** `rateLimit: 100, rateLimitWindow: 60` = 100 requests per minute

### Rate Limit Response
When rate limit is exceeded:
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "limit": 100,
  "window": 60,
  "retryAfter": 45
}
```

### Rate Limit Headers
Every response includes rate limit information:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705320000
```

## Security Best Practices

### API Key Storage
- **Never commit API keys to version control**
- Store keys in environment variables or secure vaults
- Use different keys for development and production
- Rotate keys regularly

### API Key Management
- Create separate keys for different integrations
- Use descriptive names for easy identification
- Set appropriate permissions (principle of least privilege)
- Set expiration dates for temporary access
- Monitor usage regularly
- Revoke unused or compromised keys immediately

### Request Security
- Always use HTTPS in production
- Validate and sanitize all input data
- Implement request signing for sensitive operations
- Log all API requests for audit trails

## Error Responses

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Error Codes
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid API key
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Testing

### Test Script
A comprehensive test script is provided at `backend/test-api-keys.sh`:

```bash
chmod +x backend/test-api-keys.sh
./backend/test-api-keys.sh
```

The script tests:
1. User login
2. API key creation
3. API key listing
4. API key details retrieval
5. Public API requests with API key
6. Rate limiting
7. Usage statistics
8. API key updates
9. Message sending via Public API
10. API key deletion

### Manual Testing with cURL

**Create API Key:**
```bash
curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key",
    "rateLimit": 100
  }'
```

**Use API Key:**
```bash
curl -X GET http://localhost:3000/api/v1/public/v1/contacts \
  -H "X-API-Key: <api-key>"
```

## Database Schema

### api_keys Table
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255),
  key_hash VARCHAR(255),
  key_prefix VARCHAR(10),
  permissions JSONB,
  rate_limit INTEGER DEFAULT 100,
  rate_limit_window INTEGER DEFAULT 60,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_by_user_id UUID REFERENCES users(id),
  total_requests INTEGER DEFAULT 0,
  last_request_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Integration Examples

### Node.js
```javascript
const axios = require('axios');

const apiKey = 'your-api-key';
const baseURL = 'http://localhost:3000/api/v1/public/v1';

const client = axios.create({
  baseURL,
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  }
});

// Send a message
async function sendMessage(phoneNumber, message) {
  try {
    const response = await client.post('/messages/send', {
      phoneNumber,
      message,
      type: 'text'
    });
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

sendMessage('+1234567890', 'Hello from Node.js!');
```

### Python
```python
import requests

API_KEY = 'your-api-key'
BASE_URL = 'http://localhost:3000/api/v1/public/v1'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Send a message
def send_message(phone_number, message):
    response = requests.post(
        f'{BASE_URL}/messages/send',
        headers=headers,
        json={
            'phoneNumber': phone_number,
            'message': message,
            'type': 'text'
        }
    )
    return response.json()

result = send_message('+1234567890', 'Hello from Python!')
print(result)
```

### PHP
```php
<?php
$apiKey = 'your-api-key';
$baseURL = 'http://localhost:3000/api/v1/public/v1';

function sendMessage($phoneNumber, $message) {
    global $apiKey, $baseURL;
    
    $ch = curl_init("$baseURL/messages/send");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "X-API-Key: $apiKey",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'phoneNumber' => $phoneNumber,
        'message' => $message,
        'type' => 'text'
    ]));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

$result = sendMessage('+1234567890', 'Hello from PHP!');
print_r($result);
?>
```

## Monitoring and Analytics

### Usage Tracking
Monitor API key usage through:
- Total request count
- Last used timestamp
- Request patterns
- Error rates

### Audit Logging
All API requests are logged with:
- Timestamp
- API key used
- Endpoint accessed
- Response status
- Request/response data

## Future Enhancements

Potential improvements for the API system:
1. Webhook delivery for real-time events
2. GraphQL API support
3. Batch operations
4. Advanced filtering and search
5. API versioning
6. Request signing for enhanced security
7. IP whitelisting per API key
8. Custom rate limit rules per endpoint
9. API usage analytics dashboard
10. Automated API key rotation

## Support

For issues or questions:
- Check the OpenAPI documentation at `/api/docs`
- Review error messages and status codes
- Check API key permissions and rate limits
- Verify API key is active and not expired
- Contact support with API key ID (never share the actual key)
