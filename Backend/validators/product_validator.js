const Joi = require("joi");

const beautyProductValidationSchema = Joi.object({
  name: Joi.string().required(),
  brand: Joi.string().required(),
  category: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().required(),
  quantityAvailable: Joi.number().required(),
  rating: Joi.number().default(0),
  images: Joi.array().items(Joi.string()).default([]),
});

module.exports = beautyProductValidationSchema;
