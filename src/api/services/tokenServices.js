const jwt = require("jsonwebtoken"),
  accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET,
  refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET,
  tokenHelper = require("../helpers/tokenHelpers")

class TokenService {
  generateTokens(payload) {
    console.log(payload,"payload")
    const accessToken = jwt.sign(payload, accessTokenSecret, {
      expiresIn: "10h",
    });
    const refreshToken = jwt.sign(payload, refreshTokenSecret, {
      expiresIn: "5 days",
    });
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(){
    try{

    }catch(err){

    }
  }

  async storeRefreshToken(token, userId) {
    try {
      console.log(userId)
      await tokenHelper.storeRefreshTokens({
        token,
        userId,
      });
    } catch (err) {
      console.log(err.message,"message");
    }
  }

  verifyAccessToken(token) {
    return jwt.verify(token, accessTokenSecret);
  }

}

module.exports = new TokenService();
