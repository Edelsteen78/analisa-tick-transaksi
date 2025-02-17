const API_KEY = "V5YBXFRFAH5PT6UL"; // Ganti dengan API Key Alpha Vantage
let candleChart, eventChart, riskChart, sentimentScore;

// **Level Support & Resistance**
const SUPPORT_LEVEL = 2770.03;
const RESISTANCE_LEVEL = 2885.02;
const TAKE_PROFIT = [2900, 2920];
const STOP_LOSS = 2770;

// **Kamus Kata untuk Analisis Sentimen**
const POSITIVE_WORDS = ["naik", "bullish", "positif", "optimis", "penguatan", "kenaikan"];
const NEGATIVE_WORDS = ["turun", "bearish", "negatif", "pesimis", "pelemahan", "penurunan"];

// **Fungsi untuk Menganalisis Sentimen Berita**
function analyzeSentiment(newsText) {
    let score = 0;
    const words = newsText.toLowerCase().split(/\s+/);

    words.forEach(word => {
        if (POSITIVE_WORDS.includes(word)) score += 1;
        if (NEGATIVE_WORDS.includes(word)) score -= 1;
    });

    sentimentScore = score;
    return score;
}

// **Fungsi untuk Menampilkan Rekomendasi Buy/Sell**
function getTradeRecommendation() {
    if (sentimentScore > 0) {
        return "Rekomendasi: BUY (Sentimen positif)";
    } else if (sentimentScore < 0) {
        return "Rekomendasi: SELL (Sentimen negatif)";
    } else {
        return "Rekomendasi: HOLD (Sentimen netral)";
    }
}

// **Fungsi untuk Menyimpan Berita Fundamental & Analisis Sentimen**
function saveNews() {
    const newsText = document.getElementById("newsInput").value;
    localStorage.setItem("fundamentalNews", newsText);
    
    const sentiment = analyzeSentiment(newsText);
    document.getElementById("sentimentScore").textContent = `Skor Sentimen: ${sentiment}`;
    document.getElementById("tradeRecommendation").textContent = getTradeRecommendation();
    
    visualizeEventChart(newsText, sentiment);
}

// **Fungsi untuk Mengambil Data XAU/USD dari Alpha Vantage**
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

// **Fungsi untuk Menampilkan Candlestick Chart**
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

// **Fungsi untuk Menampilkan Event Chart (Dampak Berita Fundamental)**
function visualizeEventChart(newsText, sentiment) {
    const ctx = document.getElementById("eventChart").getContext("2d");
    if (eventChart) eventChart.destroy();

    eventChart = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: "Event Berita",
                    data: [{ x: 2885, y: sentiment }],
                    backgroundColor: sentiment > 0 ? "green" : "red",
                    pointRadius: 10
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { type: "linear", position: "bottom", title: { display: true, text: "Harga Emas ($)" } },
                y: { title: { display: true, text: "Dampak Berita (Skor Sentimen)" } }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: () => newsText
                    }
                }
            }
        }
    });
}

// **Fungsi untuk Menampilkan Risk Management Chart**
function visualizeRiskChart() {
    const ctx = document.getElementById("riskChart").getContext("2d");
    if (riskChart) riskChart.destroy();

    riskChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Stop-Loss", "Entry", "Take-Profit"],
            datasets: [{
                label: "Harga ($)",
                data: [STOP_LOSS, RESISTANCE_LEVEL, TAKE_PROFIT[0]],
                backgroundColor: ["red", "blue", "green"]
            }]
        },
        options: { responsive: true }
    });
}

// **Fungsi untuk Memuat Semua Chart Saat Website Dibuka**
function runAnalysis() {
    visualizeCandleChart();
    visualizeRiskChart();

    const savedNews = localStorage.getItem("fundamentalNews");
    if (savedNews) {
        document.getElementById("newsInput").value = savedNews;
        const sentiment = analyzeSentiment(savedNews);
        document.getElementById("sentimentScore").textContent = `Skor Sentimen: ${sentiment}`;
        document.getElementById("tradeRecommendation").textContent = getTradeRecommendation();
        visualizeEventChart(savedNews, sentiment);
    }
}

window.onload = runAnalysis;