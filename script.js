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
        const res = await fetch("https://open-api.coinglass.com/public/v2/funding_rates?exchange=delta&interval=8h", {
            headers: { "accept": "application/json" }
        });

        const json = await res.json();

        if (json.code !== "0") throw new Error("API Error");

        const deltaRates = json.data.find(item => item.exchangeName === "Delta")?.fundingRateList || [];

        const high = deltaRates
            .filter(c => Math.abs(parseFloat(c.fundingRate)) >= THRESHOLD)
            .sort((a, b) => Math.abs(parseFloat(b.fundingRate)) - Math.abs(parseFloat(a.fundingRate)));

        if (high.length === 0) {
            noData.classList.remove("hidden");
        } else {
            high.forEach(c => {
                const rate = parseFloat(c.fundingRate);
                const percent = (rate * 100).toFixed(4);
                const symbol = c.symbol.replace("PERP", "");

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${symbol}</td>
                    <td class="${rate > 0 ? 'positive' : 'negative'}">
                        ${rate > 0 ? "🟢 +" : "🔴 "} ${percent}%
                    </td>
                    <td>${rate > 0 ? "Longs paying Shorts" : "Shorts paying Longs"}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        lastUpdate.textContent = new Date().toLocaleString("en-IN");

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="3">Error 😓<br>Auto retry in 1 min...</td></tr>`;
        console.error(err);
    } finally {
        loading.classList.add("hidden");
    }
}

// Start
fetchData();
setInterval(fetchData, 60000); // हर मिनट अपडेट
