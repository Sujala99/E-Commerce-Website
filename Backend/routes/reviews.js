const express = require("express");
const isAuth = require("../middlewares/is_auth");
const reviewController = require("../controllers/review");

const router = express.Router();

router.post("/post-review/:userId", isAuth, reviewController.postReview);
router.get("/:productId", reviewController.fetchReviews);

module.exports = router;
