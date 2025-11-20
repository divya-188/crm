#!/bin/bash

# Simple Agent User Seeding Script
# Uses the existing seed-test-users script

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Seeding Agent User                                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "→ Running test users seed script..."
echo ""

# Run the existing seed script which creates all test users including agent
npm run seed:test-users

echo ""
echo "✓ Agent user should now be available"
echo ""
echo "Agent Credentials:"
echo "  Email:    agent@test.com"
echo "  Password: Agent123!"
echo "  Role:     agent"
echo ""
echo "Test the login:"
echo "  curl -X POST http://localhost:3000/api/v1/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"agent@test.com\",\"password\":\"Agent123!\"}'"
