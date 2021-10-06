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
        // await db
        //   .getDb()
        //   .collection(collections.USERS)
        //   .updateOne(
        //     { _id: ObjectId(postContent.userId) },
        //     { $push: { posts: postContent } }
        //   );
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
  // user posts
  // getUserFeeds: (userId) => {
  //   return new Promise(async (resolve, reject) => {
  //     console.log(userId, "userId in get feeds");
  //     try {
  //       const post = await db
  //         .getDb()
  //         .collection(collections.USERS)
  //         .aggregate([
  //           {
  //             $match: {
  //               _id: ObjectId(userId),
  //             },
  //           },
  //           {
  //             $lookup: {
  //               from: "posts",
  //               localField: "friends",
  //               foreignField: "userId",
  //               as: "friendPosts",
  //             },
  //           },
  //           {
  //             $project: {
  //               allPosts: {
  //                 $concatArrays: ["$friendPosts", "$posts"],
  //               },
  //             },
  //           },
  //           {
  //             $unwind: {
  //               path: "$allPosts",
  //             },
  //           },
  //           {
  //             $sort: {
  //               "allPosts.createdAt": -1,
  //             },
  //           },
  //           {
  //             $project: {
  //               _id: 0,
  //               allPosts: 1,
  //             },
  //           },
  //         ])
  //         .toArray();
  //       const result = post.map((p) => p.allPosts);
  //       console.log(result, "posts helpwer");
  //       resolve(result);
  //     } catch (err) {
  //       reject(err.message);
  //     }
  //   });
  // },

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
      // console.log(post, userId, "post helper");
      try {
        if (!post.likes.includes(userId)) {
          const result = await db
            .getDb()
            .collection(collections.POST)
            .findOneAndUpdate(
              { _id: ObjectId(post._id) },
              { $push: { likes: userId } },
              { returnDocument: "after" }
              // { returnDocument: "after" },
              // function (err, documents) {
              //   console.log(documents,"document in like")
              // }
            );
          // console.log(`result`, result.value);
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
              // { returnDocument: "after" },
              // function (err, documents) {
              //   console.log(documents, "document in dislike");
              // }
            );
          result.value.type = "DISLIKE";
          // console.log(`result`, result);
          resolve(result.value);
        }

        // query for updating user collection
        // await db
        //   .getDb()
        //   .collection(collections.USERS)
        //   .update(
        //     {
        //       "posts._id": post._id,
        //     },
        //     [
        //       {
        //         $set: {
        //           posts: {
        //             $map: {
        //               input: "$posts",
        //               as: "p",
        //               in: {
        //                 $cond: [
        //                   {
        //                     $eq: ["$$p._id", post._id],
        //                   },
        //                   {
        //                     $mergeObjects: [
        //                       "$$p",
        //                       {
        //                         likes: {
        //                           $cond: [
        //                             {
        //                               $in: [userId, "$$p.likes"],
        //                             },
        //                             {
        //                               $filter: {
        //                                 input: "$$p.likes",
        //                                 cond: {
        //                                   $ne: ["$$this", userId],
        //                                 },
        //                               },
        //                             },
        //                             {
        //                               $concatArrays: ["$$p.likes", [userId]],
        //                             },
        //                           ],
        //                         },
        //                       },
        //                     ],
        //                   },
        //                   "$$p",
        //                 ],
        //               },
        //             },
        //           },
        //         },
        //       },
        //     ]
        //   );
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
        resolve(response.value);
      } catch (err) {
        console.log(`Error in commentPost helpper`, err.message);
        reject(err.message);
      }

      // try {
      //   await db
      //     .getDb()
      //     .collection(collections.POST)
      //     .updateOne(
      //       { _id: ObjectId(post._id) },
      //       { $push: { comments: commentObj } }
      //     );
      //   resolve("Comment added successfully");
      // } catch (err) {
      //   reject(err);
      // }
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
        await db
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
        resolve("Post deleted successfully");
      } catch (err) {
        reject(err.message);
      }
    });
  },
};
