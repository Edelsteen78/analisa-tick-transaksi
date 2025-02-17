const API_KEY = "V5YBXFRFAH5PT6UL"; // Ganti dengan API Key Alpha Vantage
let stockChart, forexChart, commodityChart, candleChart;
let autoFetchInterval;

// Simbol populer
const STOCKS = ["AAPL", "TSLA", "AMZN"];
const FOREX = ["EUR/USD", "GBP/USD", "USD/JPY"];
const COMMODITIES = ["XAU/USD", "XAG/USD", "WTI"];

// Fungsi untuk membuat checkbox berdasarkan simbol
function generateCheckboxes() {
    createCheckboxes("stockList", STOCKS, "stock");
    createCheckboxes("forexList", FOREX, "forex");
    createCheckboxes("commodityList", COMMODITIES, "commodity");

    restoreCheckboxState();
    if (localStorage.getItem("autoFetchRunning") === "true") {
        autoFetchData();
    }
}

// Fungsi untuk membuat checkbox kategori
function createCheckboxes(containerId, symbols, className) {
    const container = document.getElementById(containerId);
    symbols.forEach(symbol => {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = symbol;
        checkbox.classList.add(className);
        
        let label = document.createElement("label");
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${symbol}`));

        container.appendChild(label);
        container.appendChild(document.createElement("br"));
    });

    document.querySelectorAll(`.${className}`).forEach(checkbox => {
        checkbox.addEventListener("change", saveCheckboxState);
    });
}

// Fungsi untuk menyimpan state checkbox ke localStorage
function saveCheckboxState() {
    let selectedStocks = [...document.querySelectorAll(".stock:checked")].map(el => el.value);
    let selectedForex = [...document.querySelectorAll(".forex:checked")].map(el => el.value);
    let selectedCommodities = [...document.querySelectorAll(".commodity:checked")].map(el => el.value);

    localStorage.setItem("selectedStocks", JSON.stringify(selectedStocks));
    localStorage.setItem("selectedForex", JSON.stringify(selectedForex));
    localStorage.setItem("selectedCommodities", JSON.stringify(selectedCommodities));
}

// Fungsi untuk memulihkan state checkbox dari localStorage
function restoreCheckboxState() {
    let selectedStocks = JSON.parse(localStorage.getItem("selectedStocks")) || [];
    let selectedForex = JSON.parse(localStorage.getItem("selectedForex")) || [];
    let selectedCommodities = JSON.parse(localStorage.getItem("selectedCommodities")) || [];

    document.querySelectorAll(".stock").forEach(checkbox => {
        checkbox.checked = selectedStocks.includes(checkbox.value);
    });
    document.querySelectorAll(".forex").forEach(checkbox => {
        checkbox.checked = selectedForex.includes(checkbox.value);
    });
    document.querySelectorAll(".commodity").forEach(checkbox => {
        checkbox.checked = selectedCommodities.includes(checkbox.value);
    });
}

// Fungsi untuk mengambil data dari Alpha Vantage
async function fetchMarketData(type, symbol) {
    try {
        let url = "";
        if (type === "stock") {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;
        } else if (type === "forex") {
            const [from, to] = symbol.split("/");
            url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${from}&to_symbol=${to}&interval=5min&apikey=${API_KEY}`;
        } else if (type === "commodity") {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        return data["Time Series (5min)"] ? Object.keys(data["Time Series (5min)"]).map(time => ({
            Time: time,
            Price: parseFloat(data["Time Series (5min)"][time]["1. open"])
        })).reverse() : null;
    } catch (error) {
        console.error(`Gagal mengambil data untuk ${symbol}:`, error);
        return null;
    }
}

// Fungsi untuk menampilkan grafik candle dengan sinyal Buy/Sell
function visualizeCandleChart(data) {
    const labels = data.map(row => row.Time);
    const prices = data.map(row => row.Price);
    const signals = data.map(row => row.Signal);

    const buySignals = signals.map((signal, i) => (signal === "BUY" ? prices[i] : null));
    const sellSignals = signals.map((signal, i) => (signal === "SELL" ? prices[i] : null));

    const ctx = document.getElementById("candleChart").getContext("2d");
    
    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                { label: "Harga", data: prices, borderColor: "blue", borderWidth: 2, fill: false },
                { label: "BUY", data: buySignals, backgroundColor: "green", pointRadius: 5, type: "scatter" },
                { label: "SELL", data: sellSignals, backgroundColor: "red", pointRadius: 5, type: "scatter" }
            ],
        },
        options: { responsive: true, plugins: { legend: { display: true } } }
    });
}

// Fungsi untuk menangani upload file CSV
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return alert("Pilih file CSV terlebih dahulu!");
    const rawData = await parseCSV(file);
    const analyzedData = analyzeCandle(rawData);
    visualizeCandleChart(analyzedData);
}

// Fungsi untuk menyimpan berita fundamental
function saveNews() {
    const impact = document.querySelector('input[name="impact"]:checked').value;
    const sentiment = document.querySelector('input[name="sentiment"]:checked').value;
    localStorage.setItem("newsImpact", impact);
    localStorage.setItem("newsSentiment", sentiment);
}

// Fungsi untuk memuat berita fundamental saat halaman dibuka kembali
function loadNews() {
    const impact = localStorage.getItem("newsImpact");
    const sentiment = localStorage.getItem("newsSentiment");
    if (impact) document.querySelector(`input[name="impact"][value="${impact}"]`).checked = true;
    if (sentiment) document.querySelector(`input[name="sentiment"][value="${sentiment}"]`).checked = true;
}

window.onload = function () {
    generateCheckboxes();
    loadNews();
};