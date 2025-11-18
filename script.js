/**
 * Delta Exchange Funding Rate Monitor - Mobile Debugging Version
 * यह संस्करण स्क्रीन पर ही आने वाले डेटा को प्रिंट करता है।
 */

// 1. कॉन्फ़िगरेशन
const DELTA_WS_URL = "wss://socket.delta.exchange"; 
const FUNDING_THRESHOLD = 0.0050; 
const TEST_THRESHOLD = 0.0001; // टेस्टिंग के लिए कम थ्रेशोल्ड
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; 

// 2. DOM एलिमेंट्स
const statusDisplay = document.getElementById('ws-status');
const listContainer = document.getElementById('crypto-list');
const debugArea = document.getElementById('debug-area'); // नया डीबग एलिमेंट

// 3. डेटा स्टोर
let marketRates = {}; 

// सुरक्षित रूप से फंडिंग रेट फ़ील्ड खोजने के लिए फ़ंक्शन
function getFundingRateValue(ticker) {
    if (ticker.funding_rate !== undefined) return ticker.funding_rate;
    if (ticker.rate !== undefined) return ticker.rate;
    if (ticker.fr !== undefined) return ticker.fr;
    return undefined;
}

// स्क्रीन पर डीबग लॉग प्रिंट करें
function logToDebugArea(message) {
    const p = document.createElement('p');
    p.style.margin = '2px 0';
    p.style.fontSize = '0.7em';
    p.textContent = message;
    
    // सुनिश्चित करें कि यह बहुत बड़ा न हो जाए
    if (debugArea.children.length > 20) {
        debugArea.removeChild(debugArea.children[1]); // पुराने लॉग्स को हटाएँ
    }
    debugArea.appendChild(p);
    debugArea.scrollTop = debugArea.scrollHeight; // नीचे स्क्रॉल करें
}

// 4. WebSocket कनेक्शन स्थापित करना
function initWebSocket() {
    statusDisplay.textContent = "कनेक्टिंग...";
    statusDisplay.setAttribute('data-status', 'connecting');
    debugArea.innerHTML = '<h3>Live Data Stream (Debugging)</h3>';

    const ws = new WebSocket(DELTA_WS_URL);

    ws.onopen = () => {
        logToDebugArea("✅ Connected. Subscribing...");
        statusDisplay.textContent = "कनेक्टेड (OK)";
        statusDisplay.setAttribute('data-status', 'connected');

        ws.send(JSON.stringify({
            "op": "subscribe",
            "channel": "ticker",
            "symbols": ["*"] 
        }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            if (data.channel === 'ticker' && data.data) {
                const ticker = data.data;

                // *** 🛑 मोबाइल डीबगिंग स्टेप: स्क्रीन पर डेटा प्रिंट करें 🛑 ***
                const keys = Object.keys(ticker);
                logToDebugArea(`Keys: ${keys.join(', ')}`);
                // -----------------------------------------------------------

                const symbol = ticker.symbol;
                let fundingRateValue = getFundingRateValue(ticker);
                
                if (symbol && fundingRateValue !== undefined) {
                    logToDebugArea(`Found: ${symbol}, Rate: ${fundingRateValue}`);
                    
                    const fundingRate = parseFloat(fundingRateValue); 

                    if (!isNaN(fundingRate)) {
                        marketRates[symbol] = fundingRate;
                    }
                }
            }
            
        } catch (error) {
            // silent fail
        }
    };

    ws.onclose = () => {
        logToDebugArea("❌ Disconnected. Retrying in 5s.");
        statusDisplay.textContent = "डिस्कनेक्टेड (Reconnecting)";
        statusDisplay.setAttribute('data-status', 'error');
        setTimeout(initWebSocket, 5000);
    };

    ws.onerror = (error) => {
        logToDebugArea("🚨 WebSocket Error!");
        statusDisplay.textContent = "एरर";
        statusDisplay.setAttribute('data-status', 'error');
        ws.close();
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
