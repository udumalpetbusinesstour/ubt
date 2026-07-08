#!/bin/bash

# Exit immediately if any command fails
set -e

echo "=========================================="
# Get the directory where the script is located
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"
echo "📂 Project Root: $PROJECT_DIR"
echo "=========================================="

echo "🧹 1. Discarding local build file overrides to prevent conflicts..."
git reset --hard HEAD
git clean -fd

echo "📥 2. Pulling latest code from GitHub..."
git pull

echo "📦 3. Syncing backend dependencies..."
cd backend
npm install
cd ..

echo "📦 4. Syncing frontend dependencies..."
cd frontend
npm install
cd ..

echo "🏗️ 5. Rebuilding frontend assets..."
cd frontend
npm run build
cd ..

echo "🚀 6. Deploying built frontend assets to Nginx Production..."
rm -rf /var/www/html/*
cp -r frontend/dist/* /var/www/html/

echo "🔄 7. Restarting ubt-backend PM2 process..."
# Attempt to restart the process; if it doesn't exist, start it
pm2 restart ubt-backend --update-env || pm2 start backend/server.js --name "ubt-backend"

echo "🌐 8. Reloading Nginx configuration..."
systemctl reload nginx

echo "=========================================="
echo "✅ VPS Production Deployment Completed Successfully!"
echo "=========================================="
