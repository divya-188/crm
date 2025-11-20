-- Delete All Templates Script
-- WARNING: This will permanently delete ALL templates and related data
-- Use with caution!

-- Step 1: Show what will be deleted
SELECT 
  'Templates to delete:' as info,
  COUNT(*) as count
FROM templates;

SELECT 
  id,
  name,
  "displayName",
  "tenantId",
  status,
  "createdAt"
FROM templates
ORDER BY "createdAt" DESC;

-- Step 2: Delete related data first (to avoid foreign key constraints)

-- Delete template status history
DELETE FROM template_status_history
WHERE "templateId" IN (SELECT id FROM templates);

-- Delete template test sends
DELETE FROM template_test_sends
WHERE "templateId" IN (SELECT id FROM templates);

-- Delete template usage analytics
DELETE FROM template_usage_analytics
WHERE "templateId" IN (SELECT id FROM templates);

-- Delete template audit logs
DELETE FROM template_audit_logs
WHERE "templateId" IN (SELECT id FROM templates);

-- Step 3: Delete all templates
DELETE FROM templates;

-- Step 4: Verify deletion
SELECT 
  'Remaining templates:' as info,
  COUNT(*) as count
FROM templates;

-- Step 5: Reset sequence (optional - if you want IDs to start fresh)
-- Note: Only works if using serial/sequence for IDs
-- ALTER SEQUENCE templates_id_seq RESTART WITH 1;

SELECT 'All templates deleted successfully!' as result;
