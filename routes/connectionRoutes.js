const express = require("express");
const router = express.Router();
const ConnectionController = require("../controllers/connectionController");

router.post("/", ConnectionController.createConnection);
router.get("/", ConnectionController.getAllConnections);
router.get("/:id", ConnectionController.getConnectionById);
router.delete("/:id", ConnectionController.deleteConnection);
router.put("/:id", ConnectionController.updateConnection);

module.exports = router;
