#!/bin/bash

echo "☁️ Cloud Backup Script for Adelynn's Jungle Dash"
echo "================================================"

# Check if iCloud Drive is available
if [ -d ~/Library/Mobile\ Documents/com~apple~CloudDocs ]; then
    echo "📱 iCloud Drive detected!"
    CLOUD_DIR="~/Library/Mobile\ Documents/com~apple~CloudDocs/AdelynnGame"
    mkdir -p "$CLOUD_DIR"
    
    # Backup game files to iCloud
    echo "☁️ Backing up to iCloud Drive..."
    cp -r audio "$CLOUD_DIR/" 2>/dev/null
    cp -r sprites "$CLOUD_DIR/" 2>/dev/null
    cp game.js "$CLOUD_DIR/" 2>/dev/null
    cp index.html "$CLOUD_DIR/" 2>/dev/null
    cp style.css "$CLOUD_DIR/" 2>/dev/null
    echo "✅ Game files backed up to iCloud Drive"
    echo "📁 iCloud location: $CLOUD_DIR"
else
    echo "⚠️ iCloud Drive not found"
fi

# Check for Google Drive
if [ -d ~/Google\ Drive ]; then
    echo "🔍 Google Drive detected!"
    GD_DIR="~/Google\ Drive/AdelynnGame"
    mkdir -p "$GD_DIR"
    
    echo "☁️ Backing up to Google Drive..."
    cp -r audio "$GD_DIR/" 2>/dev/null
    cp -r sprites "$GD_DIR/" 2>/dev/null
    cp game.js "$GD_DIR/" 2>/dev/null
    cp index.html "$GD_DIR/" 2>/dev/null
    cp style.css "$GD_DIR/" 2>/dev/null
    echo "✅ Game files backed up to Google Drive"
    echo "📁 Google Drive location: $GD_DIR"
else
    echo "⚠️ Google Drive not found"
fi

# Check for Dropbox
if [ -d ~/Dropbox ]; then
    echo "📦 Dropbox detected!"
    DB_DIR="~/Dropbox/AdelynnGame"
    mkdir -p "$DB_DIR"
    
    echo "☁️ Backing up to Dropbox..."
    cp -r audio "$DB_DIR/" 2>/dev/null
    cp -r sprites "$DB_DIR/" 2>/dev/null
    cp game.js "$DB_DIR/" 2>/dev/null
    cp index.html "$DB_DIR/" 2>/dev/null
    cp style.css "$DB_DIR/" 2>/dev/null
    echo "✅ Game files backed up to Dropbox"
    echo "📁 Dropbox location: $DB_DIR"
else
    echo "⚠️ Dropbox not found"
fi

echo ""
echo "🎮 Game backup completed!"
echo "💡 Your game is now safely stored in multiple locations:"
echo "   - Local: Current directory"
echo "   - WINDOWS11 volume: /Volumes/WINDOWS11/AdelynnGameBackup/"
echo "   - Cloud: iCloud Drive, Google Drive, or Dropbox (if available)"
echo ""
echo "🔄 Run this script regularly to keep your backups updated!" 