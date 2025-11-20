#!/bin/bash

# Color Migration Script
# Replaces old purple/cyan colors with emerald green theme

echo "Starting color migration..."

# Find all TypeScript/TSX files in src directory
FILES=$(find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*")

for file in $FILES; do
  # Skip if file doesn't exist
  [ ! -f "$file" ] && continue
  
  # Purple to Primary (Emerald) - Tailwind classes
  sed -i '' 's/bg-purple-50/bg-primary-50/g' "$file"
  sed -i '' 's/bg-purple-100/bg-primary-100/g' "$file"
  sed -i '' 's/bg-purple-200/bg-primary-200/g' "$file"
  sed -i '' 's/bg-purple-500/bg-primary-500/g' "$file"
  sed -i '' 's/bg-purple-600/bg-primary-600/g' "$file"
  sed -i '' 's/bg-purple-700/bg-primary-700/g' "$file"
  sed -i '' 's/bg-purple-900/bg-primary-900/g' "$file"
  
  sed -i '' 's/text-purple-400/text-primary-400/g' "$file"
  sed -i '' 's/text-purple-500/text-primary-500/g' "$file"
  sed -i '' 's/text-purple-600/text-primary-600/g' "$file"
  sed -i '' 's/text-purple-700/text-primary-700/g' "$file"
  sed -i '' 's/text-purple-900/text-primary-900/g' "$file"
  
  sed -i '' 's/border-purple-200/border-primary-200/g' "$file"
  sed -i '' 's/border-purple-300/border-primary-300/g' "$file"
  sed -i '' 's/border-purple-500/border-primary-500/g' "$file"
  sed -i '' 's/border-purple-600/border-primary-600/g' "$file"
  sed -i '' 's/border-purple-800/border-primary-800/g' "$file"
  
  sed -i '' 's/from-purple-50/from-primary-50/g' "$file"
  sed -i '' 's/from-purple-500/from-primary-500/g' "$file"
  sed -i '' 's/from-purple-600/from-primary-600/g' "$file"
  sed -i '' 's/from-purple-700/from-primary-700/g' "$file"
  
  sed -i '' 's/to-purple-50/to-primary-50/g' "$file"
  sed -i '' 's/to-purple-500/to-primary-500/g' "$file"
  sed -i '' 's/to-purple-600/to-primary-600/g' "$file"
  sed -i '' 's/to-purple-700/to-primary-700/g' "$file"
  sed -i '' 's/to-purple-800/to-primary-800/g' "$file"
  
  sed -i '' 's/via-purple-600/via-primary-600/g' "$file"
  
  sed -i '' 's/hover:bg-purple-50/hover:bg-primary-50/g' "$file"
  sed -i '' 's/hover:bg-primary-600/hover:bg-primary-600/g' "$file"
  sed -i '' 's/hover:bg-purple-700/hover:bg-primary-700/g' "$file"
  sed -i '' 's/hover:bg-purple-800/hover:bg-primary-800/g' "$file"
  
  sed -i '' 's/hover:from-purple-700/hover:from-primary-700/g' "$file"
  sed -i '' 's/hover:to-purple-800/hover:to-primary-800/g' "$file"
  
  sed -i '' 's/dark:bg-purple-900/dark:bg-primary-900/g' "$file"
  sed -i '' 's/dark:text-purple-400/dark:text-primary-400/g' "$file"
  sed -i '' 's/dark:border-purple-800/dark:border-primary-800/g' "$file"
  sed -i '' 's/dark:hover:border-purple-800/dark:hover:border-primary-800/g' "$file"
  
  # Hex colors
  sed -i '' 's/#8b5cf6/#10B981/g' "$file"
  sed -i '' 's/#8B5CF6/#10B981/g' "$file"
  sed -i '' 's/#7c3aed/#059669/g' "$file"
  sed -i '' 's/#7C3AED/#059669/g' "$file"
  sed -i '' 's/#a78bfa/#34D399/g' "$file"
  sed -i '' 's/#A78BFA/#34D399/g' "$file"
  
  # Cyan to Primary (for primary actions only - be selective)
  sed -i '' 's/bg-cyan-100/bg-primary-100/g' "$file"
  sed -i '' 's/text-cyan-700/text-primary-700/g' "$file"
  sed -i '' 's/#06b6d4/#10B981/g' "$file"
  sed -i '' 's/#06B6D4/#10B981/g' "$file"
  
done

echo "Color migration complete!"
echo "Please review the changes and test thoroughly."
