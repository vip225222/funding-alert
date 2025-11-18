// Global variables
let ws = null;
let autoRefreshInterval = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let allCryptoData = [];
let isConnected = false;

// Update UI status
function updateConnectionStatus(message, type = 'loading') {
    const statusEl = document.getElementById('connectionStatus');
    const indicator = document.getElementById('statusIndicator');
    const wsStatus = document.getElementById('wsStatus');
    
    statusEl.textContent = message;
    indicator.className = `status-indicator ${type}`;
    
    if (type === 'success') {
        wsStatus.textContent = '🟢';
    } else if (type === 'error') {
        wsStatus.textContent = '🔴';
    } else {
        wsStatus.textContent = '🟡';
    }
}

// Update loading message
function updateLoadingMessage(mainText, detailText) {
    const loadingText = document.getElementById('loadingText');
    const loadingDetail = document.getElementById('loadingDetail');
    
    if (loadingText) loadingText.textContent = mainText;
    if (loadingDetail) loadingDetail.textContent = detailText;
}

// Show success banner
function showSuccessBanner(message) {
    const warningMsg = document.getElementById('warningMessage');
    warningMsg.innerHTML = `
        <div class="warning success-banner">
            ✅ ${message}
        </div>
    `;
    setTimeout(() => {
        warningMsg.innerHTML = '';
    }, 5000);
}

// Show error message
function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.innerHTML = `
        <div class="error">
            ⚠️ ${message}
        </div>
    `;
}

// Fetch data via REST API (fallback method)
async function fetchViaAPI() {
    console.log('[API] Fetching via REST API...');
    updateLoadingMessage('📡 Fetching via REST API...', 'Using HTTP fallback');
    
    const proxies = [
        { name: 'AllOrigins', url: (api) => `https://api.allorigins.win/raw?url=${encodeURIComponent(api)}` },
        { name: 'CORSProxy', url: (api) => `https://corsproxy.io/?${encodeURIComponent(api)}` }
    ];
    
    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        try {
            console.log(`[API] Trying ${proxy.name}...`);
            updateLoadingMessage(`🔄 Trying ${proxy.name}...`, `Attempt ${i + 1}/${proxies.length}`);
            
            const apiUrl = 'https://api.delta.exchange/v2/tickers';
            const proxyUrl = proxy.url(apiUrl);
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(15000)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.result || !Array.isArray(data.result)) {
                throw new Error('Invalid data format');
            }
            
            console.log(`[API] ✅ Success with ${proxy.name}`);
            allCryptoData = data.result;
            processAndDisplayData();
            
            updateConnectionStatus(`Connected via ${proxy.name}`, 'success');
            showSuccessBanner(`<strong>Connected!</strong><br><small>Using: ${proxy.name} REST API</small>`);
            
            document.getElementById('loadingMessage').style.display = 'none';
            return true;
            
        } catch (error) {
            console.error(`[API] ${proxy.name} failed:`, error.message);
        }
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
