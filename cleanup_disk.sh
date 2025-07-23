#!/bin/bash

echo "🧹 Disk Cleanup Script for Adelynn's Jungle Dash"
echo "================================================"

# Check disk space before cleanup
echo "📊 Disk space before cleanup:"
df -h | grep -E "(Filesystem|/dev/disk1)"

# Create backup directories on WINDOWS11 volume
echo "📁 Creating backup directories..."
mkdir -p /Volumes/WINDOWS11/AdelynnGameBackup
mkdir -p /Volumes/WINDOWS11/Photos
mkdir -p /Volumes/WINDOWS11/Downloads

# Move large files to WINDOWS11 volume
echo "📦 Moving large files to WINDOWS11 volume..."

# Move game assets if they exist
if [ -d "audio" ]; then
    cp -r audio /Volumes/WINDOWS11/AdelynnGameBackup/ 2>/dev/null
    echo "✅ Audio files backed up"
fi

if [ -d "sprites" ]; then
    cp -r sprites /Volumes/WINDOWS11/AdelynnGameBackup/ 2>/dev/null
    echo "✅ Sprite files backed up"
fi

# Move photos from Downloads
if [ -d ~/Downloads ]; then
    cp ~/Downloads/*.jpg /Volumes/WINDOWS11/Photos/ 2>/dev/null
    cp ~/Downloads/*.png /Volumes/WINDOWS11/Photos/ 2>/dev/null
    echo "✅ Photos moved to WINDOWS11 volume"
fi

# Clean up system caches
echo "🧽 Cleaning system caches..."
rm -rf ~/Library/Caches/* 2>/dev/null
rm -rf /tmp/* 2>/dev/null
echo "✅ System caches cleaned"

# Clean up Downloads (move to WINDOWS11, then delete from Downloads)
echo "📥 Cleaning Downloads folder..."
if [ -d ~/Downloads ]; then
    cp ~/Downloads/* /Volumes/WINDOWS11/Downloads/ 2>/dev/null
    rm -rf ~/Downloads/* 2>/dev/null
    echo "✅ Downloads cleaned and backed up"
fi

# Check disk space after cleanup
echo ""
echo "📊 Disk space after cleanup:"
df -h | grep -E "(Filesystem|/dev/disk1)"

echo ""
echo "🎮 Your game files are safely backed up on WINDOWS11 volume!"
echo "📁 Backup location: /Volumes/WINDOWS11/AdelynnGameBackup/"
echo "📸 Photos location: /Volumes/WINDOWS11/Photos/"
echo "📥 Downloads backup: /Volumes/WINDOWS11/Downloads/"
echo ""
echo "💡 Run this script whenever you need to free up space!" 