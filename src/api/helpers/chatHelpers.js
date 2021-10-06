const collections = require("../../config/collection"),
  db = require("../../config/dbConnection"),
  { ObjectId } = require("mongodb");

module.exports = {
  getConversationsHelper: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const conversations = await db
          .getDb()
          .collection(collections.USERS)
          .aggregate([
            {
              $match: {
                _id: ObjectId(userId),
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "friends",
                foreignField: "_id",
                as: "friends",
              },
            },
            {
              $unwind: {
                path: "$friends",
              },
            },
            {
              $lookup: {
                from: "conversations",
                let: { user: "$_id", friend: "$friends._id" },
                pipeline: [
                  { $match: { $expr: { $in: ["$$user", "$recipients"] } } },
                  { $unwind: "$recipients" },
                  { $match: { $expr: { $eq: ["$$friend", "$recipients"] } } },
                ],
                as: "friends.conversation",
              },
            },
            {
              $unwind: {
                path: "$friends.conversation",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $replaceRoot: {
                newRoot: "$friends",
              },
            },
            {
              $sort: {
                "conversations.createdAt": -1,
              },
            },
            {
              $project: {
                friends: 0,
                password: 0,
                friendRequests: 0,
              },
            },
          ])
          .toArray();
          // console.log(`conversations`, conversations)
        resolve(conversations);
      } catch (err) {
        console.log(`err in getConvo`, err);
        reject(err);
      }
    });
  },
  createMessageHelper: (userId, msg) => {
    return new Promise(async (resolve, reject) => {
      const sender = ObjectId(userId),
        recipient = ObjectId(msg.recipient);
      const msgObj = {
        recipient,
        sender,
        createdAt: new Date(),
        updatedAt: new Date(),
        text: msg.text,
        read: false,
      };
      try {
        const conversation = await db
          .getDb()
          .collection(collections.CONVERSATION)
          .findOneAndUpdate(
            {
              $or: [
                { recipients: [sender, recipient] },
                { recipients: [recipient, sender] },
              ],
            },
            {
              $set: {
                recipients: [sender, recipient],
                createdAt: msgObj.createdAt,
                updatedAt: msgObj.updatedAt,
                text: msg.text,
                author:sender
              },
            },
            { upsert: true, returnDocument: "after" }
          );
        msgObj.conversation = conversation.value._id;
        const message = await db
          .getDb()
          .collection(collections.MESSAGE)
          .insertOne(msgObj);
        msgObj._id = message.insertedId;
        resolve(msgObj);
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  },
  getMessageHelper: (convoId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const messages = await db
          .getDb()
          .collection(collections.MESSAGE)
          .find({ conversation: ObjectId(convoId) })
          .sort({ createdAt: -1 })
          .toArray();
        console.log(`messages`, messages);
        resolve(messages);
      } catch (error) {
        console.log(`error.message`, error.message);
        reject(error.message);
      }
    });
  },
};
