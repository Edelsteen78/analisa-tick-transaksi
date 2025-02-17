const API_KEY = "V5YBXFRFAH5PT6UL"; // Ganti dengan API Key Alpha Vantage
let model;
let stockChart, forexChart, commodityChart;
let autoFetchInterval; // Variabel untuk menyimpan interval otomatis

// Fungsi untuk mengambil data dari Alpha Vantage
async function fetchMarketData(type, symbol, market = "USD") {
  try {
    let url = "";
    if (type === "stock") {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;
    } else if (type === "forex") {
      url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${symbol}&to_symbol=${market}&interval=5min&apikey=${API_KEY}`;
    } else if (type === "commodity") {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    console.log("Response API:", data);

    if (data["Note"]) {
      console.warn("⚠ API Rate Limit Tercapai. Mencoba kembali nanti...");
      return null; // Beri nilai null agar sistem tahu API limit
    }

    if (!data["Time Series (5min)"]) {
      alert("⚠ Data tidak ditemukan atau format salah.");
      return null;
    }

    const timeSeries = data["Time Series (5min)"];
    return Object.keys(timeSeries).map((time) => ({
      Time: time,
      Price: parseFloat(timeSeries[time]["1. open"]),
      Volume: parseFloat(timeSeries[time]["5. volume"]),
    })).reverse();
  } catch (error) {
    console.error("Gagal mengambil data:", error);
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

// Fungsi utama untuk mengambil data otomatis berdasarkan centang
async function autoFetchData() {
  let stocksChecked = document.getElementById("autoStock").checked;
  let forexChecked = document.getElementById("autoForex").checked;
  let commoditiesChecked = document.getElementById("autoCommodity").checked;

  if (!stocksChecked && !forexChecked && !commoditiesChecked) {
    alert("Pilih setidaknya satu kategori untuk diambil otomatis.");
    return;
  }

  autoFetchInterval = setInterval(async () => {
    if (stocksChecked) await getMarketAnalysis("stock");
    if (forexChecked) await getMarketAnalysis("forex");
    if (commoditiesChecked) await getMarketAnalysis("commodity");
  }, 60000); // Ambil data setiap 60 detik

  alert("🚀 Auto-fetching dimulai! Data akan diperbarui setiap 60 detik.");
}

// Fungsi untuk menghentikan auto-fetch
function stopAutoFetch() {
  clearInterval(autoFetchInterval);
  alert("🛑 Auto-fetching dihentikan.");
}

// Fungsi utama untuk mengambil dan menampilkan data manual
async function getMarketAnalysis(type) {
  let symbol = "";
  let market = "USD"; 
  let statsId = "";
  let chartId = "";
  let predictionId = "";
  let chartRef;

  if (type === "stock") {
    symbol = "AAPL"; // Gantilah dengan saham pilihanmu
    statsId = "statsStock";
    chartId = "stockChart";
    predictionId = "predictionStock";
    chartRef = stockChart;
  } else if (type === "forex") {
    symbol = "EUR";
    statsId = "statsForex";
    chartId = "forexChart";
    predictionId = "predictionForex";
    chartRef = forexChart;
  } else if (type === "commodity") {
    symbol = "XAUUSD";
    statsId = "statsCommodity";
    chartId = "commodityChart";
    predictionId = "predictionCommodity";
    chartRef = commodityChart;
  }

  const data = await fetchMarketData(type, symbol, market);
  if (!data) return;

  analyzeStatistics(data, statsId);
  if (type === "stock") stockChart = visualizePrices(data, chartId, chartRef);
  if (type === "forex") forexChart = visualizePrices(data, chartId, chartRef);
  if (type === "commodity") commodityChart = visualizePrices(data, chartId, chartRef);
}

// Muat model saat halaman dimuat
loadModel();