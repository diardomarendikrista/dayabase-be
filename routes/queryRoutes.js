const express = require("express");
const router = express.Router();

const QueryController = require("../controllers/queryController");

router.post("/run", QueryController.runQuery);
router.post("/testRun", QueryController.testRunQuery);

module.exports = router;
