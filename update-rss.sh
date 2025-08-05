#!/bin/bash

echo "📡 Quick RSS Update for Linkity Link"
echo ""

# Generate RSS feed
echo "🔄 Generating RSS feed..."
node rss-generator.js

if [ $? -eq 0 ] && [ -f "rss.xml" ]; then
    ITEM_COUNT=$(grep -c "<item>" rss.xml)
    echo "✅ RSS feed updated with $ITEM_COUNT items"
    echo "📅 Last update: $(date)"
else
    echo "❌ Failed to update RSS feed"
    exit 1
fi