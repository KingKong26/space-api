const { ResultWithContext } = require("express-validator/src/chain");
const collections = require("../../config/collection"),
  db = require("../../config/dbConnection"),
  userHelpers = require("../helpers/userHelpers"),
  s3Services = require("../services/s3Service"),
  tokenServices = require("../services/tokenServices");
const postHelpers = require("../helpers/postHelpers");

class UserController {
  // SEND_REQUEST
  async sentRequest(req, res) {
    const requesterData = req.user;
    // request object to be stored in friend request collection
    // const requestObj = {
    //   requesterId: requesterData._id,
    //   createdAt: new Date(),
    //   status: "Pending",
    // };
    const receiverDetails = await userHelpers.getUserDetailsHelper(
      req.params.id
    );
    try {
      const requestResult = await userHelpers.requestHelper(
        requesterData._id,
        receiverDetails
      );
      // const requestedUpdatedData = await userHelpers.getUserDetailsHelper(req.user._id)
      // console.log(`requestedUpdatedData`, requestedUpdatedData);
      console.log(`requestResult`, requestResult);
      res.status(200).json(requestResult);
    } catch (err) {
      res.status(500).json(err);
    }
  }
  // ACCEPT_REQUEST
  async acceptRequest(req, res) {
    const acceptorData = req.user;
    // acceptor details to make sure request exists -
    // this code can be changed for optimization if this gets unnecessary in the future.
    try {
      const acceptorDetails = await userHelpers.getUserDetailsHelper(
        acceptorData._id
      );
      const requestCheck = acceptorDetails.friendRequests.filter(
        (e) => e === req.params.id
      );
      if (!requestCheck.length) throw Error("Request not found");
      const acceptResult = await userHelpers.acceptRequestHelper(
        acceptorData._id,
        req.params.id
      );
      res.status(200).json(acceptResult);
    } catch (err) {
      res.status(500).json(err.message);
    }
  }
  // REJECT_REQUEST
  async rejectRequest(req, res) {
    const rejectorId = req.user._id;
    try {
      const rejectorDetails = await userHelpers.getUserDetailsHelper(
        rejectorId
      );
      console.log(rejectorDetails, "acceptor details");
      const requestCheck = rejectorDetails.friendRequests.filter(
        (e) => e === req.params.id
      );
      if (!requestCheck.length) throw Error("Request not found");
      const rejectionResult = await userHelpers.rejectRequest(
        rejectorId,
        req.params.id
      );
      res.status(200).json(rejectionResult);
    } catch (err) {
      console.log(`err in rejectRequest ctr`, err)
      res.status(500).json(err.message);
    }
  }
  // UNFRIEND_USER
  async unfriendUser(req,res){
    const unfriendId = req.params.id
    const userId = req.user._id
    try{
      const unfriendUser = await userHelpers.unfriendHelper(unfriendId,userId)
      console.log(`unfriendUser`, unfriendUser)
      res.status(200).json(unfriendUser)
    }catch(err){
      console.log(`err.message`, err.message)
      res.status(500).json(err.message)
    }
  }
  // GET_USER_FEED_POSTS
  async getUserFeeds(req, res) {
    try {
      const posts = await postHelpers.getUserFeeds(req.user._id);
      // const currentUser = await userHelpers.getUserDetailsHelper(req.user._id)
      // const userPosts = await userHelpers.getUserTimeline(req.user._id)
      // const friendPosts = await userHelpers.getUserFriendsTimeline(currentUser);
      // console.log(posts,"posts")
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // SEARCH_USER
  async searchUser(req, res) {
    try {
      const results = await userHelpers.searchUserHelper(req.query.q);
      res.status(200).json(results);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // GET_PROFILE_TIMELINE
  async getProfileTimeline(req, res) {
    try {
      const userPosts = await userHelpers.getUserTimeline(req.params.id);
      res.status(200).json(userPosts);
    } catch (err) {
      res.status(500).json(err);
    }
  }
  // GET_PROFILE_PHOTOS
  async getProfilePhotos(req, res) {
    try {
      const userPosts = await userHelpers.getUserPhotos(req.params.id);
      res.status(200).json(userPosts);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // GET_FRIENDS_TIMELINE_POSTS
  async getFriendsPosts(req, res) {
    try {
      const user = await User.findOne({ username: req.params.username });
      const posts = await Post.find({ userId: user._id });
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // sample for testing db connection
  async sample(req, res) {
    try {
      console.log("reached sample");
      const result = await userHelpers.getSample();
      console.log(result, "result");
      res.send("result");
    } catch (err) {
      console.log(err);
    }
  }
  // protected routes
  async protected(req, res) {
    try {
      console.log("reached protected");
      const result = await userHelpers.getSample();
      console.log(result, "result");
      res.send("result");
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = new UserController();
