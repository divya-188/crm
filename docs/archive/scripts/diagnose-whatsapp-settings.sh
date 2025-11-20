#!/bin/bash

echo "=== WhatsApp Settings Diagnostic ==="
echo ""

echo "1. Checking Frontend Files..."
echo "--------------------------------------"
[ -f "frontend/src/components/settings/WhatsAppSettings.tsx" ] && echo "✅ WhatsAppSettings.tsx exists" || echo "❌ WhatsAppSettings.tsx missing"
[ -f "frontend/src/services/whatsapp-settings.service.ts" ] && echo "✅ whatsapp-settings.service.ts exists" || echo "❌ whatsapp-settings.service.ts missing"
[ -f "frontend/src/components/ui/Modal.tsx" ] && echo "✅ Modal.tsx exists" || echo "❌ Modal.tsx missing"
[ -f "frontend/src/components/ui/Badge.tsx" ] && echo "✅ Badge.tsx exists" || echo "❌ Badge.tsx missing"
[ -f "frontend/src/components/ui/Alert.tsx" ] && echo "✅ Alert.tsx exists" || echo "❌ Alert.tsx missing"

echo ""
echo "2. Checking Backend Files..."
echo "--------------------------------------"
[ -f "backend/src/modules/tenants/services/whatsapp-config.service.ts" ] && echo "✅ whatsapp-config.service.ts exists" || echo "❌ whatsapp-config.service.ts missing"
[ -f "backend/src/modules/tenants/controllers/whatsapp-config.controller.ts" ] && echo "✅ whatsapp-config.controller.ts exists" || echo "❌ whatsapp-config.controller.ts missing"
[ -f "backend/src/modules/tenants/entities/whatsapp-config.entity.ts" ] && echo "✅ whatsapp-config.entity.ts exists" || echo "❌ whatsapp-config.entity.ts missing"
[ -f "backend/src/modules/tenants/dto/whatsapp-config.dto.ts" ] && echo "✅ whatsapp-config.dto.ts exists" || echo "❌ whatsapp-config.dto.ts missing"

echo ""
echo "3. Checking Settings.tsx Integration..."
echo "--------------------------------------"
if grep -q "WhatsAppSettings" "frontend/src/pages/Settings.tsx"; then
    echo "✅ WhatsAppSettings imported in Settings.tsx"
else
    echo "❌ WhatsAppSettings NOT imported in Settings.tsx"
fi

if grep -q "whatsapp" "frontend/src/pages/Settings.tsx"; then
    echo "✅ WhatsApp tab exists in Settings.tsx"
else
    echo "❌ WhatsApp tab NOT found in Settings.tsx"
fi

echo ""
echo "4. Checking Database Migration..."
echo "--------------------------------------"
[ -f "backend/create-whatsapp-configs-table.sql" ] && echo "✅ SQL migration file exists" || echo "❌ SQL migration file missing"
[ -f "backend/src/database/migrations/1700000000017-CreateWhatsAppConfigsTable.ts" ] && echo "✅ TypeORM migration exists" || echo "❌ TypeORM migration missing"

echo ""
echo "5. Checking Module Registration..."
echo "--------------------------------------"
if grep -q "WhatsAppConfigService" "backend/src/modules/tenants/tenants.module.ts"; then
    echo "✅ WhatsAppConfigService registered in TenantsModule"
else
    echo "❌ WhatsAppConfigService NOT registered"
fi

if grep -q "WhatsAppConfigController" "backend/src/modules/tenants/tenants.module.ts"; then
    echo "✅ WhatsAppConfigController registered in TenantsModule"
else
    echo "❌ WhatsAppConfigController NOT registered"
fi

echo ""
echo "=== Next Steps ==="
echo ""
echo "If you see any ❌ above, those files need to be created or fixed."
echo ""
echo "To run the database migration:"
echo "  psql -U your_username -d your_database -f backend/create-whatsapp-configs-table.sql"
echo ""
echo "To test the backend API:"
echo "  ./backend/test-whatsapp-settings.sh <your_admin_token>"
echo ""
echo "To check backend logs:"
echo "  Check your backend terminal for any error messages"
echo ""
