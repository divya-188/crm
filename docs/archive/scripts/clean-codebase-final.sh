#!/bin/bash

echo "🧹 Final Codebase Cleanup - Moving ALL .md and .sh files to docs/"
echo "=================================================================="

# Create comprehensive docs structure
mkdir -p docs/{backend,frontend}/{templates,components,services,modules,tests,scripts,pages,features}

# Count files before (excluding node_modules)
TOTAL_FILES=$(find backend frontend -type f \( -name "*.md" -o -name "*.sh" \) ! -path "*/node_modules/*" | wc -l)
echo "📊 Found $TOTAL_FILES documentation/script files to move"
echo ""

# ============================================
# BACKEND
# ============================================
echo "📦 Processing BACKEND files..."

# Find and move all .md files from backend (excluding node_modules)
find backend -type f -name "*.md" ! -path "*/node_modules/*" | while read file; do
  # Get relative path from backend/
  rel_path="${file#backend/}"
  dir_path=$(dirname "$rel_path")
  filename=$(basename "$file")
  
  # Create target directory
  mkdir -p "docs/backend/$dir_path"
  
  # Move file
  mv "$file" "docs/backend/$dir_path/$filename" 2>/dev/null && echo "  ✓ $rel_path"
done

# Find and move all .sh files from backend
find backend -type f -name "*.sh" ! -path "*/node_modules/*" | while read file; do
  filename=$(basename "$file")
  mv "$file" "docs/backend/scripts/$filename" 2>/dev/null && echo "  ✓ scripts/$filename"
done

# ============================================
# FRONTEND
# ============================================
echo ""
echo "🎨 Processing FRONTEND files..."

# Find and move all .md files from frontend (excluding node_modules)
find frontend -type f -name "*.md" ! -path "*/node_modules/*" | while read file; do
  # Get relative path from frontend/
  rel_path="${file#frontend/}"
  dir_path=$(dirname "$rel_path")
  filename=$(basename "$file")
  
  # Create target directory
  mkdir -p "docs/frontend/$dir_path"
  
  # Move file
  mv "$file" "docs/frontend/$dir_path/$filename" 2>/dev/null && echo "  ✓ $rel_path"
done

# Find and move all .sh files from frontend
find frontend -type f -name "*.sh" ! -path "*/node_modules/*" | while read file; do
  filename=$(basename "$file")
  mv "$file" "docs/frontend/scripts/$filename" 2>/dev/null && echo "  ✓ scripts/$filename"
done

# ============================================
# Verify cleanup
# ============================================
echo ""
echo "=================================================================="
echo "✅ Cleanup complete!"
echo ""

REMAINING_BACKEND=$(find backend -type f \( -name "*.md" -o -name "*.sh" \) ! -path "*/node_modules/*" | wc -l)
REMAINING_FRONTEND=$(find frontend -type f \( -name "*.md" -o -name "*.sh" \) ! -path "*/node_modules/*" | wc -l)

echo "📊 Results:"
echo "  Backend:  $REMAINING_BACKEND files remaining"
echo "  Frontend: $REMAINING_FRONTEND files remaining"
echo ""

if [ "$REMAINING_BACKEND" -eq 0 ] && [ "$REMAINING_FRONTEND" -eq 0 ]; then
  echo "🎉 Codebase is now 100% CLEAN!"
  echo ""
  echo "✨ No .md or .sh files remain in:"
  echo "   ✓ backend/src/"
  echo "   ✓ backend/test/"
  echo "   ✓ frontend/src/"
  echo "   ✓ All subdirectories"
else
  echo "⚠️  Some files still remain:"
  echo ""
  if [ "$REMAINING_BACKEND" -gt 0 ]; then
    echo "Backend files:"
    find backend -type f \( -name "*.md" -o -name "*.sh" \) ! -path "*/node_modules/*"
  fi
  if [ "$REMAINING_FRONTEND" -gt 0 ]; then
    echo "Frontend files:"
    find frontend -type f \( -name "*.md" -o -name "*.sh" \) ! -path "*/node_modules/*"
  fi
fi

echo ""
echo "📁 All documentation is now organized in: docs/"
echo ""
tree -L 3 -d docs/ 2>/dev/null || find docs -type d | head -20
