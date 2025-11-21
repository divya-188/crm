/**
 * Backfill Window Tracking for Existing Conversations
 * 
 * This script updates existing conversations to set the window tracking fields
 * based on their last inbound message.
 */

const { DataSource } = require('typeorm');
require('dotenv').config();

async function backfillWindowTracking() {
  console.log('🔄 Starting window tracking backfill...\n');

  // Create database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'whatscrm',
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    // Get all conversations
    const conversations = await dataSource.query(`
      SELECT id FROM conversations
    `);

    console.log(`📊 Found ${conversations.length} conversations\n`);

    let updated = 0;
    let skipped = 0;

    for (const conversation of conversations) {
      // Get last inbound message for this conversation
      const lastInboundMessage = await dataSource.query(`
        SELECT "createdAt"
        FROM messages
        WHERE "conversationId" = $1
        AND direction = 'inbound'
        ORDER BY "createdAt" DESC
        LIMIT 1
      `, [conversation.id]);

      if (lastInboundMessage.length === 0) {
        // No inbound message - window should be closed
        await dataSource.query(`
          UPDATE conversations
          SET 
            "lastInboundMessageAt" = NULL,
            "windowExpiresAt" = NULL,
            "isWindowOpen" = false
          WHERE id = $1
        `, [conversation.id]);
        
        skipped++;
        continue;
      }

      // Parse the timestamp correctly (database stores in local time)
      const lastInboundAt = new Date(lastInboundMessage[0].createdAt);
      
      // Add 24 hours to get window expiry
      const windowExpiresAt = new Date(lastInboundAt.getTime() + 24 * 60 * 60 * 1000);
      
      // Check if window is still open
      const now = new Date();
      const isWindowOpen = now < windowExpiresAt;
      
      // Log for debugging
      const hoursRemaining = (windowExpiresAt - now) / (1000 * 60 * 60);

      // Update conversation
      await dataSource.query(`
        UPDATE conversations
        SET 
          "lastInboundMessageAt" = $1,
          "windowExpiresAt" = $2,
          "isWindowOpen" = $3
        WHERE id = $4
      `, [lastInboundAt, windowExpiresAt, isWindowOpen, conversation.id]);

      updated++;

      console.log(`✅ Updated conversation ${conversation.id}`);
      console.log(`   Last inbound: ${lastInboundAt.toLocaleString()}`);
      console.log(`   Window expires: ${windowExpiresAt.toLocaleString()}`);
      console.log(`   Window open: ${isWindowOpen ? 'YES' : 'NO'}`);
      console.log(`   Hours remaining: ${hoursRemaining.toFixed(1)}\n`);
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (no inbound): ${skipped}`);
    console.log(`   📝 Total: ${conversations.length}\n`);

    await dataSource.destroy();
    console.log('✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

backfillWindowTracking();
