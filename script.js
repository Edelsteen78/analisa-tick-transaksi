const API_KEY = "V5YBXFRFAH5PT6UL"; // Ganti dengan API Key Alpha Vantage
let stockChart, forexChart, commodityChart;
let autoFetchInterval;

// Simbol populer untuk masing-masing kategori
const STOCKS = ["AAPL", "TSLA", "AMZN"];
const FOREX = ["EUR/USD", "GBP/USD", "USD/JPY"];
const COMMODITIES = ["XAU/USD", "XAG/USD", "WTI"];

// Fungsi untuk membuat checkbox berdasarkan simbol
function generateCheckboxes() {
  createCheckboxes("stockList", STOCKS, "stock");
  createCheckboxes("forexList", FOREX, "forex");
  createCheckboxes("commodityList", COMMODITIES, "commodity");
}

// Fungsi untuk membuat checkbox per kategori
function createCheckboxes(containerId, symbols, className) {
  const container = document.getElementById(containerId);
  symbols.forEach(symbol => {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = symbol;
    checkbox.classList.add(className);
    checkbox.checked = true; // Default: Semua simbol dicentang
    
    let label = document.createElement("label");
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${symbol}`));

    container.appendChild(label);
    container.appendChild(document.createElement("br"));
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
    console.log(`Response API (${symbol}):`, data);

    if (data["Note"]) {
      console.warn("⚠ API Rate Limit Tercapai. Menunggu...");
      return null;
    }

    if (!data["Time Series (5min)"]) {
      console.warn(`⚠ Data untuk ${symbol} tidak ditemukan.`);
      return null;
    }

    const timeSeries = data["Time Series (5min)"];
    return Object.keys(timeSeries).map((time) => ({
      Time: time,
      Price: parseFloat(timeSeries[time]["1. open"]),
      Volume: parseFloat(timeSeries[time]["5. volume"]),
    })).reverse();
  } catch (error) {
    console.error(`Gagal mengambil data untuk ${symbol}:`, error);
    return null;
  }
}

// Fungsi untuk menampilkan grafik
function visualizePrices(data, canvasId, chartRef) {
  if (!data || !data.length) return;

  const labels = data.map((row) => row.Time);
  const prices = data.map((row) => row.Price);

  const ctx = document.getElementById(canvasId).getContext("2d");

  if (chartRef) {
    chartRef.destroy();
  }

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Harga",
          data: prices,
          borderColor: "blue",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
    },
  });
}

// Fungsi untuk mengambil data otomatis berdasarkan checkbox yang dicentang
async function autoFetchData() {
  document.getElementById("statusMessage").textContent = "⏳ Mengambil data otomatis...";

  autoFetchInterval = setInterval(async () => {
    console.log("🔄 Memulai pengambilan data otomatis...");

    const selectedStocks = [...document.querySelectorAll(".stock:checked")].map(el => el.value);
    const selectedForex = [...document.querySelectorAll(".forex:checked")].map(el => el.value);
    const selectedCommodities = [...document.querySelectorAll(".commodity:checked")].map(el => el.value);

    for (let stock of selectedStocks) {
      let data = await fetchMarketData("stock", stock);
      if (data) visualizePrices(data, "stockChart", stockChart);
    }
    for (let forex of selectedForex) {
      let data = await fetchMarketData("forex", forex);
      if (data) visualizePrices(data, "forexChart", forexChart);
    }
    for (let commodity of selectedCommodities) {
      let data = await fetchMarketData("commodity", commodity);
      if (data) visualizePrices(data, "commodityChart", commodityChart);
    }
  }, 60000); // Ambil data setiap 60 detik

  alert("🚀 Auto-fetching dimulai! Data akan diperbarui setiap 60 detik.");
}

// Fungsi untuk menghentikan auto-fetch
function stopAutoFetch() {
  clearInterval(autoFetchInterval);
  document.getElementById("statusMessage").textContent = "🛑 Auto-fetching dihentikan.";
  alert("🛑 Auto-fetching dihentikan.");
}

// Fungsi untuk me-refresh halaman otomatis setiap 5 menit
setTimeout(() => {
  location.reload();
}, 300000); // 300000 ms = 5 menit

// Jalankan fungsi untuk membuat checkbox saat halaman dimuat
window.onload = generateCheckboxes;