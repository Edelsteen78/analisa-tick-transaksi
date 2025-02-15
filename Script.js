// Fungsi untuk parsing file CSV
function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split("\n").map(row => row.split(","));
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header.trim()] = row[i] ? parseFloat(row[i].trim()) : null;
        });
        return obj;
      });
      resolve(data);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

// Fungsi untuk analisis statistik dasar
function analyzeStatistics(data) {
  const prices = data.map(row => row.Price).filter(price => !isNaN(price));
  const volumes = data.map(row => row.Volume).filter(volume => !isNaN(volume));

  const stats = {
    totalTransactions: data.length,
    highestPrice: Math.max(...prices),
    lowestPrice: Math.min(...prices),
    averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    totalVolume: volumes.reduce((sum, volume) => sum + volume, 0),
  };

  document.getElementById("statsOutput").textContent = JSON.stringify(stats, null, 2);
  return stats;
}

// Fungsi untuk visualisasi grafik harga
function visualizePrices(data) {
  const labels = data.map(row => row.Time);
  const prices = data.map(row => row.Price);

  const ctx = document.getElementById("priceChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Harga",
        data: prices,
        borderColor: "blue",
        borderWidth: 2,
        fill: false,
      }],
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
let model;
async function loadModel() {
  model = await tf.loadLayersModel("tfjs_model/model.json"); // Pastikan path benar
}

// Fungsi untuk prediksi harga menggunakan model ML
async function predictPrice() {
  if (!model) {
    alert("Model belum dimuat. Silakan muat model terlebih dahulu.");
    return;
  }

  const lastPrice = 110; // Contoh input: harga terakhir
  const lastVolume = 1000; // Contoh input: volume terakhir
  const input = tf.tensor2d([[lastPrice, lastVolume]]);
  const prediction = model.predict(input);
  const result = prediction.dataSync()[0];
  document.getElementById("predictionOutput").textContent = `Harga Prediksi: ${result.toFixed(2)}`;
}

// Fungsi utama untuk analisis data
async function analyzeData() {
  const fileInput = document.getElementById("csvFileInput");
  if (!fileInput.files.length) {
    alert("Silakan unggah file CSV terlebih dahulu.");
    return;
  }

  const file = fileInput.files[0];
  const data = await parseCSV(file);

  // Analisis statistik
  analyzeStatistics(data);

  // Visualisasi grafik
  visualizePrices(data);
}

// Muat model saat halaman dimuat
loadModel();
