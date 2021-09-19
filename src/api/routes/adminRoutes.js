const express = require("express"),
 router = express.Router(),
 userControllers = require("../controllers/userController"); 

router.post("/login",()=>{
    res.send('admin routes')
});


module.exports = router;
