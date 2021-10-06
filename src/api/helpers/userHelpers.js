const collections = require("../../../src/config/collection"),
  db = require("../../../src/config/dbConnection"),
  bcrypt = require("bcrypt"),
  saltRounds = 10,
  { ObjectId } = require("mongodb");

module.exports = {
  // register - user onboarding
  registerUser: (userData) => {
    return new Promise(async (resolve, reject) => {
      // const checkUser = await db
      //   .getDb()
      //   .collection(collections.USERS)
      //   .findOne({ email: userData.email });
      // if (checkUser) return reject({ message: "This email already exists" });
      try {
        userData.password = await bcrypt.hash(userData.password, saltRounds);
        userData.friendRequests = [];
        userData.online = true;
        await db.getDb().collection(collections.USERS).insertOne(userData);
        resolve(userData);
      } catch (error) {
        console.log("Error saving user: ");
        reject(error);
      }
    });
  },

  checkUser: (userData) => {
    return new Promise(async (resolve, reject) => {
      const checkUser = await db
        .getDb()
        .collection(collections.USERS)
        .findOne({ email: userData });
      if (checkUser) return reject({ message: "This email already exists" });
      resolve("User does not exist");
    });
  },
  // login - authentication
  loginUser: (loginData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await db
          .getDb()
          .collection(collections.USERS)
          .findOne({ email: loginData.email });
        if (!user) throw new Error("Email not found");
        const validPassword = await bcrypt.compare(
          loginData.password,
          user.password
        );
        if (!validPassword) throw new Error("Passwords don't match");
        resolve(user);
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  },
  // get user details
  getUserDetailsHelper: async (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let userData = await db
          .getDb()
          .collection(collections.USERS)
          .findOne({ _id: ObjectId(userId) }, { projection: { password: 0 } });
        const requestId = userData.friendRequests.map((user) => ObjectId(user));
        const friendRequests = await db
          .getDb()
          .collection(collections.USERS)
          .find({ _id: { $in: requestId } })
          .toArray();
        userData.requestDetails = friendRequests;
        resolve(userData);
      } catch (err) {
        reject(err);
      }
    });
  },

  getDetails: async (userId) => {
    console.log(userId);
    return new Promise(async (resolve, reject) => {
      try {
        let userData = await db
          .getDb()
          .collection(collections.USERS)
          .findOne(
            { _id: ObjectId(userId) },
            {
              projection: {
                password: 0,
              },
            }
          );
        userData.friends = userData.friends.map((id) => id.toString());
        resolve(userData);
      } catch (err) {
        reject(err);
      }
    });
  },
  toggleOnlineHelper: async (toggle, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`toggle,userId`, toggle,userId)
        const wait = await db
          .getDb()
          .collection(collections.USERS)
          .findOneAndUpdate(
            { _id: ObjectId(userId) },
            {
              $set: { online: toggle },
            },
            { returnDocument: "after" }
          );
          console.log(`wait`, wait)
        resolve(wait);
      } catch (err) {
        reject(err);
      }
    });
  },
  // request helper
  requestHelper: async (requesterId, receiverDetails) => {
    return new Promise(async (resolve, reject) => {
      // this loop is expensive so look for other ways to do this function,
      // for example try and store friend request in a new collection or use indexing of array or any other methods.
      const checkRequest = receiverDetails.friendRequests.filter(
        (e) => e === requesterId
      );
      console.log(`receiverDetails`, receiverDetails);
      try {
        if (!checkRequest.length) {
          const sendRequest = await db
            .getDb()
            .collection(collections.USERS)
            .findOneAndUpdate(
              { _id: ObjectId(receiverDetails._id) },
              { $push: { friendRequests: requesterId } },
              { returnDocument: "after" }
            );
          console.log(`sendRequest.value`, sendRequest.value);
          resolve(sendRequest.value);
        } else {
          const cancelRequest = await db
            .getDb()
            .collection(collections.USERS)
            .findOneAndUpdate(
              { _id: ObjectId(receiverDetails._id) },
              { $pull: { friendRequests: requesterId } },
              { returnDocument: "after" }
            );
          console.log(`cancelRequest.value`, cancelRequest.value);
          resolve(cancelRequest.value);
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  // accept request
  acceptRequestHelper: (acceptorId, requesterId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // update accepter's friends list
        const updatedAcceptor = await db
          .getDb()
          .collection(collections.USERS)
          .findOneAndUpdate(
            {
              _id: ObjectId(acceptorId),
            },
            {
              $push: { friends: ObjectId(requesterId) },
              $pull: { friendRequests: requesterId },
            },
            { returnDocument: "after" }
          );
        // update requester's friends list
        await db
          .getDb()
          .collection(collections.USERS)
          .findOneAndUpdate(
            { _id: ObjectId(requesterId) },
            { $push: { friends: ObjectId(acceptorId) } },
            { returnDocument: "after" }
          );
        console.log(updatedAcceptor, "updated Acceptor");
        const requestId = updatedAcceptor.value.friendRequests.map((user) =>
          ObjectId(user)
        );
        updatedAcceptor.value.requestDetails = await db
          .getDb()
          .collection(collections.USERS)
          .find({ _id: { $in: requestId } })
          .toArray();
        resolve(updatedAcceptor.value);
      } catch (err) {
        console.log(err.message);
        reject(err);
      }
    });
  },
  // reject request
  rejectRequest: (rejectorId, requesterId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const updatedRejector = await db
          .getDb()
          .collection(collections.USERS)
          .findOneAndUpdate(
            {
              _id: ObjectId(rejectorId),
            },
            {
              $pull: { friendRequests: requesterId },
            },
            { returnDocument: "after" }
          );
        const requestId = updatedRejector.value.friendRequests.map((user) =>
          ObjectId(user)
        );
        updatedRejector.value.requestDetails = await db
          .getDb()
          .collection(collections.USERS)
          .find({ _id: { $in: requestId } })
          .toArray();
        console.log("updatedRejector: ", updatedRejector);
        resolve(updatedRejector.value);
      } catch (err) {
        console.log(`err in rejectRequest helper`, err);
        reject(err);
      }
    });
  },
  // UNFRIEND USER
  unfriendHelper: (friendId, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const unfriendFromUser = await db
          .getDb()
          .collection(collections.USERS)
          .findOneAndUpdate(
            { _id: ObjectId(userId) },
            { $pull: { friends: ObjectId(friendId) } },
            { returnDocument: "after" }
          );
        const unfriendFromFriend = await db
          .getDb()
          .collection(collections.USERS)
          .findOneAndUpdate(
            { _id: ObjectId(friendId) },
            { $pull: { friends: ObjectId(userId) } }
          );
        console.log(unfriendFromUser.value, "unfrineds");
        resolve(unfriendFromUser.value);
      } catch (err) {
        reject(err);
      }
    });
  },
  // SEARCH_USER
  searchUserHelper: (query) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await db
          .getDb()
          .collection(collections.USERS)
          .find({ fullName: { $regex: new RegExp(query) } })
          .toArray();
        console.log("Result:", result.length);
        resolve(result);
      } catch (err) {
        console.log("error:", err.message);
        reject(err);
      }
    });
  },

  // get user timeline
  getUserTimeline: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log("userId in getUserTimeline", userId);
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
                localField: "_id",
                foreignField: "userId",
                as: "userPosts",
              },
            },
            {
              $unwind: {
                path: "$userPosts",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $sort: {
                "userPosts.createdAt": -1,
              },
            },
            {
              $lookup: {
                from: "comments",
                localField: "userPosts.comments",
                foreignField: "_id",
                as: "userPosts.comments",
              },
            },
            {
              $group: {
                _id: "$_id",
                docs: {
                  $first: "$$ROOT",
                },
                posts: {
                  $push: "$userPosts",
                },
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    "$docs",
                    {
                      userPosts: "$posts",
                    },
                  ],
                },
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
          ])
          .toArray();
        // console.log(`post[0].userPosts`, post[0].userPosts[0].userId);
        // const objPresent = post[0].userPosts.some(
        //   (obj) => obj.userId?.toString() == userId
        // );
        // console.log(`objPresent`, objPresent);
        // if (!objPresent) {
        //   post[0].userPosts = [];
        // }
        if (!post[0].userPosts[0]?._id) post[0].userPosts = [];
        console.log(post, "post from getUserTimeline");
        resolve(post[0]);
      } catch (err) {
        console.log(`err.message`, err.message);
        reject(err.message);
      }
    });
  },

  getUserPhotos: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId, "hrljkj");
      try {
        const post = await db
          .getDb()
          .collection(collections.POST)
          .find({ userId: ObjectId(userId) })
          .toArray();
        console.log(post, "posts userphoto");
        resolve(post);
      } catch (err) {
        reject(err.message);
      }
    });
  },
  // get user's friends timeline --this is not tested
  getUserFriendsTimeline: (currentUser) => {
    return Promise.all(
      currentUser.friends.map((friendId) => {
        return db
          .getDb()
          .collection(collections.POST)
          .find({ userId: friendId })
          .toArray();
      })
    );
  },
  // sample helper
  getSample: async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const wait = await db
          .getDb()
          .collection(collections.SAMPLE)
          .find({})
          .toArray();
        resolve(wait);
      } catch (err) {
        reject(err);
      }
    });
  },
};
