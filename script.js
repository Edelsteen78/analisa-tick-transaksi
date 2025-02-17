const API_KEY = "YOUR_API_KEY"; // Ganti dengan API Key Alpha Vantage
let marketChart, transactionChart, candleChart, fundamentalChart;
let autoFetchInterval;

// Simbol yang sering dipakai dalam trading
const STOCKS = ["AAPL", "TSLA", "AMZN"];
const FOREX = ["EUR/USD", "GBP/USD", "USD/JPY"];
const COMMODITIES = ["XAU/USD", "XAG/USD", "WTI"];

// Fungsi untuk membuat checkbox dan menyimpan state
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

// Fungsi untuk menggabungkan data Alpha Vantage dan CSV dalam satu chart
function visualizeMarketChart(dataAlpha, dataCSV) {
    const labels = [...dataAlpha.map(row => row.Time), ...dataCSV.map(row => row.Time)];
    const prices = [...dataAlpha.map(row => row.Price), ...dataCSV.map(row => row.Price)];

    const ctx = document.getElementById("marketChart").getContext("2d");
    
    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{ label: "Harga Pasar", data: prices, borderColor: "blue", borderWidth: 2, fill: false }],
        },
        options: { responsive: true, plugins: { legend: { display: true } } }
    });
}

// Fungsi untuk menampilkan grafik berita fundamental
function visualizeFundamentalChart(sentiment) {
    const ctx = document.getElementById("fundamentalChart").getContext("2d");

    new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Positif", "Negatif"],
            datasets: [{
                data: sentiment === "positif" ? [70, 30] : [30, 70],
                backgroundColor: ["green", "red"]
            }]
        },
        options: { responsive: true, plugins: { legend: { display: true } } }
    });
}

// Fungsi untuk menangani upload file CSV
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return alert("Pilih file CSV terlebih dahulu!");
    const rawData = await parseCSV(file);
    visualizeMarketChart([], rawData);
}

// Fungsi untuk menyimpan berita fundamental
function saveNews() {
    const impact = document.querySelector('input[name="impact"]:checked').value;
    const sentiment = document.querySelector('input[name="sentiment"]:checked").value;
    localStorage.setItem("newsImpact", impact);
    localStorage.setItem("newsSentiment", sentiment);
    visualizeFundamentalChart(sentiment);
}

window.onload = function () {
    generateCheckboxes();
};