const pool = require("../config/db");

class DashboardController {
  /**
   * @description Membuat dashboard baru
   * @route POST /api/dashboards
   */
  static async createDashboard(req, res) {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Nama dashboard wajib diisi." });
    }
    try {
      const newDashboard = await pool.query(
        "INSERT INTO dashboards (name, description) VALUES ($1, $2) RETURNING *",
        [name, description || null]
      );
      res.status(201).json(newDashboard.rows[0]);
    } catch (error) {
      console.error("Gagal membuat dashboard:", error);
      res
        .status(500)
        .json({ message: "Gagal membuat dashboard", error: error.message });
    }
  }

  /**
   * @description Mengambil daftar semua dashboard
   * @route GET /api/dashboards
   */
  static async getAllDashboards(req, res) {
    try {
      const allDashboards = await pool.query(
        "SELECT id, name, description, created_at FROM dashboards ORDER BY created_at DESC"
      );
      res.status(200).json(allDashboards.rows);
    } catch (error) {
      console.error("Gagal mengambil dashboards:", error);
      res
        .status(500)
        .json({ message: "Gagal mengambil dashboards", error: error.message });
    }
  }

  /**
   * @description Mengambil detail satu dashboard beserta question dan layoutnya
   * @route GET /api/dashboards/:id
   */
  static async getDashboardById(req, res) {
    const { id } = req.params;
    try {
      // Query untuk mengambil detail dashboard dan semua question di dalamnya
      const queryText = `
        SELECT 
          d.id as dashboard_id, d.name, d.description,
          dq.question_id, q.name as question_name, q.chart_type,
          dq.layout_config
        FROM dashboards d
        LEFT JOIN dashboard_questions dq ON d.id = dq.dashboard_id
        LEFT JOIN questions q ON dq.question_id = q.id
        WHERE d.id = $1;
      `;
      const result = await pool.query(queryText, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan" });
      }

      // Proses hasil query menjadi format yang rapi
      const dashboardData = {
        id: result.rows[0].dashboard_id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        questions: result.rows[0].question_id
          ? result.rows.map((row) => ({
              id: row.question_id,
              name: row.question_name,
              chart_type: row.chart_type,
              layout: row.layout_config,
            }))
          : [],
      };

      res.status(200).json(dashboardData);
    } catch (error) {
      console.error(`Gagal mengambil dashboard ${id}:`, error);
      res
        .status(500)
        .json({ message: "Gagal mengambil dashboard", error: error.message });
    }
  }

  /**
   * @description Memperbarui nama/deskripsi dashboard
   * @route PUT /api/dashboards/:id
   */
  static async updateDashboard(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Nama dashboard wajib diisi." });
    }
    try {
      const updatedDashboard = await pool.query(
        "UPDATE dashboards SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
        [name, description, id]
      );
      if (updatedDashboard.rowCount === 0) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan." });
      }
      res.status(200).json(updatedDashboard.rows[0]);
    } catch (error) {
      console.error(`Gagal memperbarui dashboard ${id}:`, error);
      res
        .status(500)
        .json({ message: "Gagal memperbarui dashboard", error: error.message });
    }
  }

  /**
   * @description Menghapus dashboard
   * @route DELETE /api/dashboards/:id
   */
  static async deleteDashboard(req, res) {
    const { id } = req.params;
    try {
      const deleteOp = await pool.query(
        "DELETE FROM dashboards WHERE id = $1 RETURNING *",
        [id]
      );
      if (deleteOp.rowCount === 0) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan." });
      }
      res.status(200).json({ message: "Dashboard berhasil dihapus." });
    } catch (error) {
      console.error(`Gagal menghapus dashboard ${id}:`, error);
      res
        .status(500)
        .json({ message: "Gagal menghapus dashboard", error: error.message });
    }
  }

  // --- Metode untuk Mengelola Isi Dashboard ---

  /**
   * @description Menambahkan question ke dashboard
   * @route POST /api/dashboards/:id/questions
   */
  static async addQuestionToDashboard(req, res) {
    const { id: dashboard_id } = req.params;
    const { question_id, layout_config } = req.body;
    if (!question_id || !layout_config) {
      return res
        .status(400)
        .json({ message: "question_id dan layout_config wajib diisi." });
    }
    try {
      const newLink = await pool.query(
        "INSERT INTO dashboard_questions (dashboard_id, question_id, layout_config) VALUES ($1, $2, $3) RETURNING *",
        [dashboard_id, question_id, JSON.stringify(layout_config)]
      );
      res.status(201).json(newLink.rows[0]);
    } catch (error) {
      console.error(
        `Gagal menambah question ke dashboard ${dashboard_id}:`,
        error
      );
      res
        .status(500)
        .json({
          message: "Gagal menambah question ke dashboard",
          error: error.message,
        });
    }
  }

  /**
   * @description Memperbarui layout dari semua question di dashboard
   * @route PUT /api/dashboards/:id/layout
   */
  static async updateDashboardLayout(req, res) {
    const { id: dashboard_id } = req.params;
    const layout = req.body; // Diharapkan berupa array of layout objects
    if (!Array.isArray(layout)) {
      return res
        .status(400)
        .json({ message: "Body harus berupa array layout." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Gunakan Promise.all untuk menjalankan semua query update secara paralel
      await Promise.all(
        layout.map((item) => {
          const { i: question_id, ...gridProps } = item;
          return client.query(
            "UPDATE dashboard_questions SET layout_config = $1 WHERE dashboard_id = $2 AND question_id = $3",
            [JSON.stringify(gridProps), dashboard_id, question_id]
          );
        })
      );
      await client.query("COMMIT");
      res
        .status(200)
        .json({ message: "Layout dashboard berhasil diperbarui." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(
        `Gagal memperbarui layout dashboard ${dashboard_id}:`,
        error
      );
      res
        .status(500)
        .json({ message: "Gagal memperbarui layout", error: error.message });
    } finally {
      client.release();
    }
  }

  /**
   * @description Menghapus question dari dashboard
   * @route DELETE /api/dashboards/:id/questions/:questionId
   */
  static async removeQuestionFromDashboard(req, res) {
    const { id: dashboard_id, questionId: question_id } = req.params;
    try {
      const deleteOp = await pool.query(
        "DELETE FROM dashboard_questions WHERE dashboard_id = $1 AND question_id = $2 RETURNING *",
        [dashboard_id, question_id]
      );
      if (deleteOp.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Question tidak ditemukan di dashboard ini." });
      }
      res
        .status(200)
        .json({ message: "Question berhasil dihapus dari dashboard." });
    } catch (error) {
      console.error(
        `Gagal menghapus question ${question_id} dari dashboard ${dashboard_id}:`,
        error
      );
      res
        .status(500)
        .json({
          message: "Gagal menghapus question dari dashboard",
          error: error.message,
        });
    }
  }
}

module.exports = DashboardController;
