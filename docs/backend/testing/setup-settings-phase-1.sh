#!/bin/bash

# Settings Implementation - Phase 1 Setup Script
# This script sets up the foundation for the settings system

set -e

echo "🚀 Setting up Settings System - Phase 1"
echo "========================================"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from backend directory"
    exit 1
fi

# Step 1: Check for ENCRYPTION_KEY
echo ""
echo "📝 Step 1: Checking ENCRYPTION_KEY..."
if grep -q "ENCRYPTION_KEY=" .env 2>/dev/null; then
    echo "✅ ENCRYPTION_KEY found in .env"
else
    echo "⚠️  ENCRYPTION_KEY not found in .env"
    echo "Generating a secure encryption key..."
    
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    echo "" >> .env
    echo "# Settings Encryption Key" >> .env
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env
    
    echo "✅ ENCRYPTION_KEY added to .env"
fi

# Step 2: Run migrations
echo ""
echo "📝 Step 2: Running database migrations..."
npm run migration:run

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

# Step 3: Verify tables
echo ""
echo "📝 Step 3: Verifying database tables..."

TABLES=(
    "platform_settings"
    "platform_branding"
    "settings_audit_log"
)

for table in "${TABLES[@]}"; do
    if psql $DATABASE_URL -c "SELECT 1 FROM $table LIMIT 1" > /dev/null 2>&1; then
        echo "✅ Table '$table' exists"
    else
        echo "❌ Table '$table' not found"
    fi
done

# Step 4: Verify tenant columns
echo ""
echo "📝 Step 4: Verifying tenant table updates..."

COLUMNS=(
    "white_label_enabled"
    "team_settings"
    "integration_settings"
)

for column in "${COLUMNS[@]}"; do
    if psql $DATABASE_URL -c "SELECT $column FROM tenants LIMIT 1" > /dev/null 2>&1; then
        echo "✅ Column 'tenants.$column' exists"
    else
        echo "❌ Column 'tenants.$column' not found"
    fi
done

# Step 5: Check Redis connection
echo ""
echo "📝 Step 5: Checking Redis connection..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis is not running (cache will be disabled)"
fi

# Summary
echo ""
echo "========================================"
echo "✅ Phase 1 Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Restart your NestJS application"
echo "2. Verify services are registered in app.module.ts"
echo "3. Run tests: npm run test"
echo "4. Proceed to Phase 2 implementation"
echo ""
echo "📚 Documentation: SETTINGS-PHASE-1-COMPLETE.md"
