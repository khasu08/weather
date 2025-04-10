const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const fetchWeather = require('./weatherApi'); // must exist
const xlsx = require('xlsx');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// SQLite DB setup
const db = new sqlite3.Database('./weather.db', (err) => {
  if (err) return console.error('Error opening database:', err.message);
  console.log('✅ Connected to SQLite database');
});

db.run(`
  CREATE TABLE IF NOT EXISTS weather_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT,
    temperature TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Fetch and save weather
app.post('/weather', async (req, res) => {
  const { city } = req.body;
  const weatherData = await fetchWeather(city);

  if (!weatherData) {
    return res.status(404).json({ error: 'City not found or API error.' });
  }

  // Get current local timestamp
  const timestamp = new Date().toLocaleString(); // Local time

  db.run(
    `INSERT INTO weather_history (city, temperature, description, timestamp) VALUES (?, ?, ?, ?)`,
    [weatherData.city, weatherData.temperature, weatherData.description, timestamp],
    (err) => {
      if (err) console.error(err.message);
    }
  );

  res.json(weatherData);
});

// Get all history with local timestamp conversion
app.get('/history', (req, res) => {
  db.all('SELECT * FROM weather_history ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch history' });

    // Convert UTC timestamp to local time
    rows.forEach((row) => {
      const utcDate = new Date(row.timestamp);
      row.timestamp = utcDate.toLocaleString(); // Converts to local timezone
    });

    res.json(rows);
  });
});

// Delete all history
app.delete('/history', (req, res) => {
  db.run('DELETE FROM weather_history', [], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete history' });
    res.json({ message: 'History deleted successfully' });
  });
});

// Delete single entry
app.delete('/history/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM weather_history WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete entry' });
    res.json({ message: 'Entry deleted successfully' });
  });
});

// Export to Excel
app.get('/export', (req, res) => {
  db.all('SELECT * FROM weather_history ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).send('Error exporting history');

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Weather History');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="weather_history.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
