/**
 * Delta Exchange Funding Rate Monitor - Frontend Only (WebSocket)
 * *** यह संस्करण (Version) डेटा फॉर्मेट को डीबग करने के लिए Console Log का उपयोग करता है। ***
 */

// 1. कॉन्फ़िगरेशन
const DELTA_WS_URL = "wss://socket.delta.exchange"; 
const FUNDING_THRESHOLD = 0.0050; // 0.50%
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 मिनट

// 2. DOM एलिमेंट्स
const statusDisplay = document.getElementById('ws-status');
const listContainer = document.getElementById('crypto-list');

// 3. डेटा स्टोर
let marketRates = {}; 

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
            
            // डेटा प्रोसेसिंग और डीबगिंग लॉजिक
            if (data.channel === 'ticker' && data.data) {
                const ticker = data.data;

                // *** 🛑 डीबगिंग स्टेप: Console में Ticker डेटा प्रिंट करें 🛑 ***
                // F12 Console में, यह आपको सभी fields के नाम दिखाएगा।
                console.log("--- Ticker Data ---");
                console.log(ticker); 
                // -----------------------------------------------------------

                // यहाँ आपको सही फ़ील्ड का नाम डालना है।
                // हम मान रहे हैं: ticker.funding_rate
                // लेकिन यह ticker.rate या ticker.fr भी हो सकता है।
                
                // उदाहरण के लिए, यदि Console में 'fundingRate' दिखता है, तो नीचे की लाइन बदलें:
                // const fundingRate = parseFloat(ticker.fundingRate); 
                
                if (ticker.symbol && ticker.funding_rate !== undefined) {
                    const symbol = ticker.symbol;
                    const fundingRate = parseFloat(ticker.funding_rate); 

                    if (!isNaN(fundingRate)) {
                        marketRates[symbol] = fundingRate;
                    }
                }
            }
            
        } catch (error) {
            console.error("Error processing message or JSON parsing error:", error);
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

// 5. डिस्प्ले को अपडेट करने का फंक्शन
function refreshDisplay() {
    console.log("Display updated based on 5-minute screening.");
    console.log("Current marketRates snapshot for screening:", marketRates); // Debugging snapshot
    
    listContainer.innerHTML = ''; 
    let alertFound = false;

    // हम टेस्टिंग के लिए 0.0001 का उपयोग करेंगे जब तक कि सही डेटा न दिखने लगे
    const ACTIVE_THRESHOLD = 0.0001; 

    for (const symbol in marketRates) {
        const rate = marketRates[symbol];
        const absRate = Math.abs(rate);
        
        // शर्त चेक करें: टेस्टिंग के लिए 0.0001
        if (absRate >= ACTIVE_THRESHOLD) {
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
    } else {
         // यदि अलर्ट मिला, तो वास्तविक थ्रेशोल्ड (0.50%) के बारे में जानकारी दें
         // यदि 0.0001 पर अलर्ट मिला है, तो लॉजिक सही है।
         console.log(`Alerts found using the test threshold (${ACTIVE_THRESHOLD}). You can now safely change the threshold to 0.0050.`);
    }
}

// 6. मुख्य प्रक्रिया शुरू करना
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    setInterval(refreshDisplay, REFRESH_INTERVAL_MS);
    setTimeout(refreshDisplay, 10000); 
});
