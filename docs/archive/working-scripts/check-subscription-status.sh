#!/bin/bash

echo "🔍 Checking Subscription Status in Database"
echo "==========================================="
echo ""

# Check if we can connect to PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client."
    exit 1
fi

# Get database credentials from .env
DB_HOST=$(grep DB_HOST backend/.env | cut -d '=' -f2)
DB_PORT=$(grep DB_PORT backend/.env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME backend/.env | cut -d '=' -f2)
DB_USER=$(grep DB_USERNAME backend/.env | cut -d '=' -f2)
DB_PASS=$(grep DB_PASSWORD backend/.env | cut -d '=' -f2)

echo "📊 Recent Subscriptions:"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    id, 
    \"tenantId\", 
    \"planId\", 
    status, 
    \"razorpaySubscriptionId\",
    \"startDate\",
    \"endDate\",
    \"createdAt\"
FROM subscriptions 
ORDER BY \"createdAt\" DESC 
LIMIT 5;
"

echo ""
echo "📋 Subscription Count by Status:"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT status, COUNT(*) as count 
FROM subscriptions 
GROUP BY status;
"
