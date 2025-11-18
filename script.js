/**
 * Delta Exchange Monitor - FINAL PUBLIC REST API VERSION
 * NO API KEY REQUIRED. Uses the stable /v2/products endpoint.
 */

// 1. कॉन्फ़िगरेशन
// अब API Key की कोई जरूरत नहीं है
const API_URL = "https://api.delta.exchange/v2/products"; 
const FUNDING_THRESHOLD = 0.0001; // TESTING THRESHOLD (0.01%) - बाद में 0.0050 कर दें
const REFRESH_TIME = 5 * 60; // 5 minutes

// Elements (पुराने HTML structure के अनुसार)
const fundingGrid = document.getElementById('crypto-grid') || document.getElementById('funding-grid'); 
const statusBadge = document.getElementById('connection-status');
const countdownEl = document.getElementById('countdown');
const debugLog = document.getElementById('debug-log'); // Debug area (if present)

let countdownTimer = REFRESH_TIME;
let marketRates = {};

// Helper function for status/logging
function updateStatus(state, message = '') {
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
    if (debugLog) debugLog.innerHTML += `<p>${new Date().toLocaleTimeString()} - ${state}: ${message}</p>`;
}

// --- 2. Main Fetch Function ---
async function fetchMarketData() {
    updateStatus('updating', 'Starting fetch...');

    fundingGrid.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Scanning Public Market Data...</p>
        </div>
    `;
    
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);

        const data = await response.json();
        
        if (data && Array.isArray(data)) {
            marketRates = {};
            
            data.forEach(product => {
                // Check for Perpetual Futures and Funding Rate field
                if (product.perpetual === true && product.symbol && product.funding_rate !== undefined) {
                    const rate = parseFloat(product.funding_rate);
                    if (!isNaN(rate)) {
                        marketRates[product.symbol] = rate;
                    }
                }
            });

            renderCards(marketRates);
            updateStatus('connected', `Processed ${Object.keys(marketRates).length} symbols.`);
            resetTimer();

        } else {
            throw new Error("Invalid or empty data format received.");
        }

    } catch (error) {
        updateStatus('error', `Fetch Error: ${error.message}`);
        fundingGrid.innerHTML = `
            <div class="loading-container">
                <p style="color: #ef4444; font-size: 1.5rem;">❌</p>
                <p style="color: #ef4444;">API Connection Failed.</p>
                <p style="font-size: 0.8rem;">Check network or endpoint URL.</p>
            </div>`;
    }
}

// --- 3. Render Cards Function ---
function renderCards(rates) {
    fundingGrid.innerHTML = ''; 
    let hasOpportunities = false;
    
    const currentThreshold = FUNDING_THRESHOLD; 

    for (const symbol in rates) {
        const rate = rates[symbol];
        const absRate = Math.abs(rate);

        if (absRate >= currentThreshold) {
            hasOpportunities = true;
            const isPositive = rate > 0;
            const ratePercent = (rate * 100).toFixed(4) + '%';
            
            const div = document.createElement('div');
            div.className = `card ${isPositive ? 'long' : 'short'}`;
            div.innerHTML = `
                <div class="symbol-info">
                    <h2>${symbol}</h2>
                    <p>${isPositive ? 'PAY SHORT' : 'PAY LONG'}</p>
                </div>
                <div class="rate-info">
                    <span class="rate-val" style="color: ${isPositive ? '#10b981' : '#ef4444'}">${ratePercent}</span>
                    <span class="sub-val">Funding</span>
                </div>
            `;
            fundingGrid.appendChild(div);
        }
    }

    if (!hasOpportunities) {
        fundingGrid.innerHTML = `
            <div class="loading-container">
                <p style="font-size: 2rem;">😴</p>
                <p>Threshold: ${(currentThreshold * 100).toFixed(2)}%</p>
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

// Start
document.addEventListener('DOMContentLoaded', fetchMarketData);
