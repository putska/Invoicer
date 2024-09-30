#!/bin/bash

echo "Starting deployment..."

# Navigate to project directory
cd /path/to/your/project || { echo "Failed to navigate to project directory"; exit 1; }

# Pull the latest code
echo "Pulling latest code..."
git pull origin main || { echo "Failed to pull latest code"; exit 1; }

# Install dependencies
echo "Installing dependencies..."
npm install || { echo "Failed to install dependencies"; exit 1; }

# Build the application
echo "Building application..."
npm run build || { echo "Failed to build application"; exit 1; }

# Restart the application
echo "Restarting application..."
pm2 restart your-app-name || { echo "Failed to restart application"; exit 1; }

echo "Deployment completed!"
