const { Pool } = require("pg");
const mysql = require("mysql2/promise");
const mssql = require("mssql");
const sqlite3 = require("sqlite3").verbose();

async function connectToDatabase(config) {
  const { dbType, user, host, database, password, port } = config;

  // Switch untuk memilih driver yang tepat
  switch (dbType) {
    case "postgres":
      console.log("Connecting to PostgreSQL...");
      const pgPool = new Pool({ user, host, database, password, port });
      return pgPool;

    case "mysql":
      console.log("Connecting to MySQL...");
      const mysqlConnection = await mysql.createConnection({
        user,
        host,
        database,
        password,
        port,
      });
      return mysqlConnection;

    case "mssql":
      console.log("Connecting to SQL Server...");
      // MSSQL menggunakan 'server' bukan 'host'
      // Opsi 'trustServerCertificate' sering dibutuhkan untuk koneksi lokal/development
      const mssqlPool = await mssql.connect({
        user,
        password,
        server: host, // Perhatikan ini
        database,
        port,
        options: {
          trustServerCertificate: true,
        },
      });
      return mssqlPool;

    case "sqlite":
      console.log("Connecting to SQLite...");
      // SQLite hanya butuh path file, yang kita masukkan ke properti 'database'
      if (!database)
        throw new Error("Database file path is required for SQLite!");

      // sqlite3 bersifat callback, jadi kita bungkus dalam Promise agar kompatibel
      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(database, (err) => {
          if (err) {
            console.error(err.message);
            reject(err);
          }
          console.log("Connected to the SQLite database.");
          resolve(db);
        });
      });

    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

module.exports = { connectToDatabase };
