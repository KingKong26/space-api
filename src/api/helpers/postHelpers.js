const collections = require("../../../src/config/collection"),
  db = require("../../../src/config/dbConnection"),
  { ObjectId } = require("mongodb");

module.exports = {
  // upload - posts with medias and text contents
  uploadPost: async (postContent) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(postContent, "postContent before");
        await db.getDb().collection(collections.POST).insertOne(postContent);
        console.log(postContent, "postContent after");
        resolve(postContent);
      } catch (err) {
        reject(err);
      }
    });
  },

  //   get a single post details
  getPost: (postId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const post = await db
          .getDb()
          .collection(collections.POST)
          .findOne({ _id: ObjectId(postId) });
        resolve(post);
      } catch (err) {
        reject("Post not found");
      }
    });
  },

  getUserFeeds: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const post = await db
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
                from: "posts",
                localField: "friends",
                foreignField: "userId",
                as: "friendsPost",
              },
            },
            {
              $lookup: {
                from: "posts",
                localField: "_id",
                foreignField: "userId",
                as: "userPost",
              },
            },
            {
              $project: {
                _id: 0,
                posts: {
                  $concatArrays: ["$userPost", "$friendsPost"],
                },
              },
            },
            {
              $unwind: {
                path: "$posts",
              },
            },
            {
              $lookup: {
                from: "comments",
                localField: "posts.comments",
                foreignField: "_id",
                as: "posts.comments",
              },
            },
            {
              $sort: {
                "posts.createdAt": -1,
              },
            },
          ])
          .toArray();
        const result = post.map((post) => {
          return post.posts;
        });
        resolve(result);
      } catch (err) {
        console.log(`err`, err);
        reject(err.message);
      }
    });
  },

  // like post
  likePost: async (post, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!post.likes.includes(userId)) {
          const result = await db
            .getDb()
            .collection(collections.POST)
            .findOneAndUpdate(
              { _id: ObjectId(post._id) },
              { $push: { likes: userId } },
              { returnDocument: "after" }
            );
          result.value.type = "LIKE";
          resolve(result.value);
        } else {
          const result = await db
            .getDb()
            .collection(collections.POST)
            .findOneAndUpdate(
              { _id: ObjectId(post._id) },
              { $pull: { likes: userId } },
              { returnDocument: "after" }
            );
          result.value.type = "DISLIKE";
          resolve(result.value);
        }
      } catch (err) {
        console.log(err.message, "message");
        reject(err);
      }
    });
  },

  // comment on post
  commentPost: async (post, userId, comment) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = await db
          .getDb()
          .collection(collections.POST)
          .findOneAndUpdate(
            { _id: ObjectId(post) },
            { $push: { comments: comment } },
            { returnDocument: "after" }
          );
        resolve(response.value.userId);
      } catch (err) {
        console.log(`Error in commentPost helpper`, err.message);
        reject(err.message);
      }
    });
  },

  // update post
  updatePostHelper: (postId, newContent) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db
          .getDb()
          .collection(collections.POST)
          .updateOne(
            { _id: ObjectId(postId) },
            { $set: { postContent: newContent } }
          );
        resolve("Post updated successfully");
      } catch (err) {
        reject(err.message);
      }
    });
  },

  // delete a post
  deletePostHelper: (postId, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deletedPost = await db
          .getDb()
          .collection(collections.POST)
          .deleteOne({ _id: ObjectId(postId) });
        await db
          .getDb()
          .collection(collections.USERS)
          .updateOne(
            { _id: ObjectId(userId) },
            { $pull: { posts: ObjectId(postId) } }
          );
          console.log(deletedPost)
        resolve(deletedPost);
      } catch (err) {
        reject(err.message);
      }
    });
  },
};
