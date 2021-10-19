const tokenService = require("../services/tokenServices"),
  userHelpers = require("../helpers/userHelpers");

class AuthController {
  // register user
  async userRegister(req, res) {
    try {
      try {
        let checkUser = await userHelpers.checkUser(req.body.email);
        console.log(checkUser);
      } catch (err) {
        console.log(err.message, "message");
        return res.status(409).json({ message: "This email already exists" });
      }
      let avatarUrl = `https://avatars.dicebear.com/api/human/${req.body.email}.svg`;
      req.body.avatar = avatarUrl;
      let user = await userHelpers.registerUser(req.body);
      // call token service for token generation
      const { accessToken, refreshToken } = tokenService.generateTokens({
        _id: user._id,
        activated: false,
      });
      // store refresh token in db
      await tokenService.storeRefreshToken(refreshToken, user._id);
      // setting cookies in response header
      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
      });
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
      });
      // send response
      res.status(200).json({ ...user, message: "User register successful" });
    } catch (error) {
      res.status(409).json(error.message);
    }
  }
  // login user
  async userLogin(req, res) {
    try {
      console.log(`req.body`, req.body);
      const user = await userHelpers.loginUser(req.body);
      const { accessToken, refreshToken } = tokenService.generateTokens({
        _id: user._id,
        activated: false,
      });
      // store refresh token in db
      await tokenService.storeRefreshToken(refreshToken, user._id);
      // setting cookies in response header
      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.cookie("userId", user._id, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        secure: true,
        sameSite: "none",
      });
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      // send response
      res.status(200).json("User authentication successful");
    } catch (error) {
      console.log(`error.message`, error.message);
      res.status(401).send(error.message);
    }
  }

  // get user data after successful jwt handshake

  async getUserData(req, res) {
    try {
      const userData = await userHelpers.getUserDetailsHelper(req.user._id);
      res.status(200).json(userData);
    } catch (err) {
      console.log("Error:", err);
      res.status(500).json(err);
    }
  }

  async getData(req, res) {
    try {
      console.log("User: ", req.params.id);
      const userData = await userHelpers.getUserDetailsHelper(req.params.id);
      console.log("User data: ", userData);
      res.status(200).json(userData);
    } catch (err) {
      console.log("Error:", err);
      res.status(500).json(err);
    }
  }
  async toggleOnline(req, res) {
    console.log(`req.body`, req.body);
    try {
      await userHelpers.toggleOnlineHelper(req.body.toggle, req.user._id);
      res.status(200).json("Update success!!");
    } catch (err) {
      console.log("Error:", err);
      res.status(500).json(err);
    }
  }
  // sample for testing db connection
  async sample(req, res) {
    try {
      const result = await userHelpers.getSample();
      console.log(result, "result");
      res.send(result);
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = new AuthController();
