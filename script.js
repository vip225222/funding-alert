/**
 * Delta Exchange Funding Monitor - FINAL PRODUCTION READY VERSION
 * Designed to work with a Serverless Proxy (e.g., Netlify/Vercel) to bypass CORS.
 */

// =======================================================
// ⚠️ IMPORTANT: इस URL को अपने Serverless Function URL से बदलें
// For testing on GitHub Pages, use: 
// const API_URL = "https://api.delta.exchange/v2/products"; 
// =======================================================
const API_URL = "https://api.delta.exchange/v2/products"; 
// =======================================================

const FUNDING_THRESHOLD = 0.0050; // 0.50% (Testing ke baad ise 0.0050 rakhein)
const REFRESH_TIME = 5 * 60; // 5 minutes (in seconds)

// DOM Elements
const fundingGrid = document.getElementById('crypto-list') || document.getElementById('funding-grid'); 
const statusBadge = document.getElementById('connection-status');
const countdownEl = document.getElementById('countdown');

let countdownTimer = REFRESH_TIME;

// --- 1. Status Update Utility ---
function updateStatus(state) {
    const badge = statusBadge || document.createElement('div');
    if (state === 'connected') {
        badge.innerHTML = `<span class="dot"></span> Live`;
        badge.classList.add('status-connected');
        badge.classList.remove('status-error');
    } else if (state === 'error') {
        badge.innerHTML = `<span class="dot"></span> Error`;
        badge.classList.add('status-error');
        badge.classList.remove('status-connected');
    } else {
        badge.innerHTML = `<span class="dot"></span> Updating...`;
        badge.classList.remove('status-connected', 'status-error');
    }
}

// --- 2. Main Fetch Function ---
async function fetchMarketData() {
    updateStatus('updating');

    // Show loading spinner while fetching
    fundingGrid.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Scanning Delta Market...</p>
        </div>
    `;
    
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);

        const data = await response.json();
        
        if (data && Array.isArray(data)) {
            renderCards(data);
            updateStatus('connected');
            resetTimer();
        } else {
            throw new Error("Invalid or empty data format received.");
        }

    } catch (error) {
        updateStatus('error');
        fundingGrid.innerHTML = `
            <div class="loading-container">
                <p style="color: #ef4444; font-size: 1.5rem;">❌</p>
                <p style="color: #ef4444;">API Connection Failed.</p>
                <p style="font-size: 0.8rem;">(Need a Serverless Proxy)</p>
            </div>`;
    }
}

// --- 3. Render Cards Function ---
function renderCards(products) {
    fundingGrid.innerHTML = ''; 
    let hasOpportunities = false;
    
    products.forEach(p => {
        // Check for Perpetual Futures and Funding Rate field
        if (p.perpetual === true && p.symbol && p.funding_rate !== undefined) {
            
            const rate = parseFloat(p.funding_rate);
            const absRate = Math.abs(rate);

            if (absRate >= FUNDING_THRESHOLD) {
                hasOpportunities = true;
                const isPositive = rate > 0;
                const ratePercent = (rate * 100).toFixed(4) + '%';
                
                const div = document.createElement('div');
                div.className = `crypto-card ${isPositive ? 'long' : 'short'}`;
                
                div.innerHTML = `
                    <div class="symbol-info">
                        <h2>${p.symbol}</h2>
                        <p>${isPositive ? 'LONG (Pay Short)' : 'SHORT (Pay Long)'}</p>
                    </div>
                    <div class="rate-info">
                        <span class="rate-val" style="color: ${isPositive ? '#10b981' : '#ef4444'}">${ratePercent}</span>
                        <span class="sub-val">Funding Rate</span>
                    </div>
                `;
                fundingGrid.appendChild(div);
            }
        }
    });

    if (!hasOpportunities) {
        fundingGrid.innerHTML = `
            <div class="loading-container">
                <p style="font-size: 2rem;">😴</p>
                <p>Threshold: ${(FUNDING_THRESHOLD * 100).toFixed(2)}%</p>
                <p style="font-size: 0.8rem;">No crypto found.</p>
            </div>`;
    }
}

// --- 4. Timer & Init ---
function resetTimer() { countdownTimer = REFRESH_TIME; }

setInterval(() => {
    if(countdownTimer > 0) {
        countdownTimer--;
        const m = Math.floor(countdownTimer / 60);
        const s = countdownTimer % 60;
        if(countdownEl) countdownEl.textContent = `${m}:${s < 10 ? '0'+s : s}`;
    } else {
        fetchMarketData();
    }
}, 1000);

// Start on load
document.addEventListener('DOMContentLoaded', fetchMarketData);
