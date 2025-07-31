// controllers/connectionController.js
const { encrypt } = require("../utils/crypto");
const pool = require("../config/db"); // Koneksi ke DB dayabase_app

class ConnectionController {
  /**
   * @description Membuat koneksi database baru dan menyimpan ke DB
   * @route POST /api/connections
   */
  static async createConnection(req, res) {
    const {
      connection_name,
      db_type,
      host,
      port,
      db_user,
      password,
      database_name,
    } = req.body;

    // Validasi
    if (
      !connection_name ||
      !db_type ||
      !host ||
      !port ||
      !db_user ||
      !password ||
      !database_name
    ) {
      return res
        .status(400)
        .json({ message: "All connection fields are required." });
    }

    try {
      const password_encrypted = encrypt(password);

      const newConnection = await pool.query(
        `INSERT INTO database_connections 
         (connection_name, db_type, host, port, db_user, password_encrypted, database_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, connection_name, db_type, host, port, db_user, database_name`,
        [
          connection_name,
          db_type,
          host,
          port,
          db_user,
          password_encrypted,
          database_name,
        ]
      );

      res.status(201).json(newConnection.rows[0]);
    } catch (error) {
      console.error("Error creating connection:", error);
      res
        .status(500)
        .json({ message: "Failed to create connection", error: error.message });
    }
  }

  /**
   * @description Mengambil semua koneksi yang tersimpan (tanpa password)
   * @route GET /api/connections
   */
  static async getAllConnections(req, res) {
    try {
      const allConnections = await pool.query(
        "SELECT id, connection_name, db_type, host, port, db_user, database_name, created_at FROM database_connections ORDER BY created_at DESC"
      );
      res.status(200).json(allConnections.rows);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch connections", error: error.message });
    }
  }

  /**
   * @description Mengambil satu koneksi berdasarkan ID (tanpa password)
   * @route GET /api/connections/:id
   */
  static async getConnectionById(req, res) {
    const { id } = req.params;
    try {
      const connection = await pool.query(
        "SELECT id, connection_name, db_type, host, port, db_user, database_name, created_at FROM database_connections WHERE id = $1",
        [id]
      );

      if (connection.rows.length === 0) {
        return res.status(404).json({ message: "Connection not found." });
      }

      res.status(200).json(connection.rows[0]);
    } catch (error) {
      console.error(`Error fetching connection ${id}:`, error);
      res
        .status(500)
        .json({ message: "Failed to fetch connection.", error: error.message });
    }
  }

  /**
   * @description Menghapus sebuah koneksi database
   * @route DELETE /api/connections/:id
   */
  static async deleteConnection(req, res) {
    const { id } = req.params;
    try {
      // Di aplikasi nyata, Anda mungkin perlu mengecek apakah koneksi ini masih dipakai oleh 'questions'
      // Untuk sekarang, kita langsung hapus.
      const deleteOp = await pool.query(
        "DELETE FROM database_connections WHERE id = $1 RETURNING *",
        [id]
      );

      if (deleteOp.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Connection not found, nothing to delete." });
      }

      res
        .status(200)
        .json({ message: `Connection with id ${id} deleted successfully.` });
    } catch (error) {
      // Handle error jika koneksi masih dipakai oleh foreign key
      if (error.code === "23503") {
        // Kode error foreign key violation di PostgreSQL
        return res.status(400).json({
          message:
            "Cannot delete this connection because it is still being used by one or more questions.",
        });
      }
      console.error(`Error deleting connection ${id}:`, error);
      res
        .status(500)
        .json({ message: "Failed to delete connection", error: error.message });
    }
  }

  /**
   * @description Memperbarui sebuah koneksi yang ada
   * @route PUT /api/connections/:id
   */
  static async updateConnection(req, res) {
    const { id } = req.params;
    const {
      connection_name,
      db_type,
      host,
      port,
      db_user,
      password,
      database_name,
    } = req.body;

    if (
      !connection_name ||
      !db_type ||
      !host ||
      !port ||
      !db_user ||
      !database_name
    ) {
      return res
        .status(400)
        .json({ message: "All fields except password are required." });
    }

    try {
      let query;
      let values;

      if (password) {
        // Jika ada password baru, enkripsi dan update semuanya
        const password_encrypted = encrypt(password);
        query = `
          UPDATE database_connections 
          SET connection_name = $1, db_type = $2, host = $3, port = $4, db_user = $5, password_encrypted = $6, database_name = $7
          WHERE id = $8 RETURNING id, connection_name, db_type, host, port, db_user, database_name`;
        values = [
          connection_name,
          db_type,
          host,
          port,
          db_user,
          password_encrypted,
          database_name,
          id,
        ];
      } else {
        // Jika tidak ada password baru, jangan update kolom password
        query = `
          UPDATE database_connections 
          SET connection_name = $1, db_type = $2, host = $3, port = $4, db_user = $5, database_name = $6
          WHERE id = $7 RETURNING id, connection_name, db_type, host, port, db_user, database_name`;
        values = [
          connection_name,
          db_type,
          host,
          port,
          db_user,
          database_name,
          id,
        ];
      }

      const updatedConnection = await pool.query(query, values);

      if (updatedConnection.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Connection not found, nothing to update." });
      }

      res.status(200).json(updatedConnection.rows[0]);
    } catch (error) {
      console.error(`Error updating connection ${id}:`, error);
      res
        .status(500)
        .json({ message: "Failed to update connection", error: error.message });
    }
  }
}

module.exports = ConnectionController;
