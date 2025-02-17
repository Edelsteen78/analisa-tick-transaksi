const API_KEY = "V5YBXFRFAH5PT6UL"; // Ganti dengan API Key Alpha Vantage
let candleChart, eventChart, riskChart, activeSymbol = null, fetchInterval;

// **Level Support & Resistance**
const SYMBOLS = {
    "XAU/USD": { support: 2770.03, resistance: 2885.02, takeProfit: 2900, stopLoss: 2770 },
    "EUR/USD": { support: 1.0850, resistance: 1.0950, takeProfit: 1.1000, stopLoss: 1.0800 }
};

// **Fungsi untuk mengambil data harga dari Alpha Vantage**
async function fetchMarketData(symbol) {
    const [from, to] = symbol.split("/");
    const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${from}&to_symbol=${to}&interval=5min&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data["Time Series FX (5min)"]) return null;

    return Object.keys(data["Time Series FX (5min)"]).map(time => ({
        Time: time,
        Open: parseFloat(data["Time Series FX (5min)"][time]["1. open"]),
        High: parseFloat(data["Time Series FX (5min)"][time]["2. high"]),
        Low: parseFloat(data["Time Series FX (5min)"][time]["3. low"]),
        Close: parseFloat(data["Time Series FX (5min)"][time]["4. close"]),
    })).reverse();
}

// **Fungsi untuk Menampilkan Candlestick Chart**
async function visualizeCandleChart(symbol) {
    const data = await fetchMarketData(symbol);
    if (!data) {
        alert(`Gagal mengambil data harga untuk ${symbol}`);
        return;
    }

    const ctx = document.getElementById("candleChart").getContext("2d");
    if (candleChart) candleChart.destroy();

    candleChart = new Chart(ctx, {
        type: "candlestick",
        data: {
            datasets: [{
                label: `Harga ${symbol}`,
                data: data.map(row => ({
                    t: new Date(row.Time),
                    o: row.Open,
                    h: row.High,
                    l: row.Low,
                    c: row.Close
                })),
                borderColor: symbol === "XAU/USD" ? "gold" : "blue",
            }]
        },
        options: { responsive: true }
    });
}

// **Fungsi untuk Memulai Pengambilan Data Pasar**
function startFetchingData(symbol) {
    clearInterval(fetchInterval);
    fetchInterval = setInterval(() => visualizeCandleChart(symbol), 60000); // Fetch data setiap 1 menit
    visualizeCandleChart(symbol);
}

// **Fungsi untuk Mengaktifkan/Tidak Aktifkan Tombol**
function toggleSymbol(symbol) {
    if (activeSymbol === symbol) {
        document.getElementById(symbol).classList.remove("active");
        activeSymbol = null;
        clearInterval(fetchInterval); // Hentikan pengambilan data
        return;
    }

    // Nonaktifkan tombol lain
    document.querySelectorAll(".symbol-btn").forEach(btn => btn.classList.remove("active"));

    // Aktifkan tombol yang ditekan
    document.getElementById(symbol).classList.add("active");
    activeSymbol = symbol;

    // Ambil data pasar secara otomatis
    startFetchingData(symbol);
}

window.onload = function () {
    document.getElementById("XAU/USD").addEventListener("click", () => toggleSymbol("XAU/USD"));
    document.getElementById("EUR/USD").addEventListener("click", () => toggleSymbol("EUR/USD"));
};