// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./weather.db');

// Create table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT,
    temperature TEXT,
    description TEXT,
    date TEXT
  )`);
});

module.exports = db;
