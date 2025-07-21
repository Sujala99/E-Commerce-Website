const Review = require("../models/review");
const User = require("../models/user");
const Product = require("../models/product");

exports.postReview = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { productId, rating, feedback } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      const theError = new Error("Failed to fetch product.");
      theError.statusCode = 404;
      throw theError;
    }

    product.rating = ((product.rating + rating) / 2).toFixed(1);
    product.totalReviews = product.totalReviews + 1;

    const theProduct = await product.save();

    const review = new Review({
      rating: rating,
      feedback: feedback,
      productId: theProduct._id,
      userId: userId,
    });

    const newReview = await review.save();

    res.status(201).json({
      message: "You feedback has been posted.",
      review: newReview,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.fetchReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page, sortBy } = req.query;
    const perPage = 5;
    console.log(sortBy);

    const totalReviews = await Review.countDocuments({ productId: productId });

    let sortOptions = {};

    switch (sortBy) {
      case "recent":
        sortOptions.createdAt = -1;
        break;
      case "highest":
        sortOptions.rating = -1;
        break;
      case "lowest":
        sortOptions.rating = 1;
        break;
      default:
        sortOptions.createdAt = -1;
        break;
    }

    let reviews = await Review.find({ productId: productId })
      .sort(sortOptions)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("userId");

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found." });
    }

    res.status(200).json({
      message: "Reviews fetched successfully.",
      totalReviews: totalReviews,
      reviews: reviews,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};
