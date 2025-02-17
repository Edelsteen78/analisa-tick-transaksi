const API_KEY = "V5YBXFRFAH5PT6UL"; // Ganti dengan API Key Alpha Vantage
let stockChart, forexChart, commodityChart;
let autoFetchInterval;

// Simbol populer untuk masing-masing kategori
const STOCKS = ["AAPL", "TSLA", "AMZN", "GOOGL", "MSFT"];
const FOREX = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD"];
const COMMODITIES = ["XAU/USD", "XAG/USD", "WTI", "NG"];

// Fungsi untuk mengambil data dari Alpha Vantage
async function fetchMarketData(type, symbol, market = "USD") {
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

// Fungsi untuk analisis statistik
function analyzeStatistics(data, outputElementId) {
  if (!data || !data.length) return;

  const prices = data.map((row) => row.Price).filter((p) => !isNaN(p));
  const volumes = data.map((row) => row.Volume).filter((v) => !isNaN(v));

  const stats = {
    totalTransactions: data.length,
    highestPrice: Math.max(...prices),
    lowestPrice: Math.min(...prices),
    averagePrice: (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2),
    totalVolume: volumes.reduce((sum, volume) => sum + volume, 0),
  };

  document.getElementById(outputElementId).textContent = JSON.stringify(stats, null, 2);
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

// Fungsi untuk mengambil data otomatis
async function autoFetchData() {
  document.getElementById("statusMessage").textContent = "⏳ Mengambil data otomatis...";

  autoFetchInterval = setInterval(async () => {
    console.log("🔄 Memulai pengambilan data otomatis...");
    for (let stock of STOCKS) {
      let data = await fetchMarketData("stock", stock);
      if (data) visualizePrices(data, "stockChart", stockChart);
    }
    for (let forex of FOREX) {
      let data = await fetchMarketData("forex", forex);
      if (data) visualizePrices(data, "forexChart", forexChart);
    }
    for (let commodity of COMMODITIES) {
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