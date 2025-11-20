-- Fix WhatsApp Connection
-- This script ensures your WhatsApp settings are in the whatsapp_connections table

-- Step 1: Check if connection exists
SELECT 
  'Current connections:' as info,
  id,
  "tenantId",
  name,
  type,
  status,
  "isActive"
FROM whatsapp_connections
WHERE "tenantId" = '656b754d-0385-4401-a00b-ae8f4d3fe5e0';

-- Step 2: If no connection exists, insert one
-- If connection exists but has wrong type, update it
INSERT INTO whatsapp_connections (
  id,
  "tenantId",
  name,
  type,
  status,
  "phoneNumberId",
  "businessAccountId",
  "accessToken",
  "webhookSecret",
  "webhookUrl",
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  '284490ee-4561-4365-a15f-2c83d281f2ae',
  '656b754d-0385-4401-a00b-ae8f4d3fe5e0',
  'Rudra Digital labs',
  'meta_api',
  'connected',
  '880104691848272',
  '847148631049947',
  'EAALs5nPZA8CQBP5arnoLZCqpT9eKu5KKFjoAPTZACE3OZCwKKIWzUCtUuKL9GePhYCCmS0Y3f0WiP3QB1skDgBw4QIblIfFWvKi0sdZARak2uXq5wlx6nsGHrvEQA5o5X6nBa4JtBTHOvnsOyM4G4q6E3qM585aUbFVeriYgskISM52cZCaSklJgWdbrVHK23GEypP1EPEaVqOpJMQ5kgRI7bsIIeh3fOsVBadpzjWkvQwmR0A7lnzxw0kLflggYj5jAdqbXtBl6BACBp4kDgIbbzVGwZDZD',
  'divya_whatsapp_verify_2025',
  'https://b6738d6c5d64.ngrok-free.app/api/v1/webhooks/whatsapp',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
  type = 'meta_api',
  status = 'connected',
  "isActive" = true,
  "phoneNumberId" = '880104691848272',
  "businessAccountId" = '847148631049947',
  "accessToken" = 'EAALs5nPZA8CQBP5arnoLZCqpT9eKu5KKFjoAPTZACE3OZCwKKIWzUCtUuKL9GePhYCCmS0Y3f0WiP3QB1skDgBw4QIblIfFWvKi0sdZARak2uXq5wlx6nsGHrvEQA5o5X6nBa4JtBTHOvnsOyM4G4q6E3qM585aUbFVeriYgskISM52cZCaSklJgWdbrVHK23GEypP1EPEaVqOpJMQ5kgRI7bsIIeh3fOsVBadpzjWkvQwmR0A7lnzxw0kLflggYj5jAdqbXtBl6BACBp4kDgIbbzVGwZDZD',
  "updatedAt" = NOW();

-- Step 3: Verify the fix
SELECT 
  '✅ Connection after fix:' as info,
  id,
  "tenantId",
  name,
  type,
  status,
  "isActive",
  "phoneNumberId",
  "businessAccountId",
  CASE WHEN "accessToken" IS NOT NULL THEN '✅ Has Token' ELSE '❌ Missing' END as token_status
FROM whatsapp_connections
WHERE "tenantId" = '656b754d-0385-4401-a00b-ae8f4d3fe5e0';
