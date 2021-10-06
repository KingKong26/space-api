const collections = require("../../config/collection"),
  db = require("../../config/dbConnection"),
  { ObjectId } = require("mongodb");

module.exports = {
  createNotifyHelper: (notifyObj) => {
    return new Promise(async (resolve, reject) => {
      try {
        notifyObj.createdBy = ObjectId(notifyObj.createdBy);
        let newNotify = await db
          .getDb()
          .collection(collections.NOTIFY)
          .insertOne(notifyObj);
        notifyObj._id = newNotify.insertedId;
        resolve(notifyObj);
      } catch (err) {
        console.log(`err`, err);
        reject(err);
      }
    });
  },
  getNotifyHelper: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const notify = await db
          .getDb()
          .collection(collections.NOTIFY)
          .aggregate([
            {
              $match: {
                $expr: {
                  $in: [userId, "$recipients"],
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $unwind: {
                path: "$user",
              },
            },
            {
              $project: {
                _id: 1,
                type: 1,
                createdBy: 1,
                createdAt: 1,
                recipients: 1,
                url: 1,
                read: 1,
                "user.fullName": 1,
                "user._id": 1,
                "user.avatar": 1,
              },
            },
          ]).toArray()
        resolve(notify);
      } catch (err) {
        console.log(`err`, err);
        reject(err);
      }
    });
  },
};
