#!/usr/bin/env node

/**
 * Script to sync existing incoming_messages to conversations
 * Run with: node scripts/sync-existing-messages.js
 */

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'whatscrm',
  user: 'postgres',
  password: 'postgres',
});

async function syncMessages() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get all incoming messages
    const messagesResult = await client.query(`
      SELECT * FROM incoming_messages 
      ORDER BY timestamp ASC
    `);

    console.log(`📨 Found ${messagesResult.rows.length} incoming messages to sync`);

    for (const msg of messagesResult.rows) {
      console.log(`\n🔄 Processing message from ${msg.from}...`);

      // Find or create contact
      let contact = await client.query(
        `SELECT * FROM contacts WHERE "tenantId" = $1 AND phone = $2`,
        [msg.tenantId, msg.from]
      );

      if (contact.rows.length === 0) {
        console.log(`  📇 Creating contact: ${msg.from}`);
        const contactResult = await client.query(
          `INSERT INTO contacts ("tenantId", phone, "firstName", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING *`,
          [msg.tenantId, msg.from, msg.fromName || msg.from]
        );
        contact = contactResult;
      } else {
        console.log(`  ✓ Contact exists: ${msg.from}`);
      }

      const contactId = contact.rows[0].id;

      // Find or create conversation
      let conversation = await client.query(
        `SELECT * FROM conversations WHERE "tenantId" = $1 AND "contactId" = $2`,
        [msg.tenantId, contactId]
      );

      if (conversation.rows.length === 0) {
        console.log(`  💬 Creating conversation for contact: ${contactId}`);
        const convResult = await client.query(
          `INSERT INTO conversations ("tenantId", "contactId", status, "unreadCount", "lastMessageAt", "createdAt", "updatedAt")
           VALUES ($1, $2, 'open', 0, $3, NOW(), NOW())
           RETURNING *`,
          [msg.tenantId, contactId, msg.timestamp]
        );
        conversation = convResult;
      } else {
        console.log(`  ✓ Conversation exists: ${conversation.rows[0].id}`);
      }

      const conversationId = conversation.rows[0].id;

      // Check if message already exists in conversation
      const existingMessage = await client.query(
        `SELECT * FROM messages WHERE "externalId" = $1`,
        [msg.metaMessageId]
      );

      if (existingMessage.rows.length === 0) {
        console.log(`  📝 Creating message in conversation`);
        await client.query(
          `INSERT INTO messages ("conversationId", type, direction, content, "externalId", status, metadata, "createdAt", "updatedAt")
           VALUES ($1, $2, 'inbound', $3, $4, 'delivered', $5, $6, $6)`,
          [
            conversationId,
            msg.type || 'text',
            msg.text || '',
            msg.metaMessageId,
            JSON.stringify({ media: msg.media, context: msg.context }),
            msg.timestamp
          ]
        );

        // Update conversation
        await client.query(
          `UPDATE conversations 
           SET "lastMessageAt" = $1, "unreadCount" = "unreadCount" + 1, "updatedAt" = NOW()
           WHERE id = $2`,
          [msg.timestamp, conversationId]
        );

        console.log(`  ✅ Message synced to conversation`);
      } else {
        console.log(`  ⏭️  Message already exists in conversation`);
      }
    }

    console.log(`\n✅ Sync complete!`);

    // Show summary
    const conversationCount = await client.query(`SELECT COUNT(*) FROM conversations`);
    const messageCount = await client.query(`SELECT COUNT(*) FROM messages`);
    const contactCount = await client.query(`SELECT COUNT(*) FROM contacts`);

    console.log(`\n📊 Summary:`);
    console.log(`   Conversations: ${conversationCount.rows[0].count}`);
    console.log(`   Messages: ${messageCount.rows[0].count}`);
    console.log(`   Contacts: ${contactCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

syncMessages()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
