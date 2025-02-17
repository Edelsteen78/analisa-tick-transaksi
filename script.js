const API_KEY = "V5YBXFRFAH5PT6UL"; // Ganti dengan API Key Alpha Vantage
let candleChart, lineChart, riskChart;

// Simbol yang akan diambil (XAU/USD & EUR/USD)
const SYMBOLS = ["XAU/USD", "EUR/USD"];

// Level Support & Resistance
const LEVELS = {
    "XAU/USD": { support: 2770.03, resistance: 2885.02, takeProfit: 2900, stopLoss: 2770 },
    "EUR/USD": { support: 1.0850, resistance: 1.0950, takeProfit: 1.1000, stopLoss: 1.0800 }
};

// Fungsi untuk mengambil data harga dari Alpha Vantage
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

// Fungsi untuk menampilkan **Candlestick Chart**
async function visualizeCandleChart() {
    const xauData = await fetchMarketData("XAU/USD");
    const eurData = await fetchMarketData("EUR/USD");

    if (!xauData || !eurData) {
        alert("Gagal mengambil data harga!");
        return;
    }

    const ctx = document.getElementById("candleChart").getContext("2d");
    if (candleChart) candleChart.destroy();

    candleChart = new Chart(ctx, {
        type: "candlestick",
        data: {
            datasets: [
                {
                    label: "XAU/USD",
                    data: xauData.map(row => ({
                        t: new Date(row.Time),
                        o: row.Open,
                        h: row.High,
                        l: row.Low,
                        c: row.Close
                    })),
                    borderColor: "gold",
                },
                {
                    label: "EUR/USD",
                    data: eurData.map(row => ({
                        t: new Date(row.Time),
                        o: row.Open,
                        h: row.High,
                        l: row.Low,
                        c: row.Close
                    })),
                    borderColor: "blue",
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                annotation: {
                    annotations: {
                        xauResistance: {
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'y',
                            value: LEVELS["XAU/USD"].resistance,
                            borderColor: 'red',
                            borderWidth: 2,
                            label: { enabled: true, content: "XAU Resistance" }
                        },
                        xauSupport: {
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'y',
                            value: LEVELS["XAU/USD"].support,
                            borderColor: 'green',
                            borderWidth: 2,
                            label: { enabled: true, content: "XAU Support" }
                        },
                        eurResistance: {
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'y',
                            value: LEVELS["EUR/USD"].resistance,
                            borderColor: 'purple',
                            borderWidth: 2,
                            label: { enabled: true, content: "EUR Resistance" }
                        },
                        eurSupport: {
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'y',
                            value: LEVELS["EUR/USD"].support,
                            borderColor: 'cyan',
                            borderWidth: 2,
                            label: { enabled: true, content: "EUR Support" }
                        }
                    }
                }
            }
        }
    });
}

// Fungsi untuk menampilkan **Line Chart (Berita Fundamental)**
function visualizeLineChart() {
    const ctx = document.getElementById("lineChart").getContext("2d");
    if (lineChart) lineChart.destroy();

    lineChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["1 Jan", "5 Jan", "10 Jan", "15 Jan", "20 Jan"],
            datasets: [
                {
                    label: "XAU/USD",
                    data: [2800, 2850, 2830, 2900, 2920],
                    borderColor: "gold",
                    fill: false
                },
                {
                    label: "EUR/USD",
                    data: [1.0850, 1.0875, 1.0900, 1.0920, 1.0950],
                    borderColor: "blue",
                    fill: false
                },
                {
                    label: "Event Geopolitik",
                    data: [null, null, 2830, null, null],
                    backgroundColor: "red",
                    type: "scatter",
                    pointRadius: 5
                }
            ]
        },
        options: { responsive: true }
    });
}

// Fungsi untuk menampilkan **Risk Management Chart**
function visualizeRiskChart() {
    const ctx = document.getElementById("riskChart").getContext("2d");
    if (riskChart) riskChart.destroy();

    riskChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Stop-Loss", "Entry", "Take-Profit"],
            datasets: [
                {
                    label: "XAU/USD",
                    data: [LEVELS["XAU/USD"].stopLoss, LEVELS["XAU/USD"].resistance, LEVELS["XAU/USD"].takeProfit],
                    backgroundColor: ["red", "blue", "green"]
                },
                {
                    label: "EUR/USD",
                    data: [LEVELS["EUR/USD"].stopLoss, LEVELS["EUR/USD"].resistance, LEVELS["EUR/USD"].takeProfit],
                    backgroundColor: ["pink", "purple", "cyan"]
                }
            ]
        },
        options: { responsive: true }
    });
}

// Fungsi untuk menjalankan semua visualisasi secara otomatis
function runAnalysis() {
    visualizeCandleChart();
    visualizeLineChart();
    visualizeRiskChart();
}

window.onload = runAnalysis;