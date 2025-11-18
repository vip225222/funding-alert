// ⚠️ APNA API KEY & SECRET YAHAN DAAL DO ⚠️
const API_KEY    = "yL8vA2msxSEBtlLwqHvTKE4iDfqNWb";
const API_SECRET = "qIVYL0KnJV7CU5xw7i5nErVKCtajVU2IkyubMF4gRcfpUDQEHLCllFtMals4";

const API_URL = "https://api.delta.exchange/v2/tickers?contract_types=perpetual";
const THRESHOLD = 0.0050; // 0.50%

async function fetchData() {
    const tableBody  = document.getElementById("table-body");
    const loading    = document.getElementById("loading");
    const noData     = document.getElementById("no-data");
    const lastUpdate = document.getElementById("last-update");

    tableBody.innerHTML = "";
    loading.classList.remove("hidden");
    noData.classList.add("hidden");

    try {
        const timestamp = Date.now().toString();
        const method = "GET";
        const path = "/v2/tickers";
        const queryString = "?contract_types=perpetual";
        
        // Exact signature string Delta expect karta hai
        const signatureString = timestamp + method + path + queryString;
        const signature = CryptoJS.HmacSHA256(signatureString, API_SECRET).toString(CryptoJS.enc.Hex);

        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "api-key": API_KEY,
                "timestamp": timestamp,
                "signature": signature,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error ${response.status}: ${err}`);
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
        console.error("Delta API Error:", error);
    } finally {
        loading.classList.add("hidden");
    }
}

// Start after CryptoJS loads
setTimeout(() => {
    fetchData();
    setInterval(fetchData, 60000);
}, 1000);
