const { cookie } = require('express-validator');
const tokenService = require('../services/tokenServices')

module.exports = async function (req, res, next) {
  try {
    const { accessToken,refreshToken } = req.cookies;
    if (!accessToken) throw new Error("Token not present");
    const userData = await tokenService.verifyAccessToken(accessToken);
    if(!userData) throw new Error("Token not valid");
    req.user = userData
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
    console.log(err);
  }
};