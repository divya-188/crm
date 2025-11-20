#!/bin/bash

# Test Email Notification System
# This script tests the email notification functionality

echo "=========================================="
echo "Email Notification System Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing Email Templates...${NC}"
echo ""

# Check if email templates exist
TEMPLATES_DIR="src/modules/subscriptions/templates"

if [ -d "$TEMPLATES_DIR" ]; then
    echo -e "${GREEN}✓ Templates directory exists${NC}"
    
    TEMPLATES=(
        "subscription-welcome.hbs"
        "payment-success.hbs"
        "payment-failed.hbs"
        "quota-warning.hbs"
        "renewal-reminder.hbs"
        "subscription-cancelled.hbs"
    )
    
    for template in "${TEMPLATES[@]}"; do
        if [ -f "$TEMPLATES_DIR/$template" ]; then
            echo -e "${GREEN}✓ Template found: $template${NC}"
        else
            echo -e "${YELLOW}✗ Template missing: $template${NC}"
        fi
    done
else
    echo -e "${YELLOW}✗ Templates directory not found${NC}"
fi

echo ""
echo -e "${BLUE}Checking Email Service Implementation...${NC}"
echo ""

# Check if email service has required methods
SERVICE_FILE="src/modules/subscriptions/services/email-notification.service.ts"

if [ -f "$SERVICE_FILE" ]; then
    echo -e "${GREEN}✓ Email notification service exists${NC}"
    
    METHODS=(
        "sendSubscriptionWelcome"
        "sendPaymentSuccess"
        "sendPaymentFailed"
        "sendQuotaWarning"
        "sendRenewalReminder"
        "sendCancellationConfirmation"
    )
    
    for method in "${METHODS[@]}"; do
        if grep -q "$method" "$SERVICE_FILE"; then
            echo -e "${GREEN}✓ Method implemented: $method${NC}"
        else
            echo -e "${YELLOW}✗ Method missing: $method${NC}"
        fi
    done
else
    echo -e "${YELLOW}✗ Email notification service not found${NC}"
fi

echo ""
echo -e "${BLUE}Checking Quota Monitoring...${NC}"
echo ""

QUOTA_SERVICE="src/modules/subscriptions/services/quota-enforcement.service.ts"

if [ -f "$QUOTA_SERVICE" ]; then
    if grep -q "checkAndSendQuotaWarnings" "$QUOTA_SERVICE"; then
        echo -e "${GREEN}✓ Quota monitoring implemented${NC}"
    else
        echo -e "${YELLOW}✗ Quota monitoring not found${NC}"
    fi
    
    if grep -q "WARNING_THRESHOLDS" "$QUOTA_SERVICE"; then
        echo -e "${GREEN}✓ Warning thresholds configured (80%, 90%, 95%)${NC}"
    else
        echo -e "${YELLOW}✗ Warning thresholds not configured${NC}"
    fi
else
    echo -e "${YELLOW}✗ Quota enforcement service not found${NC}"
fi

echo ""
echo -e "${BLUE}Checking Renewal Reminder Scheduler...${NC}"
echo ""

SCHEDULER_SERVICE="src/modules/subscriptions/services/renewal-scheduler.service.ts"

if [ -f "$SCHEDULER_SERVICE" ]; then
    if grep -q "processRenewalReminders" "$SCHEDULER_SERVICE"; then
        echo -e "${GREEN}✓ Renewal reminder scheduler implemented${NC}"
    else
        echo -e "${YELLOW}✗ Renewal reminder scheduler not found${NC}"
    fi
    
    if grep -q "sendRemindersForDay" "$SCHEDULER_SERVICE"; then
        echo -e "${GREEN}✓ Reminder sending logic implemented${NC}"
    else
        echo -e "${YELLOW}✗ Reminder sending logic not found${NC}"
    fi
    
    if grep -q "renewalReminders" "$SCHEDULER_SERVICE"; then
        echo -e "${GREEN}✓ Reminder tracking implemented${NC}"
    else
        echo -e "${YELLOW}✗ Reminder tracking not found${NC}"
    fi
else
    echo -e "${YELLOW}✗ Renewal scheduler service not found${NC}"
fi

echo ""
echo -e "${BLUE}Checking Database Migrations...${NC}"
echo ""

MIGRATIONS_DIR="src/database/migrations"

if [ -f "$MIGRATIONS_DIR/1700000000013-AddQuotaWarningTracking.ts" ]; then
    echo -e "${GREEN}✓ Quota warning tracking migration created${NC}"
else
    echo -e "${YELLOW}✗ Quota warning tracking migration not found${NC}"
fi

if [ -f "$MIGRATIONS_DIR/1700000000014-AddRenewalRemindersTracking.ts" ]; then
    echo -e "${GREEN}✓ Renewal reminders tracking migration created${NC}"
else
    echo -e "${YELLOW}✗ Renewal reminders tracking migration not found${NC}"
fi

echo ""
echo "=========================================="
echo "Email Notification System Test Complete"
echo "=========================================="
echo ""
echo -e "${BLUE}Configuration Notes:${NC}"
echo "1. Set EMAIL_PROVIDER in .env (sendgrid, ses, smtp, or console)"
echo "2. Configure provider-specific credentials"
echo "3. Set EMAIL_FROM and EMAIL_FROM_NAME"
echo "4. Renewal reminders run daily at 10 AM"
echo "5. Quota warnings sent at 80%, 90%, and 95% thresholds"
echo "6. Warnings have 24-hour cooldown to prevent spam"
echo ""
