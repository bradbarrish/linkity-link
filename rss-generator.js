import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Raindrop.io API Configuration
const RAINDROP_CONFIG = {
    TEST_TOKEN: '28588c25-dec4-4966-afe1-9ce1f9c374ff',
    BASE_URL: 'https://api.raindrop.io/rest/v1',
    DEFAULT_COLLECTION: 0
};

async function fetchCollections() {
    const response = await fetch(`${RAINDROP_CONFIG.BASE_URL}/collections`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${RAINDROP_CONFIG.TEST_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) throw new Error(`Collections request failed`);
    const data = await response.json();
    return data.items;
}

async function fetchBookmarks() {
    try {
        const collections = await fetchCollections();
        const linkityCollection = collections.find(col => col.title === 'Linkity Link');
        
        const collectionId = linkityCollection ? linkityCollection._id : RAINDROP_CONFIG.DEFAULT_COLLECTION;
        
        const response = await fetch(`${RAINDROP_CONFIG.BASE_URL}/raindrops/${collectionId}?sort=-created&perpage=50`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${RAINDROP_CONFIG.TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`API request failed`);
        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        return [];
    }
}

function generateRSS(bookmarks) {
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Linkity Link</title>
        <link>https://linkitylink.lol</link>
        <description>A curated collection of interesting links by Brad Barrish</description>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="https://linkitylink.lol/rss.xml" rel="self" type="application/rss+xml" />
        ${bookmarks.map(bookmark => `
        <item>
            <title><![CDATA[${bookmark.title}]]></title>
            <link>${bookmark.link}</link>
            <guid>${bookmark.link}</guid>
            <pubDate>${new Date(bookmark.created).toUTCString()}</pubDate>
            <description><![CDATA[${bookmark.note || bookmark.excerpt || ''}]]></description>
        </item>`).join('')}
    </channel>
</rss>`;
    
    return rss;
}

async function generateRSSFeed() {
    try {
        console.log('Fetching bookmarks from Raindrop.io...');
        const bookmarks = await fetchBookmarks();
        
        if (bookmarks.length === 0) {
            console.log('No bookmarks found');
            return;
        }
        
        console.log(`Found ${bookmarks.length} bookmarks`);
        
        const rssContent = generateRSS(bookmarks);
        
        // Write RSS file
        fs.writeFileSync('rss.xml', rssContent);
        console.log('RSS feed generated successfully: rss.xml');
        
    } catch (error) {
        console.error('Error generating RSS feed:', error);
    }
}

// Run the generator
generateRSSFeed(); 