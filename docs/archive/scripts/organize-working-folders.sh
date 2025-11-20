#!/bin/bash

echo "🗂️  Organizing working_docs and working_scripts into docs/"
echo "=========================================================="
echo ""

# Count files
DOCS_COUNT=$(find working_docs -type f | wc -l)
SCRIPTS_COUNT=$(find working_scripts -type f | wc -l)

echo "📊 Files to organize:"
echo "  working_docs:    $DOCS_COUNT files"
echo "  working_scripts: $SCRIPTS_COUNT files"
echo ""

# Create organized structure in docs
mkdir -p docs/archive/working-docs
mkdir -p docs/archive/working-scripts

echo "📦 Moving working_docs/ contents..."
# Move all files from working_docs
if [ -d "working_docs" ]; then
  cp -r working_docs/* docs/archive/working-docs/ 2>/dev/null
  echo "  ✓ Copied all files from working_docs/"
fi

echo ""
echo "🔧 Moving working_scripts/ contents..."
# Move all files from working_scripts
if [ -d "working_scripts" ]; then
  cp -r working_scripts/* docs/archive/working-scripts/ 2>/dev/null
  echo "  ✓ Copied all files from working_scripts/"
fi

echo ""
echo "🗑️  Removing original folders..."
# Remove the original folders
rm -rf working_docs
echo "  ✓ Deleted working_docs/"

rm -rf working_scripts
echo "  ✓ Deleted working_scripts/"

echo ""
echo "=========================================================="
echo "✅ Organization Complete!"
echo ""

# Verify deletion
if [ ! -d "working_docs" ] && [ ! -d "working_scripts" ]; then
  echo "🎉 Folders successfully removed!"
  echo ""
  echo "✨ All content moved to:"
  echo "   📁 docs/archive/working-docs/    ($DOCS_COUNT files)"
  echo "   📁 docs/archive/working-scripts/ ($SCRIPTS_COUNT files)"
else
  echo "⚠️  Warning: Some folders still exist"
  [ -d "working_docs" ] && echo "  - working_docs/ still exists"
  [ -d "working_scripts" ] && echo "  - working_scripts/ still exists"
fi

echo ""
echo "📁 Complete docs structure:"
echo "   docs/"
echo "   ├── archive/"
echo "   │   ├── working-docs/       (historical documentation)"
echo "   │   ├── working-scripts/    (historical scripts)"
echo "   │   ├── scripts/            (root scripts)"
echo "   │   ├── pdfs/               (PDF files)"
echo "   │   └── misc/               (other files)"
echo "   ├── backend/                (backend documentation)"
echo "   ├── frontend/               (frontend documentation)"
echo "   └── project-wide/           (cross-cutting docs)"
echo ""
echo "🎯 Project root is now clean and organized!"
