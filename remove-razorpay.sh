#!/bin/bash

echo "🗑️  Removing Razorpay Integration"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Step 1: Removing Razorpay npm package from backend"
cd backend
npm uninstall razorpay
echo -e "${GREEN}✅ Razorpay package removed${NC}"
echo ""

cd ..

echo "📋 Step 2: Removing Razorpay service file"
rm -f backend/src/modules/subscriptions/services/razorpay-payment.service.ts
echo -e "${GREEN}✅ Razorpay service removed${NC}"
echo ""

echo "📋 Step 3: Removing Razorpay test files"
rm -f backend/test/subscription-lifecycle/razorpay-integration.e2e-spec.ts
rm -f backend/test-razorpay-*.sh
rm -f backend/test-razorpay-import.ts
rm -f test-razorpay-*.sh
echo -e "${GREEN}✅ Razorpay test files removed${NC}"
echo ""

echo "📋 Step 4: Removing Razorpay documentation files"
rm -f RAZORPAY-*.md
rm -f .kiro/specs/razorpay-subscription-implementation/*.md
rmdir .kiro/specs/razorpay-subscription-implementation 2>/dev/null
echo -e "${GREEN}✅ Razorpay documentation removed${NC}"
echo ""

echo "📋 Step 5: Removing Razorpay example repo"
rm -rf razorpay-next
echo -e "${GREEN}✅ Razorpay example repo removed${NC}"
echo ""

echo "📋 Step 6: Cleaning backend dist folder"
rm -rf backend/dist/test-razorpay-*
rm -rf backend/dist/src/modules/subscriptions/services/razorpay-payment.*
rm -rf backend/dist/test/subscription-lifecycle/razorpay-*
echo -e "${GREEN}✅ Backend dist cleaned${NC}"
echo ""

echo "📋 Step 7: Removing Razorpay environment variables"
echo -e "${YELLOW}⚠️  Manual step required:${NC}"
echo "   Edit backend/.env and remove:"
echo "   - RAZORPAY_KEY_ID"
echo "   - RAZORPAY_KEY_SECRET"
echo "   - RAZORPAY_WEBHOOK_SECRET"
echo ""

echo "📋 Step 8: Update unified payment service"
echo -e "${YELLOW}⚠️  Manual step required:${NC}"
echo "   Edit: backend/src/modules/subscriptions/services/unified-payment.service.ts"
echo "   Remove Razorpay imports and references"
echo ""

echo "📋 Step 9: Update subscriptions module"
echo -e "${YELLOW}⚠️  Manual step required:${NC}"
echo "   Edit: backend/src/modules/subscriptions/subscriptions.module.ts"
echo "   Remove RazorpayPaymentService from providers"
echo ""

echo "📋 Step 10: Update subscription entity"
echo -e "${YELLOW}⚠️  Manual step required:${NC}"
echo "   Edit: backend/src/modules/subscriptions/entities/subscription.entity.ts"
echo "   Remove razorpaySubscriptionId field"
echo ""

echo ""
echo -e "${GREEN}✅ Razorpay removal complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Remove Razorpay env variables from backend/.env"
echo "2. Update unified-payment.service.ts"
echo "3. Update subscriptions.module.ts"
echo "4. Update subscription.entity.ts"
echo "5. Restart backend server"
echo "6. Test with Stripe/PayPal only"
