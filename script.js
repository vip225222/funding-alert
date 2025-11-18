const THRESHOLD = 0.0050; // 0.50% = 0.0050

async function fetchData() {
    const tableBody  = document.getElementById("table-body");
    const loading    = document.getElementById("loading");
    const noData     = document.getElementById("no-data");
    const lastUpdate = document.getElementById("last-update");

    tableBody.innerHTML = "";
    loading.classList.remove("hidden");
    noData.classList.add("hidden");

    try {
        const response = await fetch("https://open-api.coinglass.com/public/v2/funding_rates?exchange=delta&interval=8h");
        
        if (!response.ok) throw new Error("Network error");

        const data = await response.json();

        if (data.code !== "0") throw new Error("API response error");

        const deltaList = data.data.find(item => item.exchangeName === "Delta")?.fundingRateList || [];

        const highFunding = deltaList
            .filter(coin => Math.abs(parseFloat(coin.fundingRate)) >= THRESHOLD)
            .sort((a, b) => Math.abs(parseFloat(b.fundingRate)) - Math.abs(parseFloat(a.fundingRate)));

        if (highFunding.length === 0) {
            noData.classList.remove("hidden");
        } else {
            highFunding.forEach(coin => {
                const rate = parseFloat(coin.fundingRate);
                const percent = (rate * 100).toFixed(4);
                const symbol = coin.symbol.replace("PERP", "");

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${symbol}</td>
                    <td class="${rate > 0 ? "positive" : "negative"}">
                        ${rate > 0 ? "🟢 +" : "🔴 "} ${percent}%
                    </td>
                    <td>${rate > 0 ? "Longs → Shorts" : "Shorts → Longs"}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        lastUpdate.textContent = new Date().toLocaleString("en-IN");

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="3">Error 😓<br>Retry in 1 minute...</td></tr>`;
        console.error(error);
    } finally {
        loading.classList.add("hidden");
    }
}

// Start karo
fetchData();
setInterval(fetchData, 60000); // हर मिनट अपडेट
