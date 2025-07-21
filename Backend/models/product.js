const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const beautyProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantityAvailable: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    totalReviews: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BeautyProduct", beautyProductSchema);
