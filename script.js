const API_URL = "https://api.delta.exchange/v2/tickers?contract_types=perpetual";
const THRESHOLD = 0.0001; // 0.50% = 0.0050

async function fetchData() {
    const tableBody = document.getElementById("table-body");
    const loading = document.getElementById("loading");
    const noData = document.getElementById("no-data");
    const lastUpdate = document.getElementById("last-update");

    // Reset
    tableBody.innerHTML = "";
    loading.classList.remove("hidden");
    noData.classList.add("hidden");

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!data.result || data.result.length === 0) {
            throw new Error("No data");
        }

        const highFunding = data.result
            .filter(item => {
                const fundingRate = parseFloat(item.funding_rate || 0);
                return Math.abs(fundingRate) >= THRESHOLD;
            })
            .sort((a, b) => Math.abs(parseFloat(b.funding_rate)) - Math.abs(parseFloat(a.funding_rate)));

        if (highFunding.length === 0) {
            noData.classList.remove("hidden");
            tableBody.innerHTML = "";
        } else {
            highFunding.forEach(item => {
                const fundingRate = parseFloat(item.funding_rate);
                const ratePercent = (fundingRate * 100).toFixed(4);
                const isPositive = fundingRate > 0;

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td data-label="Symbol">${item.symbol.replace("_PERP", "")}</td>
                    <td data-label="Funding" class="${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? "🟢 +" : "🔴"} ${ratePercent}%
                    </td>
                    <td data-label="Price">$${parseFloat(item.mark_price).toLocaleString()}</td>
                    <td data-label="Next Funding">${item.time_to_funding || "Soon"}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        lastUpdate.textContent = new Date().toLocaleString('en-IN');
        
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="4">Error loading data 😓<br>${error.message}</td></tr>`;
    } finally {
        loading.classList.add("hidden");
    }
}

// Auto refresh every 1 minute
fetchData(); // First load
setInterval(fetchData, 60000);            card.className = `crypto-card ${cardClass}`;
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
