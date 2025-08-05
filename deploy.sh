#!/bin/bash

echo "🚀 Starting Linkity Link deployment process..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Generate RSS feed
echo "📡 Generating RSS feed..."
npm run generate-rss
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate RSS feed"
    exit 1
fi

# Check if RSS file was created/updated
if [ -f "rss.xml" ]; then
    ITEM_COUNT=$(grep -c "<item>" rss.xml)
    echo "✅ RSS feed generated successfully with $ITEM_COUNT items"
    echo "📅 Last build date: $(grep "<lastBuildDate>" rss.xml | sed 's/.*<lastBuildDate>//;s/<\/lastBuildDate>.*//')"
else
    echo "⚠️  Warning: rss.xml file not found"
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo "📌 Next steps:"
echo "   1. Commit your changes: git add . && git commit -m 'Update RSS feed'"
echo "   2. Push to GitHub: git push"
echo "   3. Your RSS feed will be available at: https://linkitylink.lol/rss.xml" 