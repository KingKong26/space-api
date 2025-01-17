const express = require("express"),
 router = express.Router(),
 { 
    loginValidationRules,
    registerValidationRules,
    postValidationRules, 
    commentValidationRules,
    validate
 }  = require("../validations/userValidations"),
 authController = require("../controllers/authController"),
 userController = require("../controllers/userController"),
 authMiddleware = require("../middlewares/authMiddleware"),
 postController = require("../controllers/postController"),
 chatController = require("../controllers/chatController"),
 multer = require("multer"),
//  upload = multer({dest:'uploads/'}),
 {getFileStream} = require("../services/s3"),
 fs = require("fs"),
 util = require("util"),
 unlinkFile = util.promisify(fs.unlink),
 upload = multer({storage:multer.memoryStorage()}),
 notifyControllers = require("../controllers/notifyControllers");

// all routes
 router.post("/register", registerValidationRules(), validate, authController.userRegister); //user onboarding
 router.post("/login", loginValidationRules(), validate, authController.userLogin); //user login
 router.get("/", authMiddleware, authController.getUserData); //user data fetching after jwt validation
 router.get("/profile/:id",userController.getProfileTimeline) //get a friend's - all posts
 router.put("/profile",authMiddleware,userController.updateProfile) //update user profile details
 router.put("/online", authMiddleware, authController.toggleOnline); //user update online

//  post  routes 
 router.post("/post", authMiddleware,upload.array('files',2), postController.postContent);   
 router.put("/post/:id/like", authMiddleware, postController.likePosts); //like a post
 router.put("/post/:id/comment", authMiddleware, commentValidationRules(), validate, postController.commentPost); //comment on a post
 router.get("/post/:id", authMiddleware, postController.getPost) //get a single post
 router.put("/post/:id", authMiddleware, postController.updatePost); //update a single post 
 router.delete("/post/:id", authMiddleware, postController.deletePost); //delete a single post

//  comments routes
router.post("/comment",authMiddleware,postController.commentPost)
router.put("/comment/like/:id",authMiddleware,postController.likeComment)

//  friends
 router.put("/friend-request/:id", authMiddleware, userController.sentRequest); //send and cancel request
 router.put("/friend-request/accept/:id", authMiddleware, userController.acceptRequest) //accept request
 router.put("/friend-request/reject/:id", authMiddleware, userController.rejectRequest) //reject request
 router.put("/unfriend/:id", authMiddleware, userController.unfriendUser) //reject request

// fetch requests
 router.get("/feeds/", authMiddleware, userController.getUserFeeds) //get a current users timeline (user post and his friends/followers)
 router.get("/photos/:id",userController.getProfilePhotos) //get a friends all photos
//  router.get("/:id",userController.getProfilePhotos) //get a friends all photos

// get requests
router.get("/search", userController.searchUser) //get a current users timeline (user post and his friends/followers)

// chat routes
router.get("/conversations",authMiddleware, chatController.getConversations) 
router.post("/message",authMiddleware,chatController.createMessage)
router.get("/message/:id",authMiddleware,chatController.getMessage)

// notification  routes
router.post("/notify",authMiddleware,notifyControllers.createNotify)
router.get("/notify",authMiddleware,notifyControllers.getNotify)
router.patch("/notify",authMiddleware,notifyControllers.readNotify)

// images
router.get('/images/:key',postController.getImage)
 
//  test routes
router.get("/sample", userController.sample);
 
module.exports = router; 
