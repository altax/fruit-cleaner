// ==========================================
// CONFIGURATION
// ==========================================
// Keywords to search for in the text (Latin and Cyrillic 'Nix')
const TARGET_KEYWORDS = ['nix', 'никс']; 
const TARGET_URL_SLUG = '/nix-';
const CARD_SELECTORS = 'article, li, [class*="card"], [class*="item"], [class*="material"]';

// ==========================================
// 1. CSS EARLY BLOCK (Prevents flickering)
// ==========================================
// Injected at document_start to hide the cards before the browser paints them
(function injectKillCSS() {
    const css = `
        a[href*="${TARGET_URL_SLUG}"] { display: none !important; }
        article:has(a[href*="${TARGET_URL_SLUG}"]):not(:has(article)) { display: none !important; }
        li:has(a[href*="${TARGET_URL_SLUG}"]):not(:has(li)) { display: none !important; }
        [class*="card"]:has(a[href*="${TARGET_URL_SLUG}"]):not(:has(article, [class*="card"])) { display: none !important; }
        [class*="item"]:has(a[href*="${TARGET_URL_SLUG}"]):not(:has(article, [class*="item"])) { display: none !important; }
        [class*="material"]:has(a[href*="${TARGET_URL_SLUG}"]):not(:has(article, [class*="material"])) { display: none !important; }
        [class~="news"]:has(a[href*="${TARGET_URL_SLUG}"]):not(:has(article, [class*="card"], [class*="item"])) { display: none !important; }
    `;

    const style = document.createElement('style');
    style.id = 'fruit-cleaner-css';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
})();

// ==========================================
// 2. BACKUP JS FILTER (For dynamic content)
// ==========================================
// Used as a fallback in case the CSS :has() selector fails
function containsBlockedKeyword(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return TARGET_KEYWORDS.some(kw => lower.includes(kw));
}

function hideNixNews(rootNode = document) {
    rootNode.querySelectorAll('a').forEach(link => {
        if (containsBlockedKeyword(link.textContent)) {
            const card = link.closest(CARD_SELECTORS);
            if (card && card.style.display !== 'none') {
                card.style.display = 'none';
            }
        }
    });
}

// ==========================================
// 3. SEARCH OVERLAY (Shadow DOM)
// ==========================================
// Replaces the search results with a custom message if the query is "nix"
function isSearchNix() {
    try {
        const url = new URL(location.href);
        if (url.pathname !== '/search') return false;
        const q = (url.searchParams.get('search') || '').toLowerCase().trim();
        return /\bnix\b/.test(q) || q.includes('никс'); // Includes Cyrillic 'никс'
    } catch {
        return false;
    }
}

function showOverlay() {
    if (document.getElementById('fruit-cleaner-overlay') || !document.body) return;

    const host = document.createElement('div');
    host.id = 'fruit-cleaner-overlay';
    const shadow = host.attachShadow({ mode: 'open' });
    
    // Styles are isolated inside Shadow DOM to prevent conflicts with the website's CSS
    const style = document.createElement('style');
    style.textContent = `
        :host {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            z-index: 2147483647; background: linear-gradient(135deg, #1e1e2f 0%, #151520 100%);
            display: flex; align-items: center; justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .close-btn {
            position: absolute; top: 30px; right: 40px; font-size: 48px; font-weight: 300;
            color: #8e8e93; text-decoration: none; line-height: 1;
            transition: color 0.2s, transform 0.2s; cursor: pointer;
        }
        .close-btn:hover { color: #ffffff; transform: scale(1.1); }
        .title {
            font-size: 48px; font-weight: 700; color: #f2f2f7;
            text-align: center; line-height: 1.4; margin: 0; padding: 0 20px;
            letter-spacing: -0.5px;
        }
    `;
    
    const closeBtn = document.createElement('a');
    closeBtn.className = 'close-btn';
    closeBtn.href = '/';
    closeBtn.innerHTML = '&times;';
    
    const title = document.createElement('h1');
    title.className = 'title';
    // Russian text: "read GTA news instead"
    title.textContent = 'почитай лучше новости про гта';
    
    shadow.append(style, closeBtn, title);
    document.body.appendChild(host);
}

function hideOverlay() {
    document.getElementById('fruit-cleaner-overlay')?.remove();
}

function syncSearchPage() {
    if (isSearchNix()) {
        showOverlay();
        setTimeout(showOverlay, 500); // Retry in case Nuxt renders slowly
    } else {
        hideOverlay();
    }
}

// ==========================================
// 4. INIT & SPA NAVIGATION TRACKING
// ==========================================
function boot() {
    hideNixNews();
    
    // Optimized MutationObserver: checks only newly added DOM nodes
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        hideNixNews(node); // Pass only the new node to save resources
                    }
                });
            }
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    syncSearchPage();
}

if (document.body) {
    boot();
} else {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
}

// Track SPA navigation (Nuxt.js changes URL without page reload)
let lastHref = location.href;
setInterval(() => {
    if (location.href !== lastHref) {
        lastHref = location.href;
        syncSearchPage();
    }
}, 300);