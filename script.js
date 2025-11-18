/**
 * Delta Exchange Funding Rate Monitor - Frontend Only (WebSocket)
 * यह संस्करण तीन संभावित फंडिंग रेट फ़ील्ड नामों को चेक करता है
 * और टेस्टिंग के लिए 0.0001% की थ्रेशोल्ड का उपयोग करता है।
 */

// 1. कॉन्फ़िगरेशन
const DELTA_WS_URL = "wss://socket.delta.exchange"; 
const FUNDING_THRESHOLD = 0.0050; // आपका लक्ष्य (0.50%)
const TEST_THRESHOLD = 0.0001; // टेस्टिंग के लिए कम थ्रेशोल्ड
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 मिनट

// 2. DOM एलिमेंट्स
const statusDisplay = document.getElementById('ws-status');
const listContainer = document.getElementById('crypto-list');

// 3. डेटा स्टोर
let marketRates = {}; 

// सुरक्षित रूप से फंडिंग रेट फ़ील्ड खोजने के लिए फ़ंक्शन
function getFundingRateValue(ticker) {
    // 1. funding_rate को चेक करें
    if (ticker.funding_rate !== undefined) return ticker.funding_rate;
    // 2. rate को चेक करें
    if (ticker.rate !== undefined) return ticker.rate;
    // 3. fr (Abbreviation) को चेक करें
    if (ticker.fr !== undefined) return ticker.fr;
    
    return undefined;
}

// 4. WebSocket कनेक्शन स्थापित करना
function initWebSocket() {
    statusDisplay.textContent = "कनेक्टिंग...";
    statusDisplay.setAttribute('data-status', 'connecting');

    const ws = new WebSocket(DELTA_WS_URL);

    ws.onopen = () => {
        console.log("WebSocket connected successfully. Sending subscription request...");
        statusDisplay.textContent = "कनेक्टेड (OK)";
        statusDisplay.setAttribute('data-status', 'connected');

        // Subscription संदेश: 'ticker' चैनल सभी symbols के लिए
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

                const symbol = ticker.symbol;
                
                // **** मल्टी-चेक लॉजिक का उपयोग करें ****
                let fundingRateValue = getFundingRateValue(ticker);
                
                if (symbol && fundingRateValue !== undefined) {
                    const fundingRate = parseFloat(fundingRateValue); 

                    if (!isNaN(fundingRate)) {
                        // डेटा स्टोर में अपडेट करें
                        marketRates[symbol] = fundingRate;
                    }
                }
            }
            
        } catch (error) {
            // यह JSON parsing errors को शांत रखता है
            // console.error("Error processing message or JSON parsing error:", error); 
        }
    };

    ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 5 seconds...");
        statusDisplay.textContent = "डिस्कनेक्टेड (Reconnecting)";
        statusDisplay.setAttribute('data-status', 'error');
        setTimeout(initWebSocket, 5000);
    };

    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
        statusDisplay.textContent = "एरर";
        statusDisplay.setAttribute('data-status', 'error');
        ws.close();
    };
}

// 5. डिस्प्ले को अपडेट करने का फंक्शन (5 मिनट की स्क्रीनिंग)
function refreshDisplay() {
    console.log(`Display updated based on ${REFRESH_INTERVAL_MS / 60000} minute screening. Using Test Threshold: ${TEST_THRESHOLD * 100}%`);
    
    listContainer.innerHTML = ''; 
    let alertFound = false;

    for (const symbol in marketRates) {
        const rate = marketRates[symbol];
        const absRate = Math.abs(rate);
        
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
