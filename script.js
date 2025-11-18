/**
 * Delta Exchange Funding Monitor - API Key Version
 * Designed for Mobile App Experience
 */

// ==========================================
// 🔑 CONFIGURATION (अपनी KEY यहाँ डालें)
// ==========================================
const API_KEY = "yL8vA2msxSEBtlLwqHvTKE4iDfqNWb"; 
// ==========================================

const API_URL = "https://api.delta.exchange/v2/products";
const THRESHOLD = 0.0050; // 0.50%
const REFRESH_TIME = 5 * 60; // 5 minutes in seconds

// Elements
const grid = document.getElementById('crypto-grid');
const statusBadge = document.getElementById('connection-status');
const statusDot = document.querySelector('.dot');
const countdownEl = document.getElementById('countdown');

let countdownTimer = REFRESH_TIME;

// --- 1. Fetch Data Function ---
async function fetchMarketData() {
    updateStatus('updating');
    
    try {
        // API Call with Headers
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // अगर Delta सिर्फ api-key header मांगता है तो इसे use करे,
                // अगर Bearer token मांगता है तो 'Authorization': `Bearer ${API_KEY}` use करें.
                // यहाँ हम एक सामान्य तरीका अपना रहे हैं:
                'api-key': API_KEY 
            }
        });

        if (!response.ok) throw new Error('API Failed');

        const data = await response.json();
        
        // Process Data
        if(Array.isArray(data)) {
            renderCards(data);
            updateStatus('connected');
            resetTimer();
        }

    } catch (error) {
        console.error(error);
        updateStatus('error');
        grid.innerHTML = `<div class="loading-spinner" style="color:#ef4444">Error loading data. <br> Check API Key.</div>`;
    }
}

// --- 2. Render Cards Function ---
function renderCards(products) {
    grid.innerHTML = ''; // Clear existing
    let hasOpportunities = false;

    products.forEach(product => {
        // Filter: Only Perpetuals & Check Funding Rate
        if (product.perpetual && product.funding_rate) {
            
            const rate = parseFloat(product.funding_rate);
            const absRate = Math.abs(rate);

            // CHECK THRESHOLD (0.50%)
            if (absRate >= THRESHOLD) {
                hasOpportunities = true;
                createCard(product.symbol, rate);
            }
        }
    });

    if (!hasOpportunities) {
        grid.innerHTML = `
            <div class="loading-spinner">
                No crypto above 0.50% right now.<br>
                Scanning market...
            </div>`;
    }
}

// --- 3. Create HTML Card ---
function createCard(symbol, rate) {
    const ratePercent = (rate * 100).toFixed(4) + '%';
    const isPositive = rate > 0;
    
    const cardType = isPositive ? 'long' : 'short';
    const badgeText = isPositive ? 'PAY SHORT' : 'PAY LONG';
    
    const div = document.createElement('div');
    div.className = `card ${cardType}`;
    
    div.innerHTML = `
        <div class="symbol-info">
            <h2>${symbol}</h2>
            <span class="badge ${cardType}">${badgeText}</span>
        </div>
        <div class="rate-info">
            <span class="rate-val">${ratePercent}</span>
            <p>Funding Rate</p>
        </div>
    `;
    
    grid.appendChild(div);
}

// --- 4. Utilities ---
function updateStatus(state) {
    if (state === 'connected') {
        statusBadge.innerHTML = '<span class="dot"></span> Live';
        statusBadge.classList.add('status-connected');
        statusBadge.classList.remove('status-error');
    } else if (state === 'error') {
        statusBadge.innerHTML = '<span class="dot"></span> Error';
        statusBadge.classList.add('status-error');
    } else {
        statusBadge.innerHTML = '<span class="dot"></span> Updating...';
    }
}

function resetTimer() {
    countdownTimer = REFRESH_TIME;
}

// --- 5. Timer & Init ---
setInterval(() => {
    if(countdownTimer > 0) {
        countdownTimer--;
        // Format MM:SS
        const m = Math.floor(countdownTimer / 60);
        const s = countdownTimer % 60;
        countdownEl.textContent = `${m}:${s < 10 ? '0'+s : s}`;
    } else {
        fetchMarketData(); // Timer ends, fetch new data
    }
}, 1000);

// Start on load
fetchMarketData();
