#!/bin/bash

# Script to organize documentation files into proper structure

echo "🗂️  Organizing documentation files..."

# Create documentation structure
mkdir -p docs/{backend,frontend,project-wide}/{subscriptions,settings,templates,webhooks,api-keys,whatsapp,testing,flow-builder,inbox,contacts,campaigns,ui-components}

# ============================================
# BACKEND DOCUMENTATION
# ============================================

echo "📦 Moving backend documentation..."

# Subscriptions
mv backend/SUBSCRIPTION-LIFECYCLE.md docs/backend/subscriptions/ 2>/dev/null
mv backend/SUBSCRIPTION-LIFECYCLE-IMPLEMENTATION.md docs/backend/subscriptions/ 2>/dev/null
mv backend/RAZORPAY-CONFIGURATION.md docs/backend/subscriptions/ 2>/dev/null
mv backend/E2E-TESTS-IMPLEMENTATION-SUMMARY.md docs/backend/subscriptions/ 2>/dev/null
mv backend/EMAIL-NOTIFICATION-SYSTEM.md docs/backend/subscriptions/ 2>/dev/null
mv backend/subscription-e2e-report-*.md docs/backend/subscriptions/ 2>/dev/null

# Settings
mv backend/SETTINGS-INTEGRATION-TESTS-COMPLETE.md docs/backend/settings/ 2>/dev/null
mv backend/PAYMENT-SERVICE-SETTINGS-INTEGRATION.md docs/backend/settings/ 2>/dev/null
mv backend/PAYMENT-SETTINGS-INTEGRATION.md docs/backend/settings/ 2>/dev/null
mv backend/EMAIL-NOTIFICATION-SETTINGS-INTEGRATION.md docs/backend/settings/ 2>/dev/null
mv backend/CENTRALIZED-ERROR-HANDLING-COMPLETE.md docs/backend/settings/ 2>/dev/null
mv backend/ERROR-HANDLING-GUIDE.md docs/backend/settings/ 2>/dev/null

# WhatsApp
mv backend/WHATSAPP-ERROR-HANDLING-FIX.md docs/backend/whatsapp/ 2>/dev/null
mv backend/TESTING-WHATSAPP-CONNECTION.md docs/backend/whatsapp/ 2>/dev/null

# Webhooks
mv backend/WEBHOOKS-DOCUMENTATION.md docs/backend/webhooks/ 2>/dev/null
mv backend/WEBHOOKS-INTEGRATION-EXAMPLE.md docs/backend/webhooks/ 2>/dev/null
mv backend/WEBHOOKS-IMPLEMENTATION-SUMMARY.md docs/backend/webhooks/ 2>/dev/null
mv backend/WEBHOOKS-INTEGRATION-CHECKLIST.md docs/backend/webhooks/ 2>/dev/null
mv backend/WEBHOOKS-QUICKSTART.md docs/backend/webhooks/ 2>/dev/null

# API Keys
mv backend/API-KEYS-DOCUMENTATION.md docs/backend/api-keys/ 2>/dev/null

# Super Admin
mv backend/SUPER-ADMIN-SETUP.md docs/backend/ 2>/dev/null

# Testing scripts - move to testing folder
mv backend/test-*.sh docs/backend/testing/ 2>/dev/null
mv backend/setup-*.sh docs/backend/testing/ 2>/dev/null
mv backend/run-*.sh docs/backend/testing/ 2>/dev/null
mv backend/*-test-*.sh docs/backend/testing/ 2>/dev/null
mv backend/activate-*.sh docs/backend/testing/ 2>/dev/null
mv backend/clear-*.sh docs/backend/testing/ 2>/dev/null
mv backend/reset-*.sh docs/backend/testing/ 2>/dev/null
mv backend/fix-*.sh docs/backend/testing/ 2>/dev/null
mv backend/diagnose-*.sh docs/backend/testing/ 2>/dev/null
mv backend/debug-*.sh docs/backend/testing/ 2>/dev/null
mv backend/add-*.sh docs/backend/testing/ 2>/dev/null
mv backend/add-*.js docs/backend/testing/ 2>/dev/null
mv backend/check-*.ts docs/backend/testing/ 2>/dev/null

# ============================================
# FRONTEND DOCUMENTATION
# ============================================

echo "🎨 Moving frontend documentation..."

# Flow Builder
mv frontend/FLOW-BUILDER-*.md docs/frontend/flow-builder/ 2>/dev/null
mv frontend/NODE-*.md docs/frontend/flow-builder/ 2>/dev/null
mv frontend/CUSTOM-NODES-*.md docs/frontend/flow-builder/ 2>/dev/null
mv frontend/EXECUTION-*.md docs/frontend/flow-builder/ 2>/dev/null
mv frontend/TASK-41-*.md docs/frontend/flow-builder/ 2>/dev/null

# Inbox
mv frontend/INBOX-*.md docs/frontend/inbox/ 2>/dev/null
mv frontend/CONVERSATION-*.md docs/frontend/inbox/ 2>/dev/null
mv frontend/MESSAGE-*.md docs/frontend/inbox/ 2>/dev/null

# Contacts
mv frontend/CONTACT-*.md docs/frontend/contacts/ 2>/dev/null
mv frontend/CONTACTS-*.md docs/frontend/contacts/ 2>/dev/null

# Campaigns
mv frontend/CAMPAIGN-*.md docs/frontend/campaigns/ 2>/dev/null

# UI Components
mv frontend/DESIGN-SYSTEM-*.md docs/frontend/ui-components/ 2>/dev/null
mv frontend/API-STATE-MANAGEMENT-GUIDE.md docs/frontend/ui-components/ 2>/dev/null

# General Frontend
mv frontend/SETUP-SUMMARY.md docs/frontend/ 2>/dev/null
mv frontend/update-*.sh docs/frontend/ 2>/dev/null

# ============================================
# PROJECT-WIDE DOCUMENTATION
# ============================================

echo "🌐 Moving project-wide documentation..."

# Root level docs
mv ORGANIZATION-COMPLETE.md docs/project-wide/ 2>/dev/null
mv DOCUMENTATION-INDEX.md docs/project-wide/ 2>/dev/null
mv AUTOMATION-ECOSYSTEM-COMPLETE-GUIDE.md docs/project-wide/ 2>/dev/null
mv WHATSAPP-MULTI-TENANT-SETUP.md docs/project-wide/ 2>/dev/null
mv WHATSAPP-TESTING-GUIDE.md docs/project-wide/ 2>/dev/null
mv QUICK-TEST-WHATSAPP-MESSAGES.md docs/project-wide/ 2>/dev/null
mv START-HERE-WHATSAPP-SETUP.md docs/project-wide/ 2>/dev/null
mv WHATS-NEXT.md docs/project-wide/ 2>/dev/null

# Settings Module
mv SETTINGS-*.md docs/project-wide/settings/ 2>/dev/null
mv TASK-*.md docs/project-wide/settings/ 2>/dev/null
mv PHASE-*.md docs/project-wide/settings/ 2>/dev/null
mv REAL-TIME-*.md docs/project-wide/settings/ 2>/dev/null
mv LOGO-*.md docs/project-wide/settings/ 2>/dev/null
mv ENCRYPTION-*.md docs/project-wide/settings/ 2>/dev/null
mv CONSOLE-*.md docs/project-wide/settings/ 2>/dev/null
mv WHATSAPP-WEBHOOK-URL-FIX.md docs/project-wide/settings/ 2>/dev/null
mv WHATSAPP-SETTINGS-IMPLEMENTATION.md docs/project-wide/settings/ 2>/dev/null
mv WHATSAPP-TEST-CONNECTION-FIX.md docs/project-wide/settings/ 2>/dev/null
mv AUTH-GUARDS-SETTINGS-INTEGRATION.md docs/project-wide/settings/ 2>/dev/null
mv UNIFIED-PAYMENT-SERVICE-INTEGRATION-COMPLETE.md docs/project-wide/settings/ 2>/dev/null

# Setup scripts
mv setup-*.sh docs/project-wide/ 2>/dev/null

echo "✅ Documentation organization complete!"
echo ""
echo "📁 Documentation structure:"
echo "   docs/"
echo "   ├── backend/"
echo "   │   ├── subscriptions/"
echo "   │   ├── settings/"
echo "   │   ├── templates/"
echo "   │   ├── webhooks/"
echo "   │   ├── api-keys/"
echo "   │   ├── whatsapp/"
echo "   │   └── testing/"
echo "   ├── frontend/"
echo "   │   ├── flow-builder/"
echo "   │   ├── inbox/"
echo "   │   ├── contacts/"
echo "   │   ├── campaigns/"
echo "   │   ├── templates/"
echo "   │   └── ui-components/"
echo "   └── project-wide/"
echo "       └── settings/"
echo ""
echo "🧹 Codebase is now clean!"
