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
        // Coinglass public API - Delta Exchange ke exact rates
        const response = await fetch("https://open-api.coinglass.com/public/v2/funding_rates?exchange=delta&interval=8h", {
            headers: { "accept": "application/json" }
        });

        const data = await response.json();

        if (data.code !== "0") throw new Error("API Error");

        const deltaList = data.data.find(d => d.exchangeName === "Delta")?.fundingRateList || [];

        const highFunding = deltaList
            .filter(item => Math.abs(parseFloat(item.fundingRate)) >= THRESHOLD)
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
                    <td data-label="Price">Live on Delta</td>
                `;
                tableBody.appendChild(row);
            });
        }

        lastUpdate.textContent = new Date().toLocaleString('en-IN');

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="3">Error 😓<br>Retry in 1 min...</td></tr>`;
    } finally {
        loading.classList.add("hidden");
    }
}

// Start
fetchData();
setInterval(fetchData, 60000); // Har minute update
