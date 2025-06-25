#!/bin/bash

# Install dependencies
npm install

# Generate RSS feed
npm run generate-rss

echo "RSS feed generated successfully!"
echo "You can now deploy your site with the rss.xml file." 