// config/db.js
const { Pool } = require("pg");
require("dotenv").config(); // Memuat variabel dari file .env

// Membuat koneksi pool ke DB dayabase_app
// Pakai prefix APP_ untuk membedakan dengan koneksi database target.
const pool = new Pool({
  user: process.env.APP_DB_USER,
  host: process.env.APP_DB_HOST,
  database: process.env.APP_DB_DATABASE,
  password: process.env.APP_DB_PASSWORD,
  port: process.env.APP_DB_PORT,
});

// Mengecek koneksi saat pertama kali dijalankan
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error connecting to the application database", err.stack);
  } else {
    console.log("Application database connected successfully.");
  }
});

module.exports = pool;
