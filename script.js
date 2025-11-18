/**
 * Delta Exchange Funding Monitor - With Loading Animation
 */

// ==========================================
// 🔑 CONFIGURATION
// ==========================================
const API_KEY = "yL8vA2msxSEBtlLwqHvTKE4iDfqNWb"; // <--- अपनी Key यहाँ डालें
// ==========================================

const API_URL = "https://api.delta.exchange/v2/products";
const THRESHOLD = 0.0001; // 0.01%
const REFRESH_TIME = 5 * 60; // 5 minutes

// Elements
const grid = document.getElementById('crypto-grid');
const statusBadge = document.getElementById('connection-status');
const countdownEl = document.getElementById('countdown');

let countdownTimer = REFRESH_TIME;

// --- 1. Fetch Data Function ---
async function fetchMarketData() {
    updateStatus('updating');

    // 🔥 SHOW LOADING SPINNER 🔥
    // जब तक डेटा नहीं आता, यह एनिमेशन दिखाओ
    grid.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Scanning Market Data...</p>
        </div>
    `;
    
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'api-key': API_KEY
            }
        });

        if (!response.ok) throw new Error('API Failed');

        const data = await response.json();
        
        if(Array.isArray(data)) {
            renderCards(data);
            updateStatus('connected');
            resetTimer();
        } else if (data.result && Array.isArray(data.result)) {
             // कभी कभी डेटा data.result के अंदर होता है
            renderCards(data.result);
            updateStatus('connected');
            resetTimer();
        }

    } catch (error) {
        console.error(error);
        updateStatus('error');
        // Error आने पर भी दिखेगा कि क्या हुआ
        grid.innerHTML = `
            <div class="loading-container">
                <p style="color: #ef4444; font-size: 1.5rem;">⚠️</p>
                <p style="color: #ef4444;">Connection Failed</p>
                <p style="font-size: 0.8rem;">Retrying in 5 min...</p>
            </div>`;
    }
}

// --- 2. Render Cards Function ---
function renderCards(products) {
    // पहले ग्रिड खाली करें
    grid.innerHTML = ''; 
    let hasOpportunities = false;

    products.forEach(product => {
        if (product.perpetual && product.funding_rate) {
            
            const rate = parseFloat(product.funding_rate);
            const absRate = Math.abs(rate);

            if (absRate >= THRESHOLD) {
                hasOpportunities = true;
                createCard(product.symbol, rate);
            }
        }
    });

    if (!hasOpportunities) {
        // अगर कोई डेटा 0.50% के ऊपर नहीं है
        grid.innerHTML = `
            <div class="loading-container">
                <p style="font-size: 2rem;">😴</p>
                <p>Market is calm.</p>
                <p style="font-size: 0.8rem;">No crypto above 0.50% funding.</p>
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
        statusBadge.classList.remove('status-connected');
        statusBadge.classList.remove('status-error');
    }
}

function resetTimer() {
    countdownTimer = REFRESH_TIME;
}

// --- 5. Timer & Init ---
setInterval(() => {
    if(countdownTimer > 0) {
        countdownTimer--;
        const m = Math.floor(countdownTimer / 60);
        const s = countdownTimer % 60;
        countdownEl.textContent = `${m}:${s < 10 ? '0'+s : s}`;
    } else {
        fetchMarketData();
    }
}, 1000);

// Start on load
fetchMarketData();
