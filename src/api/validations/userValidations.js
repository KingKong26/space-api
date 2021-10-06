const { body,check, validationResult } = require("express-validator");

const registerValidationRules = () => {
  return [
    // firstname must be of string and minimum three length
    body("fullName").isLength({ min: 3 }).isString(),
    // username must be an email
    body("email").isEmail(),
    // password must be at least 5 chars long
    body("password").isLength({ min: 5 }),
  ];
};

const loginValidationRules = () => {
  return [
    body("email").isEmail(),
    // password must be at least 5 chars long
    body("password").isLength({ min: 5 }),
  ];
};

const postValidationRules = () => {
  return [
    body("content").isString()
  ];
};

const commentValidationRules = () => {
  return [
    body("comment").isString()
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
  return res.status(422).json({
    errors: extractedErrors,
  });
};

module.exports = {
  registerValidationRules,
  loginValidationRules,
  postValidationRules,
  commentValidationRules,
  validate,
};
