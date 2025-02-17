let candleChart = null;

document.getElementById('upload-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const file = document.getElementById('csv-file').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const csvData = event.target.result;
            processCSVData(csvData);
        };
        reader.readAsText(file);
    }
});

function processCSVData(csvData) {
    const rows = csvData.split('\n').slice(1); // Skip header
    const data = rows.map(row => {
        const [time, open, high, low, close] = row.split(',');
        return {
            Time: time,
            Open: parseFloat(open),
            High: parseFloat(high),
            Low: parseFloat(low),
            Close: parseFloat(close)
        };
    });

    visualizeCandleChartFromCSV(data);
}

function visualizeCandleChartFromCSV(data) {
    const ctx = document.getElementById('candleChart').getContext('2d');
    if (candleChart) candleChart.destroy();

    candleChart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'Harga dari CSV',
                data: data.map(row => ({
                    t: new Date(row.Time),
                    o: row.Open,
                    h: row.High,
                    l: row.Low,
                    c: row.Close
                })),
                borderColor: 'green'
            }]
        },
        options: { responsive: true }
    });
}