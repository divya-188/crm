#!/bin/bash

echo "🧹 Final Project Cleanup - Moving ALL non-essential files to docs/"
echo "===================================================================="
echo ""

# Create archive folder for miscellaneous files
mkdir -p docs/archive/{scripts,pdfs,misc}

echo "📦 Moving root-level documentation files..."

# Move all .md files from root (except README.md)
find . -maxdepth 1 -type f -name "*.md" ! -name "README.md" | while read file; do
  filename=$(basename "$file")
  mv "$file" "docs/archive/$filename" 2>/dev/null && echo "  ✓ Moved: $filename"
done

echo ""
echo "🔧 Moving root-level script files..."

# Move all .sh files from root
find . -maxdepth 1 -type f -name "*.sh" | while read file; do
  filename=$(basename "$file")
  mv "$file" "docs/archive/scripts/$filename" 2>/dev/null && echo "  ✓ Moved: scripts/$filename"
done

echo ""
echo "📄 Moving PDF files..."

# Move all .pdf files from root
find . -maxdepth 1 -type f -name "*.pdf" | while read file; do
  filename=$(basename "$file")
  mv "$file" "docs/archive/pdfs/$filename" 2>/dev/null && echo "  ✓ Moved: pdfs/$filename"
done

echo ""
echo "🗂️  Moving other documentation files..."

# Move any .sql, .txt, or other doc files from root
find . -maxdepth 1 -type f \( -name "*.sql" -o -name "*.txt" -o -name "*.log" \) | while read file; do
  filename=$(basename "$file")
  mv "$file" "docs/archive/misc/$filename" 2>/dev/null && echo "  ✓ Moved: misc/$filename"
done

# Check template steps folder
if [ -d "template steps" ]; then
  echo ""
  echo "📁 Moving 'template steps' folder..."
  mv "template steps" "docs/archive/" 2>/dev/null && echo "  ✓ Moved: template steps/"
fi

echo ""
echo "===================================================================="
echo "✅ Cleanup Complete!"
echo ""

# Count remaining files
REMAINING_MD=$(find . -maxdepth 1 -type f -name "*.md" ! -name "README.md" | wc -l)
REMAINING_SH=$(find . -maxdepth 1 -type f -name "*.sh" | wc -l)
REMAINING_PDF=$(find . -maxdepth 1 -type f -name "*.pdf" | wc -l)

echo "📊 Root Directory Status:"
echo "  .md files (excluding README.md): $REMAINING_MD"
echo "  .sh files: $REMAINING_SH"
echo "  .pdf files: $REMAINING_PDF"
echo ""

if [ "$REMAINING_MD" -eq 0 ] && [ "$REMAINING_SH" -eq 0 ] && [ "$REMAINING_PDF" -eq 0 ]; then
  echo "🎉 Root directory is now CLEAN!"
  echo ""
  echo "✨ Only essential files remain:"
  echo "   ✓ README.md"
  echo "   ✓ package.json files"
  echo "   ✓ .gitignore"
  echo "   ✓ Configuration files"
else
  echo "⚠️  Some files still remain in root:"
  ls -la | grep -E "\.(md|sh|pdf|sql|txt|log)$" | grep -v "README.md"
fi

echo ""
echo "📁 All archived files are in: docs/archive/"
echo "   ├── scripts/     (shell scripts)"
echo "   ├── pdfs/        (PDF documents)"
echo "   ├── misc/        (other files)"
echo "   └── *.md         (markdown docs)"
echo ""
echo "🎯 Project structure is now clean and organized!"
