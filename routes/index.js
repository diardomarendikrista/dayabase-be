// routes/index.js
const express = require("express");
const router = express.Router();

const Controller = require("../controllers");
router.get("/", Controller.getRootHandler);

const queryRoutes = require("./queryRoutes");
const questionRoutes = require("./questionRoutes");
const connectionRoutes = require("./connectionRoutes");
const dashboardRoutes = require("./dashboardRoutes");

router.use("/query", queryRoutes);
router.use("/questions", questionRoutes);
router.use("/connections", connectionRoutes);
router.use("/dashboards", dashboardRoutes);

module.exports = router;
