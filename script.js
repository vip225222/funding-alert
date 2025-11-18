/**
 * Delta Exchange Funding Rate Monitor - Frontend Only (WebSocket)
 * यह स्क्रिप्ट सीधे Delta Exchange WebSocket से फंडिंग रेट डेटा प्राप्त करती है।
 */

// 1. कॉन्फ़िगरेशन
// **** सबसे संभावित WebSocket URL ****
const DELTA_WS_URL = "wss://socket.delta.exchange"; 
const FUNDING_THRESHOLD = 0.0050; // 0.50% को डेसीमल फॉर्मेट (0.0050) में
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 मिनट = 300,000 मिलीसेकंड

// 2. DOM एलिमेंट्स
const statusDisplay = document.getElementById('ws-status');
const listContainer = document.getElementById('crypto-list');

// 3. डेटा स्टोर
// इस ऑब्जेक्ट में हम हाल ही में प्राप्त सभी फंडिंग रेट्स को स्टोर करेंगे।
let marketRates = {}; // { 'BTC-PERP': 0.0051, 'ETH-PERP': -0.0060, ... }

// 4. WebSocket कनेक्शन स्थापित करना
function initWebSocket() {
    statusDisplay.textContent = "कनेक्टिंग...";
    statusDisplay.setAttribute('data-status', 'connecting');

    const ws = new WebSocket(DELTA_WS_URL);

    ws.onopen = () => {
        console.log("WebSocket connected successfully.");
        statusDisplay.textContent = "कनेक्टेड (OK)";
        statusDisplay.setAttribute('data-status', 'connected');

        // *** Subscription संदेश: Delta Exchange 'v1' style subscribe ***
        // यह संदेश सभी Tickers के डेटा के लिए subscription भेजता है।
        ws.send(JSON.stringify({
            "op": "subscribe",
            "channel": "ticker", // 'ticker' चैनल में फंडिंग रेट डेटा शामिल होता है
            "symbols": ["*"]    // सभी उपलब्ध symbols
        }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // डेटा प्रोसेसिंग लॉजिक
            if (data.channel === 'ticker' && data.data) {
                const ticker = data.data;

                // सुनिश्चित करें कि फंडिंग रेट मौजूद है और मान्य है
                if (ticker.symbol && ticker.funding_rate !== undefined) {
                    const symbol = ticker.symbol;
                    const fundingRate = parseFloat(ticker.funding_rate); 

                    if (!isNaN(fundingRate)) {
                        // डेटा स्टोर में अपडेट करें
                        marketRates[symbol] = fundingRate;
                    }
                }
            }
            
        } catch (error) {
            // JSON parsing error या अन्य समस्या होने पर
            // console.error("Error processing message:", error);
        }
    };

    ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 5 seconds...");
        statusDisplay.textContent = "डिस्कनेक्टेड (Reconnecting)";
        statusDisplay.setAttribute('data-status', 'error');
        // कनेक्शन बंद होने पर 5 सेकंड बाद फिर से कनेक्ट करने का प्रयास करें
        setTimeout(initWebSocket, 5000);
    };

    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
        statusDisplay.textContent = "एरर";
        statusDisplay.setAttribute('data-status', 'error');
        ws.close(); // त्रुटि होने पर कनेक्शन बंद करें
    };
}

// 5. डिस्प्ले को अपडेट करने का फंक्शन (5 मिनट की स्क्रीनिंग)
function refreshDisplay() {
    console.log("Display updated based on 5-minute screening.");
    listContainer.innerHTML = ''; // पिछली लिस्ट को खाली करें
    let alertFound = false;

    // marketRates में मौजूद हर Crypto को चेक करें
    for (const symbol in marketRates) {
        const rate = marketRates[symbol];
        const absRate = Math.abs(rate);
        
        // शर्त चेक करें: Funding Rate 0.50% के ऊपर या नीचे होना चाहिए
        if (absRate >= FUNDING_THRESHOLD) {
            alertFound = true;
            
            // कार्ड एलिमेंट बनाएँ और डिस्प्ले करें
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
        listContainer.innerHTML = '<p>वर्तमान में कोई भी Crypto 0.50% की अलर्ट सीमा को पार नहीं कर रहा है।</p>';
    }
}

// 6. मुख्य प्रक्रिया शुरू करना
document.addEventListener('DOMContentLoaded', () => {
    // 1. WebSocket कनेक्शन शुरू करें
    initWebSocket();
    
    // 2. हर 5 मिनट में डिस्प्ले को अपडेट करने के लिए इंटरवल सेट करें (स्क्रीनिंग लॉजिक)
    setInterval(refreshDisplay, REFRESH_INTERVAL_MS);

    // पेज लोड होने पर पहली बार डिस्प्ले को अपडेट करें (डेटा आने का इंतज़ार)
    // 10 सेकंड का विलंब ताकि WebSocket को कनेक्ट होकर शुरुआती डेटा प्राप्त करने का समय मिल सके
    setTimeout(refreshDisplay, 10000); 
});
