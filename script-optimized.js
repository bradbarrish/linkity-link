// Start fetching immediately - don't wait for DOM
const bookmarksPromise = fetchAllBookmarks();

// Setup DOM interactions only after content loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupInteractions);
} else {
    setupInteractions();
}

// Display bookmarks as soon as both DOM and data are ready
Promise.all([
    bookmarksPromise,
    new Promise(resolve => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            resolve();
        } else {
            document.addEventListener('DOMContentLoaded', resolve);
        }
    })
]).then(([{headlineBookmarks, regularBookmarks}]) => {
    displayContent(headlineBookmarks, regularBookmarks);
});

async function fetchAllBookmarks() {
    // Check cache first
    const cachedData = checkCache();
    if (cachedData) {
        // Return cached data immediately, update in background
        updateInBackground();
        return cachedData;
    }
    
    // No cache, fetch fresh data
    return await fetchFreshData();
}

function checkCache() {
    const cached = localStorage.getItem(RAINDROP_CONFIG.STORAGE_KEYS.BOOKMARKS_CACHE);
    const cacheTime = localStorage.getItem(RAINDROP_CONFIG.STORAGE_KEYS.LAST_SYNC);
    
    if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        // Use cache if less than 5 minutes old
        if (age < 300000) {
            const bookmarks = JSON.parse(cached);
            const headline = localStorage.getItem('headline_cache');
            return {
                headlineBookmarks: headline ? [JSON.parse(headline)] : [],
                regularBookmarks: bookmarks
            };
        }
    }
    return null;
}

async function fetchFreshData() {
    const [headlineBookmarks, regularBookmarks] = await Promise.all([
        fetchHeadlineBookmarks(),
        fetchBookmarks()
    ]);
    
    // Cache the results
    if (regularBookmarks.length > 0) {
        localStorage.setItem(RAINDROP_CONFIG.STORAGE_KEYS.BOOKMARKS_CACHE, JSON.stringify(regularBookmarks));
        localStorage.setItem(RAINDROP_CONFIG.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    }
    if (headlineBookmarks.length > 0) {
        localStorage.setItem('headline_cache', JSON.stringify(headlineBookmarks[0]));
    }
    
    return { headlineBookmarks, regularBookmarks };
}

async function updateInBackground() {
    // Silently update cache in background
    fetchFreshData().then(({headlineBookmarks, regularBookmarks}) => {
        // Only update display if content actually changed
        const currentCache = localStorage.getItem(RAINDROP_CONFIG.STORAGE_KEYS.BOOKMARKS_CACHE);
        const newCache = JSON.stringify(regularBookmarks);
        if (currentCache !== newCache) {
            displayContent(headlineBookmarks, regularBookmarks);
        }
    }).catch(() => {}); // Silently fail background updates
}

function displayContent(headlineBookmarks, regularBookmarks) {
    if (headlineBookmarks.length > 0) {
        displayHeadline(headlineBookmarks[0]);
    }
    
    if (regularBookmarks.length > 0) {
        displayBookmarks(regularBookmarks);
    } else {
        showEmptyState();
    }
}

// Simplified fetch functions without console.log
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

async function fetchHeadlineBookmarks() {
    try {
        const collections = await fetchCollections();
        const headlineCollection = collections.find(col => col.title === 'Linkity Link Headline');
        
        if (!headlineCollection) return [];
        
        const response = await fetch(`${RAINDROP_CONFIG.BASE_URL}/raindrops/${headlineCollection._id}?sort=-created&perpage=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${RAINDROP_CONFIG.TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`Headline request failed`);
        const data = await response.json();
        return data.items;
    } catch (error) {
        return [];
    }
}

async function fetchBookmarks() {
    try {
        const collections = await fetchCollections();
        const linkityCollection = collections.find(col => col.title === 'Linkity Link');
        
        const collectionId = linkityCollection ? linkityCollection._id : RAINDROP_CONFIG.DEFAULT_COLLECTION;
        
        const response = await fetch(`${RAINDROP_CONFIG.BASE_URL}/raindrops/${collectionId}?sort=-created&perpage=18`, {
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
        // Try cache on error
        const cached = localStorage.getItem(RAINDROP_CONFIG.STORAGE_KEYS.BOOKMARKS_CACHE);
        return cached ? JSON.parse(cached) : [];
    }
}

function displayHeadline(headlineBookmark) {
    const headlineSection = document.getElementById('headline-link');
    const headlineText = headlineBookmark.note || headlineBookmark.excerpt || headlineBookmark.title;
    headlineSection.innerHTML = `<a href="${headlineBookmark.link}" target="_blank">${headlineText}</a>`;
    headlineSection.style.display = 'block';
}

function displayBookmarks(bookmarks) {
    const columns = [
        document.getElementById('column-1'),
        document.getElementById('column-2'),
        document.getElementById('column-3')
    ];

    // Clear columns
    columns.forEach(column => column.innerHTML = '');

    // Distribute bookmarks
    const itemsPerColumn = Math.ceil(bookmarks.length / 3);
    
    bookmarks.forEach((bookmark, index) => {
        const columnIndex = Math.floor(index / itemsPerColumn);
        const targetColumn = columns[Math.min(columnIndex, 2)];
        targetColumn.appendChild(createNewsItem(bookmark));
    });
}

function createNewsItem(bookmark) {
    const domain = getDomain(bookmark.link);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
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

// Utility functions
function getDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch (e) {
        return 'unknown';
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

function showEmptyState() {
    document.getElementById('column-1').innerHTML = `
        <div class="empty-item">No bookmarks found</div>
    `;
}

// Setup interactions (animations) - delayed to not block initial render
function setupInteractions() {
    // Delay animations slightly to prioritize content
    setTimeout(() => {
        setupClickAnimation();
        setupAnimatedCursor();
    }, 100);
}

// Simplified animation setup
function setupClickAnimation() {
    document.addEventListener('click', (e) => {
        const chars = ['*', '+', 'x', 'o', '.', '#', '@', '%', '&'];
        const element = document.createElement('div');
        element.className = 'ascii-particle';
        element.textContent = chars[Math.floor(Math.random() * chars.length)];
        element.style.left = e.clientX + 'px';
        element.style.top = e.clientY + 'px';
        document.body.appendChild(element);
        setTimeout(() => element.remove(), 800);
    });
}

function setupAnimatedCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'animated-cursor';
    cursor.textContent = '+';
    document.body.appendChild(cursor);
    
    const cursorChars = ['+', 'x', '*', 'o', '•', '○'];
    let cursorIndex = 0;
    let isThrottled = false;
    
    document.addEventListener('mousemove', (e) => {
        if (!isThrottled) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            isThrottled = true;
            requestAnimationFrame(() => isThrottled = false);
        }
    });
    
    setInterval(() => {
        cursor.textContent = cursorChars[cursorIndex];
        cursorIndex = (cursorIndex + 1) % cursorChars.length;
    }, 300);
}