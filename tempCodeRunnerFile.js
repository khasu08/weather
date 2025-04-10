const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const fetchWeather = require('./weatherApi');
const xlsx = require('xlsx');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// SQLite setup
const db = new sqlite3.Database('./weather.db', (err) => {
  if (err) console.error('Error opening database:', err.message);
  else console.log('Connected to SQLite database.');
});

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS weather_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT,
    temperature TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Route: Get weather data
app.post('/weather', async (req, res) => {
  const { city } = req.body;
  const weatherData = await fetchWeather(city);

  if (!weatherData) {
    return res.status(404).json({ error: 'City not found or API error.' });
  }

  // Insert into DB
  db.run(
    'INSERT INTO weather_history (city, temperature, description) VALUES (?, ?, ?)',
    [weatherData.city, weatherData.temperature, weatherData.description],
    (err) => {
      if (err) console.error(err.message);
    }
  );

  res.json(weatherData);
});

// Route: Get history
app.get('/history', (req, res) => {
  db.all('SELECT * FROM weather_history ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
    res.json(rows);
  });
});

// Route: Delete history
app.delete('/history', (req, res) => {
  db.run('DELETE FROM weather_history', [], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to delete history' });
    }
    res.json({ message: 'History deleted successfully' });
  });
});

// ✅ Route: Export to Excel
app.get('/export', async (req, res) => {
  try {
    db.all('SELECT * FROM weather_history ORDER BY timestamp DESC', [], (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error exporting history');
      }

      const worksheet = xlsx.utils.json_to_sheet(rows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Weather History');

      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="weather_history.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error exporting history');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
