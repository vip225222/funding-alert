let autoRefreshInterval;
let countdownInterval;
let secondsRemaining = 60;
let retryCount = 0;
const maxRetries = 3;

// Multiple CORS proxies
const proxies = [
    { name: 'AllOrigins', url: (api) => `https://api.allorigins.win/raw?url=${encodeURIComponent(api)}` },
    { name: 'CORSProxy', url: (api) => `https://corsproxy.io/?${encodeURIComponent(api)}` },
    { name: 'ThingProxy', url: (api) => `https://thingproxy.freeboard.io/fetch/${api}` }
];

let currentProxyIndex = 0;

// Update connection status in UI
function updateConnectionStatus(message, type = 'loading') {
    const statusEl = document.getElementById('connectionStatus');
    const indicator = document.getElementById('statusIndicator');
    
    statusEl.textContent = message;
    indicator.className = `status-indicator ${type}`;
}

// Update loading messages
function updateLoadingMessage(mainText, detailText) {
    const loadingText = document.getElementById('loadingText');
    const loadingDetail = document.getElementById('loadingDetail');
    
    if (loadingText) loadingText.textContent = mainText;
    if (loadingDetail) loadingDetail.textContent = detailText;
}

// Main fetch function
async function fetchData() {
    const btn = document.getElementById('refreshBtn');
    const loadingMsg = document.getElementById('loadingMessage');
    const errorMsg = document.getElementById('errorMessage');
    const warningMsg = document.getElementById('warningMessage');
    const container = document.getElementById('cryptoContainer');

    // Reset UI
    btn.disabled = true;
    btn.textContent = '⏳ Loading...';
    loadingMsg.style.display = 'block';
    errorMsg.innerHTML = '';
    warningMsg.innerHTML = '';
    container.innerHTML = '';
    
    updateConnectionStatus('Connecting...', 'loading');
    updateLoadingMessage('🔄 Connecting to Delta Exchange...', 'Initializing...');

    // Try each proxy
    for (let i = 0; i < proxies.length; i++) {
        currentProxyIndex = (currentProxyIndex + i) % proxies.length;
        const proxy = proxies[currentProxyIndex];
        
        try {
            console.log(`[${new Date().toLocaleTimeString()}] Trying ${proxy.name}...`);
            
            updateLoadingMessage(
                `🔄 Trying ${proxy.name}...`,
                `Attempt ${i + 1} of ${proxies.length}`
            );
            updateConnectionStatus(`Trying ${proxy.name}...`, 'loading');
            
            const apiUrl = 'https://api.delta.exchange/v2/tickers';
            const proxyUrl = proxy.url(apiUrl);
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.result || !Array.isArray(data.result)) {
                throw new Error('Invalid data format');
            }

            // SUCCESS!
            console.log(`[${new Date().toLocaleTimeString()}] ✅ Success with ${proxy.name}`);
            
            updateLoadingMessage('✅ Connected! Processing data...', `Using ${proxy.name}`);
            updateConnectionStatus('Connected ✓', 'success');
            
            // Filter cryptos
            const filteredCryptos = data.result.filter(crypto => {
                const fundingRate = parseFloat(crypto.funding_rate) * 100;
                return Math.abs(fundingRate) >= 0.50;
            });

            console.log(`Found ${filteredCryptos.length} cryptos above threshold`);
            
            // Display results
            displayCryptos(filteredCryptos);
            updateStats(filteredCryptos);
            updateLastUpdateTime();
            resetCountdown();
            retryCount = 0;
            
            // Success message
            warningMsg.innerHTML = `
                <div class="warning success-banner">
                    ✅ <strong>Successfully Connected!</strong><br>
                    <small>Using: ${proxy.name} | Found: ${filteredCryptos.length} cryptos | Time: ${new Date().toLocaleTimeString()}</small>
                </div>
            `;
            setTimeout(() => {
                warningMsg.innerHTML = '';
            }, 8000);
            
            loadingMsg.style.display = 'none';
            btn.disabled = false;
            btn.textContent = '🔄 Refresh Now';
            
            return; // Exit on success

        } catch (error) {
            console.error(`[${new Date().toLocaleTimeString()}] ❌ ${proxy.name} failed:`, error.message);
            
            updateLoadingMessage(
                `⚠️ ${proxy.name} failed`,
                `Error: ${error.message} - Trying next...`
            );
            
            // Wait before trying next
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // If last proxy failed
            if (i === proxies.length - 1) {
                updateConnectionStatus('Connection Failed ✗', 'error');
                
                errorMsg.innerHTML = `
                    <div class="error">
                        ⚠️ <strong>All Connection Attempts Failed</strong><br>
                        <small>Tried ${proxies.length} different proxies</small><br>
                        <small style="opacity: 0.7;">Last Error: ${error.message}</small><br>
                        <br>
                        <strong>Auto-retry in 10 seconds...</strong>
                    </div>
                `;
                
                // Auto retry
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`[${new Date().toLocaleTimeString()}] 🔄 Auto retry ${retryCount}/${maxRetries}`);
                    setTimeout(() => fetchData(), 10000);
                } else {
                    console.log(`[${new Date().toLocaleTimeString()}] ❌ Max retries reached`);
                    errorMsg.innerHTML += `<br><small>Max retries reached. Please refresh manually.</small>`;
                }
            }
        }
    }

    loadingMsg.style.display = 'none';
    btn.disabled = false;
    btn.textContent = '🔄 Refresh Now';
}

// Display cryptos
function displayCryptos(cryptos) {
    const container = document.getElementById('cryptoContainer');
    
    if (cryptos.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                📭 <strong>No Cryptos Found</strong><br>
                <small>Abhi koi crypto 0.50% threshold cross nahi kar raha</small>
            </div>
        `;
        return;
    }

    // Sort by funding rate
    cryptos.sort((a, b) => {
        const rateA = parseFloat(a.funding_rate) * 100;
        const rateB = parseFloat(b.funding_rate) * 100;
        return Math.abs(rateB) - Math.abs(rateA);
    });

    container.innerHTML = cryptos.map((crypto, index) => {
        const fundingRate = parseFloat(crypto.funding_rate) * 100;
        const isPositive = fundingRate > 0;
        const sign = isPositive ? '+' : '';
        
        return `
            <div class="crypto-card ${isPositive ? 'positive' : 'negative'}" style="animation-delay: ${index * 0.05}s">
                <div class="crypto-header">
                    <div class="crypto-symbol">${crypto.symbol || 'N/A'}</div>
                    <div class="funding-rate ${isPositive ? 'positive' : 'negative'}">
                        ${sign}${fundingRate.toFixed(4)}%
                    </div>
                </div>
                <div class="crypto-info">
                    <strong>Mark Price:</strong> $${parseFloat(crypto.mark_price || 0).toFixed(2)}<br>
                    <strong>24h Volume:</strong> $${parseFloat(crypto.turnover_24h || 0).toLocaleString()}<br>
                    <strong>Contract:</strong> ${crypto.contract_type || 'N/A'}
                </div>
            </div>
        `;
    }).join('');
}

// Update stats
function updateStats(cryptos) {
    const positive = cryptos.filter(c => parseFloat(c.funding_rate) > 0.005).length;
    const negative = cryptos.filter(c => parseFloat(c.funding_rate) < -0.005).length;
    
    document.getElementById('totalCount').textContent = cryptos.length;
    document.getElementById('positiveCount').textContent = positive;
    document.getElementById('negativeCount').textContent = negative;
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('hi-IN');
}

// Countdown functions
function resetCountdown() {
    secondsRemaining = 60;
    updateCountdown();
}

function updateCountdown() {
    document.getElementById('nextUpdate').textContent = `${secondsRemaining}s`;
    if (secondsRemaining > 0) {
        secondsRemaining--;
    }
}

// Auto-refresh setup
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);

    autoRefreshInterval = setInterval(fetchData, 60000);
    countdownInterval = setInterval(updateCountdown, 1000);
    
    console.log('[Auto-refresh] Started - Every 60 seconds');
}

// Initialize on page load
window.addEventListener('load', () => {
    console.log('[Init] Starting Delta Exchange Monitor...');
    fetchData();
    startAutoRefresh();
});

// Cleanup
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
});

// Network status
window.addEventListener('online', () => {
    console.log('[Network] Connection restored');
    document.getElementById('warningMessage').innerHTML = `
        <div class="warning success-banner">
            ✅ Internet connection restored! Refreshing data...
        </div>
    `;
    setTimeout(() => fetchData(), 1000);
});

window.addEventListener('offline', () => {
    console.log('[Network] Connection lost');
    updateConnectionStatus('Offline ✗', 'error');
    document.getElementById('errorMessage').innerHTML = `
        <div class="error">
            📡 No internet connection detected<br>
            <small>Waiting to reconnect...</small>
        </div>
    `;
});            setTimeout(() => warningMsg.innerHTML = '', 5000);
            
            loadingMsg.style.display = 'none';
            btn.disabled = false;
            btn.textContent = '🔄 Refresh Now';
            return; // Success - exit function

        } catch (error) {
            console.error(`${proxy.name} failed:`, error.message);
            
            // Show which proxy failed
            loadingMsg.innerHTML = `
                <div class="spinner"></div>
                <p>⚠️ ${proxy.name} failed, trying next...</p>
                <small style="opacity: 0.7;">${error.message}</small>
            `;
            
            // Wait a bit before trying next proxy
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // If this was the last proxy, show error
            if (i === proxies.length - 1) {
                statusIndicator.className = 'status-indicator error';
                errorMsg.innerHTML = `
                    <div class="error">
                        ⚠️ <strong>Connection Error</strong><br>
                        <small>Sabhi proxy services fail ho gayi. Kuch der baad try karein.</small><br>
                        <small style="opacity: 0.7;">Error: ${error.message}</small>
                    </div>
                `;
                
                // Auto retry after 10 seconds
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(() => {
                        console.log(`Auto retry ${retryCount}/${maxRetries}...`);
                        fetchData();
                    }, 10000);
                }
            }
        }
    }

    loadingMsg.style.display = 'none';
    btn.disabled = false;
    btn.textContent = '🔄 Refresh Now';
}

// Cryptos display karne ka function
function displayCryptos(cryptos) {
    const container = document.getElementById('cryptoContainer');
    
    if (cryptos.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                📭 Abhi koi crypto 0.50% threshold cross nahi kar raha
            </div>
        `;
        return;
    }

    // Funding rate ke according sort karein (highest to lowest)
    cryptos.sort((a, b) => {
        const rateA = parseFloat(a.funding_rate) * 100;
        const rateB = parseFloat(b.funding_rate) * 100;
        return Math.abs(rateB) - Math.abs(rateA);
    });

    container.innerHTML = cryptos.map(crypto => {
        const fundingRate = parseFloat(crypto.funding_rate) * 100;
        const isPositive = fundingRate > 0;
        const sign = isPositive ? '+' : '';
        
        return `
            <div class="crypto-card ${isPositive ? 'positive' : 'negative'}">
                <div class="crypto-header">
                    <div class="crypto-symbol">${crypto.symbol || 'N/A'}</div>
                    <div class="funding-rate ${isPositive ? 'positive' : 'negative'}">
                        ${sign}${fundingRate.toFixed(4)}%
                    </div>
                </div>
                <div class="crypto-info">
                    <strong>Mark Price:</strong> $${parseFloat(crypto.mark_price || 0).toFixed(2)}<br>
                    <strong>24h Volume:</strong> $${parseFloat(crypto.turnover_24h || 0).toLocaleString()}<br>
                    <strong>Contract Type:</strong> ${crypto.contract_type || 'N/A'}
                </div>
            </div>
        `;
    }).join('');
}

// Stats update karne ka function
function updateStats(cryptos) {
    const positive = cryptos.filter(c => parseFloat(c.funding_rate) > 0.005).length;
    const negative = cryptos.filter(c => parseFloat(c.funding_rate) < -0.005).length;
    
    document.getElementById('totalCount').textContent = cryptos.length;
    document.getElementById('positiveCount').textContent = positive;
    document.getElementById('negativeCount').textContent = negative;
}

// Last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('hi-IN');
    document.getElementById('lastUpdate').textContent = timeString;
}

// Countdown reset
function resetCountdown() {
    secondsRemaining = 60;
    updateCountdown();
}

// Countdown update
function updateCountdown() {
    document.getElementById('nextUpdate').textContent = `${secondsRemaining}s`;
    if (secondsRemaining > 0) {
        secondsRemaining--;
    }
}

// Auto-refresh setup (har 1 minute)
function startAutoRefresh() {
    // Pehle existing intervals clear karein
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);

    // 60 seconds (1 minute) mein refresh
    autoRefreshInterval = setInterval(fetchData, 60000);
    
    // Countdown har second
    countdownInterval = setInterval(updateCountdown, 1000);
}

// Page load hone pe
window.addEventListener('load', () => {
    fetchData();
    startAutoRefresh();
});

// Page close hone pe intervals clear karein
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
});

// Online/Offline detection
window.addEventListener('online', () => {
    document.getElementById('warningMessage').innerHTML = `
        <div class="warning">
            ✅ Internet connection restored! Refreshing...
        </div>
    `;
    setTimeout(() => fetchData(), 1000);
});

window.addEventListener('offline', () => {
    document.getElementById('errorMessage').innerHTML = `
        <div class="error">
            📡 No internet connection. Waiting to reconnect...
        </div>
    `;
});
