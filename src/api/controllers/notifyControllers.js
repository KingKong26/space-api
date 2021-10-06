const collection = require("../../config/collection"),
  db = require("../../config/dbConnection"),
  notifyHelper = require("../helpers/notifyHelpers");

class NotifyController {
  async createNotify(req, res) {
    try {
      console.log(`req.body`, req.body);
      const newNotify = await notifyHelper.createNotifyHelper(req.body);
      res.status(200).json(newNotify);
    } catch (err) {
      console.log(`err.message`, err.message);
      res.status(500).json(err.message);
    }
  }
  async getNotify(req, res) {
    try {
      console.log(`req.user`, req.user._id);
      const notify = await notifyHelper.getNotifyHelper(req.user._id);
      res.status(200).json(notify);
    } catch (err) {
      console.log(`err.message`, err.message);
      res.status(500).json(err.message);
    }
  }
}

module.exports = new NotifyController();
