const collection = require("../../config/collection"),
  db = require("../../config/dbConnection"),
  chatHelpers = require("../helpers/chatHelpers");

class ChatController {
  async getConversations(req, res) {
    try {
      // console.log(`req.user in getConversation`, req.user);
      const conversations = await chatHelpers.getConversationsHelper(
        req.user._id
      );
      res.status(200).json(conversations);
    } catch (err) {
      console.log(`err.message`, err.message);
      res.status(500).json(err.message);
    }
  }

  async createMessage(req, res) {
    try {
      const createdMessage = await chatHelpers.createMessageHelper(
        req.user._id,
        req.body
      );
      console.log(`temp`, createdMessage);
      res.status(200).json(createdMessage);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  async getMessage(req, res) {
    try {
      const messages = await chatHelpers.getMessageHelper(req.params.id);
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json(err);
    }
  }
}

module.exports = new ChatController();
