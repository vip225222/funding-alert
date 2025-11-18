const API_URL = "https://open-api.coinglass.com/public/v2/funding_rates?exchange=delta&interval=8h";
const THRESHOLD = 0.0050; // 0.50%

async function fetchData() {
    const tableBody = document.getElementById("table-body");
    const loading = document.getElementById("loading");
    const noData = document.getElementById("no-data");
    const lastUpdate = document.getElementById("last-update");

    tableBody.innerHTML = "";
    loading.classList.remove("hidden");
    noData.classList.add("hidden");

    try {
        const response = await fetch(API_URL, {
            headers: {
                'accept': 'application/json'
                // Coinglass free tier mein header ki zarurat nahi, lekin safe side pe
            }
        });

        const data = await response.json();

        if (data.code !== "0" || !data.data) {
            throw new Error("API Error");
        }
        
        // Coinglass Delta ke liye data
        const deltaData = data.data.find(item => item.exchangeName === "Delta")?.fundingRateList || [];

        const highFunding = deltaData
            .filter(item => {
                const rate = parseFloat(item.fundingRate);
                return Math.abs(rate) >= THRESHOLD;
            })
            .sort((a, b) => Math.abs(parseFloat(b.fundingRate)) - Math.abs(parseFloat(a.fundingRate)));

        if (highFunding.length === 0) {
            noData.classList.remove("hidden");
        } else {
            highFunding.forEach(item => {
                const rate = parseFloat(item.fundingRate);
                const ratePercent = (rate * 100).toFixed(4);
                const symbol = item.symbol.replace("PERP", "");

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td data-label="Symbol">${symbol}</td>
                    <td data-label="Funding" class="${rate > 0 ? 'positive' : 'negative'}">
                        ${rate > 0 ? "🟢 +" : "🔴"} ${ratePercent}%
                    </td>
                    <td data-label="Price">-</td>
                    <td data-label="Next Funding">8h interval</td>
                `;
                tableBody.appendChild(row);
            });
        }

        lastUpdate.textContent = new Date().toLocaleString('en-IN');

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="4">Connection Issue 😓<br>Coinglass se data aa raha hai, retrying...</td></tr>`;
        console.error(error);
    } finally {
        loading.classList.add("hidden");
    }
}

// Start
fetchData();
setInterval(fetchData, 60000);    };
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
