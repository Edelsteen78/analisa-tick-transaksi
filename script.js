const API_KEY = "YOUR_API_KEY"; // Ganti dengan API Key Alpha Vantage
let candleChart, lineChart, riskChart;

// Level Support & Resistance
const SUPPORT_LEVEL = 2770.03;
const RESISTANCE_LEVEL = 2885.02;
const TAKE_PROFIT = 2900;
const STOP_LOSS = 2770;
const TARGET_ZONE = [2900, 2920];

// Fungsi untuk mengambil data harga emas dari Alpha Vantage
async function fetchGoldData() {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=XAUUSD&interval=5min&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data["Time Series (5min)"]) return null;

    return Object.keys(data["Time Series (5min)"]).map(time => ({
        Time: time,
        Open: parseFloat(data["Time Series (5min)"][time]["1. open"]),
        High: parseFloat(data["Time Series (5min)"][time]["2. high"]),
        Low: parseFloat(data["Time Series (5min)"][time]["3. low"]),
        Close: parseFloat(data["Time Series (5min)"][time]["4. close"]),
    })).reverse();
}

// Fungsi untuk menampilkan **Candlestick Chart**
async function visualizeCandleChart() {
    const data = await fetchGoldData();
    if (!data) {
        alert("Gagal mengambil data harga emas!");
        return;
    }

    const ctx = document.getElementById("candleChart").getContext("2d");
    if (candleChart) candleChart.destroy();

    candleChart = new Chart(ctx, {
        type: "candlestick",
        data: {
            datasets: [{
                label: "Harga Emas",
                data: data.map(row => ({
                    t: new Date(row.Time),
                    o: row.Open,
                    h: row.High,
                    l: row.Low,
                    c: row.Close
                })),
                borderColor: "blue",
            }]
        },
        options: {
            responsive: true,
            plugins: {
                annotation: {
                    annotations: {
                        resistanceLine: {
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'y',
                            value: RESISTANCE_LEVEL,
                            borderColor: 'red',
                            borderWidth: 2,
                            label: { enabled: true, content: "Resistance" }
                        },
                        supportLine: {
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'y',
                            value: SUPPORT_LEVEL,
                            borderColor: 'green',
                            borderWidth: 2,
                            label: { enabled: true, content: "Support" }
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
                    label: "Harga Emas",
                    data: [2800, 2850, 2830, 2900, 2920],
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
            datasets: [{
                label: "Harga ($)",
                data: [STOP_LOSS, RESISTANCE_LEVEL, TAKE_PROFIT],
                backgroundColor: ["red", "blue", "green"]
            }]
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