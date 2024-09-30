#!/bin/bash

# Navigate to the project directory
cd /home/swatts/Invoicer

# Pull the latest changes from GitHub
git pull origin main

# Install any new dependencies
npm install

# Build the application
npm run build

# Restart the application using PM2
pm2 restart csePortal

# Exit the script
exit
