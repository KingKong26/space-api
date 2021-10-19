const { ObjectId } = require("bson");
const commentHelpers = require("../helpers/commentHelpers");
const s3Services = require("../services/s3Service"),
  tokenServices = require("../services/tokenServices"),
  postHelpers = require("../helpers/postHelpers"),
  userHelpers = require("../helpers/userHelpers"),
  { uploadFile } = require("../services/s3bucket"),
  {getFileStream} = require("../services/s3"),
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
      const userId = req.user._id;
      const postDetails = await postHelpers.getPost(req.params.id);
      const updateLikes = await postHelpers.likePost(postDetails, userId);
      res.status(200).json(updateLikes);
    } catch (err) {
      console.log(err.message, "error in controller");
      res.status(500).json({ err, message: "error" });
    }
  }

  //   comment a post
  async commentPost(req, res) {
    try {
      const userId = req.user._id;
      const userData = await userHelpers.getUserDetailsHelper(userId);
      const commentObj = {
        comment: req.body.comment,
        authorId: ObjectId(userId),
        authorName: userData.fullName,
        authorAvatar: userData.avatar,
        postId:ObjectId(req.body.postId),
        likes: [],
        createdAt: new Date(),
      };
      const newComment = await commentHelpers.newComment(commentObj);
      console.log(`newComment`, newComment);
      let postAuthor = await postHelpers.commentPost(req.body.postId, userId, newComment._id);
      newComment.postAuthor =postAuthor
      res.status(200).json(newComment);
    } catch (err) {
      console.log(err.message)
      res.status(500).json(err)
    }
  }

  async likeComment(req,res){
    try{
     const userId = req.user._id
     const commentDetails = await commentHelpers.getComment(req.params.id);
     const updatedComment = await commentHelpers.likeComment(commentDetails,userId)
      res.status(200).json(updatedComment)
    }catch(err){
      console.log(err.message)
      res.status(500).json(err)
    }
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
      console.log(`post,req.user._id`, post,req.user._id)
      if (post.userId.toString() === req.user._id) {
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

  async getImage(req,res){
    console.log("hello")
   let key = req.params.key
   key = "files/"+key
   const readStream =  getFileStream(key)
   readStream.pipe(res)
   // res.end(readStream)
  }
}

module.exports = new PostController();
