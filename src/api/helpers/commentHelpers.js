const collections = require("../../config/collection"),
  db = require("../../config/dbConnection"),
  { ObjectId } = require("mongodb");

module.exports = {
  newComment: (comment) => {
    return new Promise(async (resolve, reject) => {
      try {
        let result = await db
          .getDb()
          .collection(collections.COMMENT)
          .insertOne(comment);
        comment._id = result.insertedId;
        resolve(comment);
      } catch (err) {
        console.log("Error in newComment Helper", err.message);
        reject(err.message);
      }
    });
  },

  getComment: (commentId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const commentDetails = await db
          .getDb()
          .collection(collections.COMMENT)
          .findOne({ _id: ObjectId(commentId) });
        console.log(commentDetails, "Comment details");
        resolve(commentDetails);
      } catch (err) {
        reject(err);
      }
    });
  },

  likeComment: (comment, userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(`comment,userId`, comment, userId);
      try {
        if (comment.likes.includes(userId)) {
          let result = await db
            .getDb()
            .collection(collections.COMMENT)
            .findOneAndUpdate(
              { _id: ObjectId(comment._id) },
              { $pull: { likes: userId } },
              { returnDocument: "after" }
            );
          resolve(result.value);
        } else {
          let result = await db
            .getDb()
            .collection(collections.COMMENT)
            .findOneAndUpdate(
              { _id: ObjectId(comment._id) },
              { $push: { likes: userId } },
              { returnDocument: "after" }
            );
          resolve(result.value);
        }
      } catch (err) {
        reject(err);
      }
    });
  },
};
