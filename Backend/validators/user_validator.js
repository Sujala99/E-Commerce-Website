const Joi = require("joi");

const userValidationSchema = Joi.object({
  username: Joi.string().trim().min(8).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().min(8).required(),
  status: Joi.string().required(),
  profileImage: Joi.string().required(),
});

module.exports = userValidationSchema;
