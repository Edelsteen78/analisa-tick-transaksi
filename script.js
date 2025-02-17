const API_KEY = "YOUR_ALPHA_VANTAGE_API_KEY"; // Ganti dengan API key Anda

// Variabel global untuk menyimpan simbol aktif dan interval polling
let activeSymbol = null;
let pollingInterval = null;

// Fungsi untuk menangani klik tombol simbol
document.querySelectorAll(".symbol-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const symbol = button.getAttribute("data-symbol");

    if (activeSymbol === symbol) {
      // Jika tombol yang sama ditekan lagi, nonaktifkan
      button.classList.remove("active");
      activeSymbol = null;
      clearInterval(pollingInterval); // Hentikan polling
      document.getElementById("output").style.display = "none";
    } else {
      // Nonaktifkan semua tombol lainnya
      document.querySelectorAll(".symbol-btn").forEach((btn) => {
        btn.classList.remove("active");
      });

      // Aktifkan tombol yang diklik
      button.classList.add("active");
      activeSymbol = symbol;

      // Mulai polling data pasar
      startPolling(symbol);
    }
  });
});

// Fungsi untuk memulai polling data pasar
function startPolling(symbol) {
  clearInterval(pollingInterval); // Pastikan tidak ada polling sebelumnya

  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
      );
      const data = await response.json();

      if (!data["Global Quote"] || !data["Global Quote"]["05. price"]) {
        showError("Simbol tidak ditemukan atau data tidak tersedia.");
        return;
      }

      const lastPrice = parseFloat(data["Global Quote"]["05. price"]);
      const news = document.getElementById("news").value;
      const recommendation = analyzeData(lastPrice, news);
      const targetPip = calculateTargetPip(lastPrice);

      document.getElementById("lastPrice").textContent = `$${lastPrice.toFixed(2)}`;
      document.getElementById("recommendation").textContent = recommendation;
      document.getElementById("targetPip").textContent = `${targetPip} pip`;

      document.getElementById("output").style.display = "block";
      document.getElementById("error").style.display = "none";
    } catch (error) {
      showError("Terjadi kesalahan saat mengambil data.");
    }
  }, 5000); // Polling setiap 5 detik
}

function analyzeData(price, news) {
  const positiveKeywords = ["positif", "naik", "bullish", "permintaan tinggi"];
  const negativeKeywords = ["negatif", "turun", "bearish", "ketidakpastian"];

  let sentimentScore = 0;

  positiveKeywords.forEach((keyword) => {
    if (news.toLowerCase().includes(keyword)) sentimentScore += 1;
  });

  negativeKeywords.forEach((keyword) => {
    if (news.toLowerCase().includes(keyword)) sentimentScore -= 1;
  });

  if (sentimentScore > 0) {
    return "BUY";
  } else if (sentimentScore < 0) {
    return "SELL";
  } else {
    return "HOLD";
  }
}

function calculateTargetPip(price) {
  const pipValue = (price * 0.01).toFixed(2);
  return pipValue;
}

function showError(message) {
  document.getElementById("error").textContent = message;
  document.getElementById("error").style.display = "block";
  document.getElementById("output").style.display = "none";
}