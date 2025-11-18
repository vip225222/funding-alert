let autoRefreshInterval;
let countdownInterval;
let secondsRemaining = 60;
let retryCount = 0;
const maxRetries = 3;

// Multiple CORS proxies - ek fail ho to dusra try kare
const proxies = [
    { name: 'AllOrigins', url: (api) => `https://api.allorigins.win/raw?url=${encodeURIComponent(api)}` },
    { name: 'CORS Anywhere', url: (api) => `https://corsproxy.io/?${encodeURIComponent(api)}` },
    { name: 'ThingProxy', url: (api) => `https://thingproxy.freeboard.io/fetch/${api}` }
];

let currentProxyIndex = 0;

// Data fetch karne ka function with retry logic
async function fetchData() {
    const btn = document.getElementById('refreshBtn');
    const loadingMsg = document.getElementById('loadingMessage');
    const errorMsg = document.getElementById('errorMessage');
    const warningMsg = document.getElementById('warningMessage');
    const container = document.getElementById('cryptoContainer');
    const statusIndicator = document.getElementById('statusIndicator');

    btn.disabled = true;
    btn.textContent = '⏳ Loading...';
    loadingMsg.style.display = 'block';
    errorMsg.innerHTML = '';
    warningMsg.innerHTML = '';
    container.innerHTML = '';
    statusIndicator.className = 'status-indicator';

    // Try each proxy
    for (let i = 0; i < proxies.length; i++) {
        currentProxyIndex = (currentProxyIndex + i) % proxies.length;
        const proxy = proxies[currentProxyIndex];
        
        try {
            console.log(`Trying ${proxy.name} proxy...`);
            
            const apiUrl = 'https://api.delta.exchange/v2/tickers';
            const proxyUrl = proxy.url(apiUrl);
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.result || !Array.isArray(data.result)) {
                throw new Error('Invalid data format received');
            }

            // Success!
            console.log(`Success with ${proxy.name}`);
            
            // Filter: funding rate 0.50% se upar ya niche
            const filteredCryptos = data.result.filter(crypto => {
                const fundingRate = parseFloat(crypto.funding_rate) * 100;
                return Math.abs(fundingRate) >= 0.50;
            });

            displayCryptos(filteredCryptos);
            updateStats(filteredCryptos);
            updateLastUpdateTime();
            resetCountdown();
            retryCount = 0;
            
            statusIndicator.className = 'status-indicator success';
            
            // Show success message for first load
            if (i > 0) {
                warningMsg.innerHTML = `
                    <div class="warning">
                        ✅ Connected successfully using ${proxy.name} proxy
                    </div>
                `;
                setTimeout(() => warningMsg.innerHTML = '', 5000);
            }
            
            loadingMsg.style.display = 'none';
            btn.disabled = false;
            btn.textContent = '🔄 Refresh Now';
            return; // Success - exit function

        } catch (error) {
            console.error(`${proxy.name} failed:`, error.message);
            
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
