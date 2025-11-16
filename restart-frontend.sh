#!/bin/bash

echo "🧹 Cleaning frontend cache..."
rm -rf frontend/node_modules/.vite
rm -rf frontend/dist
rm -rf frontend/.vite

echo "🚀 Starting frontend dev server..."
cd frontend
npm run dev
