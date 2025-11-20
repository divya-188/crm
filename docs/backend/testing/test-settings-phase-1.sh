#!/bin/bash

# Settings Phase 1 - Integration Test Script
# Tests all foundation components

set -e

echo "🧪 Testing Settings Phase 1 - Foundation"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${YELLOW}Testing: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Change to backend directory
cd "$(dirname "$0")"

echo -e "\n📝 Step 1: Running Unit Tests"
echo "================================"

run_test "Encryption Service Tests" \
    "npm test -- encryption.service.spec.ts --passWithNoTests"

run_test "Settings Cache Service Tests" \
    "npm test -- settings-cache.service.spec.ts --passWithNoTests"

run_test "Settings Audit Service Tests" \
    "npm test -- settings-audit.service.spec.ts --passWithNoTests"

echo -e "\n📝 Step 2: Database Verification"
echo "=================================="

# Check if database is accessible
run_test "Database Connection" \
    "psql \$DATABASE_URL -c 'SELECT 1' > /dev/null 2>&1"

# Verify tables exist
run_test "platform_settings table exists" \
    "psql \$DATABASE_URL -c 'SELECT 1 FROM platform_settings LIMIT 1' > /dev/null 2>&1"

run_test "platform_branding table exists" \
    "psql \$DATABASE_URL -c 'SELECT 1 FROM platform_branding LIMIT 1' > /dev/null 2>&1"

run_test "settings_audit_log table exists" \
    "psql \$DATABASE_URL -c 'SELECT 1 FROM settings_audit_log LIMIT 1' > /dev/null 2>&1"

# Verify tenant columns
run_test "tenants.white_label_enabled column exists" \
    "psql \$DATABASE_URL -c 'SELECT white_label_enabled FROM tenants LIMIT 1' > /dev/null 2>&1"

run_test "tenants.team_settings column exists" \
    "psql \$DATABASE_URL -c 'SELECT team_settings FROM tenants LIMIT 1' > /dev/null 2>&1"

run_test "tenants.integration_settings column exists" \
    "psql \$DATABASE_URL -c 'SELECT integration_settings FROM tenants LIMIT 1' > /dev/null 2>&1"

echo -e "\n📝 Step 3: Redis Verification"
echo "==============================="

run_test "Redis Connection" \
    "redis-cli ping > /dev/null 2>&1"

run_test "Redis SET operation" \
    "redis-cli SET test:key 'test-value' > /dev/null 2>&1"

run_test "Redis GET operation" \
    "[ \"\$(redis-cli GET test:key)\" = 'test-value' ]"

run_test "Redis DEL operation" \
    "redis-cli DEL test:key > /dev/null 2>&1"

echo -e "\n📝 Step 4: Environment Variables"
echo "==================================="

run_test "ENCRYPTION_KEY is set" \
    "[ ! -z \"\$ENCRYPTION_KEY\" ]"

run_test "DATABASE_URL is set" \
    "[ ! -z \"\$DATABASE_URL\" ]"

run_test "REDIS_HOST is set" \
    "[ ! -z \"\$REDIS_HOST\" ]"

echo -e "\n📝 Step 5: Functional Tests"
echo "=============================="

# Test encryption/decryption
run_test "Encryption/Decryption works" \
    "node -e \"
const crypto = require('crypto');
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'test-key', 'salt', 32);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update('test-data', 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
if (decrypted !== 'test-data') process.exit(1);
\""

# Test database insert/select
run_test "Database INSERT/SELECT works" \
    "psql \$DATABASE_URL -c \"
INSERT INTO platform_settings (category, key, value) 
VALUES ('test', 'test-key', 'test-value') 
ON CONFLICT (category, key) DO UPDATE SET value = 'test-value';
SELECT 1 FROM platform_settings WHERE category = 'test' AND key = 'test-key';
\" > /dev/null 2>&1"

# Test audit log insert
run_test "Audit Log INSERT works" \
    "psql \$DATABASE_URL -c \"
INSERT INTO settings_audit_log (settings_type, action, status) 
VALUES ('test', 'test', 'success');
SELECT 1 FROM settings_audit_log WHERE settings_type = 'test';
\" > /dev/null 2>&1"

# Cleanup test data
psql $DATABASE_URL -c "DELETE FROM platform_settings WHERE category = 'test'" > /dev/null 2>&1
psql $DATABASE_URL -c "DELETE FROM settings_audit_log WHERE settings_type = 'test'" > /dev/null 2>&1

echo -e "\n📝 Step 6: Performance Tests"
echo "=============================="

# Test cache performance
run_test "Redis performance (1000 operations)" \
    "node -e \"
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
(async () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    await redis.set('perf:test:' + i, 'value' + i);
  }
  for (let i = 0; i < 1000; i++) {
    await redis.get('perf:test:' + i);
  }
  const duration = Date.now() - start;
  await redis.del(...Array.from({length: 1000}, (_, i) => 'perf:test:' + i));
  await redis.quit();
  if (duration > 5000) process.exit(1); // Should complete in < 5 seconds
})();
\""

# Summary
echo -e "\n========================================"
echo -e "Test Results Summary"
echo -e "========================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "Total: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed! Phase 1 foundation is solid.${NC}"
    echo -e "\n${GREEN}Ready to proceed to Phase 2!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please fix issues before proceeding.${NC}"
    exit 1
fi
