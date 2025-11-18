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
        const response = await fetch("https://api.bybit.com/v5/market/tickers?category=linear");
        const data = await response.json();

        if (data.retCode !== 0) throw new Error("API Error");

        const highFunding = data.result.list
            .filter(item => item.symbol.endsWith("USDT"))
            .filter(item => Math.abs(parseFloat(item.fundingRate)) >= THRESHOLD)
            .sort((a, b) => Math.abs(parseFloat(b.fundingRate)) - Math.abs(parseFloat(a.fundingRate)));

        if (highFunding.length === 0) {
            noData.classList.remove("hidden");
        } else {
            highFunding.forEach(item => {
                const rate = parseFloat(item.fundingRate);
                const percent = (rate * 100).toFixed(4);
                const symbol = item.symbol.replace("USDT", "");
                const price = parseFloat(item.lastPrice).toLocaleString();

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${symbol}</td>
                    <td class="${rate > 0 ? "positive" : "negative"}">
                        ${rate > 0 ? "🟢 +" : "🔴 "} ${percent}%
                    </td>
                    <td>$${price}</td>
                    <td>${new Date(parseInt(item.nextFundingTime)).toLocaleString('en-IN')}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        lastUpdate.textContent = new Date().toLocaleString("en-IN");

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="4">Error 😓<br>Retry in 1 min...</td></tr>`;
    } finally {
        loading.classList.add("hidden");
    }
}

fetchData();
setInterval(fetchData, 60000);
