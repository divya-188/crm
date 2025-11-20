#!/bin/bash

# Quick test runner for Phase 1
# Runs unit tests only (faster than full integration tests)

set -e

echo "🧪 Running Phase 1 Unit Tests"
echo "=============================="

cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if dist exists (compiled code)
if [ ! -d "dist" ]; then
    echo "🔨 Building project..."
    npm run build
fi

# Run unit tests
echo ""
echo "Running Encryption Service tests..."
npm test -- encryption.service.spec.ts --passWithNoTests --silent

echo ""
echo "Running Settings Cache Service tests..."
npm test -- settings-cache.service.spec.ts --passWithNoTests --silent

echo ""
echo "Running Settings Audit Service tests..."
npm test -- settings-audit.service.spec.ts --passWithNoTests --silent

echo ""
echo "✅ All unit tests completed!"
echo ""
echo "To run full integration tests (including database and Redis):"
echo "  ./test-settings-phase-1.sh"
