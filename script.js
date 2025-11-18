// ⚠️ YAHAN APNA DELTA EXCHANGE API KEY & SECRET DAAL DO ⚠️
const API_KEY    = "yL8vA2msxSEBtlLwqHvTKE4iDfqNWb";          // ← Yahan daalo
const API_SECRET = "qIVYL0KnJV7CU5xw7i5nErVKCtajVU2IkyubMF4gRcfpUDQEHLCllFtMals4";       // ← Yahan daalo
// =====================================================

const API_URL = "https://api.delta.exchange/v2/tickers?contract_types=perpetual";
const THRESHOLD = 0.0001; // 0.50% = 0.0050

function generateSignature(timestamp) {
    const string = timestamp + "GET" + "/v2/tickers";
    return CryptoJS.HmacSHA256(string, API_SECRET).toString(CryptoJS.enc.Hex);
}

async function fetchData() {
    const tableBody   = document.getElementById("table-body");
    const loading     = document.getElementById("loading");
    const noData      = document.getElementById("no-data");
    const lastUpdate  = document.getElementById("last-update");

    tableBody.innerHTML = "";
    loading.classList.remove("hidden");
    noData.classList.add("hidden");

    try {
        const timestamp = Date.now();
        const signature = generateSignature(timestamp);

        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "api-key": API_KEY,
                "timestamp": timestamp.toString(),
                "signature": signature,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        const highFunding = data.result
            .filter(item => Math.abs(parseFloat(item.funding_rate || 0)) >= THRESHOLD)
            .sort((a, b) => Math.abs(parseFloat(b.funding_rate)) - Math.abs(parseFloat(a.funding_rate)));

        if (highFunding.length === 0) {
            noData.classList.remove("hidden");
        } else {
            highFunding.forEach(item => {
                const rate = parseFloat(item.funding_rate);
                const ratePercent = (rate * 100).toFixed(4);
                const symbol = item.symbol.replace("_PERP", "");

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td data-label="Symbol">${symbol}</td>
                    <td data-label="Funding" class="${rate > 0 ? 'positive' : 'negative'}">
                        ${rate > 0 ? "🟢 +" : "🔴"} ${ratePercent}%
                    </td>
                    <td data-label="Price">$${parseFloat(item.mark_price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td data-label="Next Funding">${item.time_to_funding || "Soon"}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        lastUpdate.textContent = new Date().toLocaleString('en-IN');

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="4">Error 😓<br>${error.message}</td></tr>`;
        console.error(error);
    } finally {
        loading.classList.add("hidden");
    }
}

// Auto start after CryptoJS loads
if (typeof CryptoJS !== "undefined") {
    fetchData();
    setInterval(fetchData, 60000); // Har 1 minute update
} else {
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            fetchData();
            setInterval(fetchData, 60000);
        }, 1000);
    });
}
