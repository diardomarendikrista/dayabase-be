const express = require("express");
const router = express.Router();

const DashboardController = require("../controllers/dashboardController");

// CRUD basic
router.get("/", DashboardController.getAllDashboards);
router.get("/:id", DashboardController.getDashboardById);
router.post("/", DashboardController.createDashboard);
router.put("/:id", DashboardController.updateDashboard);
router.delete("/:id", DashboardController.deleteDashboard);

// kelola isi dashboard
router.post("/:id/questions", DashboardController.addQuestionToDashboard);
router.put("/:id/layout", DashboardController.updateDashboardLayout);
router.delete(
  "/:id/questions/:questionId",
  DashboardController.removeQuestionFromDashboard
);

module.exports = router;
