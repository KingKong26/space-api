const s3Services = require("../services/s3Service"),
  tokenServices = require("../services/tokenServices"),
  postHelpers = require("../helpers/postHelpers"),
  userHelpers = require("../helpers/userHelpers"),
  { uploadFile } = require("../services/s3bucket"),
  fileUpload = require("../services/fileUpload");

class PostController {
  // post content into db - media content into s3 bucket
  async postContent(req, res) {
    try {
      const userData = await userHelpers.getUserDetailsHelper(req.user._id);
      console.log(req.files, "req.files");
      let file;
      let result;
      // code for file processing
      if (req.files.length) {
        file = await fileUpload.fileUpload(req.files);
        result = await uploadFile(file);
        result = result.map((item) => item.Key);
        console.log(result, "result");
      }
      // post to store in database contains an array called medias for storing the s3 keys of corresponding medias
      const postContent = {
        ...req.body,
        ...(result && { medias: result }),
        createdAt: new Date(),
        userId: userData._id,
        authorName: userData.fullName,
        avatar: userData.avatar,
        likes: [],
        comments: [],
      };
      const post = await postHelpers.uploadPost(postContent);
      res.status(200).json({ ...post });
    } catch (err) {
      console.log(err.message);
      res.status(500).json(err.message);
    }
  }

  // like a post- insert likes of users as their _id into likes array inside post collection
  async likePosts(req, res) {
    try {
      const userData = req.user;
      const postDetails = await postHelpers.getPost(req.params.id);
      const updateLikes = await postHelpers.likePost(postDetails, userData._id);
      let response
      if (updateLikes) {
        response = {
          message: "This post has been liked",
          res: updateLikes
        };
      }else{
        response = {
          message: "This post has been disliked",
          res: updateLikes
        }
      }
      res.status(200).json(updateLikes);
    } catch (err) {
      console.log(err.message,"error in controller")
      res.status(500).json({ err, message: "error" });
    }
  }

  //   comment a post
  async commentPost(req, res) {
    try {
      const userData = req.user;
      const postDetails = await postHelpers.getPost(req.params.id);
      const updateComments = await postHelpers.commentPost(
        postDetails,
        userData._id,
        req.body
      );
      console.log(updateComments);
      res.status(200).json(updateComments);
    } catch (err) {}
  }

  // update a post
  async updatePost(req, res) {
    try {
      const post = await postHelpers.getPost(req.params.id);
      if (post.userId === req.user._id) {
        const updatePost = await postHelpers.updatePostHelper(
          req.params.id,
          req.body.newContent
        );
        res.status(200).json(updatePost);
      } else {
        res.status(405).json("You can only update your own posts");
      }
    } catch (err) {
      res.status(500).json(err.message);
    }
  }

  // delete a post
  async deletePost(req, res) {
    try {
      const post = await postHelpers.getPost(req.params.id);
      if (post.userId === req.user._id) {
        const deletePost = await postHelpers.deletePostHelper(
          req.params.id,
          req.user._id
        );
        res.status(200).json(deletePost);
      } else {
        res.status(405).json("You can only update your own posts");
      }
    } catch (err) {
      console.log(err.message);
      res.status(500).json(err);
    }
  }

  //   get a single
  async getPost(req, res) {
    try {
      const post = await postHelpers.getPost(req.params.id);
      if (post) {
        res.status(200).json(post);
      } else {
        res.status(403).json("This post does not exist");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  }
}

module.exports = new PostController();
