// Retro ASCII Characters for animations
const ASCII_CHARS = ['*', '+', 'x', 'o', '.', '#', '@', '%', '&'];
const ANIMATION_CHARS = ['*', '+', 'x', '.', ' '];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupClickAnimation();
    setupAnimatedCursor();
});

async function initializeApp() {
    try {
        console.log('┌─ Linkity Link initialized ─┐');
        
        // Fetch headline and regular bookmarks in parallel
        const [headlineBookmarks, regularBookmarks] = await Promise.all([
            fetchHeadlineBookmarks().catch(() => []),
            fetchBookmarks().catch(() => [])
        ]);
        
        // Hide loading and display content
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        // Display headline if available
        if (headlineBookmarks.length > 0) {
            displayHeadline(headlineBookmarks[0]);
        }
        
        // Display regular bookmarks
        if (regularBookmarks.length > 0) {
            displayBookmarks(regularBookmarks);
        } else {
            showEmptyState();
        }
        
    } catch (error) {
        console.error('App initialization failed:', error);
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
        showErrorState();
    }
}

function setupClickAnimation() {
    document.addEventListener('click', (e) => {
        createASCIIAnimation(e.clientX, e.clientY);
    });
}

function createASCIIAnimation(x, y) {
    const char = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
    const element = document.createElement('div');
    element.className = 'ascii-particle';
    element.textContent = char;
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    
    document.body.appendChild(element);
    
    // Remove element after animation completes
    setTimeout(() => element.remove(), 800);
}


function setupAnimatedCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'animated-cursor';
    cursor.textContent = '+';
    document.body.appendChild(cursor);
    
    let cursorIndex = 0;
    const cursorChars = ['+', 'x', '*', 'o', '•', '○'];
    
    // Throttled mouse move for better performance
    let isThrottled = false;
    document.addEventListener('mousemove', (e) => {
        if (!isThrottled) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            isThrottled = true;
            requestAnimationFrame(() => isThrottled = false);
        }
    });
    
    // Animate cursor character
    setInterval(() => {
        cursor.textContent = cursorChars[cursorIndex];
        cursorIndex = (cursorIndex + 1) % cursorChars.length;
    }, 300);
}


function showEmptyState() {
    const bookmarksList = document.getElementById('bookmarks-list');
    bookmarksList.innerHTML = `
        <div class="empty-item">No bookmarks found in your Raindrop.io account</div>
        <div class="empty-item">Add some bookmarks to see them here</div>
    `;
}

function showErrorState() {
    const bookmarksList = document.getElementById('bookmarks-list');
    bookmarksList.innerHTML = `
        <div class="error-item">Failed to connect to Raindrop.io API</div>
        <div class="error-item">Check console for details</div>
    `;
}

// Raindrop.io API functions
async function fetchCollections() {
    try {
        const token = RAINDROP_CONFIG.TEST_TOKEN;
        const response = await fetch(`${RAINDROP_CONFIG.BASE_URL}/collections`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Collections request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error fetching collections:', error);
        return [];
    }
}

async function fetchHeadlineBookmarks() {
    try {
        console.log('┌─ Fetching headline bookmarks ─┐');
        
        // First get collections to find "Linkity Link Headline"
        const collections = await fetchCollections();
        const headlineCollection = collections.find(col => col.title === 'Linkity Link Headline');
        
        if (!headlineCollection) {
            console.log('└─ Linkity Link Headline collection not found ─┘');
            return [];
        }
        
        const token = RAINDROP_CONFIG.TEST_TOKEN;
        const response = await fetch(`${RAINDROP_CONFIG.BASE_URL}/raindrops/${headlineCollection._id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Headline request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('└─ Headline bookmarks fetched successfully ─┘');
        
        return data.items;
    } catch (error) {
        console.error('Error fetching headline bookmarks:', error);
        return [];
    }
}


async function fetchBookmarks() {
    try {
        console.log('┌─ Fetching bookmarks from Linkity Link collection ─┐');
        
        // First get collections to find "Linkity Link"
        const collections = await fetchCollections();
        const linkityCollection = collections.find(col => col.title === 'Linkity Link');
        
        let collectionId;
        if (!linkityCollection) {
            console.log('└─ Linkity Link collection not found, using default ─┘');
            // Fall back to default collection if Linkity Link not found
            collectionId = RAINDROP_CONFIG.DEFAULT_COLLECTION;
        } else {
            collectionId = linkityCollection._id;
        }
        
        const token = RAINDROP_CONFIG.TEST_TOKEN;
        const response = await fetch(`${RAINDROP_CONFIG.BASE_URL}/raindrops/${collectionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('└─ Bookmarks fetched successfully ─┘');
        
        // Limit to most recent 18 items
        const limitedItems = data.items.slice(0, 18);
        
        // Cache the bookmarks
        localStorage.setItem(RAINDROP_CONFIG.STORAGE_KEYS.BOOKMARKS_CACHE, JSON.stringify(limitedItems));
        localStorage.setItem(RAINDROP_CONFIG.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        
        return limitedItems;
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        
        // Try to load from cache
        const cachedBookmarks = localStorage.getItem(RAINDROP_CONFIG.STORAGE_KEYS.BOOKMARKS_CACHE);
        if (cachedBookmarks) {
            console.log('└─ Loading bookmarks from cache ─┘');
            return JSON.parse(cachedBookmarks);
        }
        
        // Return empty array if no cache
        return [];
    }
}


function displayHeadline(headlineBookmark) {
    const headlineSection = document.getElementById('headline-link');
    // Use the description field for headline text, fall back to title if no description
    const headlineText = headlineBookmark.note || headlineBookmark.excerpt || headlineBookmark.title;
    headlineSection.innerHTML = `<a href="${headlineBookmark.link}" target="_blank">${headlineText}</a>`;
    headlineSection.style.display = 'block';
}

function displayBookmarks(bookmarks) {
    if (bookmarks.length === 0) {
        showEmptyState();
        return;
    }

    // Show the container
    document.getElementById('columns-container').style.display = 'flex';

    // Distribute all bookmarks across three columns
    distributeBookmarksToColumns(bookmarks);
}

function distributeBookmarksToColumns(bookmarks) {
    const columns = [
        document.getElementById('column-1'),
        document.getElementById('column-2'),
        document.getElementById('column-3')
    ];

    // Clear columns
    columns.forEach(column => column.innerHTML = '');

    // Calculate items per column for sequential distribution
    const itemsPerColumn = Math.ceil(bookmarks.length / 3);
    
    bookmarks.forEach((bookmark, index) => {
        // Determine which column based on sequential order (fill column 1, then 2, then 3)
        const columnIndex = Math.floor(index / itemsPerColumn);
        const targetColumn = columns[Math.min(columnIndex, 2)]; // Ensure we don't exceed 3 columns
        
        const newsItem = createNewsItem(bookmark);
        targetColumn.appendChild(newsItem);
    });
}

function createNewsItem(bookmark) {
    const domain = getDomain(bookmark.link);
    const faviconUrl = getFaviconUrl(bookmark.link);
    const summary = bookmark.note || bookmark.excerpt || '';

    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    newsItem.innerHTML = `
        <div class="favicon">
            <img src="${faviconUrl}" alt="${domain}" onerror="this.style.display='none'">
        </div>
        <div class="news-content">
            <a href="${bookmark.link}" class="news-title" target="_blank">${bookmark.title}</a>
            ${summary ? `<div class="news-summary">${summary}</div>` : ''}
            <div class="news-meta">
                <span class="news-time">${formatDate(bookmark.created)}</span>
            </div>
        </div>
    `;

    return newsItem;
}

function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (e) {
        return 'unknown';
    }
}

function getFaviconUrl(url) {
    try {
        const urlObj = new URL(url);
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`;
    } catch (e) {
        return 'data:image/gif;base64,R0lGODlhEAAQAIAAAAAAAP///yH5BAEAAAAALAAAAAAQABAAAAL+jI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jef6zvf+DwwKh8Si8YhMKpfMpvMJjUqn1Kr1is1qt9yu9wsOi8fksvmMTqvX7Lb7DY/L5/S6/Y7P6/f8vv8PGCg4SFhoeIiYqLjI2Oj4CBkpOUlZaXmJmam5ydnp+QkaKjpKWmp6ipqqusra6voKGys7S1tre4ubq7vL2+v7CxwsPExcbHyMnKy8zNzs/AwdLT1NXW19jZ2tvc3d7f0NHi4+Tl5ufo6err7O3u7+Dh8vP09fb3+Pn6+/z9/v/w8woMCBBAsaPIgwocKFDBs6fAgxosSJFCtavIgxo8aN';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const timeString = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `at ${timeString} on ${year}-${month}-${day}`;
}