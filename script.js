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

  // Memulihkan pilihan checkbox dari localStorage
  restoreCheckboxState();
}

// Fungsi untuk membuat checkbox per kategori
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

  // Tambahkan event listener untuk menyimpan state saat checkbox diubah
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

    const selectedStocks = JSON.parse(localStorage.getItem("selectedStocks")) || [];
    const selectedForex = JSON.parse(localStorage.getItem("selectedForex")) || [];
    const selectedCommodities = JSON.parse(localStorage.getItem("selectedCommodities")) || [];

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
  }, 60000);
}

// Fungsi untuk menghentikan auto-fetch
function stopAutoFetch() {
  clearInterval(autoFetchInterval);
  document.getElementById("statusMessage").textContent = "🛑 Auto-fetching dihentikan.";
}

// Fungsi untuk me-refresh halaman otomatis setiap 5 menit
setTimeout(() => {
  location.reload();
}, 300000);

// Jalankan fungsi untuk membuat checkbox saat halaman dimuat
window.onload = generateCheckboxes;