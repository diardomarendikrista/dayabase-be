// controllers/questionController.js
const pool = require("../config/db");

class QuestionController {
  /**
   * @description Menyimpan pertanyaan baru ke database
   * @route POST /api/questions
   */
  static async createQuestion(req, res) {
    const { name, sql_query, chart_type, chart_config, connection_id } =
      req.body;

    // Validasi input
    if (!name || !sql_query || !chart_type || !chart_config || !connection_id) {
      return res.status(400).json({
        message:
          "All fields are required: name, sql_query, chart_type, chart_config, connection_id",
      });
    }

    try {
      const newQuestion = await pool.query(
        "INSERT INTO questions (name, sql_query, chart_type, chart_config, connection_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [
          name,
          sql_query,
          chart_type,
          JSON.stringify(chart_config),
          connection_id,
        ]
      );

      res.status(201).json(newQuestion.rows[0]);
    } catch (error) {
      console.error("Error creating question:", error);
      res
        .status(500)
        .json({ message: "Failed to create question", error: error.message });
    }
  }

  /**
   * @description Mengambil semua pertanyaan (hanya info dasar)
   * @route GET /api/questions
   */
  static async getAllQuestions(req, res) {
    try {
      const allQuestions = await pool.query(
        "SELECT id, name, chart_type, created_at FROM questions ORDER BY created_at DESC"
      );
      res.status(200).json(allQuestions.rows);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch questions", error: error.message });
    }
  }

  /**
   * @description Mengambil detail satu pertanyaan beserta konfigurasi koneksinya
   * @route GET /api/questions/:id
   */
  static async getQuestionById(req, res) {
    const { id } = req.params;
    try {
      // Query ini menggabungkan data pertanyaan dengan data koneksinya
      const queryText = `
        SELECT 
          q.id, q.name, q.sql_query, q.chart_type, q.chart_config,
          c.id as connection_id, c.connection_name, c.db_type, c.host, c.port, c.db_user, c.database_name
        FROM questions q
        JOIN database_connections c ON q.connection_id = c.id
        WHERE q.id = $1;
      `;
      const questionResult = await pool.query(queryText, [id]);

      if (questionResult.rows.length === 0) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.status(200).json(questionResult.rows[0]);
    } catch (error) {
      console.error(`Error fetching question ${id}:`, error);
      res
        .status(500)
        .json({ message: "Failed to fetch question", error: error.message });
    }
  }

  /**
   * @description Hapus
   * @route DELETE /api/questions/:id
   */
  static async deleteQuestion(req, res) {
    const { id } = req.params;
    try {
      const deleteOp = await pool.query(
        "DELETE FROM questions WHERE id = $1 RETURNING *",
        [id]
      );

      // Cek apakah ada baris yang dihapus
      if (deleteOp.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Question not found, nothing to delete." });
      }

      res
        .status(200)
        .json({ message: `Question with id ${id} deleted successfully.` });
    } catch (error) {
      console.error(`Error deleting question ${id}:`, error);
      res
        .status(500)
        .json({ message: "Failed to delete question", error: error.message });
    }
  }

  /**
   * @description Memperbarui sebuah pertanyaan yang ada
   * @route PUT /api/questions/:id
   */
  static async updateQuestion(req, res) {
    const { id } = req.params;
    const { name, sql_query, chart_type, chart_config, connection_id } =
      req.body;

    // Validasi input
    if (!name || !sql_query || !chart_type || !chart_config || !connection_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const updatedQuestion = await pool.query(
        `UPDATE questions 
         SET name = $1, sql_query = $2, chart_type = $3, chart_config = $4, connection_id = $5
         WHERE id = $6 
         RETURNING *`,
        [
          name,
          sql_query,
          chart_type,
          JSON.stringify(chart_config),
          connection_id,
          id,
        ]
      );

      if (updatedQuestion.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Question not found, nothing to update." });
      }

      res.status(200).json(updatedQuestion.rows[0]);
    } catch (error) {
      console.error(`Error updating question ${id}:`, error);
      res
        .status(500)
        .json({ message: "Failed to update question", error: error.message });
    }
  }
}

module.exports = QuestionController;
