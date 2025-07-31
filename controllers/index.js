class Controller {
  static getRootHandler(req, res) {
    res.status(200).json({ message: "Dayabase BE is Running" });
  }
}

module.exports = Controller;
