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
 multer = require("multer"),
//  upload = multer({dest:'uploads/'}),
 {getFileStream} = require("../services/s3"),
 fs = require("fs"),
 util = require("util"),
 unlinkFile = util.promisify(fs.unlink),
 upload = multer({storage:multer.memoryStorage()});

// all routes
 router.post("/register", registerValidationRules(), validate, authController.userRegister); //user onboarding
 router.post("/login", loginValidationRules(), validate, authController.userLogin); //user login
 router.get("/", authMiddleware, authController.getUserData); //user data fetching after jwt validation
 router.get("/profile/:id",userController.getProfileTimeline) //get a friends all posts
//  router.get("/:id", authMiddleware, authController.getData); //user data fetching after jwt validation

//  post new routes 
 router.post("/post", authMiddleware,upload.array('files',2), postController.postContent);   
 router.put("/post/:id/like", authMiddleware, postController.likePosts); //like a post
 router.put("/post/:id/comment", authMiddleware, commentValidationRules(), validate, postController.commentPost); //comment on a post
 router.get("/post/:id", authMiddleware, postController.getPost) //get a single post
 router.put("/post/:id", authMiddleware, postController.updatePost); //update a single post 
 router.delete("/post/:id", authMiddleware, postController.deletePost); //delete a single post

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


// images
router.get('/images/:key',async(req,res)=>{
   console.log("hello")
   let key = req.params.key
   key = "files/"+key
   const readStream =  getFileStream(key)
   readStream.pipe(res)
   // res.end(readStream)
})
 

 
//  test routes
 router.get("/protected", authMiddleware, userController.protected )
 router.get("/sample", userController.sample);
 

module.exports = router;
