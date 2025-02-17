const API_KEY = "V5YBXFRFAH5PT6UL"; // Ganti dengan API Key Alpha Vantage
let model;
let stockChart, forexChart, commodityChart;

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
      alert("⚠ API Rate Limit Tercapai: " + data["Note"]);
      return [];
    }

    if (!data["Time Series (5min)"]) {
      alert("⚠ Data tidak ditemukan atau format salah.");
      return [];
    }

    const timeSeries = data["Time Series (5min)"];
    return Object.keys(timeSeries).map((time) => ({
      Time: time,
      Price: parseFloat(timeSeries[time]["1. open"]),
      Volume: parseFloat(timeSeries[time]["5. volume"]),
    })).reverse();
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    alert("❌ Gagal mengambil data. Cek console untuk detail.");
    return [];
  }
}

// Fungsi untuk analisis statistik
function analyzeStatistics(data, outputElementId) {
  if (!data.length) return;

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
  if (!data.length) return;

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

// Fungsi untuk memuat model ML
async function loadModel() {
  try {
    model = await tf.loadLayersModel("tfjs_model/model.json");
    console.log("Model berhasil dimuat.");
  } catch (error) {
    console.error("Gagal memuat model:", error);
  }
}

// Fungsi untuk prediksi harga menggunakan model ML
async function predictPrice(data, outputElementId) {
  if (!model || !data.length) return;

  const lastData = data[data.length - 1];
  const input = tf.tensor2d([[lastData.Price, lastData.Volume]]);
  const prediction = model.predict(input);
  const result = prediction.dataSync()[0];

  document.getElementById(outputElementId).textContent = `Harga Prediksi: ${result.toFixed(2)}`;
}

// Fungsi utama untuk mengambil dan menampilkan data
async function getMarketAnalysis(type) {
  let symbol = "";
  let market = "USD"; 
  let statsId = "";
  let chartId = "";
  let predictionId = "";
  let chartRef;

  if (type === "stock") {
    symbol = document.getElementById("stockSymbol").value.toUpperCase();
    statsId = "statsStock";
    chartId = "stockChart";
    predictionId = "predictionStock";
    chartRef = stockChart;
  } else if (type === "forex") {
    symbol = document.getElementById("forexSymbol").value.toUpperCase();
    statsId = "statsForex";
    chartId = "forexChart";
    predictionId = "predictionForex";
    chartRef = forexChart;
  } else if (type === "commodity") {
    symbol = document.getElementById("commoditySymbol").value.toUpperCase();
    statsId = "statsCommodity";
    chartId = "commodityChart";
    predictionId = "predictionCommodity";
    chartRef = commodityChart;
  }

  if (!symbol) {
    alert("Masukkan simbol terlebih dahulu.");
    return;
  }

  const data = await fetchMarketData(type, symbol, market);
  if (!data.length) return;

  analyzeStatistics(data, statsId);

  if (type === "stock") {
    stockChart = visualizePrices(data, chartId, chartRef);
  } else if (type === "forex") {
    forexChart = visualizePrices(data, chartId, chartRef);
  } else if (type === "commodity") {
    commodityChart = visualizePrices(data, chartId, chartRef);
  }

  predictPrice(data, predictionId);
}

// Muat model saat halaman dimuat
loadModel();