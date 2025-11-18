/**
 * Delta Exchange Monitor - Public REST API Polling Version
 * यह कोड सुरक्षित रूप से Public REST API का उपयोग करता है।
 */

// 1. कॉन्फ़िगरेशन
const REST_API_URL = "https://api.delta.exchange/v2/products"; 
const FUNDING_THRESHOLD = 0.0050; // 0.50%
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 मिनट

// 2. DOM एलिमेंट्स
const statusDisplay = document.getElementById('ws-status');
const listContainer = document.getElementById('crypto-list');
const debugArea = document.getElementById('debug-area');

// Helper function for mobile debugging logs
function logToDebugArea(message) {
    const p = document.createElement('p');
    p.style.margin = '2px 0';
    p.style.fontSize = '0.7em';
    p.textContent = message;
    
    // केवल 20 लॉग्स रखें
    if (debugArea.children.length > 20) {
        debugArea.removeChild(debugArea.children[1]); 
    }
    debugArea.appendChild(p);
    debugArea.scrollTop = debugArea.scrollHeight; 
}

let marketRates = {}; 

// 3. REST API से डेटा Fetch करने का मुख्य फंक्शन
async function fetchFundingRates() {
    logToDebugArea(`🔄 Fetching data from REST API at ${new Date().toLocaleTimeString()}...`);
    statusDisplay.textContent = "डेटा फ़ेच हो रहा...";
    statusDisplay.setAttribute('data-status', 'connecting');

    try {
        const response = await fetch(REST_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
            marketRates = {}; // डेटा स्टोर को रीसेट करें
            let processedCount = 0;
            
            data.forEach(product => {
                // केवल Perpetual Futures को प्रोसेस करें और सुनिश्चित करें कि फंडिंग रेट मौजूद है
                if (product.perpetual === true && product.symbol && product.funding_rate !== undefined) {
                    const symbol = product.symbol;
                    const fundingRate = parseFloat(product.funding_rate);
                    
                    if (!isNaN(fundingRate)) {
                        marketRates[symbol] = fundingRate;
                        processedCount++;
                    }
                }
            });

            logToDebugArea(`✅ Data fetched successfully. Processed ${processedCount} symbols.`);
            statusDisplay.textContent = `अंतिम अपडेट: ${new Date().toLocaleTimeString()}`;
            statusDisplay.setAttribute('data-status', 'connected');
            
            // डेटा फ़ेच होने के तुरंत बाद डिस्प्ले अपडेट करें
            refreshDisplay(); 

        } else {
            throw new Error("Invalid data format received.");
        }

    } catch (error) {
        logToDebugArea(`❌ Fetch Error: ${error.message}.`);
        statusDisplay.textContent = "कनेक्शन एरर";
        statusDisplay.setAttribute('data-status', 'error');
    }
}


// 4. डिस्प्ले को अपडेट करने का फंक्शन
function refreshDisplay() {
    listContainer.innerHTML = ''; 
    let alertFound = false;

    // 0.50% की वास्तविक थ्रेशोल्ड
    const currentThreshold = FUNDING_THRESHOLD;

    for (const symbol in marketRates) {
        const rate = marketRates[symbol];
        const absRate = Math.abs(rate);
        
        // शर्त चेक करें
        if (absRate >= currentThreshold) {
            alertFound = true;
            
            const card = document.createElement('div');
            const ratePercent = (rate * 100).toFixed(4) + '%'; 
            
            const rateClass = rate > 0 ? 'positive' : 'negative';
            const cardClass = rate > 0 ? 'long' : 'short';
            
            card.className = `crypto-card ${cardClass}`;
            card.innerHTML = `
                <div class="symbol">${symbol}</div>
                <div class="rate">Funding Rate: <span class="${rateClass}">${ratePercent}</span></div>
                <p>साइड: ${rate > 0 ? 'LONG (Pay Short)' : 'SHORT (Pay Long)'}</p>
            `;
            listContainer.appendChild(card);
        }
    }

    if (!alertFound) {
        listContainer.innerHTML = `<p class="loading-message">वर्तमान में कोई Crypto **${(currentThreshold * 100).toFixed(2)}%** की अलर्ट सीमा को पार नहीं कर रहा है।</p>`;
    }
}

// 5. मुख्य प्रक्रिया शुरू करना
document.addEventListener('DOMContentLoaded', () => {
    // तुरंत पहली बार डेटा फ़ेच करें
    fetchFundingRates();
    
    // हर 5 मिनट में डेटा फ़ेच करें (Polling)
    setInterval(fetchFundingRates, REFRESH_INTERVAL_MS);
});
                <div class="rate">Funding Rate: <span class="${rateClass}">${ratePercent}</span></div>
                <p>साइड: ${rate > 0 ? 'LONG (Pay Short)' : 'SHORT (Pay Long)'}</p>
            `;
            listContainer.appendChild(card);
        }
    }

    if (!alertFound) {
        listContainer.innerHTML = `<p>वर्तमान में कोई Crypto **${(FUNDING_THRESHOLD * 100).toFixed(2)}%** की अलर्ट सीमा को पार नहीं कर रहा है।</p>`;
    }
}

// 6. मुख्य प्रक्रिया शुरू करना
document.addEventListener('DOMContentLoaded', () => {
    // तुरंत पहली बार डेटा फ़ेच करें
    fetchFundingRates();
    
    // हर 5 मिनट में डेटा फ़ेच करें (Polling)
    setInterval(fetchFundingRates, REFRESH_INTERVAL_MS);
});
    };
}

// 5. डिस्प्ले को अपडेट करने का फंक्शन
function refreshDisplay() {
    // वर्तमान में उपयोग में लाए जा रहे TEST_THRESHOLD पर ध्यान दें
    listContainer.innerHTML = ''; 
    let alertFound = false;

    for (const symbol in marketRates) {
        const rate = marketRates[symbol];
        const absRate = Math.abs(rate);
        
        // TESTING THRESHOLD
        if (absRate >= TEST_THRESHOLD) {
            alertFound = true;
            
            const card = document.createElement('div');
            const ratePercent = (rate * 100).toFixed(4) + '%'; 
            
            const rateClass = rate > 0 ? 'positive' : 'negative';
            const cardClass = rate > 0 ? 'long' : 'short';
            
            card.className = `crypto-card ${cardClass}`;
            card.innerHTML = `
                <div class="symbol">${symbol}</div>
                <div class="rate">Funding Rate: <span class="${rateClass}">${ratePercent}</span></div>
                <p>साइड: ${rate > 0 ? 'LONG (Pay Short)' : 'SHORT (Pay Long)'}</p>
            `;
            listContainer.appendChild(card);
        }
    }

    if (!alertFound) {
        listContainer.innerHTML = '<p>वर्तमान में कोई Crypto **0.0001%** (टेस्टिंग थ्रेशोल्ड) की अलर्ट सीमा को पार नहीं कर रहा है।</p>';
    }
}

// 6. मुख्य प्रक्रिया शुरू करना
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    setInterval(refreshDisplay, REFRESH_INTERVAL_MS);
    setTimeout(refreshDisplay, 10000); 
});
        // शर्त चेक करें: टेस्टिंग के लिए 0.0001 का उपयोग करें
        if (absRate >= TEST_THRESHOLD) {
            alertFound = true;
            
            const card = document.createElement('div');
            // फंडिंग रेट को प्रतिशत में फॉर्मेट करें
            const ratePercent = (rate * 100).toFixed(4) + '%'; 
            
            const rateClass = rate > 0 ? 'positive' : 'negative';
            const cardClass = rate > 0 ? 'long' : 'short';
            
            card.className = `crypto-card ${cardClass}`;
            card.innerHTML = `
                <div class="symbol">${symbol}</div>
                <div class="rate">Funding Rate: <span class="${rateClass}">${ratePercent}</span></div>
                <p>साइड: ${rate > 0 ? 'LONG (Pay Short)' : 'SHORT (Pay Long)'}</p>
            `;
            listContainer.appendChild(card);
        }
    }

    if (!alertFound) {
        listContainer.innerHTML = '<p>वर्तमान में कोई Crypto **0.0001%** (टेस्टिंग थ्रेशोल्ड) की अलर्ट सीमा को पार नहीं कर रहा है।</p>';
    } else {
         console.log("Alerts successfully found using the test threshold. The parsing logic is now correct.");
    }
}

// 6. मुख्य प्रक्रिया शुरू करना
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    // हर 5 मिनट में डिस्प्ले अपडेट करें
    setInterval(refreshDisplay, REFRESH_INTERVAL_MS);
    // 10 सेकंड बाद पहला अपडेट (डेटा आने का इंतज़ार)
    setTimeout(refreshDisplay, 10000); 
});
