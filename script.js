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
        // Step 1: Funding rates
        const fundingRes = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex");
        const fundingData = await fundingRes.json();

        // Step 2: Current prices
        const priceRes = await fetch("https://fapi.binance.com/fapi/v1/ticker/price");
        const priceData = await priceRes.json();
        const priceMap = {};
        priceData.forEach(p => priceMap[p.symbol] = p.price);

        const highFunding = fundingData
            .filter(item => item.symbol.endsWith("USDT")) // Only USDT perpetuals
            .filter(item => Math.abs(parseFloat(item.lastFundingRate)) >= THRESHOLD)
            .sort((a, b) => Math.abs(parseFloat(b.lastFundingRate)) - Math.abs(parseFloat(a.lastFundingRate)));

        if (highFunding.length === 0) {
            noData.classList.remove("hidden");
        } else {
            highFunding.forEach(item => {
                const rate = parseFloat(item.lastFundingRate);
                const ratePercent = (rate * 100).toFixed(4);
                const symbol = item.symbol.replace("USDT", "");
                const price = priceMap[item.symbol] || "N/A";
                const nextTime = new Date(item.nextFundingTime).toLocaleString('en-IN');

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td data-label="Symbol">${symbol}</td>
                    <td data-label="Funding" class="${rate > 0 ? 'positive' : 'negative'}">
                        ${rate > 0 ? "🟢 +" : "🔴"} ${ratePercent}%
                    </td>
                    <td data-label="Price">$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td data-label="Next Funding">${nextTime}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        lastUpdate.textContent = new Date().toLocaleString('en-IN');

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="4">Error 😓<br>Retry ho raha hai...</td></tr>`;
        console.error(error);
    } finally {
        loading.classList.add("hidden");
    }
}

// Start
fetchData();
setInterval(fetchData, 60000); // Har minute update
