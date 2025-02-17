const API_KEY = V5YBXFRFAH5PT6UL"; // Ganti dengan API key Anda

async function fetchData() {
  const symbol = document.getElementById("symbol").value.toUpperCase();
  const news = document.getElementById("news").value;

  if (!symbol) {
    showError("Silakan masukkan simbol.");
    return;
  }

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