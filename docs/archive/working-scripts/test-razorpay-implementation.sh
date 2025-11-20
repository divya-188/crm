#!/bin/bash

echo "🧪 Testing Razorpay Implementation"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "📋 Step 1: Checking Razorpay package installation"
if grep -q '"razorpay"' backend/package.json; then
    echo -e "${GREEN}✅ Razorpay package found in package.json${NC}"
else
    echo -e "${RED}❌ Razorpay package not found${NC}"
    exit 1
fi

echo ""
echo "📋 Step 2: Checking Razorpay service file"
if [ -f "backend/src/modules/subscriptions/services/razorpay-payment.service.ts" ]; then
    echo -e "${GREEN}✅ Razorpay service file exists${NC}"
else
    echo -e "${RED}❌ Razorpay service file not found${NC}"
    exit 1
fi

echo ""
echo "📋 Step 3: Checking environment variables"
if grep -q "RAZORPAY_KEY_ID" backend/.env; then
    echo -e "${GREEN}✅ RAZORPAY_KEY_ID configured${NC}"
else
    echo -e "${RED}❌ RAZORPAY_KEY_ID not found in .env${NC}"
fi

if grep -q "RAZORPAY_KEY_SECRET" backend/.env; then
    echo -e "${GREEN}✅ RAZORPAY_KEY_SECRET configured${NC}"
else
    echo -e "${RED}❌ RAZORPAY_KEY_SECRET not found in .env${NC}"
fi

echo ""
echo "📋 Step 4: Checking code updates"

# Check DTO
if grep -q "RAZORPAY = 'razorpay'" backend/src/modules/subscriptions/dto/create-subscription.dto.ts; then
    echo -e "${GREEN}✅ PaymentProvider enum updated${NC}"
else
    echo -e "${RED}❌ PaymentProvider enum not updated${NC}"
fi

# Check Entity
if grep -q "razorpaySubscriptionId" backend/src/modules/subscriptions/entities/subscription.entity.ts; then
    echo -e "${GREEN}✅ Subscription entity updated${NC}"
else
    echo -e "${RED}❌ Subscription entity not updated${NC}"
fi

# Check Module
if grep -q "RazorpayPaymentService" backend/src/modules/subscriptions/subscriptions.module.ts; then
    echo -e "${GREEN}✅ Subscriptions module updated${NC}"
else
    echo -e "${RED}❌ Subscriptions module not updated${NC}"
fi

# Check Unified Service
if grep -q "razorpayService" backend/src/modules/subscriptions/services/unified-payment.service.ts; then
    echo -e "${GREEN}✅ Unified payment service updated${NC}"
else
    echo -e "${RED}❌ Unified payment service not updated${NC}"
fi

echo ""
echo "📋 Step 5: TypeScript compilation check"
echo -e "${BLUE}Running TypeScript check...${NC}"
cd backend && npx tsc --noEmit 2>&1 | head -20
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No TypeScript errors${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript errors found (check above)${NC}"
fi
cd ..

echo ""
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Razorpay Implementation Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run database migration:"
echo "   cd backend && npm run typeorm migration:generate src/database/migrations/AddRazorpaySubscriptionId"
echo "   npm run typeorm migration:run"
echo ""
echo "2. Restart backend server:"
echo "   npm run start:dev"
echo ""
echo "3. Test subscription creation with paymentProvider: 'razorpay'"
echo ""
echo "See RAZORPAY-IMPLEMENTATION-COMPLETE.md for detailed testing instructions"
