const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test data
const testData = {
  messageStatus: {
    entry: [{
      changes: [{
        field: 'message_status',
        value: {
          statuses: [{
            id: 'wamid.test123',
            status: 'delivered',
            timestamp: Math.floor(Date.now() / 1000).toString(),
            recipient_id: '919876543210',
          }],
        },
      }],
    }],
  },
  
  incomingMessage: {
    entry: [{
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '15550000000',
            phone_number_id: '880104691848272',
          },
          contacts: [{
            profile: {
              name: 'Test User',
            },
            wa_id: '919876543210',
          }],
          messages: [{
            from: '919876543210',
            id: 'wamid.incoming123',
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: 'text',
            text: {
              body: 'Hello, this is a test message!',
            },
          }],
        },
      }],
    }],
  },
  
  templateStatus: {
    entry: [{
      changes: [{
        field: 'message_template_status_update',
        value: {
          message_template_id: '1868398480429158',
          message_template_name: 'sample_appointment',
          event: 'APPROVED',
        },
      }],
    }],
  },
};

async function testWebhook(type) {
  console.log(`\n🧪 Testing ${type} webhook...\n`);
  
  try {
    const response = await axios.post(
      `${BASE_URL}/webhooks/meta`,
      testData[type],
      {
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=test_signature',
        },
      }
    );
    
    console.log('✅ Webhook test successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Webhook test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Webhook Tests\n');
  console.log('=' .repeat(50));
  
  // Test 1: Message Status
  await testWebhook('messageStatus');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Incoming Message
  await testWebhook('incomingMessage');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Template Status
  await testWebhook('templateStatus');
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All webhook tests completed!\n');
}

runTests();
