let candleChart = null;

document.getElementById('upload-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const file = document.getElementById('csv-file').files[0];
    if (!file) {
        alert("Silakan pilih file CSV terlebih dahulu!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const csvData = event.target.result;
        processCSVData(csvData);
    };
    reader.readAsText(file);
});

function processCSVData(csvData) {
    const rows = csvData.split('\n').slice(1); // Skip header
    const data = rows
        .map(row => row.split(','))
        .filter(cols => cols.length >= 5) // Pastikan minimal 5 kolom
        .map(cols => ({
            Time: cols[0],
            Open: parseFloat(cols[1]),
            High: parseFloat(cols[2]),
            Low: parseFloat(cols[3]),
            Close: parseFloat(cols[4])
        }));

    console.log("Data CSV:", data);
    visualizeCandleChartFromCSV(data);
}

function visualizeCandleChartFromCSV(data) {
    const ctx = document.getElementById('candleChart').getContext('2d');
    if (candleChart) candleChart.destroy();

    candleChart = new Chart(ctx, {
        type: 'candlestick',  // Gunakan ekstensi chart.js-chart-financial
        data: {
            datasets: [{
                label: 'Harga dari CSV',
                data: data.map(row => ({
                    t: new Date(row.Time.replace(" ", "T")), // Perbaiki timestamp
                    o: row.Open,
                    h: row.High,
                    l: row.Low,
                    c: row.Close
                })),
                borderColor: 'green'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
