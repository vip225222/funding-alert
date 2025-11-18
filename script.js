// Simple and working solution
let autoInterval;
let countdown = 60;

// Main function to load data
async function loadData() {
    const btn = document.getElementById('refreshBtn');
    const status = document.getElementById('status');
    const message = document.getElementById('message');
    const container = document.getElementById('cryptoContainer');
    
    // Disable button
    btn.disabled = true;
    btn.textContent = '⏳ Loading...';
    status.textContent = 'Loading...';
    status.style.color = '#fbbf24';
    message.innerHTML = '<div class="loading">🔄 Fetching data from Delta Exchange...</div>';
    container.innerHTML = '';
    
    console.log('[START] Loading data...');
    
    try {
        // Direct API call (No CORS proxy needed for GitHub Pages)
        const response = await fetch('https://api.delta.exchange/v2/tickers');
        
        if (!response.ok) {
            throw new Error('API Error: ' + response.status);
        }
        
        const data = await response.json();
        console.log('[SUCCESS] Data received:', data.result?.length, 'items');
        
        if (!data.result || !Array.isArray(data.result)) {
            throw new Error('Invalid data format');
        }
        
        // Filter cryptos with funding rate >= 0.50% or <= -0.50%
        const filtered = data.result.filter(crypto => {
            const rate = parseFloat(crypto.funding_rate) * 100;
            return Math.abs(rate) >= 0.50;
        });
        
        console.log('[FILTERED]', filtered.length, 'cryptos above threshold');
        
        // Display results
        displayCryptos(filtered);
        updateStats(filtered);
        updateTime();
        
        // Success message
        status.textContent = 'Connected ✓';
        status.style.color = '#10b981';
        message.innerHTML = `<div class="success">✅ Success! Found ${filtered.length} cryptos (${new Date().toLocaleTimeString()})</div>`;
        
        setTimeout(() => {
            message.innerHTML = '';
        }, 5000);
        
    } catch (error) {
        console.error('[ERROR]', error);
        
        // Show error
        status.textContent = 'Error ✗';
        status.style.color = '#ef4444';
        message.innerHTML = `
            <div class="error">
                ⚠️ <strong>Error:</strong> ${error.message}<br>
                <small>Please check console (F12) for details</small>
            </div>
        `;
        
        container.innerHTML = '<div class="no-data">❌ Failed to load data. Please refresh.</div>';
    }
    
    // Re-enable button
    btn.disabled = false;
    btn.textContent = '🔄 Refresh';
    resetCountdown();
}

// Display cryptos
function displayCryptos(cryptos) {
    const container = document.getElementById('cryptoContainer');
    
    if (cryptos.length === 0) {
        container.innerHTML = '<div class="no-data">📭 No cryptos found above 0.50% threshold</div>';
        return;
    }
    
    // Sort by absolute funding rate (highest first)
    cryptos.sort((a, b) => {
        const rateA = Math.abs(parseFloat(a.funding_rate) * 100);
        const rateB = Math.abs(parseFloat(b.funding_rate) * 100);
        return rateB - rateA;
    });
    
    // Create cards
    container.innerHTML = cryptos.map(crypto => {
        const rate = parseFloat(crypto.funding_rate) * 100;
        const isPositive = rate > 0;
        const sign = isPositive ? '+' : '';
        
        return `
            <div class="crypto-card ${isPositive ? 'positive' : 'negative'}">
                <div class="crypto-header">
                    <div class="crypto-symbol">${crypto.symbol}</div>
                    <div class="funding-rate ${isPositive ? 'positive' : 'negative'}">
                        ${sign}${rate.toFixed(4)}%
                    </div>
                </div>
                <div class="crypto-info">
                    <strong>Price:</strong> $${parseFloat(crypto.mark_price).toFixed(2)}<br>
                    <strong>Volume 24h:</strong> $${parseFloat(crypto.turnover_24h).toLocaleString()}<br>
                    <strong>Type:</strong> ${crypto.contract_type || 'Perpetual'}
                </div>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats(cryptos) {
    const positive = cryptos.filter(c => parseFloat(c.funding_rate) > 0.005).length;
    const negative = cryptos.filter(c => parseFloat(c.funding_rate) < -0.005).length;
    
    document.getElementById('totalCount').textContent = cryptos.length;
    document.getElementById('positiveCount').textContent = positive;
    document.getElementById('negativeCount').textContent = negative;
}

// Update time
function updateTime() {
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// Countdown timer
function resetCountdown() {
    countdown = 60;
    updateCountdown();
}

function updateCountdown() {
    document.getElementById('nextUpdate').textContent = countdown + 's';
    if (countdown > 0) countdown--;
}

// Auto-refresh every 60 seconds
function startAutoRefresh() {
    if (autoInterval) clearInterval(autoInterval);
    
    // Main refresh
    setInterval(() => {
        console.log('[AUTO-REFRESH] Reloading...');
        loadData();
    }, 60000); // 60 seconds
    
    // Countdown update
    setInterval(updateCountdown, 1000); // 1 second
    
    console.log('[AUTO-REFRESH] Enabled (every 60 seconds)');
}

// Initialize on page load
window.addEventListener('load', () => {
    console.log('=================================');
    console.log('[INIT] Delta Exchange Monitor');
    console.log('[TIME]', new Date().toLocaleString());
    console.log('=================================');
    
    // Load data immediately
    loadData();
    
    // Start auto-refresh
    startAutoRefresh();
});

// Log when leaving
window.addEventListener('beforeunload', () => {
    console.log('[EXIT] Closing...');
});        }
    }
    
    // All methods failed
    console.error('[API] All methods failed');
    updateConnectionStatus('Connection Failed', 'error');
    showError('<strong>Connection Failed</strong><br><small>Kuch der baad refresh karein</small>');
    document.getElementById('loadingMessage').style.display = 'none';
    return false;
}

// Connect via WebSocket (Primary method)
function connectWebSocket() {
    console.log('[WebSocket] Attempting connection...');
    updateLoadingMessage('🔌 Connecting WebSocket...', 'Real-time connection');
    updateConnectionStatus('Connecting WebSocket...', 'loading');
    
    try {
        // Delta Exchange WebSocket endpoint
        ws = new WebSocket('wss://socket.delta.exchange');
        
        ws.onopen = function() {
            console.log('[WebSocket] ✅ Connected!');
            isConnected = true;
            reconnectAttempts = 0;
            
            updateConnectionStatus('WebSocket Connected', 'success');
            updateLoadingMessage('✅ WebSocket Connected!', 'Subscribing to ticker updates...');
            
            // Subscribe to all tickers
            const subscribeMessage = {
                "type": "subscribe",
                "payload": {
                    "channels": [
                        {
                            "name": "v2/ticker",
                            "symbols": ["MARK:BTCUSD", "MARK:ETHUSD"] // Add more symbols
                        }
                    ]
                }
            };
            
            ws.send(JSON.stringify(subscribeMessage));
            console.log('[WebSocket] Subscription sent');
            
            // Also fetch initial data via API
            fetchViaAPI();
        };
        
        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                console.log('[WebSocket] Data received:', data.type);
                
                if (data.type === 'ticker') {
                    // Update specific ticker data
                    updateTickerData(data);
                }
            } catch (error) {
                console.error('[WebSocket] Parse error:', error);
            }
        };
        
        ws.onerror = function(error) {
            console.error('[WebSocket] Error:', error);
            updateConnectionStatus('WebSocket Error', 'error');
            
            // Fallback to REST API
            if (!isConnected) {
                console.log('[WebSocket] Failed, falling back to REST API');
                updateLoadingMessage('⚠️ WebSocket failed', 'Switching to REST API...');
                setTimeout(() => fetchViaAPI(), 2000);
            }
        };
        
        ws.onclose = function() {
            console.log('[WebSocket] Connection closed');
            isConnected = false;
            updateConnectionStatus('WebSocket Disconnected', 'error');
            
            // Try to reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                console.log(`[WebSocket] Reconnecting in ${delay/1000}s... (${reconnectAttempts}/${maxReconnectAttempts})`);
                
                setTimeout(() => {
                    console.log('[WebSocket] Reconnecting...');
                    connectWebSocket();
                }, delay);
            } else {
                console.log('[WebSocket] Max reconnect attempts reached, using REST API');
                fetchViaAPI();
            }
        };
        
    } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        updateConnectionStatus('WebSocket Failed', 'error');
        
        // Fallback to REST API immediately
        console.log('[WebSocket] Using REST API fallback');
        fetchViaAPI();
    }
}

// Update ticker data from WebSocket
function updateTickerData(tickerData) {
    // Update the crypto data array
    const index = allCryptoData.findIndex(c => c.symbol === tickerData.symbol);
    if (index !== -1) {
        allCryptoData[index] = { ...allCryptoData[index], ...tickerData };
    } else {
        allCryptoData.push(tickerData);
    }
    
    // Refresh display
    processAndDisplayData();
}

// Process and display filtered data
function processAndDisplayData() {
    console.log('[Data] Processing crypto data...');
    
    // Filter: funding rate >= 0.50% or <= -0.50%
    const filteredCryptos = allCryptoData.filter(crypto => {
        const fundingRate = parseFloat(crypto.funding_rate || 0) * 100;
        return Math.abs(fundingRate) >= 0.50;
    });
    
    console.log(`[Data] Found ${filteredCryptos.length} cryptos above threshold`);
    
    displayCryptos(filteredCryptos);
    updateStats(filteredCryptos);
    updateLastUpdateTime();
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
    
    // Sort by absolute funding rate
    cryptos.sort((a, b) => {
        const rateA = Math.abs(parseFloat(a.funding_rate || 0) * 100);
        const rateB = Math.abs(parseFloat(b.funding_rate || 0) * 100);
        return rateB - rateA;
    });
    
    container.innerHTML = cryptos.map((crypto, index) => {
        const fundingRate = parseFloat(crypto.funding_rate || 0) * 100;
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
                    <strong>Contract:</strong> ${crypto.contract_type || 'Perpetual'}
                </div>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats(cryptos) {
    const positive = cryptos.filter(c => parseFloat(c.funding_rate || 0) > 0.005).length;
    const negative = cryptos.filter(c => parseFloat(c.funding_rate || 0) < -0.005).length;
    
    document.getElementById('totalCount').textContent = cryptos.length;
    document.getElementById('positiveCount').textContent = positive;
    document.getElementById('negativeCount').textContent = negative;
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('hi-IN');
}

// Manual refresh
function manualRefresh() {
    console.log('[Manual] Refresh triggered');
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Loading...';
    
    fetchViaAPI().then(() => {
        btn.disabled = false;
        btn.textContent = '🔄 Refresh Now';
    });
}

// Auto-refresh every 60 seconds
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    
    autoRefreshInterval = setInterval(() => {
        console.log('[Auto-refresh] Fetching new data...');
        fetchViaAPI();
    }, 60000); // 60 seconds
    
    console.log('[Auto-refresh] Started - Every 60 seconds');
}

// Initialize on page load
window.addEventListener('load', () => {
    console.log('[Init] Starting Delta Exchange Monitor...');
    console.log('[Init] Time:', new Date().toLocaleTimeString());
    
    // Try WebSocket first, fallback to REST API
    connectWebSocket();
    
    // Start auto-refresh
    startAutoRefresh();
});

// Cleanup
window.addEventListener('beforeunload', () => {
    if (ws) ws.close();
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
});

// Network status
window.addEventListener('online', () => {
    console.log('[Network] Connection restored');
    showSuccessBanner('Internet connection restored! Reconnecting...');
    setTimeout(() => {
        if (!isConnected) {
            connectWebSocket();
        }
    }, 1000);
});

window.addEventListener('offline', () => {
    console.log('[Network] Connection lost');
    updateConnectionStatus('Offline', 'error');
    showError('📡 No internet connection<br><small>Waiting to reconnect...</small>');
});
