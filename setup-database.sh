#!/bin/bash

echo "🚀 Setting up WhatsApp CRM Database..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Create database
echo -e "${YELLOW}Step 1: Creating database...${NC}"
createdb whatscrm 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database 'whatscrm' created successfully${NC}"
else
    echo -e "${YELLOW}⚠ Database 'whatscrm' may already exist${NC}"
fi

# Step 2: Run migrations
echo -e "${YELLOW}Step 2: Running migrations...${NC}"
cd backend
npm run migration:run
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations completed successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi

# Step 3: Seed super admin
echo -e "${YELLOW}Step 3: Seeding super admin...${NC}"
npm run seed:super-admin
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Super admin seeded successfully${NC}"
else
    echo -e "${YELLOW}⚠ Super admin seed may have failed or already exists${NC}"
fi

echo -e "${GREEN}✅ Database setup complete!${NC}"
echo -e "${YELLOW}You can now start the servers:${NC}"
echo -e "  Backend:  cd backend && npm run start:dev"
echo -e "  Frontend: cd frontend && npm run dev"
