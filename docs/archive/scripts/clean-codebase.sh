#!/bin/bash

echo "🧹 Cleaning codebase - Moving ALL .md and .sh files to docs/"
echo "=================================================="

# Create comprehensive docs structure
mkdir -p docs/{backend,frontend}/{templates,components,services,modules,tests,scripts}

# Count files before
TOTAL_FILES=$(find backend frontend -type f \( -name "*.md" -o -name "*.sh" \) | wc -l)
echo "📊 Found $TOTAL_FILES documentation/script files to move"
echo ""

# ============================================
# BACKEND - Move all .md files
# ============================================
echo "📦 Processing backend .md files..."

# Backend root level
find backend -maxdepth 1 -type f -name "*.md" -exec sh -c '
  for file; do
    filename=$(basename "$file")
    mv "$file" "docs/backend/$filename" 2>/dev/null && echo "  ✓ Moved: $filename"
  done
' sh {} +

# Backend modules
find backend/src/modules -type f -name "*.md" -exec sh -c '
  for file; do
    module=$(echo "$file" | cut -d/ -f4)
    filename=$(basename "$file")
    mkdir -p "docs/backend/modules/$module"
    mv "$file" "docs/backend/modules/$module/$filename" 2>/dev/null && echo "  ✓ Moved: modules/$module/$filename"
  done
' sh {} +

# Backend tests
find backend/test backend/src -type f -name "*.md" -exec sh -c '
  for file; do
    filename=$(basename "$file")
    dir=$(dirname "$file" | sed "s|backend/||")
    mkdir -p "docs/backend/$dir"
    mv "$file" "docs/backend/$dir/$filename" 2>/dev/null && echo "  ✓ Moved: $dir/$filename"
  done
' sh {} +

# ============================================
# BACKEND - Move all .sh files
# ============================================
echo ""
echo "🔧 Processing backend .sh files..."

find backend -type f -name "*.sh" -exec sh -c '
  for file; do
    filename=$(basename "$file")
    mv "$file" "docs/backend/scripts/$filename" 2>/dev/null && echo "  ✓ Moved: scripts/$filename"
  done
' sh {} +

# ============================================
# FRONTEND - Move all .md files
# ============================================
echo ""
echo "🎨 Processing frontend .md files..."

# Frontend root level
find frontend -maxdepth 1 -type f -name "*.md" -exec sh -c '
  for file; do
    filename=$(basename "$file")
    mv "$file" "docs/frontend/$filename" 2>/dev/null && echo "  ✓ Moved: $filename"
  done
' sh {} +

# Frontend components
find frontend/src/components -type f -name "*.md" -exec sh -c '
  for file; do
    component=$(echo "$file" | cut -d/ -f4)
    filename=$(basename "$file")
    mkdir -p "docs/frontend/components/$component"
    mv "$file" "docs/frontend/components/$component/$filename" 2>/dev/null && echo "  ✓ Moved: components/$component/$filename"
  done
' sh {} +

# Frontend pages
find frontend/src/pages -type f -name "*.md" -exec sh -c '
  for file; do
    page=$(echo "$file" | cut -d/ -f4)
    filename=$(basename "$file")
    mkdir -p "docs/frontend/pages/$page"
    mv "$file" "docs/frontend/pages/$page/$filename" 2>/dev/null && echo "  ✓ Moved: pages/$page/$filename"
  done
' sh {} +

# Frontend features
find frontend/src/features -type f -name "*.md" -exec sh -c '
  for file; do
    feature=$(echo "$file" | cut -d/ -f4)
    filename=$(basename "$file")
    mkdir -p "docs/frontend/features/$feature"
    mv "$file" "docs/frontend/features/$feature/$filename" 2>/dev/null && echo "  ✓ Moved: features/$feature/$filename"
  done
' sh {} +

# ============================================
# FRONTEND - Move all .sh files
# ============================================
echo ""
echo "🔧 Processing frontend .sh files..."

find frontend -type f -name "*.sh" -exec sh -c '
  for file; do
    filename=$(basename "$file")
    mv "$file" "docs/frontend/scripts/$filename" 2>/dev/null && echo "  ✓ Moved: scripts/$filename"
  done
' sh {} +

# ============================================
# Verify cleanup
# ============================================
echo ""
echo "=================================================="
echo "✅ Cleanup complete!"
echo ""

REMAINING_BACKEND=$(find backend -type f \( -name "*.md" -o -name "*.sh" \) | wc -l)
REMAINING_FRONTEND=$(find frontend -type f \( -name "*.md" -o -name "*.sh" \) | wc -l)

echo "📊 Results:"
echo "  Backend:  $REMAINING_BACKEND files remaining"
echo "  Frontend: $REMAINING_FRONTEND files remaining"
echo ""

if [ "$REMAINING_BACKEND" -eq 0 ] && [ "$REMAINING_FRONTEND" -eq 0 ]; then
  echo "🎉 Codebase is now 100% clean!"
else
  echo "⚠️  Some files may still remain. Running detailed check..."
  echo ""
  echo "Remaining backend files:"
  find backend -type f \( -name "*.md" -o -name "*.sh" \)
  echo ""
  echo "Remaining frontend files:"
  find frontend -type f \( -name "*.md" -o -name "*.sh" \)
fi

echo ""
echo "📁 All documentation is now in: docs/"
echo "   ├── backend/"
echo "   │   ├── modules/"
echo "   │   ├── scripts/"
echo "   │   └── tests/"
echo "   └── frontend/"
echo "       ├── components/"
echo "       ├── pages/"
echo "       ├── features/"
echo "       └── scripts/"
