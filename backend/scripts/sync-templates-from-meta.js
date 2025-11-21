const axios = require('axios');
const { Client } = require('pg');

const TENANT_ID = '656b754d-0385-4401-a00b-ae8f4d3fe5e0';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'whatscrm',
  user: 'postgres',
  password: 'postgres',
});

async function getWhatsAppConfig() {
  const result = await client.query(
    'SELECT access_token, business_account_id FROM whatsapp_configs WHERE tenant_id = $1 AND is_active = true LIMIT 1',
    [TENANT_ID]
  );
  
  if (result.rows.length === 0) {
    throw new Error('No active WhatsApp config found for tenant');
  }
  
  return {
    accessToken: result.rows[0].access_token,
    businessAccountId: result.rows[0].business_account_id,
  };
}

async function fetchTemplatesFromMeta(accessToken, businessAccountId) {
  console.log('📥 Fetching templates from Meta API...\n');
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${businessAccountId}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          fields: 'id,name,status,category,language,components',
          limit: 100,
        },
      }
    );
    
    console.log(`✅ Fetched ${response.data.data.length} templates from Meta\n`);
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to fetch templates from Meta');
    console.error(error.response?.data || error.message);
    throw error;
  }
}

function parseMetaComponents(metaComponents) {
  const components = {};
  
  if (!metaComponents) return components;
  
  for (const component of metaComponents) {
    if (component.type === 'HEADER') {
      components.header = {
        type: component.format || 'TEXT',
        text: component.text || '',
      };
    } else if (component.type === 'BODY') {
      const placeholders = [];
      const text = component.text || '';
      
      const matches = text.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        matches.forEach((match, index) => {
          const placeholderIndex = parseInt(match.replace(/\{\{|\}\}/g, ''));
          placeholders.push({
            index: placeholderIndex,
            example: component.example?.body_text?.[0]?.[index] || `Value ${placeholderIndex}`,
          });
        });
      }
      
      components.body = {
        text,
        placeholders,
      };
    } else if (component.type === 'FOOTER') {
      components.footer = {
        text: component.text || '',
      };
    } else if (component.type === 'BUTTONS') {
      components.buttons = component.buttons?.map((btn) => ({
        type: btn.type,
        text: btn.text,
        url: btn.url,
        phoneNumber: btn.phone_number,
      }));
    }
  }
  
  return components;
}

function extractSampleValues(metaComponents) {
  const sampleValues = {};
  
  if (!metaComponents) return sampleValues;
  
  const bodyComponent = metaComponents.find((c) => c.type === 'BODY');
  if (bodyComponent?.example?.body_text) {
    bodyComponent.example.body_text[0]?.forEach((value, index) => {
      sampleValues[(index + 1).toString()] = value;
    });
  }
  
  return sampleValues;
}

function mapCategory(metaCategory) {
  const categoryMap = {
    UTILITY: 'utility',
    MARKETING: 'marketing',
    AUTHENTICATION: 'authentication',
    TRANSACTIONAL: 'utility',
    ACCOUNT_UPDATE: 'utility',
    OTP: 'authentication',
  };
  return categoryMap[metaCategory] || 'utility';
}

function mapStatus(metaStatus) {
  const statusMap = {
    APPROVED: 'approved',
    PENDING: 'pending',
    REJECTED: 'rejected',
    DELETED: 'draft',
  };
  return statusMap[metaStatus] || 'draft';
}

async function syncTemplates() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    const config = await getWhatsAppConfig();
    console.log(`✅ Found WhatsApp config for tenant\n`);
    
    const metaTemplates = await fetchTemplatesFromMeta(config.accessToken, config.businessAccountId);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const metaTemplate of metaTemplates) {
      console.log(`\n📋 Processing: ${metaTemplate.name}`);
      console.log(`   Status: ${metaTemplate.status}`);
      console.log(`   Meta ID: ${metaTemplate.id}`);
      
      // Check if template exists
      const existingResult = await client.query(
        'SELECT id, status FROM templates WHERE "metaTemplateId" = $1 AND "tenantId" = $2',
        [metaTemplate.id, TENANT_ID]
      );
      
      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];
        const newStatus = mapStatus(metaTemplate.status);
        
        if (existing.status !== newStatus) {
          await client.query(
            'UPDATE templates SET status = $1, "updatedAt" = NOW() WHERE id = $2',
            [newStatus, existing.id]
          );
          console.log(`   ✅ Updated status: ${existing.status} → ${newStatus}`);
          updated++;
        } else {
          console.log(`   ⏭️  Skipped (no changes)`);
          skipped++;
        }
      } else {
        // Create new template
        const components = parseMetaComponents(metaTemplate.components);
        const sampleValues = extractSampleValues(metaTemplate.components);
        const category = mapCategory(metaTemplate.category);
        const status = mapStatus(metaTemplate.status);
        
        await client.query(
          `INSERT INTO templates (
            "tenantId", name, "displayName", category, language, description,
            components, "sampleValues", "metaTemplateId", "metaTemplateName",
            status, "isActive", "approvedAt", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
          [
            TENANT_ID,
            metaTemplate.name,
            metaTemplate.name,
            category,
            metaTemplate.language,
            `Synced from Meta: ${metaTemplate.name}`,
            JSON.stringify(components),
            JSON.stringify(sampleValues),
            metaTemplate.id,
            metaTemplate.name,
            status,
            true,
            metaTemplate.status === 'APPROVED' ? new Date() : null,
          ]
        );
        console.log(`   ✅ Created new template`);
        created++;
      }
    }
    
    console.log(`\n\n📊 Sync Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${metaTemplates.length}`);
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

syncTemplates();
