// Client-side RSS generator
// This can be run in the browser or with a simple HTTP server

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

function downloadRSS(rssContent, filename = 'rss.xml') {
    const blob = new Blob([rssContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to generate and download RSS
async function generateAndDownloadRSS() {
    try {
        console.log('Fetching bookmarks from Raindrop.io...');
        const bookmarks = await fetchBookmarks();
        
        if (bookmarks.length === 0) {
            console.log('No bookmarks found');
            return;
        }
        
        console.log(`Found ${bookmarks.length} bookmarks`);
        
        const rssContent = generateRSS(bookmarks);
        
        // Download the RSS file
        downloadRSS(rssContent);
        console.log('RSS feed generated and downloaded successfully!');
        
    } catch (error) {
        console.error('Error generating RSS feed:', error);
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.generateAndDownloadRSS = generateAndDownloadRSS;
} 